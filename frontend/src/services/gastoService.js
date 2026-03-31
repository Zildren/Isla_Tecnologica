const API_URL = '/api/gastos';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

export const obtenerGastos = async () => {
  try {
    const r = await fetch(API_URL, { headers: authHeaders() });
    if (r.status === 401) { window.location.href = '/'; return []; }
    if (!r.ok) throw new Error(await r.text() || 'Error al obtener gastos');
    return await r.json();
  } catch (e) {
    console.error('obtenerGastos:', e);
    return [];
  }
};

export const registrarGasto = async (gasto) => {
  try {
    const r = await fetch(API_URL, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(gasto),
    });
    if (r.status === 401) { window.location.href = '/'; return null; }
    if (!r.ok) throw new Error(await r.text() || 'Error al registrar gasto');
    return await r.json();
  } catch (e) {
    console.error('registrarGasto:', e);
    throw e;
  }
};

export const actualizarGasto = async (id, gasto) => {
  try {
    const r = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(gasto),
    });
    if (r.status === 401) { window.location.href = '/'; return null; }
    if (!r.ok) throw new Error(await r.text() || 'Error al actualizar gasto');
    return await r.json();
  } catch (e) {
    console.error('actualizarGasto:', e);
    throw e;
  }
};

export const eliminarGasto = async (id) => {
  try {
    const r = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (r.status === 401) { window.location.href = '/'; return; }
    if (!r.ok) throw new Error(await r.text() || 'Error al eliminar gasto');
    return true;
  } catch (e) {
    console.error('eliminarGasto:', e);
    throw e;
  }
};