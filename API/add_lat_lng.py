import os
from sqlalchemy import create_engine, text

db_url = os.environ.get("DATABASE_URL", "sqlite:///instance/tracking.db")
print("Usando DATABASE_URL =", db_url)
engine = create_engine(db_url, connect_args={"check_same_thread": False})

with engine.connect() as conn:
    for col_sql in (
        "ALTER TABLE activos ADD COLUMN lat REAL",
        "ALTER TABLE activos ADD COLUMN lng REAL",
    ):
        try:
            conn.execute(text(col_sql))
            print("✓", col_sql, "-> OK (o ya existía)")
        except Exception as e:
            print("✗", col_sql, "->", e)