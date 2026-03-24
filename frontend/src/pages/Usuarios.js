import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = "http://localhost:8080/api/usuarios";

const Usuarios = () => {
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState([]);
    const [form, setForm] = useState({ matricula: '', password: '', rol: 'VENDEDOR' });
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        const rol = localStorage.getItem('rolUsuario');
        if (!localStorage.getItem('usuarioLogueado') || rol !== 'ADMIN') {
            alert("⚠️ Acceso denegado.");
            navigate("/");
        } else {
            cargarUsuarios();
        }
    }, [navigate]);

    const cargarUsuarios = async () => {
        try {
            const res = await fetch(API_URL);
            const data = await res.json();
            setUsuarios(data);
        } catch (e) {
            console.error("Error cargando usuarios:", e);
        }
    };

    const agregarUsuario = async () => {
        if (!form.matricula || !form.password) {
            alert("Llena todos los campos");
            return;
        }
        setCargando(true);
        try {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            setForm({ matricula: '', password: '', rol: 'VENDEDOR' });
            cargarUsuarios();
        } catch (e) {
            alert("Error al agregar usuario");
        } finally {
            setCargando(false);
        }
    };

    const toggleBloqueo = async (id, bloqueado) => {
        try {
            await fetch(`${API_URL}/${id}/bloquear`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bloqueado: !bloqueado })
            });
            cargarUsuarios();
        } catch (e) {
            alert("Error al cambiar estado");
        }
    };

    const eliminarUsuario = async (id, matricula) => {
        if (!window.confirm(`¿Eliminar al usuario "${matricula}"?`)) return;
        try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            cargarUsuarios();
        } catch (e) {
            alert("Error al eliminar");
        }
    };

    return (
        <div style={{ padding: '30px', fontFamily: 'Arial', maxWidth: '1000px', margin: '0 auto', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
            
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: '#2c3e50', margin: 0 }}>👥 Administración de Usuarios</h2>
                <button
                    onClick={() => navigate("/inventario")}
                    style={{ backgroundColor: '#34495e', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    ⬅️ Volver al Inventario
                </button>
            </div>

            {/* FORMULARIO AGREGAR */}
            <div style={{ background: 'white', padding: '25px', borderRadius: '15px', marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#2c3e50' }}>➕ Agregar Nuevo Usuario</h3>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div>
                        <label style={{ fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '6px' }}>Matrícula:</label>
                        <input
                            type="text"
                            placeholder="Ej: juan01"
                            value={form.matricula}
                            onChange={e => setForm({ ...form, matricula: e.target.value })}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '180px' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '6px' }}>Contraseña:</label>
                        <input
                            type="text"
                            placeholder="Contraseña"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '180px' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '6px' }}>Rol:</label>
                        <select
                            value={form.rol}
                            onChange={e => setForm({ ...form, rol: e.target.value })}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '140px' }}
                        >
                            <option value="VENDEDOR">VENDEDOR</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>
                    <button
                        onClick={agregarUsuario}
                        disabled={cargando}
                        style={{ backgroundColor: '#28a745', color: 'white', padding: '10px 25px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', height: '42px' }}
                    >
                        {cargando ? "Guardando..." : "✅ Agregar"}
                    </button>
                </div>
            </div>

            {/* TABLA DE USUARIOS */}
            <div style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#2c3e50', color: 'white' }}>
                        <tr>
                            <th style={{ padding: '16px' }}>ID</th>
                            <th style={{ textAlign: 'left', paddingLeft: '20px' }}>Matrícula</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.length > 0 ? usuarios.map((u, i) => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #f1f2f6', textAlign: 'center', backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                <td style={{ padding: '15px', color: '#7f8c8d' }}>{u.id}</td>
                                <td style={{ textAlign: 'left', paddingLeft: '20px', fontWeight: 'bold', color: '#2c3e50' }}>{u.matricula}</td>
                                <td>
                                    <span style={{
                                        background: u.rol === 'ADMIN' ? '#007bff' : '#28a745',
                                        color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'
                                    }}>
                                        {u.rol}
                                    </span>
                                </td>
                                <td>
                                    <span style={{
                                        background: u.bloqueado ? '#e74c3c' : '#27ae60',
                                        color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'
                                    }}>
                                        {u.bloqueado ? '🔒 Bloqueado' : '✅ Activo'}
                                    </span>
                                </td>
                                <td style={{ display: 'flex', gap: '8px', justifyContent: 'center', padding: '12px' }}>
                                    <button
                                        onClick={() => toggleBloqueo(u.id, u.bloqueado)}
                                        style={{
                                            backgroundColor: u.bloqueado ? '#27ae60' : '#e67e22',
                                            color: 'white', border: 'none', padding: '6px 14px',
                                            borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
                                        }}
                                    >
                                        {u.bloqueado ? '🔓 Desbloquear' : '🔒 Bloquear'}
                                    </button>
                                    <button
                                        onClick={() => eliminarUsuario(u.id, u.matricula)}
                                        style={{
                                            backgroundColor: '#e74c3c', color: 'white', border: 'none',
                                            padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
                                        }}
                                    >
                                        🗑️ Eliminar
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#bdc3c7', fontSize: '16px' }}>
                                    No hay usuarios registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Usuarios;