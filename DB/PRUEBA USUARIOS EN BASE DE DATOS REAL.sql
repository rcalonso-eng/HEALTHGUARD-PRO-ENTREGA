USE healthguard_pro;

DROP VIEW IF EXISTS vista_expediente_pacientes;

CREATE VIEW vista_expediente_pacientes AS
SELECT 
    u.usuario_id,
    u.nombre AS nombre_completo,
    u.email,
    u.telefono,
    r.nombre_rol AS rol_en_sistema
FROM usuarios u
JOIN usuario_roles ur ON u.usuario_id = ur.usuario_id
JOIN roles_detalle r ON ur.rol_id = r.rol_id
WHERE ur.es_rol_principal = TRUE 
AND u.estado = TRUE
ORDER BY u.nombre;

SELECT * FROM vista_expediente_pacientes;