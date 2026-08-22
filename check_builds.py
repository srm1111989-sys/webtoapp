
import psycopg2
conn = psycopg2.connect('postgresql://webtoapp:webtoapp@127.0.0.1:5434/webtoapp')
cur = conn.cursor()
cur.execute('SELECT id, order_id, status, error_message, created_at FROM builds ORDER BY created_at DESC LIMIT 5;')
for r in cur.fetchall():
    print(r)
