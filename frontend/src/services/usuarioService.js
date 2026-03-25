// ✅ Detecta automáticamente el dominio (Railway o Local) para evitar ERR_CONNECTION_REFUSED
const API_BASE = window.location.origin;
const API_URL = `${API_BASE}/api/usuarios`;

/**
 * Obtener todos los usuarios registrados
 */
export const obtenerUsuarios = async () => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Error al obtener usuarios");
        }
        return await response.json();
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        return []; 
    }
};

/**
 * Agregar un nuevo usuario (POST)
 */
export const agregarUsuario = async (usuario) => {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(usuario)
        });
        
        if (!response.ok) {
            // Captura errores específicos como "Matrícula duplicada" enviados desde Java
            const msg = await response.text();
            throw new Error(msg);
        }
        return await response.json();
    } catch (error) {
        console.error("Error al agregar usuario:", error);
        throw error; 
    }
};

/**
 * Bloquear o desbloquear usuario (PUT)
 */
export const toggleBloqueoUsuario = async (id, bloqueadoActualmente) => {
    try {
        const response = await fetch(`${API_URL}/${id}/bloquear`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bloqueado: !bloqueadoActualmente })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "No se pudo cambiar el estado del usuario");
        }
        return true;
    } catch (error) {
        console.error("Error al cambiar bloqueo:", error);
        return false;
    }
};

/**
 * Eliminar usuario (DELETE)
 */
export const eliminarUsuario = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Error en el servidor al eliminar usuario");
        }
        
        // Verifica si el backend devolvió un JSON o está vacío (204 No Content)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }
        return { success: true };
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        throw error;
    }
};

// 🚩 Marca de control para verificar despliegue en consola (F12)
console.log("Servicio de Usuarios cargado con rutas relativas: OK");