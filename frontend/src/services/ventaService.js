const API_URL = "http://localhost:8080/api/ventas";

// ✅ Función para guardar nuevas ventas (La que ya tenías)
export const registrarVenta = async (datosVenta) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosVenta)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error del servidor:", errorData);
            return null;
        }
        
        return await response.json(); 
    } catch (error) {
        console.error("Error de conexión:", error);
        return null;
    }
};

// ✅ NUEVA FUNCIÓN: Para el reporte de ganancias y estadísticas
export const obtenerVentas = async () => {
    try {
        const response = await fetch(API_URL); // Llama al @GetMapping del Backend
        
        if (!response.ok) {
            throw new Error("No se pudieron recuperar las ventas del servidor");
        }
        
        return await response.json(); // Retorna la lista de todas las ventas para filtrar en React
    } catch (error) {
        console.error("Error al obtener el historial de ventas:", error);
        return []; // Retorna un arreglo vacío para que la tabla no rompa la app
    }
};