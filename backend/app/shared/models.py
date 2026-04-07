from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON, Date, Boolean, func, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
import uuid
from app.shared.db import Base


class User(Base):
    """ユーザーテーブル"""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # リレーション
    garden_states = relationship("GardenState", back_populates="user")
    garden_objects = relationship("GardenObject", back_populates="user")
    food_items = relationship("FoodItem", back_populates="user")
    exercise_logs = relationship("ExerciseLog", back_populates="user")
    uploaded_objects = relationship("HakoniwaObject", back_populates="uploader")
    object_likes = relationship("HakoniwaObjectLike", back_populates="user")


class GardenState(Base):
    """箱庭状態テーブル"""
    __tablename__ = "garden_states"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    level = Column(Integer, default=1)
    exp = Column(Integer, default=0)
    environment = Column(JSON, default={"theme": "grass", "size": 10})
    city_name = Column(String(100), nullable=True)  # 天気連携する都市名
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="garden_states")


class GardenObject(Base):
    """箱庭オブジェクトテーブル"""
    __tablename__ = "garden_objects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type = Column(String(50), nullable=False)
    position = Column(JSON, default={"x": 0, "y": 0, "z": 0})
    model_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="garden_objects")


class FoodItem(Base):
    """食材テーブル"""
    __tablename__ = "food_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    barcode = Column(String(100), nullable=True)
    expires_at = Column(Date, nullable=True)
    quantity = Column(Integer, default=1)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="food_items")


class ExerciseLog(Base):
    """運動ログテーブル"""
    __tablename__ = "exercise_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type = Column(String(100), nullable=False)
    duration_min = Column(Integer, nullable=False)
    logged_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="exercise_logs")


class HakoniwaObject(Base):
    """箱庭オブジェクトマスタ（図鑑）

    .glb ファイルで管理する3Dモデルのマスタデータ。
    カテゴリ別カタログID、フレーバーテキスト、レアリティ等を持つ。

    カテゴリ:
      food      - 食べ物    (F001~)
      plant     - 植物      (P001~)
      person    - 人        (C001~)
      furniture - 家具      (I001~)
      building  - 建造物    (B001~)
      field     - フィールド (L001~)
      special   - 特別      (SP001~)

    特別サブカテゴリ:
      game_software - ゲームソフト
      book          - 本
      food_label    - 食材仕分け用（バーコード/画像データ付き）

    レアリティ:
      common / uncommon / rare / legendary
    """
    __tablename__ = "hakoniwa_objects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # --- 図鑑情報 ---
    catalog_id = Column(String(20), nullable=False, unique=True, index=True)
    name = Column(Text, nullable=False)
    name_en = Column(Text, nullable=True)

    # --- 分類 ---
    category = Column(String(50), nullable=False, index=True)
    subcategory = Column(String(50), nullable=True)

    # --- テキスト ---
    description = Column(Text, nullable=True)          # 説明文
    flavor_text = Column(Text, nullable=True)           # 図鑑フレーバーテキスト

    # --- レアリティ ---
    rarity = Column(String(20), nullable=False, default="common")

    # --- 出現・入手情報 ---
    locations = Column(ARRAY(Text), nullable=True)     # 出現場所
    seasons = Column(ARRAY(Text), nullable=True)       # 登場季節
    obtain_method = Column(Text, nullable=True)        # 入手方法

    # --- 3Dモデル ---
    model_path = Column(Text, nullable=True)           # /models/food/carrot.glb
    thumbnail_url = Column(Text, nullable=True)

    # --- サイズ（参考） ---
    size_w = Column(Integer, nullable=True)
    size_h = Column(Integer, nullable=True)
    size_d = Column(Integer, nullable=True)

    # --- ソーシャル ---
    like_count = Column(Integer, default=0, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)

    # --- 投稿者 ---
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # リレーション
    uploader = relationship("User", back_populates="uploaded_objects")
    likes = relationship("HakoniwaObjectLike", back_populates="object", cascade="all, delete-orphan")


class HakoniwaObjectLike(Base):
    """箱庭オブジェクト いいねテーブル"""
    __tablename__ = "hakoniwa_object_likes"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    object_id = Column(UUID(as_uuid=True), ForeignKey("hakoniwa_objects.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (UniqueConstraint("user_id", "object_id", name="uq_object_likes"),)

    user = relationship("User", back_populates="object_likes")
    object = relationship("HakoniwaObject", back_populates="likes")
