from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
from app.config import settings
from sqlalchemy.orm import Session
from app.shared.models import User
from app.features.auth.schemas import UserResponse
from google.auth.transport import requests
from google.oauth2 import id_token
import logging

# ロガー設定
logger = logging.getLogger(__name__)

# パスワードハッシング設定
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """パスワードをハッシュ化"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """パスワードを検証"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str) -> str:
    """JWT トークンを生成"""
    payload = {
        "user_id": str(user_id),
        "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow(),
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token


def verify_token(token: str) -> dict | None:
    """JWT トークンを検証"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def create_user(db: Session, email: str, password: str) -> User:
    """ユーザーを作成"""
    user = User(
        email=email,
        password_hash=hash_password(password),
        oauth_provider="password",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_email(db: Session, email: str) -> User | None:
    """メールアドレスからユーザーを取得"""
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: str) -> User | None:
    """ユーザーIDからユーザーを取得"""
    return db.query(User).filter(User.id == user_id).first()


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """ユーザーを認証"""
    user = get_user_by_email(db, email)
    if not user or not user.password_hash or not verify_password(password, user.password_hash):
        return None
    return user


def verify_google_token(token: str) -> dict | None:
    """Google ID トークンを検証

    Args:
        token: Google ID トークン

    Returns:
        トークンペイロード（email, name, picture 等）、または検証失敗時は None
    """
    try:
        # Google の公開鍵でトークンを検証
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            clock_skew_in_seconds=10,
        )
        return idinfo
    except Exception as e:
        logger.error(f"Google token verification failed: {e}")
        return None


def create_or_update_oauth_user(db: Session, oauth_provider: str, oauth_id: str, email: str, name: str | None = None) -> User | None:
    """Google OAuth ユーザーを作成または既存ユーザーを更新

    Args:
        db: DB Session
        oauth_provider: OAuth プロバイダー名（"google"）
        oauth_id: OAuth プロバイダーのユーザーID（Google の sub）
        email: ユーザーのメールアドレス
        name: ユーザー名（オプション）

    Returns:
        作成・更新されたユーザーオブジェクト
    """
    # 既存ユーザーを oauth_id から検索
    user = db.query(User).filter(User.oauth_id == oauth_id).first()

    if user:
        # 既存ユーザーを更新
        user.name = name
        user.updated_at = datetime.utcnow()
    else:
        # メールが既に登録されている場合は取得、なければ新規作成
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                oauth_provider=oauth_provider,
                oauth_id=oauth_id,
                name=name,
                password_hash=None,  # OAuth ユーザーはパスワード不要
            )
        else:
            # 既存ユーザーに OAuth 情報を追加
            user.oauth_provider = oauth_provider
            user.oauth_id = oauth_id
            if name:
                user.name = name

    db.add(user)
    db.commit()
    db.refresh(user)
    return user

