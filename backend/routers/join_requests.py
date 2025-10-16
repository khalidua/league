from typing import List
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas.join_request import JoinRequest as JoinRequestSchema, JoinRequestCreate, JoinRequestRespond
from backend.auth import require_authenticated_user


router = APIRouter()


@router.get("", response_model=List[JoinRequestSchema])
def list_join_requests(db: Session = Depends(get_db), current_user: models.User = Depends(require_authenticated_user)):
	# If user is captain (has team where teamcaptainid == player's playerid), show requests for that team
	player = db.query(models.Player).filter(models.Player.userid == current_user.userid).first()
	if not player:
		return []
	team = None
	if player.teamid:
		team = db.query(models.Team).filter(models.Team.teamid == player.teamid).first()

	query = db.query(models.JoinRequest)
	if team and team.teamcaptainid is not None and team.teamcaptainid == player.playerid:
		query = query.filter(models.JoinRequest.teamid == team.teamid)
	else:
		# Otherwise return only requests created by the current user
		query = query.filter(models.JoinRequest.requester_userid == current_user.userid)
	return query.order_by(models.JoinRequest.requestid.desc()).all()


@router.post("", response_model=JoinRequestSchema, status_code=201)
def create_join_request(payload: JoinRequestCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_authenticated_user)):
	# Validate team exists
	team = db.query(models.Team).filter(models.Team.teamid == payload.teamid).first()
	if not team:
		raise HTTPException(404, "Team not found")
	# Optional player record; if present and already in a team, disallow
	player = db.query(models.Player).filter(models.Player.userid == current_user.userid).first()
	if player and player.teamid:
		raise HTTPException(400, "You are already assigned to a team.")
	# Check existing pending request to the same team
	existing = db.query(models.JoinRequest).filter(
		models.JoinRequest.teamid == payload.teamid,
		models.JoinRequest.requester_userid == current_user.userid,
		models.JoinRequest.status == "pending"
	).first()
	if existing:
		raise HTTPException(400, "You already have a pending request to this team.")

	jr = models.JoinRequest(
		teamid=payload.teamid,
		requester_userid=current_user.userid,
		requester_playerid=player.playerid if player else None,
		status="pending",
		source="player",
		note=payload.note,
	)
	db.add(jr)
	db.commit()
	db.refresh(jr)

	# Notify team captain about the join request
	if team.teamcaptainid is not None:
		captain_player = db.query(models.Player).filter(models.Player.playerid == team.teamcaptainid).first()
		if captain_player and captain_player.userid:
			requester_name = (current_user.firstname or "").strip()
			if current_user.lastname:
				requester_name = (requester_name + " " + current_user.lastname).strip()
			requester_name = requester_name or current_user.email
			meta = {
				"requestid": jr.requestid,
				"teamid": team.teamid,
				"teamname": team.teamname,
				"requester_userid": current_user.userid,
				"requester_playerid": player.playerid if player else None,
			}
			n = models.Notification(
				recipient_userid=captain_player.userid,
				type="join_request",
				message=f"{requester_name} requested to join {team.teamname}",
				meta=json.dumps(meta),
			)
			db.add(n)
			db.commit()
	return jr


