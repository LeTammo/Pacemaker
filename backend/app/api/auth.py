from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    password: str


@router.post("/login")
async def login(payload: LoginRequest):
    if payload.password == settings.admin_password:
        return {"authenticated": True}
    raise HTTPException(status_code=401, detail="Invalid password")
