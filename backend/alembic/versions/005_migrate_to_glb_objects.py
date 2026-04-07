"""migrate voxel_models to hakoniwa_objects (.glb based)

Revision ID: 005_glb_objects
Revises: 004_add_weather_settings
Create Date: 2026-04-06
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "005_glb_objects"
down_revision = "004_add_weather_settings"
branch_labels = None
depends_on = None


def upgrade():
    # 旧テーブルを削除
    op.drop_table("voxel_model_likes")
    op.drop_table("voxel_models")

    # 新テーブル: hakoniwa_objects
    op.create_table(
        "hakoniwa_objects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),

        # 図鑑情報
        sa.Column("catalog_id", sa.String(20), nullable=False, unique=True),  # F001, P001, ...
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("name_en", sa.Text, nullable=True),

        # 分類
        sa.Column("category", sa.String(50), nullable=False),
        # food / plant / person / furniture / building / field / special
        sa.Column("subcategory", sa.String(50), nullable=True),
        # game_software / book / food_label

        # テキスト
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("flavor_text", sa.Text, nullable=True),  # 図鑑フレーバーテキスト

        # レアリティ
        sa.Column("rarity", sa.String(20), nullable=False, server_default="common"),
        # common / uncommon / rare / legendary

        # 出現・入手情報
        sa.Column("locations", postgresql.ARRAY(sa.Text), nullable=True),
        sa.Column("seasons", postgresql.ARRAY(sa.Text), nullable=True),
        sa.Column("obtain_method", sa.Text, nullable=True),

        # 3Dモデル
        sa.Column("model_path", sa.Text, nullable=True),       # /models/food/carrot.glb
        sa.Column("thumbnail_url", sa.Text, nullable=True),

        # サイズ (参考)
        sa.Column("size_w", sa.Integer, nullable=True),
        sa.Column("size_h", sa.Integer, nullable=True),
        sa.Column("size_d", sa.Integer, nullable=True),

        # ソーシャル
        sa.Column("like_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("view_count", sa.Integer, nullable=False, server_default="0"),

        # 投稿者
        sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
    )

    op.create_index("ix_hakoniwa_objects_category", "hakoniwa_objects", ["category"])
    op.create_index("ix_hakoniwa_objects_catalog_id", "hakoniwa_objects", ["catalog_id"])

    # いいねテーブル
    op.create_table(
        "hakoniwa_object_likes",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("object_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hakoniwa_objects.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "object_id", name="uq_object_likes"),
    )


def downgrade():
    op.drop_table("hakoniwa_object_likes")
    op.drop_index("ix_hakoniwa_objects_catalog_id")
    op.drop_index("ix_hakoniwa_objects_category")
    op.drop_table("hakoniwa_objects")
