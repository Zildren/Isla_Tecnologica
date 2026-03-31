// ✅ URL del backend (NO se modifica como pediste)
const API_URL = "https://tu-backend-en-railway.app/api/usuarios";

// 🏢 Empresa (temporal, luego viene del login)
const EMPRESA_ID = 1;

/**
 * Obtener usuarios por empresa
 */
export const obtenerUsuarios = async () => {
    try {
        const response = await fetch(`${API_URL}/empresa/${EMPRESA_ID}`);

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
            body: JSON.stringify({
                ...usuario,
                empresa: {
                    id: EMPRESA_ID
                }
            })
        });

        if (!response.ok) {
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

// 🚩 Verificación en consola
console.log("Servicio de Usuarios SaaS listo (multi-empresa activado) 🚀");