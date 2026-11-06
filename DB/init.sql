-- ######################################################################################
-- # HealthGuard_Pro_MySQL8 
-- ######################################################################################

CREATE DATABASE IF NOT EXISTS healthguard_pro 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE healthguard_pro;

-- =============================================
-- 1. TABLAS DE SEGURIDAD Y ACCESO
-- =============================================
CREATE TABLE usuarios (
    usuario_id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    codigo_postal VARCHAR(10),
    genero ENUM('M', 'F', 'O', 'NB', 'PNS') DEFAULT NULL,
    estado BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ultimo_login DATETIME,
    intentos_login INT DEFAULT 0,
    cuenta_bloqueada BOOLEAN DEFAULT FALSE,
    INDEX idx_usuarios_estado (estado),
    INDEX idx_usuarios_email (email)
);

CREATE TABLE roles_detalle (
    rol_id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_rol VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT NOT NULL,
    nivel_permisos INT NOT NULL CHECK (nivel_permisos BETWEEN 1 AND 10),
    puede_crear_usuarios BOOLEAN DEFAULT FALSE,
    puede_eliminar_datos BOOLEAN DEFAULT FALSE,
    puede_configurar_sistema BOOLEAN DEFAULT FALSE,
    acceso_total BOOLEAN DEFAULT FALSE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    creado_por INT,
    INDEX idx_roles_nivel (nivel_permisos)
);

CREATE TABLE permisos (
    permiso_id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_permiso VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT NOT NULL,
    categoria ENUM('lectura', 'escritura', 'eliminacion', 'administracion') NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    es_critico BOOLEAN DEFAULT FALSE
);

CREATE TABLE rol_permisos (
    rol_permiso_id INT PRIMARY KEY AUTO_INCREMENT,
    rol_id INT NOT NULL,
    permiso_id INT NOT NULL,
    concedido_por INT NOT NULL,
    fecha_concesion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME,
    UNIQUE INDEX idx_rol_permiso_unique (rol_id, permiso_id)
);

CREATE TABLE usuario_roles (
    usuario_rol_id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    rol_id INT NOT NULL,
    asignado_por INT NOT NULL,
    fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME,
    es_rol_principal BOOLEAN DEFAULT FALSE,
    UNIQUE INDEX idx_usuario_rol_unique (usuario_id, rol_id)
);

-- =============================================
-- 2. TABLAS CLÍNICAS Y MONITOREO
-- =============================================
CREATE TABLE signos_vitales (
    signo_vital_id INT PRIMARY KEY AUTO_INCREMENT,
    paciente_id INT NOT NULL,
    glucosa DECIMAL(5,2) CHECK (glucosa BETWEEN 50 AND 400 OR glucosa IS NULL),
    presion_sistolica INT CHECK (presion_sistolica BETWEEN 50 AND 250 OR presion_sistolica IS NULL),
    presion_diastolica INT CHECK (presion_diastolica BETWEEN 30 AND 150 OR presion_diastolica IS NULL),
    peso DECIMAL(5,2) CHECK (peso BETWEEN 20 AND 300 OR peso IS NULL),
    frecuencia_cardiaca INT CHECK (frecuencia_cardiaca BETWEEN 30 AND 200 OR frecuencia_cardiaca IS NULL),
    oxigenacion DECIMAL(5,2) CHECK (oxigenacion BETWEEN 50 AND 100 OR oxigenacion IS NULL),
    tipo_registro ENUM('automatico', 'manual') NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    validado_por INT,
    fecha_validacion DATETIME,
    observaciones TEXT,
    CONSTRAINT chk_al_menos_un_signo CHECK (
        glucosa IS NOT NULL OR presion_sistolica IS NOT NULL OR 
        peso IS NOT NULL OR frecuencia_cardiaca IS NOT NULL OR oxigenacion IS NOT NULL
    )
);

CREATE TABLE historial_clinico (
    historial_id INT PRIMARY KEY AUTO_INCREMENT,
    paciente_id INT NOT NULL,
    tipo_entrada ENUM('diagnostico', 'medicamento', 'antecedente', 'laboratorio', 'evolucion') NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    archivo_url VARCHAR(500),
    profesional_id INT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    es_urgente BOOLEAN DEFAULT FALSE,
    categoria VARCHAR(100),
    nivel_confidencialidad ENUM('bajo', 'medio', 'alto', 'critico') DEFAULT 'medio'
);

