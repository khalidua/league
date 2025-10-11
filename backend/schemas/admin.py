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

class AdminWithUser(AdminBase):
	adminid: int
	userid: Optional[int] = None
	firstname: Optional[str] = None
	lastname: Optional[str] = None
	email: Optional[str] = None
	profileimage: Optional[str] = None
	role: Optional[str] = None
	
	@property
	def fullname(self) -> str:
		"""Get the full name of the admin"""
		if self.firstname and self.lastname:
			return f"{self.firstname} {self.lastname}"
		elif self.firstname:
			return self.firstname
		elif self.lastname:
			return self.lastname
		else:
			return f"Admin {self.adminid}"