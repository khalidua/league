from typing import Optional
from pydantic import BaseModel

class AdminBase(BaseModel):
	permissionslevel: Optional[int] = None

	class Config:
		from_attributes = True

class AdminCreate(AdminBase):
	userid: int

class AdminUpdate(AdminBase):
	pass

class Admin(AdminBase):
	adminid: int
	userid: Optional[int] = None
