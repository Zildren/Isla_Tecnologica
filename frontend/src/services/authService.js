// ✅ Usar ruta relativa (MISMO dominio)
const API_URL = "/api/auth/login";

console.log("🔗 LOGIN URL:", window.location.origin + API_URL);

export const loginUsuario = async (matricula, password) => {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matricula, password })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Error del servidor:", errorText);

            return {
                status: "ERROR_SERVIDOR",
                detalles: errorText
            };
        }

        const data = await response.json();
        console.log("✅ LOGIN OK:", data);

        return data;

    } catch (error) {
        console.error("❌ Error de conexión:", error);

        return {
            status: "ERROR_CONEXION",
            rol: ""
        };
    }
};