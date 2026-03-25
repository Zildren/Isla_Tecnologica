// const API_URL = "http://localhost:8080/api/auth/login";
const API_URL = "/api/auth/login";

export const loginUsuario = async (matricula, password) => {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matricula, password })
        });

        const data = await response.json();
        
        // ✅ Ahora regresa el objeto completo { status, rol }
        return data;

    } catch (error) {
        console.error("Error en conexión:", error);
        return { status: "ERROR_CONEXION", rol: "" };
    }
};