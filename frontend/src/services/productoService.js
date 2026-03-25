const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
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