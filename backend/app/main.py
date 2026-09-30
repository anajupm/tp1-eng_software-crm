from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import Base, engine
from .routers import contacts

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NexoCRM API",
    description="API backend do NexoCRM",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contacts.router)


@app.get("/")
def read_root():
    return {"message": "NexoCRM API"}
