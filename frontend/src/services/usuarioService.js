// ✅ Detecta automáticamente el dominio (Railway o Local)
const API_BASE = window.location.origin;
const API_URL = `${API_BASE}/api/usuarios`;

/**
 * Obtener todos los usuarios
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
        return []; // Retorna array vacío para evitar errores en el .map() de React
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
            // Captura el mensaje específico del backend (ej: "Ya existe la matrícula")
            const msg = await response.text();
            throw new Error(msg);
        }
        return await response.json();
    } catch (error) {
        console.error("Error al agregar usuario:", error);
        throw error; // Re-lanzamos para que el componente maneje el alert
    }
};

/**
 * Bloquear/Desbloquear usuario (PUT)
 */
export const toggleBloqueoUsuario = async (id, bloqueadoActualmente) => {
    try {
        const response = await fetch(`${API_URL}/${id}/bloquear`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            // Enviamos el estado inverso al actual
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
        
        // Verificamos si hay contenido antes de intentar parsear JSON
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