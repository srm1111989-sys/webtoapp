import urllib.request
import json

token = 'glpat-G063Iq-ACQr7-DbXKuZH4m86MQp1OjF1ZmI2Cw.01.120c8eep1'
url = 'https://gitlab.com/api/v4/projects'

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
