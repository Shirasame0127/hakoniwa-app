"""add auth fields to users

Revision ID: 002_add_auth
Revises: 001_initial
Create Date: 2026-04-06

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_add_auth'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('email', sa.String(255), nullable=False))
    op.add_column('users', sa.Column('password_hash', sa.String(255), nullable=False))
    op.add_column('users', sa.Column('is_active', sa.Integer(), nullable=False, server_default='1'))
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)


def downgrade():
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_column('users', 'is_active')
    op.drop_column('users', 'password_hash')
    op.drop_column('users', 'email')