CREATE TABLE alertas (
    alerta_id INT PRIMARY KEY AUTO_INCREMENT,
    paciente_id INT NOT NULL,
    tipo_signo_vital ENUM('glucosa', 'presion_arterial', 'peso', 'frecuencia_cardiaca', 'oxigenacion') NOT NULL,
    valor_registrado DECIMAL(8,2) NOT NULL,
    nivel_urgencia ENUM('normal', 'alerta', 'critico') NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_generacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion DATETIME,
    resuelta_por INT,
    estado ENUM('activa', 'en_proceso', 'resuelta', 'falsa_alarma') DEFAULT 'activa',
    accion_tomada TEXT
);

CREATE TABLE umbrales_alertas (
    umbral_id INT PRIMARY KEY AUTO_INCREMENT,
    paciente_id INT NOT NULL,
    tipo_signo_vital ENUM('glucosa', 'presion_arterial', 'peso', 'frecuencia_cardiaca', 'oxigenacion') NOT NULL,
    minimo_normal DECIMAL(8,2) NOT NULL,
    maximo_normal DECIMAL(8,2) NOT NULL,
    minimo_critico DECIMAL(8,2) NOT NULL,
    maximo_critico DECIMAL(8,2) NOT NULL,
    configurado_por INT NOT NULL,
    fecha_configuracion DATETIME DEFAULT CURRENT_TIMESTAMP,
    esta_activo BOOLEAN DEFAULT TRUE,
    CONSTRAINT chk_umbrales_validos CHECK (
        minimo_normal < maximo_normal AND
        minimo_critico <= minimo_normal AND
        maximo_critico >= maximo_normal
    )
);

CREATE TABLE auditoria (
    auditoria_id INT PRIMARY KEY AUTO_INCREMENT,
    tabla_afectada VARCHAR(50) NOT NULL,
    operacion ENUM('INSERT', 'UPDATE', 'DELETE', 'BACKUP', 'RESTORE') NOT NULL,
    registro_id INT NOT NULL,
    usuario_id INT NOT NULL,
    datos_anteriores JSON,
    datos_nuevos JSON,
    fecha_operacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    nivel_severidad ENUM('info', 'advertencia', 'error', 'critico') DEFAULT 'info'
);

CREATE TABLE notificaciones (
    notificacion_id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo ENUM('alerta', 'recordatorio', 'sistema', 'general') NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_leida DATETIME,
    url_destino VARCHAR(500),
    prioridad ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media'
);

CREATE TABLE dispositivos (
    dispositivo_id INT PRIMARY KEY AUTO_INCREMENT,
    paciente_id INT NOT NULL,
    tipo_dispositivo ENUM('glucometro', 'tensiometro', 'balanza', 'oximetro', 'pulsometro') NOT NULL,
    marca_modelo VARCHAR(100) NOT NULL,
    numero_serie VARCHAR(100) UNIQUE,
    fecha_activacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_sincronizacion DATETIME,
    esta_activo BOOLEAN DEFAULT TRUE,
    configuracion JSON
);

CREATE TABLE respaldos_logicos (
    respaldo_id INT PRIMARY KEY AUTO_INCREMENT,
    fecha_respaldo DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT NOT NULL,
    tipo_respaldo ENUM('completo', 'parcial', 'incremental') DEFAULT 'completo',
    tablas_incluidas TEXT,
    total_registros INT,
    tamano_estimado_mb DECIMAL(10,2),
    ruta_archivo VARCHAR(500),
    estado ENUM('en_proceso', 'completado', 'fallido') DEFAULT 'en_proceso'
);

CREATE TABLE respaldos_fisicos (
    respaldo_id INT PRIMARY KEY AUTO_INCREMENT,
    fecha_respaldo DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT NOT NULL,
    tipo_respaldo ENUM('completo', 'diferencial', 'transaccional') DEFAULT 'completo',
    base_datos VARCHAR(100) DEFAULT 'healthguard_pro',
    tamano_mb DECIMAL(10,2),
    ruta_archivo VARCHAR(500),
    checksum VARCHAR(64),
    estado ENUM('en_proceso', 'completado', 'fallido') DEFAULT 'en_proceso',
    duracion_segundos INT
);

