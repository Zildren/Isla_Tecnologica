// Ruta relativa para que funcione en Railway y local
const API_URL = "/api/auth/login"; 

export const loginUsuario = async (matricula, password) => {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matricula, password })
        });

        // Verificamos si la respuesta es un JSON válido
        const data = await response.json();
        
        // Retorna el objeto { status, rol } que envía tu Java
        return data;

    } catch (error) {
        console.error("Error en conexión:", error);
        return { status: "ERROR_CONEXION", rol: "" };
    }
};