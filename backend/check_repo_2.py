import urllib.request
import json

token = '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'
url = 'https://api.github.com/repos/mokashiswapnil/webtoapp'

headers = {
    'Authorization': f'token {token}',
    'Accept': 'application/vnd.github.v3+json',
}

req = urllib.request.Request(url, headers=headers)

try:
    with urllib.request.urlopen(req) as response:
        print('Repo exists:', json.loads(response.read().decode('utf-8')).get('full_name'))
except Exception as e:
    print('Error:', e)
