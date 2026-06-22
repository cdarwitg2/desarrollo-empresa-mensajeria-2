import sqlite3
import os

db_path = 'instance/tracking.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE activos ADD COLUMN receptor_nombre VARCHAR(100);")
        print("Agregado receptor_nombre")
    except Exception as e:
        print("Error receptor_nombre:", e)
        
    try:
        cursor.execute("ALTER TABLE activos ADD COLUMN receptor_rut VARCHAR(20);")
        print("Agregado receptor_rut")
    except Exception as e:
        print("Error receptor_rut:", e)
        
    conn.commit()
    conn.close()
    print("Patch completado.")
else:
    print("Database not found")
