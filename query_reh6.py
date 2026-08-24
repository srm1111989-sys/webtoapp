import psycopg2
conn = psycopg2.connect('postgresql://webtoapp:webtoapp@127.0.0.1:5434/webtoapp')
cur = conn.cursor()
cur.execute("SELECT log FROM builds WHERE id = 'bd044be7-6d9e-4e4a-8e71-e009a6f19e16'")
row = cur.fetchone()
if row and row[0]:
    log = row[0]
    # Look for download_artifact calls in backend log (between build end and status)
    for keyword in ['download_artifact', 'artifact-missing', 'artifact storage', 'delete_run_artifacts', 'no artifacts', 'build.status', 'mark']:
        idx = log.find(keyword)
        if idx >= 0:
            print(f'--- {keyword} at {idx} ---')
            print(log[idx:idx+600])
            print()
conn.close()
