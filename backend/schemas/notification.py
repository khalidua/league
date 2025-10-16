from typing import Optional
from pydantic import BaseModel


class NotificationCreate(BaseModel):
	recipient_userid: int
	type: str
	message: str
	metadata: Optional[str] = None


class Notification(BaseModel):
	notificationid: int
	recipient_userid: int
	type: str
	message: str
	metadata: Optional[str] = None
	isread: bool

	class Config:
		from_attributes = True