@router.post("/invite/{userid}", response_model=JoinRequestSchema, status_code=201)
def invite_player(userid: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_authenticated_user)):
	"""Captain invites a user to his team -> creates a pending request with source='captain'."""
	# Ensure current user is captain of some team
	inviter_player = db.query(models.Player).filter(models.Player.userid == current_user.userid).first()
	if not inviter_player or not inviter_player.teamid:
		raise HTTPException(403, "Only team captains can invite players")
	team = db.query(models.Team).filter(models.Team.teamid == inviter_player.teamid).first()
	if not team or team.teamcaptainid != inviter_player.playerid:
		raise HTTPException(403, "Only team captains can invite players")

	# Validate invitee user exists
	invitee_user = db.query(models.User).filter(models.User.userid == userid).first()
	if not invitee_user:
		raise HTTPException(404, "Invitee user not found")

	# Check if invitee already has a team
	invitee_player = db.query(models.Player).filter(models.Player.userid == userid).first()
	if invitee_player and invitee_player.teamid:
		raise HTTPException(400, "Player is already in a team")

	# Avoid duplicate pending for same team/user
	existing = db.query(models.JoinRequest).filter(
		models.JoinRequest.teamid == team.teamid,
		models.JoinRequest.requester_userid == userid,
		models.JoinRequest.status == "pending"
	).first()
	if existing:
		raise HTTPException(400, "There is already a pending invite/request for this player")

	jr = models.JoinRequest(
		teamid=team.teamid,
		requester_userid=userid,
		requester_playerid=invitee_player.playerid if invitee_player else None,
		status="pending",
		source="captain",
		note=None,
	)
	db.add(jr)
	db.commit()
	db.refresh(jr)

	# Notify invitee
	import json as _json
	meta = {
		"requestid": jr.requestid,
		"teamid": team.teamid,
		"teamname": team.teamname,
		"requester_userid": userid,
		"requester_playerid": invitee_player.playerid if invitee_player else None,
	}
	n = models.Notification(
		recipient_userid=userid,
		type="team_invite",
		message=f"You have been invited to join {team.teamname}",
		meta=_json.dumps(meta),
	)
	db.add(n)
	db.commit()

	return jr


@router.post("/{requestid}/respond", response_model=JoinRequestSchema)
def respond_join_request(requestid: int, payload: JoinRequestRespond, db: Session = Depends(get_db), current_user: models.User = Depends(require_authenticated_user)):
	jr = db.query(models.JoinRequest).filter(models.JoinRequest.requestid == requestid).first()
	if not jr:
		raise HTTPException(404, "Join request not found")

	team = db.query(models.Team).filter(models.Team.teamid == jr.teamid).first()
	if not team:
		raise HTTPException(404, "Team not found")
	# Permission: if this is a player-originated request, only captain can respond.
	# If this is a captain-originated invite (source='captain'), the invitee (requester_userid) can respond.
	player = db.query(models.Player).filter(models.Player.userid == current_user.userid).first()
	is_captain = bool(player and team.teamcaptainid == player.playerid)
	is_invitee = (jr.source == "captain" and jr.requester_userid == current_user.userid)
	if not (is_captain or is_invitee):
		raise HTTPException(403, "Not authorized to respond to this request")

	action = (payload.action or "").lower()
	if jr.status != "pending":
		raise HTTPException(400, "Request already processed")

	if action == "approve":
		# Assign player to team
		req_player = None
		if jr.requester_playerid:
			req_player = db.query(models.Player).filter(models.Player.playerid == jr.requester_playerid).first()
		if not req_player:
			# Create a player record on the fly if missing (avoid duplicates)
			existing = db.query(models.Player).filter(models.Player.userid == jr.requester_userid).first()
			if existing:
				req_player = existing
			else:
				req_player = models.Player(
					userid=jr.requester_userid,
					teamid=None,
				)
				db.add(req_player)
				db.commit()
				db.refresh(req_player)
		if req_player.teamid:
			raise HTTPException(400, "Requester is already in a team")
		req_player.teamid = team.teamid
		jr.status = "approved"
	elif action == "deny":
		jr.status = "denied"
	elif action == "cancel":
		# Allow captains to cancel (equivalent to deny)
		jr.status = "cancelled"
	else:
		raise HTTPException(400, "Invalid action. Use approve|deny|cancel")

	if payload.note:
		jr.note = payload.note

	# Notify requester about the decision, tailor message for invite vs request
	requester_user = db.query(models.User).filter(models.User.userid == jr.requester_userid).first()
	if requester_user:
		status_text = "approved" if jr.status == "approved" else ("denied" if jr.status == "denied" else jr.status)
		meta = {
			"requestid": jr.requestid,
			"teamid": team.teamid,
			"teamname": team.teamname,
			"result": jr.status,
		}
		# If it originated from captain, phrase as invite; else as request
		if jr.source == "captain":
			message = f"Invite to join {team.teamname} {status_text}"
		else:
			message = f"Your request to join {team.teamname} was {status_text}"
		n = models.Notification(
			recipient_userid=jr.requester_userid,
			type="join_request_result",
			message=message,
			meta=json.dumps(meta),
		)
		db.add(n)

	db.add(jr)
	db.commit()
	db.refresh(jr)
	return jr


