// ✅ URL del backend (NO se modifica como pediste)
const API_URL = "https://tu-backend-en-railway.app/api/usuarios";

// 🔑 Helper JWT
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

/**
 * Obtener usuarios de la empresa (empresa viene del JWT en el backend)
 */
export const obtenerUsuarios = async () => {
  try {
    const response = await fetch(API_URL, {
      headers: authHeaders(), // 🔑
    });

    if (response.status === 401) { window.location.href = '/'; return []; }
    if (!response.ok) throw new Error(await response.text() || 'Error al obtener usuarios');

    return await response.json();
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return [];
  }
};

/**
 * Agregar usuario (empresa la asigna el backend desde el JWT)
 */
export const agregarUsuario = async (usuario) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: authHeaders(), // 🔑
      body: JSON.stringify(usuario), // ya no mandamos empresa_id desde aquí
    });

    if (response.status === 401) { window.location.href = '/'; return null; }
    if (!response.ok) throw new Error(await response.text());

    return await response.json();
  } catch (error) {
    console.error('Error al agregar usuario:', error);
    throw error;
  }
};

/**
 * Bloquear / desbloquear usuario
 */
export const toggleBloqueoUsuario = async (id, bloqueadoActualmente) => {
  try {
    const response = await fetch(`${API_URL}/${id}/bloquear`, {
      method: 'PUT',
      headers: authHeaders(), // 🔑
      body: JSON.stringify({ bloqueado: !bloqueadoActualmente }),
    });

    if (response.status === 401) { window.location.href = '/'; return false; }
    if (!response.ok) throw new Error(await response.text() || 'No se pudo cambiar el estado');

    return true;
  } catch (error) {
    console.error('Error al cambiar bloqueo:', error);
    return false;
  }
};

/**
 * Eliminar usuario
 */
export const eliminarUsuario = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: authHeaders(), // 🔑
    });

    if (response.status === 401) { window.location.href = '/'; return; }
    if (!response.ok) throw new Error(await response.text() || 'Error al eliminar usuario');

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return { success: true };
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw error;
  }
};

console.log('Servicio de Usuarios SaaS listo (JWT activado) 🚀');