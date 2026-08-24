import psycopg2
conn = psycopg2.connect('postgresql://webtoapp:webtoapp@127.0.0.1:5434/webtoapp')
cur = conn.cursor()
cur.execute("SELECT log FROM builds WHERE id = 'bd044be7-6d9e-4e4a-8e71-e009a6f19e16'")
row = cur.fetchone()
if row and row[0]:
    log = row[0]
    # Show last 3000 chars to find the failure
    print(log[-3000:])
else:
    print('No log')
conn.close()
