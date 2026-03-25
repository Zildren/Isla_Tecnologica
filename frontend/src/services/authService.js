const BASE_URL = process.env.REACT_APP_API_URL;
const API_URL = `${BASE_URL}/api/auth/login`;

// 🔍 Debug (para verificar que ya no sea undefined)
console.log("BASE_URL:", BASE_URL);
console.log("Login API:", API_URL);

export const loginUsuario = async (matricula, password) => {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ matricula, password })
        });

        // ❌ Error del servidor
        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Error del servidor:", errorText);

            return {
                status: "ERROR_SERVIDOR",
                detalles: errorText
            };
        }

        // ✅ Respuesta correcta
        return await response.json();

    } catch (error) {
        console.error("❌ Error de conexión:", error);

        return {
            status: "ERROR_CONEXION",
            rol: ""
        };
    }
};