from fastapi import FastAPI

from . import models
from .database import Base, engine
from .routers import contacts

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NexoCRM API",
    description="API backend do NexoCRM",
    version="1.0.0",
)

app.include_router(contacts.router)


@app.get("/")
def read_root():
    return {"message": "NexoCRM API"}
