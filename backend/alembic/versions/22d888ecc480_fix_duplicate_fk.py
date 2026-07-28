"""fix_duplicate_fk

Revision ID: 22d888ecc480
Revises: 66737833dd71
Create Date: 2026-07-28 16:41:25.636754

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision: str = '22d888ecc480'
down_revision: Union[str, Sequence[str], None] = '66737833dd71'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    fks = inspector.get_foreign_keys('tasks')
    
    with op.batch_alter_table('tasks', schema=None) as batch_op:
        for fk in fks:
            if 'subject_id' in fk['constrained_columns']:
                # drop all existing FKs for subject_id
                # In SQLite reflection, unnamed FKs are given temporary names by SQLAlchemy
                if fk['name']:
                    batch_op.drop_constraint(fk['name'], type_='foreignkey')
        
        # create the single correct FK
        batch_op.create_foreign_key(
            'fk_tasks_subject_id_subjects', 
            'subjects', 
            ['subject_id'], 
            ['id'], 
            ondelete='SET NULL'
        )


def downgrade() -> None:
    """Downgrade schema."""
    pass
