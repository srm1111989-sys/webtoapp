import urllib.request
import json

repo = 'pallavimokashi94-sys/webtoapp'
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
        'secret': 'ib6MnoWqQLglKBuTejUHPE09mxGN2FpV',
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
