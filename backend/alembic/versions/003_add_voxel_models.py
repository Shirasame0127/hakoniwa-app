"""add voxel_models and voxel_model_likes tables

Revision ID: 003_voxel_models
Revises: 002_add_auth
Create Date: 2026-04-06

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '003_voxel_models'
down_revision = '002_add_auth'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'voxel_models',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('pixel_data', postgresql.JSON(), nullable=False),
        sa.Column('size_w', sa.Integer(), nullable=False),
        sa.Column('size_h', sa.Integer(), nullable=False),
        sa.Column('size_d', sa.Integer(), nullable=False),
        sa.Column('vox_file_url', sa.String(500), nullable=True),
        sa.Column('thumbnail_url', sa.String(500), nullable=True),
        sa.Column('like_count', sa.Integer(), server_default='0'),
        sa.Column('view_count', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_voxel_models_user_id', 'voxel_models', ['user_id'])
    op.create_index('ix_voxel_models_category', 'voxel_models', ['category'])

    op.create_table(
        'voxel_model_likes',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), primary_key=True),
        sa.Column('model_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('voxel_models.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('voxel_model_likes')
    op.drop_index('ix_voxel_models_category', table_name='voxel_models')
    op.drop_index('ix_voxel_models_user_id', table_name='voxel_models')
    op.drop_table('voxel_models')
