from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .database import get_db
from .models import Contact, Opportunity
from .schemas import OpportunityCreate, OpportunityRead, OpportunityStageUpdate

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


@router.get("", response_model=list[OpportunityRead])
def list_opportunities(db: Session = Depends(get_db)):
    return db.query(Opportunity).order_by(Opportunity.created_at.desc()).all()


@router.post("", response_model=OpportunityRead, status_code=status.HTTP_201_CREATED)
def create_opportunity(payload: OpportunityCreate, db: Session = Depends(get_db)):
    if not payload.title.strip():
        raise HTTPException(status_code=422, detail="O título não pode ficar vazio.")
    if db.get(Contact, payload.client_id) is None:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    opportunity = Opportunity(
        **payload.model_dump(exclude={"title", "notes"}),
        title=payload.title.strip(),
        notes=payload.notes.strip(),
        created_at=datetime.now(timezone.utc).replace(tzinfo=None),
    )
    db.add(opportunity)
    db.commit()
    db.refresh(opportunity)
    return opportunity


@router.patch("/{opportunity_id}", response_model=OpportunityRead)
def update_opportunity_stage(
    opportunity_id: int,
    payload: OpportunityStageUpdate,
    db: Session = Depends(get_db),
):
    opportunity = db.get(Opportunity, opportunity_id)
    if opportunity is None:
        raise HTTPException(status_code=404, detail="Oportunidade não encontrada.")
    opportunity.stage = payload.stage
    db.commit()
    db.refresh(opportunity)
    return opportunity
