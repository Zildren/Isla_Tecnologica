const API_URL = "/api/auth/login";

export const loginUsuario = async (matricula, password) => {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matricula, password })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Error del servidor:", data);
            return { status: "ERROR_SERVIDOR", mensaje: data.mensaje };
        }

        console.log("✅ LOGIN OK:", data);

        // Guarda el JWT y datos de sesión
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('empresaId', String(data.empresaId));
            localStorage.setItem('rolUsuario', data.rol);
            localStorage.setItem('usuarioLogueado', data.matricula);
        }

        return data;

    } catch (error) {
        console.error("❌ Error de conexión:", error);
        return { status: "ERROR_CONEXION" };
    }
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('empresaId');
    localStorage.removeItem('rolUsuario');
    localStorage.removeItem('usuarioLogueado');
};