from unittest.mock import Mock

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Contact
from app.routers.contacts import create_contact
from app.schemas import ContactCreate


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