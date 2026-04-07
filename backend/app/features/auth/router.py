from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.shared.db import get_db
from app.features.auth.schemas import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    UserResponse,
    GoogleOAuthCallbackRequest,
    OAuthResponse,
)
from app.features.auth.service import (
    authenticate_user,
    create_user,
    get_user_by_email,
    create_access_token,
    verify_token,
    get_user_by_id,
    verify_google_token,
    create_or_update_oauth_user,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """ユーザー登録"""
    # メールが既に登録されているか確認
    existing_user = get_user_by_email(db, request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="このメールアドレスは既に登録されています",
        )

    # ユーザーを作成
    user = create_user(db, request.email, request.password)

    # トークンを生成
    access_token = create_access_token(user.id)

    return RegisterResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            is_active=bool(user.is_active),
        ),
    )


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """ログイン"""
    # ユーザーを認証
    user = authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # トークンを生成
    access_token = create_access_token(user.id)

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            is_active=bool(user.is_active),
        ),
    )


@router.get("/me", response_model=UserResponse)
def get_current_user(token: str = None, db: Session = Depends(get_db)):
    """現在のユーザー情報を取得"""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証が必要です",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # トークンを検証
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無効なトークンです",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ユーザーを取得
    user = get_user_by_id(db, payload.get("user_id"))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません",
        )

    return UserResponse(
        id=str(user.id),
        email=user.email,
        is_active=bool(user.is_active),
    )


@router.post("/google/callback", response_model=OAuthResponse)
def google_oauth_callback(request: GoogleOAuthCallbackRequest, db: Session = Depends(get_db)):
    """Google OAuth コールバック

    Google ID トークンを検証して、ユーザーを作成・ログインする
    """
    # Google ID トークンを検証
    idinfo = verify_google_token(request.id_token)
    if not idinfo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google トークンが無効です",
        )

    # Google の sub（ユーザーID）とメールを取得
    google_id = idinfo.get("sub")
    email = idinfo.get("email")
    name = idinfo.get("name")

    if not google_id or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google トークンから必要な情報が取得できません",
        )

    # ユーザーを作成・更新
    user = create_or_update_oauth_user(db, "google", google_id, email, name)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ユーザー作成に失敗しました",
        )

    # JWT トークンを生成
    access_token = create_access_token(user.id)

    return OAuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            is_active=bool(user.is_active),
        ),
    )