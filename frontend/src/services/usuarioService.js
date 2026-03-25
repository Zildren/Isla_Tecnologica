const API_URL = "/api/usuarios";

export const obtenerUsuarios = async () => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Error al obtener usuarios");
        return await response.json();
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        return [];
    }
};

export const agregarUsuario = async (usuario) => {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(usuario)
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

export const toggleBloqueoUsuario = async (id, bloqueado) => {
    try {
        const response = await fetch(`${API_URL}/${id}/bloquear`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bloqueado: !bloqueado })
        });
        if (!response.ok) throw new Error("No se pudo cambiar el estado");
        return true;
    } catch (error) {
        console.error("Error al cambiar bloqueo:", error);
        return false;
    }
};

export const eliminarUsuario = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });
        if (!response.ok) throw new Error("Error en el servidor al eliminar");
        return await response.json();
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        throw error;
    }
};sx