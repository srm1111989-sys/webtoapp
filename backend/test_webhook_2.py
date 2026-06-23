import urllib.request
import json

repo = 'mokashiswapnil/webtoapp'
token = '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'
url = f'https://api.github.com/repos/{repo}/hooks'

headers = {
    'Authorization': f'token {token}',
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
}

data = {
    'name': 'web',
    'active': True,
    'events': ['workflow_run'],
    'config': {
        'url': 'https://websitetoapp.app/api/webhooks/github',
        'content_type': 'json',
        'secret': 'oeizCRMKcStY7GLdrN6WH5mbhZJyQx2u',
        'insecure_ssl': '0'
    }
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        print('Webhook created:', response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print('HTTPError:', e.code)
    print('Reason:', e.read().decode('utf-8'))
except Exception as e:
    print('Error:', e)
