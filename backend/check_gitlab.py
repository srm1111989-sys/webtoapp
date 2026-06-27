import urllib.request
import json
import os

token = os.environ.get('GITLAB_TOKEN', '')
url = 'https://gitlab.com/api/v4/projects'

if not token:
    raise SystemExit('Set GITLAB_TOKEN before running this script')

headers = {
    'PRIVATE-TOKEN': token
}

req = urllib.request.Request(url, headers=headers)

try:
    with urllib.request.urlopen(req) as response:
        repos = json.loads(response.read().decode('utf-8'))
        for r in repos:
            print(r['path_with_namespace'])
except Exception as e:
    print('Error:', e)
