import requests
import json

# Login as client
res = requests.post('http://127.0.0.1:5000/api/auth/login', json={
    'rut': '12345678-9',
    'password': 'password123'
})
print(res.status_code, res.json())

token = res.json().get('token')
if token:
    headers = {'Authorization': f'Bearer {token}'}
    res2 = requests.get('http://127.0.0.1:5000/api/packages/my-packages', headers=headers)
    print(res2.status_code)
    packages = res2.json().get('packages', [])
    for p in packages:
        print(p.get('id_activo'), p.get('estado_actual'), p.get('pin_contingencia'))
