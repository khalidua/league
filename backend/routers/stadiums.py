from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas import Stadium as StadiumSchema, StadiumCreate, StadiumUpdate

router = APIRouter()

@router.get("/", response_model=List[StadiumSchema])
def list_stadiums(db: Session = Depends(get_db)):
	return db.query(models.Stadium).all()

@router.post("/", response_model=StadiumSchema, status_code=201)
def create_stadium(payload: StadiumCreate, db: Session = Depends(get_db)):
	stadium = models.Stadium(**payload.model_dump())
	db.add(stadium)
	db.commit()
	db.refresh(stadium)
	return stadium

@router.get("/{stadiumid}", response_model=StadiumSchema)
def get_stadium(stadiumid: int, db: Session = Depends(get_db)):
	stadium = db.query(models.Stadium).get(stadiumid)
	if not stadium:
		raise HTTPException(404, "Stadium not found")
	return stadium

@router.patch("/{stadiumid}", response_model=StadiumSchema)
def update_stadium(stadiumid: int, payload: StadiumUpdate, db: Session = Depends(get_db)):
	stadium = db.query(models.Stadium).get(stadiumid)
	if not stadium:
		raise HTTPException(404, "Stadium not found")
	for field, value in payload.model_dump(exclude_unset=True).items():
		setattr(stadium, field, value)
	db.add(stadium)
	db.commit()
	db.refresh(stadium)
	return stadium

@router.delete("/{stadiumid}", status_code=204)
def delete_stadium(stadiumid: int, db: Session = Depends(get_db)):
	stadium = db.query(models.Stadium).get(stadiumid)
	if not stadium:
		raise HTTPException(404, "Stadium not found")
	db.delete(stadium)
	db.commit()
	return None
