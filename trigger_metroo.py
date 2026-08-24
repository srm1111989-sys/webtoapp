import httpx, asyncio, sys, subprocess
sys.stdout.reconfigure(encoding='utf-8')

ORDER_ID = '6a01da66-5e8b-4a0d-a552-cba1907c59c5'

async def main():
    with open('/opt/webtoapp/backend/.env') as f:
        for line in f:
            if line.startswith('GITHUB_TOKEN='):
                gh_token = line.strip().split('=', 1)[1]
                break

    sql = ("SELECT ac.name, ac.url, ac.package_name, ac.primary_color, "
           "ac.secondary_color, ac.status_bar_color, ac.features, ac.firebase_config "
           "FROM app_configs ac JOIN orders o ON o.app_config_id = ac.id "
           "WHERE o.id = '" + ORDER_ID + "'")
    result = subprocess.run([
        'psql', 'postgresql://webtoapp:webtoapp@127.0.0.1:5434/webtoapp',
        '-t', '-A', '-c', sql
    ], capture_output=True, text=True)
    row = result.stdout.strip().split('|')
    if len(row) < 8:
        print('ERROR: could not get app config')
        print(result.stdout)
        return

    name, url, pkg, primary, secondary, status_bar, features, firebase = row
    app_host = url.replace('https://', '').replace('http://', '').split('/')[0] if url else ''

    payload = {
        'app_name': name,
        'app_url': url,
        'app_host': app_host,
        'primary_color': primary or '#2563EB',
        'secondary_color': secondary or '#1E40AF',
        'status_bar_color': status_bar or '#1E3A5F',
        'package_name': pkg or 'com.webtoapp.app',
        'order_id': ORDER_ID,
        'features_json': features or '{}',
        'firebase_config': firebase or '{}',
        'build_aab': 'true',
        '_build_provider': 'github1',
    }

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            'https://api.github.com/repos/pallavimokashi94-sys/webtoapp/actions/workflows/build-android.yml/dispatches',
            headers={
                'Authorization': 'token ' + gh_token,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            json=payload,
        )
        print('GitHub dispatch:', r.status_code)
        if r.status_code == 204:
            print('Build triggered successfully for Metroo!')
        else:
            print('Response:', r.text[:300])

asyncio.run(main())
