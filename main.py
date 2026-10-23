
from fastapi import FastAPI

app = FastAPI(title="DocWise AI API")


@app.get("/")
def home():
    return {
        "message": "Welcome to DocWise AI!",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }
