// ✅ Ruta relativa (MISMO dominio en Railway)
const API_URL = "/api/productos";

// 🔍 DEBUG
console.log("📦 API PRODUCTOS:", window.location.origin + API_URL);

// ✅ Obtener productos
export const obtenerProductos = async () => {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Error al obtener productos");
        }

        const data = await response.json();
        console.log("✅ Productos:", data);

        return data;
    } catch (error) {
        console.error("❌ Error al obtener productos:", error);
        throw new Error("No se pudo conectar al backend");
    }
};

// ✅ Crear o actualizar producto
export const guardarProducto = async (producto) => {
    try {
        const esEdicion = producto.id !== null && producto.id !== undefined;
        const url = esEdicion ? `${API_URL}/${producto.id}` : API_URL;
        const method = esEdicion ? "PUT" : "POST";

        console.log("📤 Enviando producto a:", window.location.origin + url);

        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(producto)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Error al guardar producto");
        }

        const data = await response.json();
        console.log("✅ Producto guardado:", data);

        return data;
    } catch (error) {
        console.error("❌ Error al guardar producto:", error);
        throw error;
    }
};

// ✅ Eliminar producto
export const eliminarProducto = async (id) => {
    try {
        const url = `${API_URL}/${id}`;
        console.log("🗑 Eliminando producto:", window.location.origin + url);

        const response = await fetch(url, {
            method: "DELETE"
        });

        if (response.ok || response.status === 204) {
            console.log("✅ Producto eliminado");
            return true;
        }

        if (response.status === 404) throw new Error("Producto no encontrado");
        if (response.status === 405) throw new Error("DELETE no permitido en el backend");

        const errorText = await response.text();
        throw new Error(errorText || `Error ${response.status}`);
    } catch (error) {
        console.error("❌ Error al eliminar producto:", error);
        throw error;
    }
};