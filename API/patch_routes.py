import re

with open('app/packages/routes.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update update_package_status logic for zero-knowledge hash checking
old_check = '''        if token_ingresado:
            if not activo.token_contingencia:
                return jsonify({'error': 'Este activo no tiene contingencia generada.'}), 400
                
            if activo.token_contingencia.upper() != token_ingresado.upper():
                return jsonify({'error': 'Token de contingencia inválido.'}), 403
                
            if activo.token_expira and datetime.utcnow() > activo.token_expira:
                return jsonify({'error': 'El token de contingencia ha expirado.'}), 403
                
            # Token válido: destruirlo para un solo uso
            activo.token_contingencia = None
            activo.token_expira = None
            usar_offline_sync = True'''

new_check = '''        if token_ingresado:
            if not activo.token_hash:
                return jsonify({'error': 'Este activo no tiene contingencia generada.'}), 400
                
            import hashlib
            hash_input = hashlib.sha256(token_ingresado.encode('utf-8')).hexdigest()
            if activo.token_hash.upper() != hash_input.upper():
                return jsonify({'error': 'Token de contingencia inválido.'}), 403
                
            if activo.token_expira and datetime.utcnow() > activo.token_expira:
                return jsonify({'error': 'El token de contingencia ha expirado.'}), 403
                
            # Token válido: destruirlo para un solo uso
            activo.token_hash = None
            activo.token_claro_temporal = None
            activo.token_expira = None
            usar_offline_sync = True'''
            
content = content.replace(old_check, new_check)

# 2. Update token generation in update_package_status
old_gen = '''        activo.estado_actual = nuevo_estado_enum
        
        if nuevo_estado_enum == EstadoActivo.EN_ACOPIO:'''

new_gen = '''        activo.estado_actual = nuevo_estado_enum
        
        # --- GENERACION AUTOMATICA ZERO-KNOWLEDGE ---
        if nuevo_estado_enum == EstadoActivo.EN_TRANSITO:
            import hashlib, random, string
            pin_plano = ''.join(random.choices(string.digits, k=6))
            pin_hash = hashlib.sha256(pin_plano.encode('utf-8')).hexdigest()
            activo.token_hash = pin_hash
            activo.token_claro_temporal = pin_plano
            from datetime import timedelta
            activo.token_expira = datetime.utcnow() + timedelta(hours=24)
        # --------------------------------------------
        
        if nuevo_estado_enum == EstadoActivo.EN_ACOPIO:'''

content = content.replace(old_gen, new_gen)

# 3. Add rol_usuario extraction and pass to to_dict
# We need to replace `activo.to_dict()` with `activo.to_dict(rol_usuario)`
# and add `rol_usuario = claims.get('roles', ['usuario'])[0] if claims else 'usuario'` right after `claims = get_jwt()`
content = content.replace('claims = get_jwt()\n        rut_remitente = claims.get(\'rut\')', 'claims = get_jwt()\n        rut_remitente = claims.get(\'rut\')\n        rol_usuario = claims.get(\'roles\', [\'usuario\'])[0] if claims else \'usuario\'')
content = content.replace('claims = get_jwt()\n        rut_usuario = claims.get(\'rut\')', 'claims = get_jwt()\n        rut_usuario = claims.get(\'rut\')\n        rol_usuario = claims.get(\'roles\', [\'usuario\'])[0] if claims else \'usuario\'')
content = content.replace('claims = get_jwt()\n        rut_responsable = claims.get(\'rut\')', 'claims = get_jwt()\n        rut_responsable = claims.get(\'rut\')\n        rol_usuario = claims.get(\'roles\', [\'usuario\'])[0] if claims else \'usuario\'')
content = content.replace('claims = get_jwt()\n        rut_mensajero = claims.get(\'rut\')', 'claims = get_jwt()\n        rut_mensajero = claims.get(\'rut\')\n        rol_usuario = claims.get(\'roles\', [\'usuario\'])[0] if claims else \'usuario\'')

# For the assignment endpoints
content = content.replace('rut_actual = get_jwt()\n        if not rut_actual:', 'claims = get_jwt()\n        rut_actual = claims\n        if not rut_actual:\n            return jsonify({\'error\': \'Token inválido\'}), 401\n        rol_usuario = claims.get(\'roles\', [\'usuario\'])[0] if claims else \'usuario\'\n        rut_actual = rut_actual.get(\'rut\')\n        #')
content = content.replace('rut_actual = rut_actual.get(\'rut\')\n        \n        activo = Activo.query', 'activo = Activo.query')

content = content.replace('nuevo_activo.to_dict()', 'nuevo_activo.to_dict(rol_usuario)')
content = content.replace('activo.to_dict()', 'activo.to_dict(rol_usuario)')
content = content.replace('pkg.to_dict()', 'pkg.to_dict(rol_usuario)')

with open('app/packages/routes.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied")
