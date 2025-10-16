from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas.notification import Notification as NotificationSchema, NotificationCreate
from backend.auth import require_authenticated_user


router = APIRouter()


@router.get("", response_model=List[NotificationSchema])
def list_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(require_authenticated_user)):
	rows = db.query(models.Notification).filter(models.Notification.recipient_userid == current_user.userid).order_by(models.Notification.notificationid.desc()).all()
	# Map model.meta -> schema.metadata transparently by returning Pydantic models
	return [NotificationSchema(
		notificationid=r.notificationid,
		recipient_userid=r.recipient_userid,
		type=r.type,
		message=r.message,
		metadata=r.meta,
		isread=r.isread,
	) for r in rows]


@router.post("", response_model=NotificationSchema, status_code=201)
def create_notification(payload: NotificationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_authenticated_user)):
	# Allow creating notifications for testing/admin use; in production restrict appropriately
	n = models.Notification(
		recipient_userid=payload.recipient_userid,
		type=payload.type,
		message=payload.message,
		meta=payload.metadata,
	)
	db.add(n)
	db.commit()
	db.refresh(n)
	return NotificationSchema(
		notificationid=n.notificationid,
		recipient_userid=n.recipient_userid,
		type=n.type,
		message=n.message,
		metadata=n.meta,
		isread=n.isread,
	)


@router.post("/{notificationid}/read", response_model=NotificationSchema)
def mark_read(notificationid: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_authenticated_user)):
	n = db.query(models.Notification).filter(models.Notification.notificationid == notificationid).first()
	if not n:
		raise HTTPException(404, "Notification not found")
	if n.recipient_userid != current_user.userid:
		raise HTTPException(403, "Cannot modify others' notifications")
	n.isread = True
	db.add(n)
	db.commit()
	db.refresh(n)
	return NotificationSchema(
		notificationid=n.notificationid,
		recipient_userid=n.recipient_userid,
		type=n.type,
		message=n.message,
		metadata=n.meta,
		isread=n.isread,
	)


