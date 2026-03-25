// Es mejor usar una variable de entorno o la URL completa de Railway si el backend es independiente
const API_URL = "https://tu-backend-en-railway.app/api/auth/login"; 

export const loginUsuario = async (matricula, password) => {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matricula, password })
        });

        // 1. Verificamos si la respuesta es exitosa antes de parsear JSON
        if (!response.ok) {
            const errorText = await response.text(); // Captura el "Invalid CORS request"
            console.error("Error del servidor:", errorText);
            return { status: "ERROR_SERVIDOR", detalles: errorText };
        }

        // 2. Si llegamos aquí, el JSON es seguro de leer
        return await response.json();

    } catch (error) {
        console.error("Error de red/conexión:", error);
        return { status: "ERROR_CONEXION", rol: "" };
    }
};