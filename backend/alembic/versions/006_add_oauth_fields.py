"""Add OAuth fields to users table

Revision ID: 006_oauth_fields
Revises: 005_glb_objects
Create Date: 2026-04-07
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "006_oauth_fields"
down_revision = "005_glb_objects"
branch_labels = None
depends_on = None


def upgrade():
    # password_hash を nullable にする（OAuth ユーザーは パスワード不要）
    op.alter_column(
        "users",
        "password_hash",
        existing_type=sa.String(255),
        nullable=True,
    )

    # OAuth フィールドを追加
    op.add_column(
        "users",
        sa.Column("oauth_provider", sa.String(50), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("oauth_id", sa.String(255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("name", sa.String(255), nullable=True),
    )

    # oauth_id にインデックス作成
    op.create_index("ix_users_oauth_id", "users", ["oauth_id"])


def downgrade():
    # インデックス削除
    op.drop_index("ix_users_oauth_id", table_name="users")

    # カラム削除
    op.drop_column("users", "oauth_provider")
    op.drop_column("users", "oauth_id")
    op.drop_column("users", "name")

    # password_hash を NOT NULL に戻す
    op.alter_column(
        "users",
        "password_hash",
        existing_type=sa.String(255),
        nullable=False,
    )
