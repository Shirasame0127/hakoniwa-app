"""add city_name to garden_states for weather system

Revision ID: 004_add_weather_settings
Revises: 003_voxel_models
Create Date: 2026-04-06

"""
from alembic import op
import sqlalchemy as sa

revision = '004_add_weather_settings'
down_revision = '003_voxel_models'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('garden_states', sa.Column('city_name', sa.String(100), nullable=True))


def downgrade():
    op.drop_column('garden_states', 'city_name')
