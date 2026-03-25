// src/services/authService.js
const BASE_URL = process.env.REACT_APP_API_URL;

const API_URL = '/api/auth/login';

// 🔍 Debug
console.log("Login API (relativa):", API_URL);
console.log("URL completa de la petición:", window.location.origin + API_URL);

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