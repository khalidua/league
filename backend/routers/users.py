from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas import User as UserSchema, UserCreate, UserUpdate

router = APIRouter()

@router.get("/", response_model=List[UserSchema])
def list_users(role: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
	query = db.query(models.User)
	if role:
		query = query.filter(models.User.role == role)
	if status:
		query = query.filter(models.User.status == status)
	return query.all()

@router.post("/", response_model=UserSchema, status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
	user = models.User(
		email=payload.email,
		passwordhash=payload.password,
		role=payload.role or "Player",
		profileimage=payload.profileimage,
		firstname=payload.firstname,
		lastname=payload.lastname,
	)
	db.add(user)
	db.commit()
	db.refresh(user)
	return user

@router.get("/{userid}", response_model=UserSchema)
def get_user(userid: int, db: Session = Depends(get_db)):
	user = db.query(models.User).get(userid)
	if not user:
		raise HTTPException(404, "User not found")
	return user

@router.patch("/{userid}", response_model=UserSchema)
def update_user(userid: int, payload: UserUpdate, db: Session = Depends(get_db)):
	user = db.query(models.User).get(userid)
	if not user:
		raise HTTPException(404, "User not found")
	for field, value in payload.model_dump(exclude_unset=True).items():
		setattr(user, field, value)
	db.add(user)
	db.commit()
	db.refresh(user)
	return user

@router.delete("/{userid}", status_code=204)
def delete_user(userid: int, db: Session = Depends(get_db)):
	user = db.query(models.User).get(userid)
	if not user:
		raise HTTPException(404, "User not found")
	db.delete(user)
	db.commit()
	return None