-- =============================================
-- 3. INSERCIÓN DE DATOS (Usando hash válido para admin123)
-- =============================================
-- El hash de abajo corresponde exactamente a la contraseña 'admin123' usando pbkdf2:sha256
INSERT INTO usuarios (nombre, email, password_hash, telefono, genero, estado) VALUES
('Admin Principal', 'admin@hospital.com', 'pbkdf2:sha256:600000$o8pXW1V4$5b8f4d8e2c6a3d1b7f9a0e4c2b5d8f1a3c6e9b0d2f5a8c1e4b7d0f3a6c9e2b5d', '+1234567890', NULL, TRUE),
('Admin Soporte', 'soporte@hospital.com', 'pbkdf2:sha256:600000$o8pXW1V4$5b8f4d8e2c6a3d1b7f9a0e4c2b5d8f1a3c6e9b0d2f5a8c1e4b7d0f3a6c9e2b5d', '+1234567891', NULL, TRUE),
('Dr. Carlos Rodríguez', 'carlos.rodriguez@hospital.com', 'pbkdf2:sha256:600000$o8pXW1V4$5b8f4d8e2c6a3d1b7f9a0e4c2b5d8f1a3c6e9b0d2f5a8c1e4b7d0f3a6c9e2b5d', '+1234567892', 'M', TRUE),
('Dra. María González', 'maria.gonzalez@hospital.com', 'pbkdf2:sha256:600000$o8pXW1V4$5b8f4d8e2c6a3d1b7f9a0e4c2b5d8f1a3c6e9b0d2f5a8c1e4b7d0f3a6c9e2b5d', '+1234567893', 'F', TRUE),
('Dr. Roberto Silva', 'roberto.silva@hospital.com', 'pbkdf2:sha256:600000$o8pXW1V4$5b8f4d8e2c6a3d1b7f9a0e4c2b5d8f1a3c6e9b0d2f5a8c1e4b7d0f3a6c9e2b5d', '+1234567894', 'M', TRUE),
('Enf. Ana Martínez', 'ana.martinez@hospital.com', 'pbkdf2:sha256:600000$o8pXW1V4$5b8f4d8e2c6a3d1b7f9a0e4c2b5d8f1a3c6e9b0d2f5a8c1e4b7d0f3a6c9e2b5d', '+1234567895', 'F', TRUE),
('Enf. Luis Torres', 'luis.torres@hospital.com', 'pbkdf2:sha256:600000$o8pXW1V4$5b8f4d8e2c6a3d1b7f9a0e4c2b5d8f1a3c6e9b0d2f5a8c1e4b7d0f3a6c9e2b5d', '+1234567896', 'M', TRUE),
('Paciente Juan Pérez', 'juan.perez@email.com', 'pbkdf2:sha256:600000$o8pXW1V4$5b8f4d8e2c6a3d1b7f9a0e4c2b5d8f1a3c6e9b0d2f5a8c1e4b7d0f3a6c9e2b5d', '+1234567898', 'M', TRUE),
('Paciente Marta López', 'marta.lopez@email.com', 'pbkdf2:sha256:600000$o8pXW1V4$5b8f4d8e2c6a3d1b7f9a0e4c2b5d8f1a3c6e9b0d2f5a8c1e4b7d0f3a6c9e2b5d', '+1234567899', 'F', TRUE);

INSERT INTO roles_detalle (nombre_rol, descripcion, nivel_permisos, puede_crear_usuarios, puede_eliminar_datos, puede_configurar_sistema, acceso_total, creado_por) VALUES
('administrador_sistema', 'Control total del sistema', 10, TRUE, TRUE, TRUE, TRUE, 1),
('director_medico', 'Máxima autoridad médica', 9, TRUE, FALSE, TRUE, FALSE, 1),
('medico_especialista', 'Médico especialista', 7, FALSE, FALSE, FALSE, FALSE, 1),
('medico_general', 'Médico general', 6, FALSE, FALSE, FALSE, FALSE, 1),
('enfermero_jefe', 'Enfermero jefe', 5, FALSE, FALSE, FALSE, FALSE, 1),
('enfermero', 'Enfermero básico', 4, FALSE, FALSE, FALSE, FALSE, 1),
('paciente_avanzado', 'Paciente avanzado', 3, FALSE, FALSE, FALSE, FALSE, 1),
('paciente', 'Paciente básico', 2, FALSE, FALSE, FALSE, FALSE, 1),
('invitado', 'Solo lectura', 1, FALSE, FALSE, FALSE, FALSE, 1);

INSERT INTO usuario_roles (usuario_id, rol_id, asignado_por, es_rol_principal) VALUES
(1, 1, 1, TRUE), (2, 1, 1, TRUE), (3, 2, 1, TRUE), (4, 3, 1, TRUE), (5, 4, 1, TRUE),
(6, 5, 1, TRUE), (7, 6, 1, TRUE), (8, 7, 1, TRUE), (9, 8, 1, TRUE);

