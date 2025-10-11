from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas import MatchResult as MatchResultSchema, MatchResultCreate, MatchResultUpdate

router = APIRouter()

@router.get("", response_model=List[MatchResultSchema])
def list_results(db: Session = Depends(get_db)):
	return db.query(models.MatchResult).all()

@router.post("", response_model=MatchResultSchema, status_code=201)
def create_result(payload: MatchResultCreate, db: Session = Depends(get_db)):
	result = models.MatchResult(**payload.model_dump())
	db.add(result)
	db.commit()
	db.refresh(result)
	return result

@router.get("/{resultid}", response_model=MatchResultSchema)
def get_result(resultid: int, db: Session = Depends(get_db)):
	result = db.query(models.MatchResult).filter(models.MatchResult.resultid == resultid).first()
	if not result:
		raise HTTPException(404, "Result not found")
	return result

@router.patch("/{resultid}", response_model=MatchResultSchema)
def update_result(resultid: int, payload: MatchResultUpdate, db: Session = Depends(get_db)):
	result = db.query(models.MatchResult).filter(models.MatchResult.resultid == resultid).first()
	if not result:
		raise HTTPException(404, "Result not found")
	for field, value in payload.model_dump(exclude_unset=True).items():
		setattr(result, field, value)
	db.add(result)
	db.commit()
	db.refresh(result)
	return result

@router.delete("/{resultid}", status_code=204)
def delete_result(resultid: int, db: Session = Depends(get_db)):
	result = db.query(models.MatchResult).filter(models.MatchResult.resultid == resultid).first()
	if not result:
		raise HTTPException(404, "Result not found")
	db.delete(result)
	db.commit()
	return None
