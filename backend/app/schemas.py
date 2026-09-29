from pydantic import BaseModel, ConfigDict


class ContactBase(BaseModel):
    name: str
    email: str
    phone: str | None = None
    company: str | None = None
    type: str


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    type: str | None = None


class ContactResponse(ContactBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
