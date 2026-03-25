// ✅ Detecta automáticamente el dominio (Railway o Local)
const API_BASE = window.location.origin;
const API_URL = `${API_BASE}/api/ventas`;

// ✅ Función para guardar nuevas ventas
export const registrarVenta = async (datosVenta) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosVenta)
        });
        
        if (!response.ok) {
            // Intentamos leer el error como texto por si no es JSON
            const errorText = await response.text();
            console.error("Error del servidor:", errorText);
            return null;
        }
        
        return await response.json(); 
    } catch (error) {
        console.error("Error de conexión:", error);
        return null;
    }
};

// ✅ Función para el reporte de ganancias y estadísticas
export const obtenerVentas = async () => {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }
        
        return await response.json(); 
    } catch (error) {
        console.error("Error al obtener el historial de ventas:", error);
        return []; 
    }
};