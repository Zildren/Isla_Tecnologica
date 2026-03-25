// const API_URL = "http://localhost:8080/api/productos";
   const API_URL = "/api/productos";

export const obtenerProductos = async () => {
    try {
        const response = await fetch(API_URL);
        return await response.json();
    } catch (error) {
        console.error("Error al obtener productos:", error);
        return [];
    }
};

export const guardarProducto = async (producto) => {
    try {
        const esEdicion = producto.id !== null && producto.id !== undefined;
        const url    = esEdicion ? `${API_URL}/${producto.id}` : API_URL;
        const method = esEdicion ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(producto)
        });
        return await response.json();
    } catch (error) {
        console.error("Error al guardar producto:", error);
    }
};