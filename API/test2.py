import sqlite3
conn = sqlite3.connect('instance/tracking.db')
cursor = conn.cursor()
cursor.execute("SELECT id_activo, estado_actual, rut_remitente, token_claro_temporal FROM activos")
for row in cursor.fetchall():
    print(row)
conn.close()
