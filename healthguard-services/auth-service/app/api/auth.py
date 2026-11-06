# auth-service/app/api/auth.py
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from app.extensions import db
from app.models import Usuario, RolDetalle, UsuarioRol

auth_bp = Blueprint('auth', __name__)

def _usuario_to_dict(u):
    rol = u._get_rol_principal()
    return {
        "usuario_id": u.usuario_id,
        "nombre": u.nombre,
        "email": u.email,
        "telefono": u.telefono,
        "direccion": u.direccion,
        "codigo_postal": u.codigo_postal,
        "genero": u.genero,
        "estado": u.estado,
        "cuenta_bloqueada": u.cuenta_bloqueada,
        "rol_principal": rol,
        "permisos": [
            rp.permiso.nombre_permiso
            for ur in u.roles if ur.rol
            for rp in ur.rol.permisos if rp.permiso
        ],
    }

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    
    if not email or not password:
        return jsonify({"error": "Email y contraseña obligatorios"}), 400

    usuario = Usuario.validar(email, password)
    if not usuario:
        return jsonify({"error": "Credenciales inválidas o cuenta bloqueada"}), 401

    usuario.ultimo_login = datetime.utcnow()
    usuario.intentos_login = 0
    db.session.commit()

    # Añadimos los claims para que clinical-service sepa el rol y permisos
    rol = usuario._get_rol_principal()
    permisos = [rp.permiso.nombre_permiso
                for ur in usuario.roles if ur.rol
                for rp in ur.rol.permisos if rp.permiso]

    claims = {"rol": rol, "permisos": permisos}
    return jsonify({
        "access_token": create_access_token(identity=usuario.usuario_id, additional_claims=claims),
        "refresh_token": create_refresh_token(identity=usuario.usuario_id, additional_claims=claims),
        "usuario": _usuario_to_dict(usuario),
    }), 200


@auth_bp.route('/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    from flask_jwt_extended import get_jwt
    uid = get_jwt_identity()
    claims = get_jwt()  # hereda los claims del refresh
    new_claims = {"rol": claims.get("rol"), "permisos": claims.get("permisos", [])}
    return jsonify({
        "access_token": create_access_token(identity=int(uid), additional_claims=new_claims)
    }), 200


@auth_bp.route('/auth/me', methods=['GET'])
@jwt_required()
def me():
    uid = int(get_jwt_identity())
    usuario = Usuario.query.get(uid)
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404
    return jsonify(_usuario_to_dict(usuario)), 200


@auth_bp.route('/auth/registro', methods=['POST'])
def registro():
    data = request.get_json(silent=True) or {}
    nombre = (data.get('nombre') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    if not nombre or not email or not password:
        return jsonify({"error": "Nombre, email y contraseña obligatorios"}), 400
    if len(password) < 6:
        return jsonify({"error": "La contraseña debe tener al menos 6 caracteres"}), 400
    if Usuario.query.filter_by(email=email).first():
        return jsonify({"error": "Ya existe una cuenta con ese email"}), 409

    nuevo = Usuario(
        nombre=nombre, email=email,
        telefono=data.get('telefono') or None,
        direccion=data.get('direccion') or None,
        estado=True,
    )
    nuevo.password = password
    db.session.add(nuevo)
    db.session.flush()

    rol = RolDetalle.query.filter_by(nombre_rol='paciente').first()
    if rol:
        db.session.add(UsuarioRol(
            usuario_id=nuevo.usuario_id,
            rol_id=rol.rol_id,
            asignado_por=nuevo.usuario_id,
            es_rol_principal=True,
        ))
    db.session.commit()
    return jsonify({"mensaje": "Registro exitoso", "usuario_id": nuevo.usuario_id}), 201

@auth_bp.route('/auth/change-password', methods=['POST'])
@jwt_required()
def change_password():
    uid = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    # Validaciones básicas
    if not current_password or not new_password:
        return jsonify({"error": "Debes proporcionar la contraseña actual y la nueva"}), 400
    if len(new_password) < 6:
        return jsonify({"error": "La nueva contraseña debe tener al menos 6 caracteres"}), 400

    usuario = Usuario.query.get(uid)
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404

    # Verificar que la contraseña actual sea correcta
    if not usuario.validar_password(current_password):
        return jsonify({"error": "La contraseña actual es incorrecta"}), 401

    # Guardar la nueva contraseña (el setter de tu modelo la encripta automáticamente)
    usuario.password = new_password
    db.session.commit()

    return jsonify({"mensaje": "Contraseña actualizada correctamente"}), 200

# Listar todos los usuarios con sus roles (Solo Admin)
@auth_bp.route('/auth/usuarios', methods=['GET'])
@jwt_required()
def listar_usuarios():
    from flask_jwt_extended import get_jwt
    if get_jwt().get('rol') != 'administrador_sistema':
        return jsonify({"error": "No autorizado"}), 403

    usuarios = Usuario.query.all()
    resultado = []
    for u in usuarios:
        rol_principal = u._get_rol_principal() or "Sin rol"
        resultado.append({
            "usuario_id": u.usuario_id,
            "nombre": u.nombre,
            "email": u.email,
            "estado": u.estado,
            "rol": rol_principal
        })
    return jsonify(resultado), 200

# Cambiar el rol de un usuario (Solo Admin)
@auth_bp.route('/auth/usuarios/<int:usuario_id>/rol', methods=['PUT'])
@jwt_required()
def cambiar_rol(usuario_id):
    from flask_jwt_extended import get_jwt
    if get_jwt().get('rol') != 'administrador_sistema':
        return jsonify({"error": "No autorizado"}), 403

    data = request.get_json()
    nuevo_rol_id = data.get('rol_id')
    
    if not nuevo_rol_id:
        return jsonify({"error": "Falta el rol_id"}), 400

    try:
        # 1. Desmarcar los roles principales anteriores (forzando la actualización)
        roles_anteriores = UsuarioRol.query.filter_by(usuario_id=usuario_id, es_rol_principal=True).all()
        for r in roles_anteriores:
            r.es_rol_principal = False
            
        # 2. Buscar si ya tiene el nuevo rol asignado
        asignacion = UsuarioRol.query.filter_by(usuario_id=usuario_id, rol_id=nuevo_rol_id).first()
        
        if asignacion:
            # Si ya lo tiene, solo lo marcamos como principal
            asignacion.es_rol_principal = True
        else:
            # Si no lo tiene, creamos la asignación
            nueva_asignacion = UsuarioRol(
                usuario_id=usuario_id,
                rol_id=nuevo_rol_id,
                asignado_por=int(get_jwt_identity()),
                es_rol_principal=True
            )
            db.session.add(nueva_asignacion)
        
        db.session.commit()
        return jsonify({"mensaje": "Rol actualizado correctamente"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500