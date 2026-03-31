const BASE_URL = process.env.REACT_APP_API_URL;
const API_URL = `${BASE_URL}/api/ventas`;

console.log("BASE_URL:", BASE_URL);
console.log("Ventas API:", API_URL);

// 🔑 Helper JWT
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

// ✅ Registrar venta
export const registrarVenta = async (datosVenta) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: authHeaders(), // 🔑
      body: JSON.stringify(datosVenta),
    });

    if (response.status === 401) { window.location.href = '/'; return null; }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al registrar venta');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error al registrar venta:', error);
    throw error;
  }
};

// ✅ Obtener ventas
export const obtenerVentas = async () => {
  try {
    const response = await fetch(API_URL, {
      headers: authHeaders(), // 🔑
    });

    if (response.status === 401) { window.location.href = '/'; return []; }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al obtener ventas');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error al obtener ventas:', error);
    return [];
  }
};

// ✅ Eliminar venta
export const eliminarVenta = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: authHeaders(), // 🔑
    });

    if (response.status === 401) { window.location.href = '/'; return; }
    if (response.ok || response.status === 204) return true;
    if (response.status === 404) throw new Error('Venta no encontrada');
    if (response.status === 405) throw new Error('DELETE no permitido en el backend');

    const errorText = await response.text();
    throw new Error(errorText || `Error ${response.status}`);
  } catch (error) {
    console.error('❌ Error al eliminar venta:', error);
    throw error;
  }
};