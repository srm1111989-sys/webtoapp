import urllib.request
import json

token = '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'
url = 'https://api.github.com/user/repos'

headers = {
    'Authorization': f'token {token}',
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
}

data = {
    'name': 'webtoapp',
    'private': True,
    'description': 'WebToApp templates fallback 2'
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        print('Repo created:', json.loads(response.read().decode('utf-8')).get('full_name'))
except Exception as e:
    print('Error:', e)
