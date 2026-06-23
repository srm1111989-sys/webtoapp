import urllib.request
import json

token = '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'
url = 'https://api.github.com/orgs/mokashiswapnil11/repos'

headers = {
    'Authorization': f'token {token}',
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
}

data = {
    'name': 'webtoapp',
    'private': True,
    'description': 'WebToApp templates'
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        print('Repo created:', json.loads(response.read().decode('utf-8')).get('full_name'))
except Exception as e:
    print('Error:', e)
