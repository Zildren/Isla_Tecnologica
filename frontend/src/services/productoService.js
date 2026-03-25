// ✅ Endpoint correcto usando ruta relativa (ya no depende de variables de entorno)
const API_URL = '/api/productos';

// 🔍 DEBUG (verifica que la URL sea la esperada)
console.log("API_URL (relativa):", API_URL);
console.log("URL completa de la petición:", window.location.origin + API_URL);

// ✅ Obtener productos
export const obtenerProductos = async () => {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Error al obtener productos");
        }

        return await response.json();
    } catch (error) {
        console.error("❌ Error al obtener productos:", error);
        throw new Error("No se pudo conectar al backend");
    }
};

// ✅ Crear o actualizar producto
export const guardarProducto = async (producto) => {
    try {
        const esEdicion = producto.id !== null && producto.id !== undefined;

        const url = esEdicion
            ? `${API_URL}/${producto.id}`
            : API_URL;

        const method = esEdicion ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(producto)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Error al guardar producto");
        }

        return await response.json();
    } catch (error) {
        console.error("❌ Error al guardar producto:", error);
        throw error;
    }
};

// ✅ Eliminar producto
export const eliminarProducto = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (response.ok || response.status === 204) {
            return true;
        }

        if (response.status === 404) {
            throw new Error("Producto no encontrado");
        }

        if (response.status === 405) {
            throw new Error("DELETE no permitido en el backend");
        }

        const errorText = await response.text();
        throw new Error(errorText || `Error ${response.status}`);
    } catch (error) {
        console.error("❌ Error al eliminar producto:", error);
        throw error;
    }
};