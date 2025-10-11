from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas import Admin as AdminSchema, AdminCreate, AdminUpdate, AdminWithUser

router = APIRouter()

@router.get("", response_model=List[AdminWithUser])
def list_admins(db: Session = Depends(get_db)):
	# Join Admin with User to get admin names
	query = db.query(models.Admin, models.User).outerjoin(
		models.User, models.Admin.userid == models.User.userid
	)
	
	results = query.all()
	
	# Convert joined results to AdminWithUser objects
	admins_with_users = []
	for admin, user in results:
		admin_data = {
			"adminid": admin.adminid,
			"userid": admin.userid,
			"permissionslevel": admin.permissionslevel,
			"firstname": user.firstname if user else None,
			"lastname": user.lastname if user else None,
			"email": user.email if user else None,
			"profileimage": user.profileimage if user else None,
			"role": user.role if user else None,
		}
		admins_with_users.append(AdminWithUser(**admin_data))
	
	return admins_with_users

@router.post("", response_model=AdminSchema, status_code=201)
def create_admin(payload: AdminCreate, db: Session = Depends(get_db)):
	admin = models.Admin(**payload.model_dump())
	db.add(admin)
	db.commit()
	db.refresh(admin)
	return admin

@router.get("/{adminid}", response_model=AdminWithUser)
def get_admin(adminid: int, db: Session = Depends(get_db)):
	# Join Admin with User to get admin names
	result = db.query(models.Admin, models.User).outerjoin(
		models.User, models.Admin.userid == models.User.userid
	).filter(models.Admin.adminid == adminid).first()
	
	if not result:
		raise HTTPException(404, "Admin not found")
	
	admin, user = result
	admin_data = {
		"adminid": admin.adminid,
		"userid": admin.userid,
		"permissionslevel": admin.permissionslevel,
		"firstname": user.firstname if user else None,
		"lastname": user.lastname if user else None,
		"email": user.email if user else None,
		"profileimage": user.profileimage if user else None,
		"role": user.role if user else None,
	}
	
	return AdminWithUser(**admin_data)

@router.patch("/{adminid}", response_model=AdminSchema)
def update_admin(adminid: int, payload: AdminUpdate, db: Session = Depends(get_db)):
	admin = db.query(models.Admin).filter(models.Admin.adminid == adminid).first()
	if not admin:
		raise HTTPException(404, "Admin not found")
	for field, value in payload.model_dump(exclude_unset=True).items():
		setattr(admin, field, value)
	db.add(admin)
	db.commit()
	db.refresh(admin)
	return admin

@router.delete("/{adminid}", status_code=204)
def delete_admin(adminid: int, db: Session = Depends(get_db)):
	admin = db.query(models.Admin).filter(models.Admin.adminid == adminid).first()
	if not admin:
		raise HTTPException(404, "Admin not found")
	db.delete(admin)
	db.commit()
	return None
