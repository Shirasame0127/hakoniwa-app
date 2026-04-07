from pydantic import BaseModel, EmailStr, Field
from typing import Optional
import uuid


class UserResponse(BaseModel):
    """ユーザーレスポンス"""
    id: str
    email: str
    is_active: bool

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    """ログインリクエスト"""
    email: EmailStr
    password: str = Field(..., min_length=6)


class LoginResponse(BaseModel):
    """ログインレスポンス"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class RegisterRequest(BaseModel):
    """登録リクエスト"""
    email: EmailStr
    password: str = Field(..., min_length=6)


class RegisterResponse(BaseModel):
    """登録レスポンス"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    """トークンペイロード"""
    user_id: str


class GoogleOAuthCallbackRequest(BaseModel):
    """Google OAuth コールバックリクエスト"""
    id_token: str


class OAuthResponse(BaseModel):
    """OAuth レスポンス"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

