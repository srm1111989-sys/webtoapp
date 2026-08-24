import psycopg2
conn = psycopg2.connect('postgresql://webtoapp:webtoapp@127.0.0.1:5434/webtoapp')
cur = conn.cursor()
cur.execute("SELECT log FROM builds WHERE id = 'bd044be7-6d9e-4e4a-8e71-e009a6f19e16'")
row = cur.fetchone()
log = row[0] if row and row[0] else ''
# Find upload-artifact section (after 63638)
upload_idx = log.find('Upload artifact')
if upload_idx < 0:
    upload_idx = log.find('upload-artifact')
if upload_idx >= 0:
    print('Upload section:')
    print(log[upload_idx:upload_idx+2000])
