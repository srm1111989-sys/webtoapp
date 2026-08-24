import psycopg2
conn = psycopg2.connect('postgresql://webtoapp:webtoapp@127.0.0.1:5434/webtoapp')
cur = conn.cursor()
cur.execute("SELECT log FROM builds WHERE id = 'bd044be7-6d9e-4e4a-8e71-e009a6f19e16'")
row = cur.fetchone()
if row and row[0]:
    log = row[0]
    # Find artifact download and upload sections
    for keyword in ['Upload', 'upload', 'artifact', 'Artifact', 'apk', 'APK', 'aab', 'AAB', 'gradle', 'assemble', 'FAIL', 'Error']:
        idx = log.find(keyword)
        if idx > 0:
            print(f'--- {keyword} at {idx} ---')
            print(log[max(0,idx-200):idx+500])
            print()
conn.close()
