// src/services/authService.js

// 🔥 Ruta relativa (frontend + backend en el mismo dominio)
const API_URL = '/api/auth/login';

// 🔍 Debug
console.log("🔗 API_URL:", window.location.origin + API_URL);

export const loginUsuario = async (matricula, password) => {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matricula, password })
        });

        // 🔥 Manejo de errores del servidor
        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Error del servidor:", errorText);

            return {
                status: "ERROR_SERVIDOR",
                detalles: errorText
            };
        }

        const data = await response.json();
        console.log("✅ Respuesta login:", data);

        return data;

    } catch (error) {
        console.error("❌ Error de conexión:", error);

        return {
            status: "ERROR_CONEXION",
            rol: ""
        };
    }
};