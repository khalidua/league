from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas import Event as EventSchema, EventCreate, EventUpdate

router = APIRouter()

@router.get("/", response_model=List[EventSchema])
def list_events(db: Session = Depends(get_db)):
	return db.query(models.Event).all()

@router.post("/", response_model=EventSchema, status_code=201)
def create_event(payload: EventCreate, db: Session = Depends(get_db)):
	event = models.Event(**payload.model_dump())
	db.add(event)
	db.commit()
	db.refresh(event)
	return event

@router.get("/{eventid}", response_model=EventSchema)
def get_event(eventid: int, db: Session = Depends(get_db)):
	event = db.query(models.Event).get(eventid)
	if not event:
		raise HTTPException(404, "Event not found")
	return event

@router.patch("/{eventid}", response_model=EventSchema)
def update_event(eventid: int, payload: EventUpdate, db: Session = Depends(get_db)):
	event = db.query(models.Event).get(eventid)
	if not event:
		raise HTTPException(404, "Event not found")
	for field, value in payload.model_dump(exclude_unset=True).items():
		setattr(event, field, value)
	db.add(event)
	db.commit()
	db.refresh(event)
	return event

@router.delete("/{eventid}", status_code=204)
def delete_event(eventid: int, db: Session = Depends(get_db)):
	event = db.query(models.Event).get(eventid)
	if not event:
		raise HTTPException(404, "Event not found")
	db.delete(event)
	db.commit()
	return None
