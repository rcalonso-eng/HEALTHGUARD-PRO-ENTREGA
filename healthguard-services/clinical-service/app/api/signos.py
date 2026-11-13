from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from app.extensions import db
from app.utils.decorators import owner_or_roles, roles_required
from app.models import SignoVital, Usuario, Alerta, UmbralAlerta 

signos_bp = Blueprint('signos', __name__)


def _signo_to_dict(s):
    return {
        "signo_vital_id": s.signo_vital_id,
        "paciente_id": s.paciente_id,
        "glucosa": float(s.glucosa) if s.glucosa is not None else None,
        "presion_sistolica": s.presion_sistolica,
        "presion_diastolica": s.presion_diastolica,
        "peso": float(s.peso) if s.peso is not None else None,
        "frecuencia_cardiaca": s.frecuencia_cardiaca,
        "oxigenacion": float(s.oxigenacion) if s.oxigenacion is not None else None,
        "tipo_registro": s.tipo_registro,
        "fecha_registro": s.fecha_registro.isoformat() if s.fecha_registro else None,
        "observaciones": s.observaciones,
    }


@signos_bp.route('/pacientes/<int:paciente_id>/signos', methods=['GET'])
@jwt_required()
@owner_or_roles('administrador_sistema', 'medico_', 'enfermero_',
                id_param='paciente_id')
def listar_signos(paciente_id):
    signos = SignoVital.consulta_por_paciente(paciente_id)
    return jsonify([_signo_to_dict(s) for s in signos]), 200


@signos_bp.route('/pacientes/<int:paciente_id>/signos', methods=['POST'])
@jwt_required()
@roles_required('administrador_sistema', 'medico_', 'enfermero_')
def crear_signo(paciente_id):
    data = request.get_json(silent=True) or {}

    if not Usuario.query.get(paciente_id):
        return jsonify({"error": "Paciente no encontrado"}), 404

    uid = int(get_jwt_identity())
    
    # 1. Guardar el signo vital en la base de datos (usando el SP)
    try:
        db.session.execute(
            text("""CALL sp_registrar_signos_sin_transaccion(
                :pid, :glu, :sis, :dia, :peso, :fc, :oxi,
                :tipo, :obs, :uid
            )"""),
            {
                "pid": paciente_id,
                "glu": data.get('glucosa'),
                "sis": data.get('presion_sistolica'),
                "dia": data.get('presion_diastolica'),
                "peso": data.get('peso'),
                "fc": data.get('frecuencia_cardiaca'),
                "oxi": data.get('oxigenacion'),
                "tipo": data.get('tipo_registro', 'manual'),
                "obs": data.get('observaciones'),
                "uid": uid,
            }
        )
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

    # 2. LÓGICA DE ALERTAS AUTOMÁTICAS BASADA EN UMBRALES 👇
    # Mapeamos los valores recibidos a las columnas de la tabla umbrales_alertas
    valores_ingresados = {
        'glucosa': data.get('glucosa'),
        'presion_arterial': data.get('presion_sistolica'), # Usamos la sistólica para evaluar la presión
        'peso': data.get('peso'),
        'frecuencia_cardiaca': data.get('frecuencia_cardiaca'),
        'oxigenacion': data.get('oxigenacion')
    }

    for tipo_signo, valor in valores_ingresados.items():
        if valor is not None:
            # Buscamos si el paciente tiene un umbral activo para este tipo de signo
            umbral = UmbralAlerta.query.filter_by(
                paciente_id=paciente_id, 
                tipo_signo_vital=tipo_signo, 
                esta_activo=True
            ).first()

            if umbral:
                nivel_alerta = None
                mensaje = ""

                # Evaluamos los valores críticos primero
                if valor <= umbral.minimo_critico:
                    nivel_alerta = 'critico'
                    mensaje = f"{tipo_signo.capitalize()} crítica (Muy baja): {valor}. Mínimo permitido: {umbral.minimo_critico}."
                elif valor >= umbral.maximo_critico:
                    nivel_alerta = 'critico'
                    mensaje = f"{tipo_signo.capitalize()} crítica (Muy alta): {valor}. Máximo permitido: {umbral.maximo_critico}."
                # Si no es crítico, evaluamos si es una alerta normal
                elif valor < umbral.minimo_normal:
                    nivel_alerta = 'alerta'
                    mensaje = f"{tipo_signo.capitalize()} fuera de rango normal (Baja): {valor}. Normal: {umbral.minimo_normal} - {umbral.maximo_normal}."
                elif valor > umbral.maximo_normal:
                    nivel_alerta = 'alerta'
                    mensaje = f"{tipo_signo.capitalize()} fuera de rango normal (Alta): {valor}. Normal: {umbral.minimo_normal} - {umbral.maximo_normal}."

                # Si se determinó que hay una anomalía, creamos la alerta en la BD
                if nivel_alerta:
                    nueva_alerta = Alerta(
                        paciente_id=paciente_id,
                        tipo_signo_vital=tipo_signo,
                        valor_registrado=valor,
                        nivel_urgencia=nivel_alerta,
                        mensaje=mensaje,
                        estado='activa'
                    )
                    db.session.add(nueva_alerta)

    db.session.commit() # Guardamos las alertas generadas

    return jsonify({"mensaje": "Signo vital registrado y umbrales evaluados"}), 201