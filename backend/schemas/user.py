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
	pass

class User(UserBase):
	userid: int
	passwordhash: str
