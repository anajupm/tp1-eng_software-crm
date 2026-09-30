from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import Base, engine
from .directory import router as directory_router
from .opportunities import router as opportunities_router
from .routers import contacts

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NexoCRM API",
    description="API backend do NexoCRM",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(contacts.router)
app.include_router(directory_router)
app.include_router(opportunities_router)


@app.get("/")
def read_root():
    return {"message": "NexoCRM API"}