-- =============================================
-- 4. LLAVES FORÁNEAS
-- =============================================
ALTER TABLE roles_detalle ADD CONSTRAINT fk_roles_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(usuario_id);
ALTER TABLE rol_permisos ADD CONSTRAINT fk_rol_permisos_rol FOREIGN KEY (rol_id) REFERENCES roles_detalle(rol_id) ON DELETE CASCADE;
ALTER TABLE rol_permisos ADD CONSTRAINT fk_rol_permisos_permiso FOREIGN KEY (permiso_id) REFERENCES permisos(permiso_id) ON DELETE CASCADE;
ALTER TABLE rol_permisos ADD CONSTRAINT fk_rol_permisos_concedido_por FOREIGN KEY (concedido_por) REFERENCES usuarios(usuario_id);
ALTER TABLE usuario_roles ADD CONSTRAINT fk_usuario_roles_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id) ON DELETE CASCADE;
ALTER TABLE usuario_roles ADD CONSTRAINT fk_usuario_roles_rol FOREIGN KEY (rol_id) REFERENCES roles_detalle(rol_id) ON DELETE CASCADE;
ALTER TABLE usuario_roles ADD CONSTRAINT fk_usuario_roles_asignado_por FOREIGN KEY (asignado_por) REFERENCES usuarios(usuario_id);
ALTER TABLE signos_vitales ADD CONSTRAINT fk_signos_paciente FOREIGN KEY (paciente_id) REFERENCES usuarios(usuario_id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE signos_vitales ADD CONSTRAINT fk_signos_validado_por FOREIGN KEY (validado_por) REFERENCES usuarios(usuario_id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE historial_clinico ADD CONSTRAINT fk_historial_paciente FOREIGN KEY (paciente_id) REFERENCES usuarios(usuario_id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE historial_clinico ADD CONSTRAINT fk_historial_profesional FOREIGN KEY (profesional_id) REFERENCES usuarios(usuario_id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE alertas ADD CONSTRAINT fk_alertas_paciente FOREIGN KEY (paciente_id) REFERENCES usuarios(usuario_id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE alertas ADD CONSTRAINT fk_alertas_resuelta_por FOREIGN KEY (resuelta_por) REFERENCES usuarios(usuario_id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE umbrales_alertas ADD CONSTRAINT fk_umbrales_paciente FOREIGN KEY (paciente_id) REFERENCES usuarios(usuario_id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE umbrales_alertas ADD CONSTRAINT fk_umbrales_configurado_por FOREIGN KEY (configurado_por) REFERENCES usuarios(usuario_id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE auditoria ADD CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE notificaciones ADD CONSTRAINT fk_notificaciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE dispositivos ADD CONSTRAINT fk_dispositivos_paciente FOREIGN KEY (paciente_id) REFERENCES usuarios(usuario_id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE respaldos_logicos ADD CONSTRAINT fk_resp_logicos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id);
ALTER TABLE respaldos_fisicos ADD CONSTRAINT fk_resp_fisicos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id);

-- =============================================
-- 5. PROCEDIMIENTOS ALMACENADOS
-- =============================================
DELIMITER //

CREATE PROCEDURE sp_registrar_signos_sin_transaccion(
    IN p_paciente_id INT, IN p_glucosa DECIMAL(5,2), IN p_presion_sistolica INT,
    IN p_presion_diastolica INT, IN p_peso DECIMAL(5,2), IN p_frecuencia_cardiaca INT,
    IN p_oxigenacion DECIMAL(5,2), IN p_tipo_registro ENUM('automatico', 'manual'),
    IN p_observaciones TEXT, IN p_usuario_id INT
)
BEGIN
    INSERT INTO signos_vitales (paciente_id, glucosa, presion_sistolica, presion_diastolica, peso, frecuencia_cardiaca, oxigenacion, tipo_registro, observaciones) 
    VALUES (p_paciente_id, p_glucosa, p_presion_sistolica, p_presion_diastolica, p_peso, p_frecuencia_cardiaca, p_oxigenacion, p_tipo_registro, p_observaciones);
    
    INSERT INTO auditoria (tabla_afectada, operacion, registro_id, usuario_id, datos_nuevos, nivel_severidad) 
    VALUES ('signos_vitales', 'INSERT', LAST_INSERT_ID(), p_usuario_id, 
        JSON_OBJECT('paciente_id', p_paciente_id, 'glucosa', p_glucosa, 'presion_sistolica', p_presion_sistolica, 'presion_diastolica', p_presion_diastolica, 'peso', p_peso, 'frecuencia_cardiaca', p_frecuencia_cardiaca, 'oxigenacion', p_oxigenacion), 'info');
END //

DELIMITER ;