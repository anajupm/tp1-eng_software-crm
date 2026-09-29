from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    company = Column(String, nullable=True)
    type = Column(String, nullable=False)
    opportunities = relationship("Opportunity", back_populates="client")
    interactions = relationship("Interaction", back_populates="contact")


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("contacts.id"), nullable=False, index=True)
    title = Column(String(120), nullable=False)
    value = Column(Numeric(11, 2), nullable=False)
    stage = Column(String(20), nullable=False, default="new", index=True)
    expected_close_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=False, default="")
    created_at = Column(DateTime, nullable=False)
    client = relationship("Contact", back_populates="opportunities")


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=False, index=True)
    type = Column(String, nullable=False)
    description = Column(String, nullable=False)
    occurred_at = Column(DateTime, nullable=False)
    contact = relationship("Contact", back_populates="interactions")
