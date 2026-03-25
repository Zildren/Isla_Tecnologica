const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_URL = `${BASE_URL}/api/productos`;

export const obtenerProductos = async () => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }
        return await response.json();
    } catch (error) {
        console.error("Error al obtener productos:", error);
        return [];
    }
};

export const guardarProducto = async (producto) => {
    try {
        const esEdicion = producto.id !== null && producto.id !== undefined;
        const url = esEdicion ? `${API_URL}/${producto.id}` : API_URL;
        const method = esEdicion ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(producto)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error al guardar producto:", error);
        return null;
    }
};

export const eliminarProducto = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok || response.status === 204 || response.status === 200) return true;
        if (response.status === 404) throw new Error('Producto no encontrado');
        if (response.status === 405) throw new Error('El backend no tiene DELETE habilitado');
        throw new Error(`Error del servidor: ${response.status}`);
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        throw error;
    }
};