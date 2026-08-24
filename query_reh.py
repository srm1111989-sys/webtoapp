import psycopg2
conn = psycopg2.connect('postgresql://webtoapp:webtoapp@127.0.0.1:5434/webtoapp')
cur = conn.cursor()
cur.execute("SELECT id, pipeline_id, variables, status, apk_url, aab_url, error_message FROM builds WHERE order_id = '96d9d481-f73e-4e0d-b0a8-dcb7f7f8452c' ORDER BY created_at DESC LIMIT 3")
for row in cur.fetchall():
    print('ID:', row[0])
    print('  pipeline:', row[1])
    print('  vars:', row[2])
    print('  status:', row[3])
    print('  apk:', row[4])
    print('  aab:', row[5])
    print('  err:', row[6])
conn.close()
