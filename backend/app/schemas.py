from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_serializer


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


class InteractionBase(BaseModel):
    type: str
    description: str
    occurred_at: datetime


class InteractionCreate(InteractionBase):
    pass


class InteractionResponse(InteractionBase):
    id: int
    contact_id: int

    model_config = ConfigDict(from_attributes=True)


OpportunityStage = Literal["new", "contact", "proposal", "won", "lost"]
InteractionType = Literal["call", "meeting", "email", "other"]


class ContactRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    company: str | None
    type: str
    email: str
    phone: str | None


class OpportunityCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    client_id: int = Field(gt=0)
    value: Decimal = Field(ge=0, le=Decimal("999999999.99"), max_digits=11, decimal_places=2)
    stage: OpportunityStage
    expected_close_date: date | None = None
    notes: str = Field(default="", max_length=2000)


class OpportunityStageUpdate(BaseModel):
    stage: OpportunityStage


class OpportunityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: int
    title: str
    value: float
    stage: OpportunityStage
    expected_close_date: date | None
    notes: str
    created_at: datetime

    @field_serializer("created_at")
    def serialize_created_at(self, value: datetime) -> str:
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat().replace("+00:00", "Z")


class InteractionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: int = Field(validation_alias="contact_id")
    type: InteractionType
    description: str
    occurred_at: datetime

    @field_serializer("occurred_at")
    def serialize_occurred_at(self, value: datetime) -> str:
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat().replace("+00:00", "Z")


class ClientSummary(BaseModel):
    client: ContactRead
    opportunities: list[OpportunityRead]
    interactions: list[InteractionRead]
