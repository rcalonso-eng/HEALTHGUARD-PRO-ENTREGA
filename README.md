 	HealthGuard Pro es una plataforma web diseñada para la gestión clínica y el monitoreo de pacientes. El sistema ha evolucionado de un modelo monolítico a una Arquitectura de Microservicios, garantizando escalabilidad, seguridad y un despliegue automatizado.

🏗️ Arquitectura del Sistema
El proyecto está construido bajo los siguientes componentes:

Frontend (React + Vite): Interfaz de usuario, implementando el patrón MVVM (Model-View-ViewModel) mediante el uso de Context API para el manejo del estado y Axios para el consumo de la API.

API Gateway (Flask + HTTPX): Punto de entrada único que recibe las peticiones del frontend y las enruta al microservicio correspondiente.

Auth Service (Flask): Microservicio encargado de la identidad, autenticación (JWT), control de acceso basado en roles (RBAC) y Rate Limiting.

Clinical Service (Flask): Microservicio central que gestiona pacientes, expedientes clínicos, signos vitales y alertas médicas.

Base de Datos (MySQL 8): Almacenamiento relacional con integridad referencial (PK, FK, Checks), vistas y Procedimientos Almacenados para la auditoría automática.

Orquestación (Docker Compose): Contenerización de todos los servicios para un despliegue con un solo comando.

Diagrama de Flujo de Peticiones










🛠️ Tecnologías Utilizadas
Frontend: React 18, React Router DOM, Axios, Context API.

Backend: Python 3.11, Flask, SQLAlchemy, PyMySQL.

Seguridad: JSON Web Tokens (JWT), Flask-JWT-Extended, Flask-Limiter (Rate Limit).

Base de Datos: MySQL 8.0.

DevOps: Docker, Docker Compose, Nginx (para el frontend).

CI/CD: GitHub Actions (Pruebas automatizadas con Pytest).

🚀 Guía de Instalación y Despliegue
Prerrequisitos
Tener instalado Docker Desktop.

Tener instalado Git (opcional, para clonar el repositorio).

Pasos para levantar el sistema
Clona el repositorio o descarga el código fuente.

Abre una terminal en la raíz del proyecto (donde se encuentra el archivo docker-compose.yml).

Ejecuta el siguiente comando para construir y levantar todos los contenedores:

bash
docker-compose up -d --build
Espera unos 30 segundos (mientras MySQL inicializa las tablas y los datos).

Abre tu navegador y accede a:
👉 http://localhost:5173

Nota: El sistema ya incluye la carga inicial de datos (init.sql) con usuarios de prueba listos para usar.

🔐 Credenciales de Prueba
Todas las cuentas tienen la contraseña: admin123

Rol	Email	Acceso
Administrador	admin@hospital.com	Acceso total (Usuarios, Auditoría, Pacientes)
Médico	carlos.rodriguez@hospital.com	Pacientes, Signos, Historial
Enfermero	ana.martinez@hospital.com	Signos, Alertas
Paciente	juan.perez@email.com	Solo sus propios signos y alertas
🧪 Pruebas Automatizadas (CI/CD)
El proyecto cuenta con un flujo de Integración Continua (CI) configurado en GitHub Actions (.github/workflows/ci.yml).

Cada vez que se realiza un push a la rama main, GitHub:

Instala Python 3.11.

Instala las dependencias del auth-service.

Ejecuta las 4 pruebas unitarias (Login exitoso, Login fallido, Bloqueo por intentos, Registro).

Para ejecutar las pruebas localmente:

bash
cd healthguard-services/auth-service
python -m pytest tests/ -v
📂 Estructura del Proyecto
text
/
├── .github/workflows/   # Configuración de GitHub Actions (CI)
├── DB/                  # Scripts SQL (init.sql con tablas, SPs y datos)
├── healthguard-frontend/ # Código fuente de React (Vistas y ViewModels)
├── healthguard-services/
│   ├── api-gateway/     # Configuración del proxy inverso
│   ├── auth-service/    # Microservicio de Autenticación y Usuarios
│   └── clinical-service/ # Microservicio de Datos Clínicos
├── docker-compose.yml   # Orquestador de contenedores
└── README.md
📌 Funcionalidades Implementadas
☑ Autenticación con JWT y Control de Acceso Basado en Roles (RBAC).
☑ Rate Limiting para prevención de ataques de fuerza bruta.
☑ CRUD completo de Pacientes (con validaciones).
☑ Registro y consulta de Signos Vitales mediante Procedimientos Almacenados.
☑ Historial Clínico con generación de notificaciones urgentes.
☑ Gestión de Usuarios y Cambio de Roles.
☑ Módulo de "Mi Perfil" para el cambio de contraseña.
☑ Bitácora de Auditoría (Logs de acciones del sistema).
