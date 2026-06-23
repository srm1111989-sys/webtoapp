import urllib.request
import json

token = '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'
url = 'https://api.github.com/user/repos?per_page=100'

headers = {
    'Authorization': f'token {token}',
    'Accept': 'application/vnd.github.v3+json'
}

req = urllib.request.Request(url, headers=headers)

try:
    with urllib.request.urlopen(req) as response:
        repos = json.loads(response.read().decode('utf-8'))
        for r in repos:
            print(r['full_name'])
except Exception as e:
    print('Error:', e)
