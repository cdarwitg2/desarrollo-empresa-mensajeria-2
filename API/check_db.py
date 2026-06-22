import sqlite3
conn = sqlite3.connect('instance/tracking.db')
cursor = conn.cursor()
cursor.execute("SELECT id_activo, estado_actual, token_claro_temporal FROM activos")
rows = cursor.fetchall()
for row in rows:
    print(row)
conn.close()
