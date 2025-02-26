
import requests
import json
import sys

url = 'https://api-testnet.grc-20.thegraph.com/space/XPZ8fnf3DvNMRDbFgxEZi2/edit/calldata'
data = {"cid":"ipfs://bafkreiabnc3kdcomwn2ismqqkkglj4sxme6a6mdzb2z6xf7ecaldjc7klm","network":"TESTNET"}

try:
    response = requests.post(url, json=data, timeout=5, verify=False)
    print(json.dumps({
        'status': response.status_code,
        'headers': dict(response.headers),
        'body': response.text
    }))
except Exception as e:
    print(json.dumps({
        'error': str(e)
    }))
