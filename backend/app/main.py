from fastapi import FastAPI

app = FastAPI(
    title="NexoCRM API",
    description="API backend do NexoCRM",
    version="1.0.0",
)


@app.get("/")
def read_root():
    return {"message": "NexoCRM API"}
