const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_URL = `${BASE_URL}/api/ventas`;

export const registrarVenta = async (datosVenta) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosVenta)
        });
        
        if (!response.ok) {
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

export const eliminarVenta = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok || response.status === 204 || response.status === 200) return true;
        if (response.status === 404) throw new Error('Venta no encontrada');
        if (response.status === 405) throw new Error('El backend no tiene DELETE habilitado');
        throw new Error(`Error del servidor: ${response.status}`);
    } catch (error) {
        console.error("Error al eliminar venta:", error);
        throw error;
    }
};
