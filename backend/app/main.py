from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.config import settings
from app.features.auth.router import router as auth_router
from app.features.objects.router import router as objects_router
from app.features.weather.router import router as weather_router

# FastAPI インスタンス作成
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    debug=settings.DEBUG
)

# CORS ミドルウェア設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "https://hakoniwa-app.pages.dev",  # 本番環境
        "http://localhost:3000",  # ローカル
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {
        "message": "AI箱庭ライフOS API",
        "version": settings.API_VERSION,
        "docs": "/docs",
        "openapi": "/openapi.json"
    }


@app.get("/health")
async def health():
    """ヘルスチェック"""
    return {"status": "ok"}


# ルーターを include
app.include_router(auth_router)
app.include_router(objects_router)
app.include_router(weather_router)

# アップロードファイルを静的配信
_upload_dir = Path("/tmp/hakoniwa_uploads")
_upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_upload_dir)), name="uploads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
