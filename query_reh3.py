import psycopg2
conn = psycopg2.connect('postgresql://webtoapp:webtoapp@127.0.0.1:5434/webtoapp')
cur = conn.cursor()

# Check both order IDs
for oid in ['96d9d481-f73e-4e0d-b0a8-dcb7f7f8452c', '61243467-3b51-45f0-832b-61578abffdb8']:
    cur.execute("SELECT id, status, progress, apk_url, aab_url, error_message, log, created_at FROM builds WHERE order_id = %s ORDER BY created_at DESC LIMIT 3", (oid,))
    rows = cur.fetchall()
    print(f'Order {oid}: {len(rows)} builds')
    for row in rows:
        print('  ID:', row[0][:8], '| status:', row[1], '| progress:', row[2])
        print('  apk_url:', row[3])
        print('  aab_url:', row[4])
        print('  error:', row[5])
        print('  log_len:', len(row[6]) if row[6] else 0)
        print('  created:', row[7])
    if not rows:
        print('  (no builds found)')
conn.close()
