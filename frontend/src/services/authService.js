// src/services/authService.js

// Base URL desde variables de entorno (Railway)
const BASE_URL = process.env.REACT_APP_API_URL;

// Endpoint completo
const API_URL = `${BASE_URL}/api/auth/login`;

// 🔍 Debug (puedes eliminarlos después)
console.log("🌐 BASE_URL:", BASE_URL);
console.log("🔗 API_URL:", API_URL);

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

        return await response.json();

    } catch (error) {
        console.error("❌ Error de conexión:", error);
        return {
            status: "ERROR_CONEXION",
            rol: ""
        };
    }
};