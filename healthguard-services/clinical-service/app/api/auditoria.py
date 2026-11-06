# clinical-service/app/api/auditoria.py
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.extensions import db
from app.models import Auditoria
from app.utils.decorators import roles_required

auditoria_bp = Blueprint('auditoria', __name__)

@auditoria_bp.route('/auditoria', methods=['GET'])
@jwt_required()
@roles_required('administrador_sistema')
def listar_auditoria():
    # Trae los últimos 100 registros ordenados por fecha
    registros = db.session.query(Auditoria).order_by(Auditoria.fecha_operacion.desc()).limit(100).all()
    
    resultado = []
    for r in registros:
        resultado.append({
            "id": r.auditoria_id,
            "tabla": r.tabla_afectada,
            "operacion": r.operacion,
            "registro_id": r.registro_id,
            "usuario_id": r.usuario_id,
            "fecha": r.fecha_operacion.isoformat() if r.fecha_operacion else None,
            "severidad": r.nivel_severidad,
            "datos_nuevos": r.datos_nuevos
        })
        
    return jsonify(resultado), 200