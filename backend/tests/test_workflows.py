
from contextlib import closing
from decimal import Decimal
from pathlib import Path
from uuid import uuid4
import sqlite3
from datetime import datetime

import pytest
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import Session

from app.directory import (
    list_clients,
    list_interactions as list_all_interactions,
    read_client_summary,
)
from app.database import Base
from app.models import Contact, Opportunity, Interaction
from app.opportunities import (
    create_opportunity,
    list_opportunities,
    update_opportunity_stage,
)
from app.schemas import OpportunityCreate, OpportunityStageUpdate
from app.routers.contacts import get_contact, list_contacts


@pytest.fixture
def db(tmp_path):
    original = Path(__file__).resolve().parents[1] / "nexocrm.db"
    copy = tmp_path / "nexocrm.db"

    if original.is_file():
        with closing(
            sqlite3.connect(original.as_uri() + "?mode=ro", uri=True)
        ) as source:
            with closing(sqlite3.connect(copy)) as target:
                source.backup(target)

    engine = create_engine(
        URL.create("sqlite", database=str(copy))
    )

    try:
        Base.metadata.create_all(bind=engine)

        with Session(engine) as session:
            yield session
    finally:
        engine.dispose()


def test_opportunity_is_saved_and_stage_change_persists(db):
    contact = Contact(
        name="Ana",
        email=f"{uuid4().hex}@example.invalid",
        type="client",
    )

    db.add(contact)
    db.commit()
    db.refresh(contact)

    created = create_opportunity(
        OpportunityCreate(
            client_id=contact.id,
            title="  Serviço  ",
            value=Decimal("350.00"),
            stage="new",
            notes="  Envio  ",
        ),
        db=db,
    )

    opportunity_id = created.id

    db.expunge_all()

    stored = db.get(Opportunity, opportunity_id)

    assert stored.title == "Serviço"
    assert stored.notes == "Envio"
    assert stored.value == Decimal("350.00")

    assert any(
        item.id == opportunity_id
        for item in list_opportunities(db=db)
    )

    update_opportunity_stage(
        opportunity_id,
        OpportunityStageUpdate(stage="won"),
        db=db,
    )

    db.expunge_all()

    assert db.get(Opportunity, opportunity_id).stage == "won"


def test_client_summary_and_contact_search_use_sqlite(db):
    token = uuid4().hex[:8]

    first = Contact(
        name=f"Ana {token}",
        email=f"ana-{uuid4().hex}@example.invalid",
        type="client",
    )

    other = Contact(
        name="Bia",
        email=f"bia-{uuid4().hex}@example.invalid",
        type="lead",
    )

    db.add_all([first, other])
    db.commit()

    moment = datetime(2026, 1, 1, 12)

    first_opp = Opportunity(
        client_id=first.id,
        title="A",
        value=Decimal("10"),
        stage="new",
        notes="",
        created_at=moment,
    )

    other_opp = Opportunity(
        client_id=other.id,
        title="B",
        value=Decimal("20"),
        stage="new",
        notes="",
        created_at=moment,
    )

    first_interaction = Interaction(
        contact_id=first.id,
        type="call",
        description="Ana",
        occurred_at=moment,
    )

    other_interaction = Interaction(
        contact_id=other.id,
        type="call",
        description="Bia",
        occurred_at=moment,
    )

    db.add_all([
        first_opp,
        other_opp,
        first_interaction,
        other_interaction,
    ])

    db.commit()

    summary = read_client_summary(first.id, db=db)

    assert summary["client"].id == first.id

    assert [
        item.id for item in summary["opportunities"]
    ] == [first_opp.id]

    assert [
        item.id for item in summary["interactions"]
    ] == [first_interaction.id]

    assert any(
        item.id == first.id
        for item in list_clients(db=db)
    )

    assert any(
        item.id == first_interaction.id
        for item in list_all_interactions(db=db)
    )

    assert any(
        item.id == first.id
        for item in list_contacts(db=db, search=None)
    )

    assert [
        item.id
        for item in list_contacts(search=token.upper(), db=db)
    ] == [first.id]

    assert [
        item.id
        for item in list_contacts(
            search=first.email.upper(),
            db=db,
        )
    ] == [first.id]

    assert get_contact(first.id, db=db).id == first.id
