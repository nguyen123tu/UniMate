import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

try:
    conn = psycopg2.connect(user="postgres", password="postgres", host="localhost", port="5432")
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    try:
        cursor.execute("CREATE DATABASE unimate")
        print("Database unimate created successfully")
    except Exception as e:
        print(f"Failed to create (maybe it exists): {e}")
    finally:
        cursor.close()
        conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
