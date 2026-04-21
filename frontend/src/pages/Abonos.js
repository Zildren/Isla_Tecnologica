import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerProductos, guardarProducto } from '../services/productoService';

// ═══════════════════════════════════════════
// AUTH HEADERS
// ═══════════════════════════════════════════
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

// ═══════════════════════════════════════════
// API HELPERS — conectan con el backend generado
// ═══════════════════════════════════════════
const api = {
  // GET /api/clientes
  getClientes: async () => {
    const r = await fetch('/api/clientes', { headers: authHeaders() });
    if (!r.ok) throw new Error('Error al cargar clientes');
    return r.json();
  },
  // POST /api/clientes
  crearCliente: async (body) => {
    const r = await fetch('/api/clientes', { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
    if (!r.ok) { const msg = await r.text(); throw new Error(msg || 'Error al crear crédito'); }
    return r.json();
  },
  // DELETE /api/clientes/{id}
  eliminarCliente: async (id) => {
    const r = await fetch(`/api/clientes/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (!r.ok) throw new Error('Error al eliminar cliente');
  },
  // POST /api/clientes/{id}/abonos
  registrarAbono: async (clienteId, body) => {
    const r = await fetch(`/api/clientes/${clienteId}/abonos`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
    if (!r.ok) { const msg = await r.text(); throw new Error(msg || 'Error al registrar abono'); }
    return r.json();
  },
  // DELETE /api/abonos/{id}
  eliminarAbono: async (id) => {
    const r = await fetch(`/api/abonos/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (!r.ok) throw new Error('Error al eliminar abono');
  },
  // GET /api/clientes/{id}/abonos  — historial de abonos de un cliente
  getAbonos: async (clienteId) => {
    const r = await fetch(`/api/clientes/${clienteId}/abonos`, { headers: authHeaders() });
    if (!r.ok) throw new Error('Error al cargar abonos');
    return r.json();
  },
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════
const formatFecha = (f) => {
  if (!f) return '—';
  try { return new Date(f + (f.includes('T') ? '' : 'T12:00:00')).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return f; }
};

const formatMoneda = (n) => `$${parseFloat(n || 0).toFixed(2)}`;

const estadoBadge = (saldo, total) => {
  const s = parseFloat(saldo), t = parseFloat(total);
  if (s <= 0) return { label: 'Liquidado',  color: '#22c55e', bg: 'rgba(34,197,94,.12)',  border: 'rgba(34,197,94,.25)' };
  if (s < t)  return { label: 'En proceso', color: '#fbbf24', bg: 'rgba(251,191,36,.12)', border: 'rgba(251,191,36,.25)' };
  return              { label: 'Pendiente',  color: '#f87171', bg: 'rgba(248,113,113,.12)',border: 'rgba(248,113,113,.25)' };
};

const pctAbonado = (saldo, total) => {
  const t = parseFloat(total);
  if (!t) return 0;
  return Math.min(100, ((t - parseFloat(saldo)) / t) * 100);
};

// ═══════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════
const Abonos = () => {
  const navigate = useNavigate();
  const matricula  = localStorage.getItem('usuarioLogueado') || 'desconocido';
  const rol        = localStorage.getItem('rolUsuario')      || 'VENDEDOR';
  const esAdmin    = rol === 'ADMIN';
  const esriempy   = matricula === 'riempy';

  // ── Datos ──
  const [clientes,  setClientes]  = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  // ── Filtros ──
  const [busqueda,     setBusqueda]     = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // ── Modal nuevo crédito ──
  const [modalNuevo,    setModalNuevo]    = useState(false);
  const [busqProd,      setBusqProd]      = useState('');
  const [prodSelec,     setProdSelec]     = useState(null);   // producto elegido
  const [cantidadProd,  setCantidadProd]  = useState(1);
  const [nuevoCliente,  setNuevoCliente]  = useState({
    nombre: '', telefono: '', descripcion: '',
    montoTotal: '', fecha: new Date().toISOString().split('T')[0],
  });
  const [errNuevo,      setErrNuevo]      = useState({});
  const [guardandoNew,  setGuardandoNew]  = useState(false);

  // ── Modal abono ──
  const [modalAbono,  setModalAbono]  = useState(null);
  const [montoAbono,  setMontoAbono]  = useState('');
  const [notaAbono,   setNotaAbono]   = useState('');
  const [errAbono,    setErrAbono]    = useState('');
  const [guardandoAb, setGuardandoAb] = useState(false);

  // ── Modal detalle / historial ──
  const [modalDetalle,       setModalDetalle]       = useState(null);
  const [abonosDetalle,      setAbonosDetalle]      = useState([]);
  const [loadingAbonosDetalle, setLoadingAbonosDetalle] = useState(false);

  // ── Modal eliminar cliente ──
  const [modalEliminar, setModalEliminar] = useState(null);

  // ══════════════════════════════════════════
  // CARGA INICIAL
  // ══════════════════════════════════════════
  const cargarClientes = useCallback(async () => {
    try {
      const data = await api.getClientes();
      setClientes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const cargarProductos = useCallback(async () => {
    try {
      const data = await obtenerProductos();
      setProductos(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/'); return; }
    Promise.all([cargarClientes(), cargarProductos()]).finally(() => setLoading(false));
  }, [navigate, cargarClientes, cargarProductos]);

  // ══════════════════════════════════════════
  // STATS
  // ══════════════════════════════════════════
  const totalDeuda      = clientes.reduce((s, c) => s + parseFloat(c.montoTotal      || 0), 0);
  const totalPendiente  = clientes.reduce((s, c) => s + parseFloat(c.saldoPendiente  || 0), 0);
  const totalCobrado    = totalDeuda - totalPendiente;
  const liquidados      = clientes.filter(c => parseFloat(c.saldoPendiente) <= 0).length;

  // ══════════════════════════════════════════
  // FILTRADO
  // ══════════════════════════════════════════
  const clientesFiltrados = clientes
    .filter(c => {
      const txt = busqueda.toLowerCase();
      const matchText =
        c.nombre.toLowerCase().includes(txt) ||
        (c.telefono || '').includes(txt) ||
        (c.descripcion || '').toLowerCase().includes(txt);
      const est = estadoBadge(c.saldoPendiente, c.montoTotal).label.toLowerCase();
      const matchEst =
        filtroEstado === 'todos'     ? true :
        filtroEstado === 'pendiente' ? est === 'pendiente' :
        filtroEstado === 'proceso'   ? est === 'en proceso' :
                                       est === 'liquidado';
      return matchText && matchEst;
    })
    .sort((a, b) => parseFloat(b.saldoPendiente) - parseFloat(a.saldoPendiente));

  // ══════════════════════════════════════════
  // SELECTOR DE PRODUCTO (igual que ventas)
  // ══════════════════════════════════════════
  const prodsFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqProd.toLowerCase()) ||
    p.codigo.toLowerCase().includes(busqProd.toLowerCase())
  );

  const seleccionarProducto = (prod) => {
    setProdSelec(prod);
    setCantidadProd(1);
    // Auto-rellenar monto con precio de venta
    setNuevoCliente(prev => ({ ...prev, montoTotal: String(prod.precioVenta) }));
    setBusqProd('');
  };

  const limpiarProducto = () => {
    setProdSelec(null);
    setCantidadProd(1);
    setNuevoCliente(prev => ({ ...prev, montoTotal: '' }));
  };

  // Recalcular monto cuando cambia cantidad
  useEffect(() => {
    if (prodSelec) {
      setNuevoCliente(prev => ({
        ...prev,
        montoTotal: String((prodSelec.precioVenta * cantidadProd).toFixed(2)),
      }));
    }
  }, [cantidadProd, prodSelec]);

  // ══════════════════════════════════════════
  // CREAR CRÉDITO
  // ══════════════════════════════════════════
  const agregarCliente = async () => {
    const errs = {};
    if (!nuevoCliente.nombre.trim())                              errs.nombre     = 'Requerido';
    if (!nuevoCliente.montoTotal || parseFloat(nuevoCliente.montoTotal) <= 0) errs.montoTotal = 'Monto inválido';
    if (prodSelec && cantidadProd > prodSelec.stock)              errs.cantidad   = `Stock insuficiente (disponible: ${prodSelec.stock})`;
    if (Object.keys(errs).length) { setErrNuevo(errs); return; }

    setGuardandoNew(true);
    try {
      // 1. Crear el cliente/crédito en el backend
      const descripcionFinal = prodSelec
        ? `${prodSelec.nombre} x${cantidadProd}${nuevoCliente.descripcion ? ' — ' + nuevoCliente.descripcion : ''}`
        : nuevoCliente.descripcion;

      await api.crearCliente({
        nombre:      nuevoCliente.nombre.trim(),
        telefono:    nuevoCliente.telefono.trim(),
        descripcion: descripcionFinal,
        montoTotal:  parseFloat(nuevoCliente.montoTotal),
      });

      // 2. Descontar stock si se seleccionó producto
      if (prodSelec) {
        await guardarProducto({
          ...prodSelec,
          stock: prodSelec.stock - cantidadProd,
          registradoPorMatricula: matricula,
        });
      }

      // 3. Resetear y recargar
      setNuevoCliente({ nombre: '', telefono: '', descripcion: '', montoTotal: '', fecha: new Date().toISOString().split('T')[0] });
      setProdSelec(null);
      setCantidadProd(1);
      setBusqProd('');
      setErrNuevo({});
      setModalNuevo(false);
      await Promise.all([cargarClientes(), cargarProductos()]);
    } catch (e) {
      alert('❌ ' + e.message);
    } finally {
      setGuardandoNew(false);
    }
  };

  // ══════════════════════════════════════════
  // REGISTRAR ABONO
  // ══════════════════════════════════════════
  const registrarAbono = async () => {
    const monto = parseFloat(montoAbono);
    if (isNaN(monto) || monto <= 0) { setErrAbono('Ingresa un monto válido'); return; }
    if (monto > parseFloat(modalAbono.saldoPendiente)) {
      setErrAbono(`El monto supera el saldo (${formatMoneda(modalAbono.saldoPendiente)})`);
      return;
    }
    setGuardandoAb(true);
    try {
      await api.registrarAbono(modalAbono.id, { monto, nota: notaAbono.trim() });
      setMontoAbono('');
      setNotaAbono('');
      setErrAbono('');
      setModalAbono(null);
      await cargarClientes();
    } catch (e) {
      setErrAbono(e.message);
    } finally {
      setGuardandoAb(false);
    }
  };

  // ══════════════════════════════════════════
  // ELIMINAR CLIENTE
  // ══════════════════════════════════════════
  const eliminarCliente = async () => {
    try {
      await api.eliminarCliente(modalEliminar.id);
      setModalEliminar(null);
      if (modalDetalle?.id === modalEliminar.id) setModalDetalle(null);
      await cargarClientes();
    } catch (e) {
      alert('❌ ' + e.message);
      setModalEliminar(null);
    }
  };

  // ══════════════════════════════════════════
  // ABRIR DETALLE CON HISTORIAL
  // ══════════════════════════════════════════
  const abrirDetalle = async (cliente) => {
    setModalDetalle(cliente);
    setLoadingAbonosDetalle(true);
    try {
      const abonos = await api.getAbonos(cliente.id);
      setAbonosDetalle(Array.isArray(abonos) ? abonos : []);
    } catch {
      setAbonosDetalle([]);
    } finally {
      setLoadingAbonosDetalle(false);
    }
  };

  // ══════════════════════════════════════════
  // ELIMINAR ABONO
  // ══════════════════════════════════════════
  const eliminarAbono = async (abonoId) => {
    if (!window.confirm('¿Eliminar este abono? El monto se devolverá al saldo pendiente.')) return;
    try {
      await api.eliminarAbono(abonoId);
      // Recargar historial y lista
      await cargarClientes();
      if (modalDetalle) {
        const abonos = await api.getAbonos(modalDetalle.id);
        setAbonosDetalle(Array.isArray(abonos) ? abonos : []);
        // Actualizar el cliente en el detalle con el saldo recalculado
        const updated = await api.getClientes();
        const clienteActualizado = updated.find(c => c.id === modalDetalle.id);
        if (clienteActualizado) setModalDetalle(clienteActualizado);
        setClientes(Array.isArray(updated) ? updated : []);
      }
    } catch (e) {
      alert('❌ ' + e.message);
    }
  };

  const handleLogout = () => {
    ['usuarioLogueado', 'rolUsuario', 'token', 'empresaId', 'userId'].forEach(k => localStorage.removeItem(k));
    navigate('/');
  };

  // ════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════
  return (
    <>
      <div className="app-shell">

        {/* ── SIDEBAR ── */}
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
          <div className="sb-logo">
            <img src="/logo.png" alt="logo" />
            {!collapsed && (
              <div className="sb-logo-text">
                <div className="sb-logo-name">Isla Tecnológica</div>
                <div className="sb-logo-sub">Sistema POS</div>
              </div>
            )}
          </div>
          <div className="sb-user">
            <div className={`sb-avatar ${esAdmin ? 'admin' : 'vendedor'}`}>
              {matricula.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="sb-user-info">
                <div className="sb-user-name">{matricula}</div>
                <div className="sb-user-role">{esAdmin ? '🔑 Admin' : '👤 Vendedor'}</div>
              </div>
            )}
          </div>
          <nav className="sb-nav">
            {!collapsed && <div className="sb-section-label">Principal</div>}
            {esriempy && (
              <button className="sb-item" onClick={() => navigate('/empresas')} title={collapsed ? 'Empresas' : ''}
                style={{ background: 'linear-gradient(90deg, rgba(167,139,250,.15) 0%, transparent 100%)', borderLeft: '3px solid #a78bfa', marginBottom: 4 }}>
                <span className="sb-icon">🏢</span>
                {!collapsed && <span className="sb-label" style={{ color: '#a78bfa', fontWeight: 700 }}>Empresas</span>}
              </button>
            )}
            <button className="sb-item active" onClick={() => navigate('/abonos')} title={collapsed ? 'Abonos' : ''}
              style={{ background: 'linear-gradient(90deg, rgba(52,211,153,.2) 0%, transparent 100%)', borderLeft: '3px solid #34d399', marginBottom: 4 }}>
              <span className="sb-icon">💳</span>
              {!collapsed && <span className="sb-label" style={{ color: '#34d399', fontWeight: 700 }}>Abonos</span>}
            </button>
            <button className="sb-item" onClick={() => navigate('/inventario')} title={collapsed ? 'Inventario' : ''}>
              <span className="sb-icon">📦</span>
              {!collapsed && <span className="sb-label">Inventario</span>}
            </button>
          </nav>
          <div className="sb-bottom">
            <div className="sb-logout" style={{ padding: '10px' }}>
              <button className="sb-item" onClick={handleLogout} title={collapsed ? 'Cerrar Sesión' : ''}>
                <span className="sb-icon">🚪</span>
                {!collapsed && <span className="sb-label">Cerrar Sesión</span>}
              </button>
            </div>
            <div className="sb-collapse">
              <button className="sb-collapse-btn" onClick={() => setCollapsed(c => !c)}>
                {collapsed ? '▶' : '◀'}
              </button>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className={`main-content ${collapsed ? 'collapsed' : ''}`}>

          {/* Topbar */}
          <div className="topbar">
            <div className="topbar-title"><span>Abonos</span> y Créditos</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {totalPendiente > 0 && (
                <div style={{ fontSize: 13, color: '#f87171', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono' }}>
                  💸 Por cobrar: <strong>{formatMoneda(totalPendiente)}</strong>
                </div>
              )}
              <button className="btn green" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => setModalNuevo(true)}>
                ➕ Nuevo Crédito
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-label">Total Créditos</div><div className="stat-val c-blue">{clientes.length}</div></div>
            <div className="stat-card"><div className="stat-label">Deuda Total</div><div className="stat-val c-red">{formatMoneda(totalDeuda)}</div></div>
            <div className="stat-card"><div className="stat-label">Total Cobrado</div><div className="stat-val" style={{ color: '#34d399' }}>{formatMoneda(totalCobrado)}</div></div>
            <div className="stat-card"><div className="stat-label">Saldo Pendiente</div><div className="stat-val c-amber">{formatMoneda(totalPendiente)}</div></div>
            <div className="stat-card"><div className="stat-label">Liquidados</div><div className="stat-val c-blue">{liquidados} / {clientes.length}</div></div>
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <div className="search-wrap" style={{ marginBottom: 0, flex: 1, minWidth: 220, maxWidth: 380 }}>
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Buscar cliente, teléfono o descripción..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { val: 'todos',     label: 'Todos',        color: '#6b7280' },
                { val: 'pendiente', label: '🔴 Pendiente', color: '#f87171' },
                { val: 'proceso',   label: '⚠️ En proceso', color: '#fbbf24' },
                { val: 'liquidado', label: '✅ Liquidado', color: '#22c55e' },
              ].map(f => (
                <button key={f.val} onClick={() => setFiltroEstado(f.val)} style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
                  border: `1px solid ${filtroEstado === f.val ? f.color : '#2a3045'}`,
                  background: filtroEstado === f.val ? `${f.color}22` : 'transparent',
                  color: filtroEstado === f.val ? f.color : '#6b7280', transition: 'all .15s',
                }}>{f.label}</button>
              ))}
            </div>
            <span style={{ fontSize: 12, color: '#4b5563', marginLeft: 'auto' }}>
              {clientesFiltrados.length} resultado{clientesFiltrados.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Loading state */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0', color: '#4b5563', fontSize: 14, gap: 10 }}>
              <span style={{ fontSize: 20 }}>⏳</span> Cargando créditos...
            </div>
          ) : (

          /* Tabla */
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Producto / Concepto</th>
                  <th>Monto Total</th>
                  <th>Abonado</th>
                  <th>Saldo</th>
                  <th>Progreso</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '60px', textAlign: 'center' }}>
                      {clientes.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 40 }}>💳</span>
                          <div style={{ color: '#4b5563', fontWeight: 600 }}>No hay créditos registrados</div>
                          <button className="btn green" style={{ padding: '9px 22px', fontSize: 13 }} onClick={() => setModalNuevo(true)}>
                            ➕ Registrar primer crédito
                          </button>
                        </div>
                      ) : 'Sin resultados para esta búsqueda'}
                    </td>
                  </tr>
                ) : clientesFiltrados.map(c => {
                  const abonado = parseFloat(c.montoTotal) - parseFloat(c.saldoPendiente);
                  const pct = pctAbonado(c.saldoPendiente, c.montoTotal);
                  const est = estadoBadge(c.saldoPendiente, c.montoTotal);
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, fontSize: 14 }}>{c.nombre}</td>
                      <td className="mono" style={{ color: '#6b7280' }}>{c.telefono || '—'}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#9ca3af', fontSize: 12 }}>
                        {c.descripcion || '—'}
                      </td>
                      <td className="mono" style={{ color: '#f87171', fontWeight: 600 }}>{formatMoneda(c.montoTotal)}</td>
                      <td className="mono" style={{ color: '#34d399' }}>{formatMoneda(abonado)}</td>
                      <td className="mono" style={{ fontWeight: 700, color: parseFloat(c.saldoPendiente) <= 0 ? '#22c55e' : '#fbbf24' }}>
                        {formatMoneda(c.saldoPendiente)}
                      </td>
                      <td style={{ minWidth: 120 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, borderRadius: 4, background: '#1e2230', overflow: 'hidden' }}>
                            <div style={{
                              width: `${pct}%`, height: '100%', borderRadius: 4, transition: 'width .3s',
                              background: pct >= 100 ? '#22c55e' : pct > 50 ? '#fbbf24' : '#f87171',
                            }} />
                          </div>
                          <span style={{ fontSize: 10, color: '#6b7280', fontFamily: 'JetBrains Mono', minWidth: 32 }}>{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono', padding: '3px 10px',
                          borderRadius: 20, background: est.bg, color: est.color, border: `1px solid ${est.border}`, whiteSpace: 'nowrap',
                        }}>{est.label}</span>
                      </td>
                      <td className="mono" style={{ color: '#6b7280', fontSize: 11, whiteSpace: 'nowrap' }}>
                        {formatFecha(c.fechaInicio)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn blue" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => abrirDetalle(c)}>
                            📋 Ver
                          </button>
                          {parseFloat(c.saldoPendiente) > 0 && (
                            <button className="btn green" style={{ padding: '5px 10px', fontSize: 11 }}
                              onClick={() => { setModalAbono(c); setMontoAbono(''); setNotaAbono(''); setErrAbono(''); }}>
                              💵 Abonar
                            </button>
                          )}
                          {esAdmin && (
                            <button className="btn red" style={{ padding: '5px 10px', fontSize: 11, background: '#ef4444', color: '#fff' }}
                              onClick={() => setModalEliminar(c)}>
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {clientesFiltrados.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#0d0f14', borderTop: '2px solid #1e2230' }}>
                    <td colSpan={3} style={{ padding: '13px 15px', fontWeight: 700, fontSize: 13 }}>
                      TOTALES ({clientesFiltrados.length})
                    </td>
                    <td className="mono" style={{ color: '#f87171', fontWeight: 700, padding: '13px 15px' }}>
                      {formatMoneda(clientesFiltrados.reduce((s, c) => s + parseFloat(c.montoTotal), 0))}
                    </td>
                    <td className="mono" style={{ color: '#34d399', fontWeight: 700, padding: '13px 15px' }}>
                      {formatMoneda(clientesFiltrados.reduce((s, c) => s + (parseFloat(c.montoTotal) - parseFloat(c.saldoPendiente)), 0))}
                    </td>
                    <td className="mono" style={{ color: '#fbbf24', fontWeight: 700, padding: '13px 15px' }}>
                      {formatMoneda(clientesFiltrados.reduce((s, c) => s + parseFloat(c.saldoPendiente), 0))}
                    </td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          )}
        </main>
      </div>

      {/* ══════════════════════════════════════════
          MODAL: NUEVO CRÉDITO
      ══════════════════════════════════════════ */}
      {modalNuevo && (
        <div className="modal-overlay" onClick={() => setModalNuevo(false)}>
          <div className="modal-box" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">💳 Registrar Nuevo Crédito</div>

            {/* ── SECCIÓN PRODUCTO (como terminal de ventas) ── */}
            <div style={{
              background: '#0a0c10', border: '1px solid #1e2230', borderRadius: 12,
              padding: '16px', marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, color: '#4f9eff', fontFamily: 'JetBrains Mono', fontWeight: 700, marginBottom: 10, letterSpacing: 1 }}>
                📦 PRODUCTO A CRÉDITO (opcional)
              </div>

              {/* Buscador de producto */}
              {!prodSelec && (
                <>
                  <div className="search-wrap" style={{ marginBottom: 8 }}>
                    <span className="search-icon">🔍</span>
                    <input className="search-input" placeholder="Buscar producto por nombre o código..."
                      value={busqProd} onChange={e => setBusqProd(e.target.value)} autoFocus />
                    {busqProd && (
                      <button onClick={() => setBusqProd('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 13 }}>✕</button>
                    )}
                  </div>

                  {/* Lista de resultados */}
                  {busqProd.length > 0 && (
                    <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {prodsFiltrados.length === 0 ? (
                        <div style={{ padding: '12px', textAlign: 'center', color: '#4b5563', fontSize: 12 }}>
                          Sin resultados para "{busqProd}"
                        </div>
                      ) : prodsFiltrados.map(p => (
                        <button key={p.id}
                          onClick={() => seleccionarProducto(p)}
                          disabled={p.stock === 0}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                            background: p.stock === 0 ? 'transparent' : '#0d0f14',
                            border: `1px solid ${p.stock === 0 ? '#1a1d20' : '#2a3045'}`,
                            borderRadius: 8, cursor: p.stock === 0 ? 'not-allowed' : 'pointer',
                            opacity: p.stock === 0 ? 0.45 : 1, textAlign: 'left',
                            transition: 'border-color .15s',
                          }}
                          onMouseEnter={e => { if (p.stock > 0) e.currentTarget.style.borderColor = '#4f9eff'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = p.stock === 0 ? '#1a1d20' : '#2a3045'; }}
                        >
                          {/* Miniatura */}
                          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#0a0c10', border: '1px solid #1e2230', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {p.imagen ? <img src={p.imagen} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : <span style={{ fontSize: 16 }}>📦</span>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#e8eaf0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</div>
                            <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                              <span className="mono">{p.codigo}</span>
                              <span style={{ color: p.stock <= 5 ? '#f87171' : '#34d399' }}>Stock: {p.stock}</span>
                            </div>
                          </div>
                          <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: '#4f9eff', fontSize: 14, flexShrink: 0 }}>
                            ${parseFloat(p.precioVenta).toFixed(2)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {busqProd.length === 0 && (
                    <div style={{ fontSize: 11, color: '#374151', textAlign: 'center', padding: '8px 0' }}>
                      Busca y selecciona un producto para autocompletar el monto y descontar stock
                    </div>
                  )}
                </>
              )}

              {/* Producto seleccionado */}
              {prodSelec && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 8, background: '#0a0c10', border: '1px solid #1e2230', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {prodSelec.imagen ? <img src={prodSelec.imagen} alt={prodSelec.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : <span style={{ fontSize: 22 }}>📦</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#e8eaf0', marginBottom: 4 }}>{prodSelec.nombre}</div>
                    <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#6b7280', marginBottom: 8, flexWrap: 'wrap' }}>
                      <span className="mono">{prodSelec.codigo}</span>
                      <span>Stock disponible: <span style={{ color: '#fbbf24', fontWeight: 600 }}>{prodSelec.stock}</span></span>
                      <span>Precio: <span className="mono" style={{ color: '#4f9eff', fontWeight: 700 }}>${parseFloat(prodSelec.precioVenta).toFixed(2)}</span></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <label style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono', whiteSpace: 'nowrap' }}>Cantidad:</label>
                      <input className="inp" style={{ width: 80, fontFamily: 'JetBrains Mono', textAlign: 'center', borderColor: errNuevo.cantidad ? 'rgba(248,113,113,.6)' : undefined }}
                        type="number" min="1" max={prodSelec.stock} value={cantidadProd}
                        onChange={e => { setCantidadProd(Math.max(1, parseInt(e.target.value) || 1)); setErrNuevo(p => ({ ...p, cantidad: '' })); }} />
                      <span style={{ fontSize: 12, color: '#4b5563' }}>
                        Total: <span className="mono" style={{ color: '#34d399', fontWeight: 700 }}>
                          ${(prodSelec.precioVenta * cantidadProd).toFixed(2)}
                        </span>
                      </span>
                    </div>
                    {errNuevo.cantidad && <div style={{ fontSize: 11, color: '#f87171', fontFamily: 'JetBrains Mono', marginTop: 4 }}>⚠ {errNuevo.cantidad}</div>}
                  </div>
                  <button onClick={limpiarProducto}
                    style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)', color: '#f87171', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11, flexShrink: 0 }}>
                    ✕ Quitar
                  </button>
                </div>
              )}
            </div>

            {/* ── DATOS DEL CLIENTE ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono', display: 'block', marginBottom: 5 }}>
                    Nombre del cliente *
                  </label>
                  <input className="inp" style={{ width: '100%', borderColor: errNuevo.nombre ? 'rgba(248,113,113,.6)' : undefined }}
                    placeholder="Ej: Juan García" value={nuevoCliente.nombre}
                    onChange={e => { setNuevoCliente(p => ({ ...p, nombre: e.target.value })); setErrNuevo(p => ({ ...p, nombre: '' })); }} />
                  {errNuevo.nombre && <span style={{ fontSize: 11, color: '#f87171', fontFamily: 'JetBrains Mono' }}>⚠ {errNuevo.nombre}</span>}
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono', display: 'block', marginBottom: 5 }}>
                    Teléfono
                  </label>
                  <input className="inp" style={{ width: '100%' }} placeholder="449-123-4567" value={nuevoCliente.telefono}
                    onChange={e => setNuevoCliente(p => ({ ...p, telefono: e.target.value }))} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono', display: 'block', marginBottom: 5 }}>
                  Descripción / Concepto adicional
                </label>
                <input className="inp" style={{ width: '100%' }}
                  placeholder={prodSelec ? 'Nota adicional (opcional)' : 'Ej: Reparación de laptop, compra a crédito...'}
                  value={nuevoCliente.descripcion}
                  onChange={e => setNuevoCliente(p => ({ ...p, descripcion: e.target.value }))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono', display: 'block', marginBottom: 5 }}>
                    Monto Total $ *
                  </label>
                  <input className="inp"
                    style={{ width: '100%', fontFamily: 'JetBrains Mono', fontSize: 16, color: '#f87171', borderColor: errNuevo.montoTotal ? 'rgba(248,113,113,.6)' : 'rgba(248,113,113,.35)' }}
                    type="number" step="0.01" min="0" placeholder="0.00"
                    value={nuevoCliente.montoTotal}
                    onChange={e => { setNuevoCliente(p => ({ ...p, montoTotal: e.target.value })); setErrNuevo(p => ({ ...p, montoTotal: '' })); }} />
                  {errNuevo.montoTotal && <span style={{ fontSize: 11, color: '#f87171', fontFamily: 'JetBrains Mono' }}>⚠ {errNuevo.montoTotal}</span>}
                  {prodSelec && (
                    <div style={{ fontSize: 10, color: '#4b5563', fontFamily: 'JetBrains Mono', marginTop: 3 }}>
                      💡 Autocompletado por el producto × cantidad
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono', display: 'block', marginBottom: 5 }}>
                    Fecha
                  </label>
                  <input className="inp" style={{ width: '100%' }} type="date" value={nuevoCliente.fecha}
                    onChange={e => setNuevoCliente(p => ({ ...p, fecha: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Resumen */}
            {prodSelec && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(52,211,153,.07)', border: '1px solid rgba(52,211,153,.2)', borderRadius: 8, fontSize: 12, color: '#34d399', fontFamily: 'JetBrains Mono' }}>
                ✅ Se descontarán <strong>{cantidadProd}</strong> unidad(es) de <strong>"{prodSelec.nombre}"</strong> del inventario al guardar.
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: 18 }}>
              <button className="btn ghost" onClick={() => { setModalNuevo(false); setErrNuevo({}); limpiarProducto(); setBusqProd(''); }}>
                Cancelar
              </button>
              <button className="btn green" onClick={agregarCliente} disabled={guardandoNew}>
                {guardandoNew ? '⏳ Guardando...' : '✅ Registrar Crédito'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: REGISTRAR ABONO
      ══════════════════════════════════════════ */}
      {modalAbono && (
        <div className="modal-overlay" onClick={() => setModalAbono(null)}>
          <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">💵 Registrar Abono</div>
            <div style={{ background: '#0d0f14', border: '1px solid #1e2230', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{modalAbono.nombre}</div>
              {modalAbono.descripcion && (
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>📝 {modalAbono.descripcion}</div>
              )}
              <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#9ca3af', flexWrap: 'wrap' }}>
                <span>Total: <span className="mono" style={{ color: '#f87171' }}>{formatMoneda(modalAbono.montoTotal)}</span></span>
                <span>Abonado: <span className="mono" style={{ color: '#34d399' }}>{formatMoneda(parseFloat(modalAbono.montoTotal) - parseFloat(modalAbono.saldoPendiente))}</span></span>
                <span>Pendiente: <span className="mono" style={{ color: '#fbbf24', fontWeight: 700 }}>{formatMoneda(modalAbono.saldoPendiente)}</span></span>
              </div>
              <div style={{ marginTop: 10, height: 6, borderRadius: 4, background: '#1e2230', overflow: 'hidden' }}>
                <div style={{
                  width: `${pctAbonado(modalAbono.saldoPendiente, modalAbono.montoTotal)}%`,
                  height: '100%', borderRadius: 4, background: '#fbbf24', transition: 'width .3s',
                }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono', display: 'block', marginBottom: 5 }}>
                  Monto del abono $
                </label>
                <input className="inp" autoFocus
                  style={{ width: '100%', fontSize: 22, fontFamily: 'JetBrains Mono', color: '#34d399', textAlign: 'center', borderColor: 'rgba(52,211,153,.35)' }}
                  type="number" step="0.01" min="0" placeholder="0.00"
                  value={montoAbono}
                  onChange={e => { setMontoAbono(e.target.value); setErrAbono(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') registrarAbono(); if (e.key === 'Escape') setModalAbono(null); }} />
                {errAbono && <span style={{ fontSize: 11, color: '#f87171', fontFamily: 'JetBrains Mono' }}>⚠ {errAbono}</span>}
              </div>
              {parseFloat(montoAbono) > 0 && parseFloat(montoAbono) <= parseFloat(modalAbono.saldoPendiente) && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: 13, fontFamily: 'JetBrains Mono', padding: '8px 0' }}>
                  <span style={{ color: '#6b7280' }}>Nuevo saldo:</span>
                  <span style={{ color: '#22c55e', fontWeight: 700 }}>
                    {formatMoneda(parseFloat(modalAbono.saldoPendiente) - parseFloat(montoAbono))}
                  </span>
                </div>
              )}
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono', display: 'block', marginBottom: 5 }}>
                  Nota (opcional)
                </label>
                <input className="inp" style={{ width: '100%' }} placeholder="Ej: Pago en efectivo"
                  value={notaAbono} onChange={e => setNotaAbono(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') registrarAbono(); }} />
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: 18 }}>
              <button className="btn ghost" onClick={() => setModalAbono(null)}>Cancelar</button>
              <button className="btn green" onClick={registrarAbono} disabled={guardandoAb}>
                {guardandoAb ? '⏳ Guardando...' : '✅ Confirmar Abono'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: DETALLE / HISTORIAL (desde backend)
      ══════════════════════════════════════════ */}
      {modalDetalle && (
        <div className="modal-overlay" onClick={() => setModalDetalle(null)}>
          <div className="modal-box" style={{ maxWidth: 560, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">📋 Detalle de Crédito</div>
            <div style={{ background: '#0d0f14', border: '1px solid #1e2230', borderRadius: 10, padding: '16px', marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{modalDetalle.nombre}</div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#9ca3af', flexWrap: 'wrap', marginBottom: 10 }}>
                {modalDetalle.telefono    && <span>📞 {modalDetalle.telefono}</span>}
                {modalDetalle.descripcion && <span>📝 {modalDetalle.descripcion}</span>}
                <span>📅 {formatFecha(modalDetalle.fechaInicio)}</span>
                <span>👤 {modalDetalle.registradoPor}</span>
              </div>
              <div style={{ display: 'flex', gap: 24, fontSize: 13, flexWrap: 'wrap' }}>
                <span>Total: <span className="mono" style={{ color: '#f87171', fontWeight: 700 }}>{formatMoneda(modalDetalle.montoTotal)}</span></span>
                <span>Abonado: <span className="mono" style={{ color: '#34d399', fontWeight: 700 }}>{formatMoneda(parseFloat(modalDetalle.montoTotal) - parseFloat(modalDetalle.saldoPendiente))}</span></span>
                <span>Pendiente: <span className="mono" style={{ color: '#fbbf24', fontWeight: 700 }}>{formatMoneda(modalDetalle.saldoPendiente)}</span></span>
              </div>
              <div style={{ marginTop: 12, height: 8, borderRadius: 4, background: '#1e2230', overflow: 'hidden' }}>
                <div style={{
                  width: `${pctAbonado(modalDetalle.saldoPendiente, modalDetalle.montoTotal)}%`,
                  height: '100%', borderRadius: 4,
                  background: parseFloat(modalDetalle.saldoPendiente) <= 0 ? '#22c55e' : '#fbbf24',
                  transition: 'width .3s',
                }} />
              </div>
            </div>

            <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'JetBrains Mono', marginBottom: 10 }}>
              HISTORIAL DE ABONOS {loadingAbonosDetalle ? '⏳' : `(${abonosDetalle.length})`}
            </div>

            {loadingAbonosDetalle ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#4b5563', fontSize: 13 }}>Cargando abonos...</div>
            ) : abonosDetalle.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#374151', fontSize: 13 }}>
                Aún no hay abonos registrados
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[...abonosDetalle].reverse().map((a, i) => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#0d0f14', borderRadius: 8, border: '1px solid #1e2230' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(52,211,153,.15)', border: '1px solid rgba(52,211,153,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#34d399', fontFamily: 'JetBrains Mono', fontWeight: 700, flexShrink: 0 }}>
                      {abonosDetalle.length - i}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="mono" style={{ color: '#34d399', fontWeight: 700, fontSize: 15 }}>{formatMoneda(a.monto)}</span>
                        <span className="mono" style={{ color: '#4b5563', fontSize: 11 }}>
                          {formatFecha(a.fecha)} {a.hora}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 3, fontSize: 11, color: '#6b7280' }}>
                        {a.nota && <span>📝 {a.nota}</span>}
                        <span>👤 {a.registradoPor}</span>
                      </div>
                    </div>
                    {esAdmin && (
                      <button onClick={() => eliminarAbono(a.id)}
                        style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', color: '#f87171', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setModalDetalle(null)}>Cerrar</button>
              {parseFloat(modalDetalle.saldoPendiente) > 0 && (
                <button className="btn green" onClick={() => {
                  setModalAbono(clientes.find(c => c.id === modalDetalle.id) || modalDetalle);
                  setMontoAbono(''); setNotaAbono(''); setErrAbono('');
                  setModalDetalle(null);
                }}>
                  💵 Registrar Abono
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: ELIMINAR CLIENTE
      ══════════════════════════════════════════ */}
      {modalEliminar && (
        <div className="modal-overlay" onClick={() => setModalEliminar(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🗑️ Eliminar Crédito</div>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16, lineHeight: 1.6 }}>
              ¿Confirmas que deseas eliminar el crédito de <strong style={{ color: '#e8eaf0' }}>{modalEliminar.nombre}</strong>?
              Se eliminarán también todos sus abonos. Esta acción no se puede deshacer.
            </p>
            <div style={{ background: '#0d0f14', border: '1px solid #1e2230', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#9ca3af' }}>
                <span>Monto: <span style={{ color: '#f87171', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{formatMoneda(modalEliminar.montoTotal)}</span></span>
                <span>Pendiente: <span style={{ color: '#fbbf24', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{formatMoneda(modalEliminar.saldoPendiente)}</span></span>
                <span>Descripción: <span style={{ color: '#9ca3af' }}>{modalEliminar.descripcion || '—'}</span></span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setModalEliminar(null)}>Cancelar</button>
              <button className="btn red" style={{ background: '#ef4444', color: '#fff', fontWeight: 700 }} onClick={eliminarCliente}>
                🗑️ Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Abonos;