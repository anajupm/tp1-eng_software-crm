from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import Contact, Interaction, Opportunity
from .schemas import ClientSummary, ContactRead, InteractionRead, OpportunityRead

router = APIRouter(tags=["clients", "interactions"])


@router.get("/clients", response_model=list[ContactRead])
def list_clients(db: Session = Depends(get_db)):
    return db.query(Contact).order_by(Contact.name.asc()).all()


@router.get("/interactions", response_model=list[InteractionRead])
def list_interactions(db: Session = Depends(get_db)):
    return db.query(Interaction).order_by(Interaction.occurred_at.desc()).all()


@router.get("/clients/{client_id}/summary", response_model=ClientSummary)
def read_client_summary(client_id: int, db: Session = Depends(get_db)):
    client = db.get(Contact, client_id)
    if client is None:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")
    opportunities = (
        db.query(Opportunity).filter_by(client_id=client_id)
        .order_by(Opportunity.created_at.desc()).all()
    )
    interactions = (
        db.query(Interaction).filter_by(contact_id=client_id)
        .order_by(Interaction.occurred_at.desc()).all()
    )
    return {"client": client, "opportunities": opportunities, "interactions": interactions}
