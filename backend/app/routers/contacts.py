from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy  import or_
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.post("", response_model=schemas.ContactResponse, status_code=status.HTTP_201_CREATED)
def create_contact(contact: schemas.ContactCreate, db: Session = Depends(get_db)):
    existing_contact = (
        db.query(models.Contact).filter(models.Contact.email == contact.email).first()
    )
    if existing_contact:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    
    db_contact = models.Contact(**contact.model_dump())
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact


@router.get("", response_model=list[schemas.ContactResponse])
def list_contacts(search: str | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Contact)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.Contact.name.ilike(search_filter),
                models.Contact.email.ilike(search_filter),
            )
        )
    return query.all()


@router.get("/{contact_id}", response_model=schemas.ContactResponse)
def get_contact(contact_id: int, db: Session = Depends(get_db)):
    contact = (
        db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    )
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found",
        )
    return contact


@router.patch("/{contact_id}", response_model=schemas.ContactResponse)
def update_contact(
    contact_id: int,
    contact_update: schemas.ContactUpdate,
    db: Session = Depends(get_db),
):
    contact = (
        db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    )
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found",
        )

    update_data = contact_update.model_dump(exclude_unset=True)
    new_email = update_data.get("email")
    if new_email and new_email != contact.email:
        existing_contact = (
            db.query(models.Contact)
            .filter(models.Contact.email == new_email, models.Contact.id != contact_id)
            .first()
        )
        if existing_contact:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

    for field, value in update_data.items():
        setattr(contact, field, value)

    db.commit()
    db.refresh(contact)
    return contact


@router.post(
    "/{contact_id}/interactions",
    response_model=schemas.InteractionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_interaction(
    contact_id: int,
    interaction: schemas.InteractionCreate,
    db: Session = Depends(get_db),
):
    contact = (
        db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    )
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found",
        )

    db_interaction = models.Interaction(
        contact_id=contact_id,
        **interaction.model_dump(),
    )
    db.add(db_interaction)
    db.commit()
    db.refresh(db_interaction)
    return db_interaction


@router.get(
    "/{contact_id}/interactions",
    response_model=list[schemas.InteractionResponse],
)
def list_interactions(contact_id: int, db: Session = Depends(get_db)):
    contact = (
        db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    )
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found",
        )

    return (
        db.query(models.Interaction)
        .filter(models.Interaction.contact_id == contact_id)
        .order_by(models.Interaction.occurred_at.desc())
        .all()
    )