from typing import Optional, Literal
from pydantic import BaseModel, EmailStr

RoleLiteral = Literal["Player", "Admin", "Organizer", "Coach"]
StatusLiteral = Literal["active", "inactive"]

class UserBase(BaseModel):
	email: Optional[EmailStr] = None
	role: Optional[RoleLiteral] = None
	profileimage: Optional[str] = None
	status: Optional[StatusLiteral] = None
	firstname: Optional[str] = None
	lastname: Optional[str] = None

	class Config:
		from_attributes = True

class UserCreate(BaseModel):
	email: EmailStr
	password: str
	role: Optional[RoleLiteral] = None
	profileimage: Optional[str] = None
	firstname: Optional[str] = None
	lastname: Optional[str] = None

class UserUpdate(UserBase):
	# Player-specific fields
	position: Optional[str] = None
	jerseynumber: Optional[int] = None
	preferredfoot: Optional[str] = None
	height: Optional[int] = None
	weight: Optional[int] = None

class User(UserBase):
	userid: int
	passwordhash: str
	teamid: Optional[int] = None
	teamname: Optional[str] = None

class UserResponse(UserBase):
	userid: int
	teamid: Optional[int] = None
	teamname: Optional[str] = None
	# Player-specific fields
	position: Optional[str] = None
	jerseynumber: Optional[int] = None
	preferredfoot: Optional[str] = None
	height: Optional[int] = None
	weight: Optional[int] = None