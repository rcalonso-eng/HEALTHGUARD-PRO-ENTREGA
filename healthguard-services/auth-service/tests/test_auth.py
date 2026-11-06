import pytest
from app import create_app
from app.extensions import db
from app.models import Usuario
from config import Config

# 1. Creamos una clase de configuración exclusiva para pruebas
class TestConfig(Config):
    TESTING = True
    # Usamos SQLite en memoria para que no toque tu MySQL real
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_SECRET_KEY = 'test-secret-key'

@pytest.fixture
def client():
    # 2. Le pasamos la configuración de pruebas al crear la app
    app = create_app(TestConfig)
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            # Creamos un usuario de prueba
            u = Usuario(nombre='Test User', email='test@test.com')
            u.password = 'Password123'
            db.session.add(u)
            db.session.commit()
            
            yield client
            
            # Limpiamos la base de datos temporal
            db.session.remove()
            db.drop_all()

# PRUEBA 1: Login exitoso
def test_login_exitoso(client):
    res = client.post('/api/auth/login', json={
        'email': 'test@test.com', 'password': 'Password123'
    })
    assert res.status_code == 200
    assert 'access_token' in res.json

# PRUEBA 2: Login fallido por contraseña incorrecta
def test_login_fallido(client):
    res = client.post('/api/auth/login', json={
        'email': 'test@test.com', 'password': 'WrongPassword'
    })
    assert res.status_code == 401
    assert 'Credenciales inválidas' in res.json['error']

# PRUEBA 3: Bloqueo de cuenta tras 5 intentos
def test_bloqueo_cuenta(client):
    for _ in range(5):
        client.post('/api/auth/login', json={'email': 'test@test.com', 'password': 'Wrong'})
    
    # Intento con la contraseña correcta, pero ya debe estar bloqueado
    res = client.post('/api/auth/login', json={
        'email': 'test@test.com', 'password': 'Password123'
    })
    assert res.status_code == 401

# PRUEBA 4: Registro de nuevo usuario
def test_registro_usuario(client):
    res = client.post('/api/auth/registro', json={
        'nombre': 'Nuevo', 'email': 'nuevo@test.com', 'password': 'Pass12345'
    })
    assert res.status_code == 201
    assert 'usuario_id' in res.json