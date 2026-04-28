const API_URL = "/api/auth/login";

export const loginUsuario = async (matricula, password) => {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matricula, password })
        });

        const data = await response.json();

        // ✅ Manejo de errores por código HTTP
        if (response.status === 403) {
            // Empresa inactiva, vencida o usuario bloqueado
            return { 
                status: "ACCESO_DENEGADO", 
                mensaje: data.error || "Acceso denegado. Contacta al administrador." 
            };
        }

        if (response.status === 401) {
            return { 
                status: "CREDENCIALES_INVALIDAS", 
                mensaje: "Usuario o contraseña incorrectos." 
            };
        }

        if (!response.ok) {
            return { 
                status: "ERROR_SERVIDOR", 
                mensaje: data.error || data.mensaje || "Error en el servidor." 
            };
        }

        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('empresaId', String(data.empresaId));
            localStorage.setItem('rolUsuario', data.rol);
            localStorage.setItem('usuarioLogueado', data.matricula);
        }

        return data;

    } catch (error) {
        console.error("Error de conexion:", error);
        return { status: "ERROR_CONEXION", mensaje: "Sin conexión al servidor." };
    }
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('empresaId');
    localStorage.removeItem('rolUsuario');
    localStorage.removeItem('usuarioLogueado');
};