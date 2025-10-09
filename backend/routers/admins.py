from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas import Admin as AdminSchema, AdminCreate, AdminUpdate

router = APIRouter()

@router.get("/", response_model=List[AdminSchema])
def list_admins(db: Session = Depends(get_db)):
	return db.query(models.Admin).all()

@router.post("/", response_model=AdminSchema, status_code=201)
def create_admin(payload: AdminCreate, db: Session = Depends(get_db)):
	admin = models.Admin(**payload.model_dump())
	db.add(admin)
	db.commit()
	db.refresh(admin)
	return admin

@router.get("/{adminid}", response_model=AdminSchema)
def get_admin(adminid: int, db: Session = Depends(get_db)):
	admin = db.query(models.Admin).get(adminid)
	if not admin:
		raise HTTPException(404, "Admin not found")
	return admin

@router.patch("/{adminid}", response_model=AdminSchema)
def update_admin(adminid: int, payload: AdminUpdate, db: Session = Depends(get_db)):
	admin = db.query(models.Admin).get(adminid)
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
	admin = db.query(models.Admin).get(adminid)
	if not admin:
		raise HTTPException(404, "Admin not found")
	db.delete(admin)
	db.commit()
	return None
