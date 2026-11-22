from unittest.mock import Mock
from datetime import datetime

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Contact
from app.routers.contacts import create_contact
from app.schemas import ContactCreate
from app.routers.contacts import create_contact, create_interaction, update_contact
from app.schemas import ContactCreate, ContactUpdate, InteractionCreate


def test_create_contact_rejects_duplicate_email():
    email = "ana@example.com"
    existing_contact = Contact(id=1, name="Ana", email=email, type="client")
    db = Mock(spec=Session)
    db.query.return_value.filter.return_value.first.return_value = existing_contact
    payload = ContactCreate(name="Outro contato", email=email, type="lead")

    with pytest.raises(HTTPException) as error:
        create_contact(payload, db=db)

    assert error.value.status_code == 409
    assert error.value.detail == "Email already registered"
    db.add.assert_not_called()
    db.commit.assert_not_called()
    db.refresh.assert_not_called()

def test_update_contact_changes_only_sent_fields():
    contact = Contact(
        id=1, name="Ana", email="ana@example.com",
        phone="123", company="Antiga", type="lead",
    )
    db = Mock(spec=Session)
    db.query.return_value.filter.return_value.first.return_value = contact

    updated = update_contact(1, ContactUpdate(company="Nova"), db=db)

    assert updated is contact
    assert contact.company == "Nova"
    assert contact.name == "Ana"
    assert contact.email == "ana@example.com"
    assert contact.phone == "123"
    assert contact.type == "lead"
    db.commit.assert_called_once_with()
    db.refresh.assert_called_once_with(contact)


def test_create_interaction_rejects_unknown_contact():
    db = Mock(spec=Session)
    db.query.return_value.filter.return_value.first.return_value = None
    payload = InteractionCreate(
        type="call",
        description="Tentativa de contato",
        occurred_at=datetime(2026, 1, 1, 12, 0),
    )

    with pytest.raises(HTTPException) as error:
        create_interaction(999, payload, db=db)

    assert error.value.status_code == 404
    assert error.value.detail == "Contact not found"
    db.add.assert_not_called()
    db.commit.assert_not_called()
    db.refresh.assert_not_called()