import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ═══════════════════════════════════════════
// STORAGE HELPERS (reemplazar con API cuando esté lista)
// ═══════════════════════════════════════════
const STORAGE_KEY = 'abonos_clientes';

const cargarClientesStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

const guardarClientesStorage = (clientes) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════
const formatFecha = (f) => {
  try { return new Date(f + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return f; }
};

const formatMoneda = (n) => `$${parseFloat(n || 0).toFixed(2)}`;

const estadoBadge = (saldo, total) => {
  if (saldo <= 0) return { label: 'Liquidado', color: '#22c55e', bg: 'rgba(34,197,94,.12)', border: 'rgba(34,197,94,.25)' };
  if (saldo < total) return { label: 'En proceso', color: '#fbbf24', bg: 'rgba(251,191,36,.12)', border: 'rgba(251,191,36,.25)' };
  return { label: 'Pendiente', color: '#f87171', bg: 'rgba(248,113,113,.12)', border: 'rgba(248,113,113,.25)' };
};

const ID = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

// ═══════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════
const Abonos = () => {
  const navigate = useNavigate();

  const matricula = localStorage.getItem('usuarioLogueado') || 'desconocido';
  const rol = localStorage.getItem('rolUsuario') || 'VENDEDOR';
  const esAdmin = rol === 'ADMIN';

  // ── Estado ──
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [collapsed, setCollapsed] = useState(false);

  // ── Modal nuevo cliente ──
  const [modalNuevo, setModalNuevo] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '', descripcion: '', montoTotal: '', fecha: new Date().toISOString().split('T')[0] });
  const [errNuevo, setErrNuevo] = useState({});

  // ── Modal abono ──
  const [modalAbono, setModalAbono] = useState(null); // cliente seleccionado
  const [montoAbono, setMontoAbono] = useState('');
  const [notaAbono, setNotaAbono] = useState('');
  const [errAbono, setErrAbono] = useState('');

  // ── Modal detalle ──
  const [modalDetalle, setModalDetalle] = useState(null);

  // ── Modal eliminar ──
  const [modalEliminar, setModalEliminar] = useState(null);

  // ── Cargar ──
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/');
      return;
    }
    setClientes(cargarClientesStorage());
  }, [navigate]);

  const guardar = (lista) => {
    setClientes(lista);
    guardarClientesStorage(lista);
  };

  // ── Stats ──
  const totalDeuda = clientes.reduce((s, c) => s + c.montoTotal, 0);
  const totalPagado = clientes.reduce((s, c) => s + c.abonos.reduce((a, b) => a + b.monto, 0), 0);
  const totalPendiente = totalDeuda - totalPagado;
  const liquidados = clientes.filter(c => c.saldoPendiente <= 0).length;

  // ── Filtrado ──
  const clientesFiltrados = clientes
    .filter(c => {
      const matchText =
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.telefono?.includes(busqueda) ||
        c.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
      const est = estadoBadge(c.saldoPendiente, c.montoTotal).label.toLowerCase();
      const matchEst =
        filtroEstado === 'todos' ? true :
        filtroEstado === 'pendiente' ? est === 'pendiente' :
        filtroEstado === 'proceso' ? est === 'en proceso' :
        est === 'liquidado';
      return matchText && matchEst;
    })
    .sort((a, b) => b.saldoPendiente - a.saldoPendiente);

  // ── Agregar cliente ──
  const agregarCliente = () => {
    const errs = {};
    if (!nuevoCliente.nombre.trim()) errs.nombre = 'Requerido';
    if (!nuevoCliente.montoTotal || parseFloat(nuevoCliente.montoTotal) <= 0) errs.montoTotal = 'Monto inválido';
    if (Object.keys(errs).length) { setErrNuevo(errs); return; }

    const cliente = {
      id: ID(),
      nombre: nuevoCliente.nombre.trim(),
      telefono: nuevoCliente.telefono.trim(),
      descripcion: nuevoCliente.descripcion.trim(),
      montoTotal: parseFloat(nuevoCliente.montoTotal),
      saldoPendiente: parseFloat(nuevoCliente.montoTotal),
      fechaInicio: nuevoCliente.fecha,
      abonos: [],
      registradoPor: matricula,
    };
    guardar([...clientes, cliente]);
    setNuevoCliente({ nombre: '', telefono: '', descripcion: '', montoTotal: '', fecha: new Date().toISOString().split('T')[0] });
    setErrNuevo({});
    setModalNuevo(false);
  };

  // ── Registrar abono ──
  const registrarAbono = () => {
    const monto = parseFloat(montoAbono);
    if (isNaN(monto) || monto <= 0) { setErrAbono('Ingresa un monto válido'); return; }
    if (monto > modalAbono.saldoPendiente) { setErrAbono(`El monto supera el saldo (${formatMoneda(modalAbono.saldoPendiente)})`); return; }

    const nuevoAbono = {
      id: ID(),
      monto,
      nota: notaAbono.trim(),
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      registradoPor: matricula,
    };

    const updated = clientes.map(c => {
      if (c.id !== modalAbono.id) return c;
      const newAbonos = [...c.abonos, nuevoAbono];
      const totalAbonado = newAbonos.reduce((s, a) => s + a.monto, 0);
      return { ...c, abonos: newAbonos, saldoPendiente: Math.max(0, c.montoTotal - totalAbonado) };
    });

    guardar(updated);
    setMontoAbono('');
    setNotaAbono('');
    setErrAbono('');
    setModalAbono(null);
  };

  // ── Eliminar cliente ──
  const eliminarCliente = () => {
    guardar(clientes.filter(c => c.id !== modalEliminar.id));
    setModalEliminar(null);
    if (modalDetalle?.id === modalEliminar.id) setModalDetalle(null);
  };

  // ── Eliminar abono ──
  const eliminarAbono = (clienteId, abonoId) => {
    if (!window.confirm('¿Eliminar este abono?')) return;
    const updated = clientes.map(c => {
      if (c.id !== clienteId) return c;
      const newAbonos = c.abonos.filter(a => a.id !== abonoId);
      const totalAbonado = newAbonos.reduce((s, a) => s + a.monto, 0);
      return { ...c, abonos: newAbonos, saldoPendiente: Math.max(0, c.montoTotal - totalAbonado) };
    });
    guardar(updated);
    if (modalDetalle?.id === clienteId) {
      setModalDetalle(updated.find(c => c.id === clienteId));
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
        {/* ── SIDEBAR (igual que Inventario) ── */}
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
            <button className="sb-item" onClick={() => navigate('/empresas')} title={collapsed ? 'Empresas' : ''}
              style={{ background: 'linear-gradient(90deg, rgba(167,139,250,.15) 0%, transparent 100%)', borderLeft: '3px solid #a78bfa', marginBottom: 4 }}>
              <span className="sb-icon">🏢</span>
              {!collapsed && <span className="sb-label" style={{ color: '#a78bfa', fontWeight: 700 }}>Empresas</span>}
            </button>
            <button className="sb-item active" onClick={() => navigate('/abonos')} title={collapsed ? 'Abonos' : ''}
              style={{ background: 'linear-gradient(90deg, rgba(52,211,153,.15) 0%, transparent 100%)', borderLeft: '3px solid #34d399', marginBottom: 4 }}>
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
            <div className="stat-card">
              <div className="stat-label">Total Créditos</div>
              <div className="stat-val c-blue">{clientes.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Deuda Total</div>
              <div className="stat-val c-red">{formatMoneda(totalDeuda)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Cobrado</div>
              <div className="stat-val" style={{ color: '#34d399' }}>{formatMoneda(totalPagado)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Saldo Pendiente</div>
              <div className="stat-val c-amber">{formatMoneda(totalPendiente)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Liquidados</div>
              <div className="stat-val c-blue">{liquidados} / {clientes.length}</div>
            </div>
          </div>

          {/* Barra de búsqueda y filtros */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <div className="search-wrap" style={{ marginBottom: 0, flex: 1, minWidth: 220, maxWidth: 380 }}>
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Buscar cliente, teléfono o descripción..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { val: 'todos', label: 'Todos', color: '#6b7280' },
                { val: 'pendiente', label: '🔴 Pendiente', color: '#f87171' },
                { val: 'proceso', label: '⚠️ En proceso', color: '#fbbf24' },
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

          {/* Tabla */}
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Descripción</th>
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
                    <td colSpan={10} style={{ padding: '60px', textAlign: 'center', color: '#374151', fontSize: 14 }}>
                      {clientes.length === 0
                        ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 40 }}>💳</span>
                            <div style={{ color: '#4b5563', fontWeight: 600 }}>No hay créditos registrados</div>
                            <button className="btn green" style={{ padding: '9px 22px', fontSize: 13 }} onClick={() => setModalNuevo(true)}>
                              ➕ Registrar primer crédito
                            </button>
                          </div>
                        : 'Sin resultados para esta búsqueda'}
                    </td>
                  </tr>
                ) : clientesFiltrados.map(c => {
                  const totalAbonado = c.abonos.reduce((s, a) => s + a.monto, 0);
                  const pct = c.montoTotal > 0 ? Math.min(100, (totalAbonado / c.montoTotal) * 100) : 0;
                  const est = estadoBadge(c.saldoPendiente, c.montoTotal);
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, fontSize: 14 }}>{c.nombre}</td>
                      <td className="mono" style={{ color: '#6b7280' }}>{c.telefono || '—'}</td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#9ca3af', fontSize: 12 }}>
                        {c.descripcion || '—'}
                      </td>
                      <td className="mono" style={{ color: '#f87171', fontWeight: 600 }}>{formatMoneda(c.montoTotal)}</td>
                      <td className="mono" style={{ color: '#34d399' }}>{formatMoneda(totalAbonado)}</td>
                      <td className="mono" style={{ fontWeight: 700, color: c.saldoPendiente <= 0 ? '#22c55e' : '#fbbf24' }}>
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
                          borderRadius: 20, background: est.bg, color: est.color, border: `1px solid ${est.border}`,
                          whiteSpace: 'nowrap',
                        }}>{est.label}</span>
                      </td>
                      <td className="mono" style={{ color: '#6b7280', fontSize: 11, whiteSpace: 'nowrap' }}>{formatFecha(c.fechaInicio)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn blue" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => setModalDetalle(c)}>
                            📋 Ver
                          </button>
                          {c.saldoPendiente > 0 && (
                            <button className="btn green" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => { setModalAbono(c); setMontoAbono(''); setNotaAbono(''); setErrAbono(''); }}>
                              💵 Abonar
                            </button>
                          )}
                          {esAdmin && (
                            <button className="btn red" style={{ padding: '5px 10px', fontSize: 11, background: '#ef4444', color: '#fff' }} onClick={() => setModalEliminar(c)}>
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
                      {formatMoneda(clientesFiltrados.reduce((s, c) => s + c.montoTotal, 0))}
                    </td>
                    <td className="mono" style={{ color: '#34d399', fontWeight: 700, padding: '13px 15px' }}>
                      {formatMoneda(clientesFiltrados.reduce((s, c) => s + c.abonos.reduce((a, b) => a + b.monto, 0), 0))}
                    </td>
                    <td className="mono" style={{ color: '#fbbf24', fontWeight: 700, padding: '13px 15px' }}>
                      {formatMoneda(clientesFiltrados.reduce((s, c) => s + c.saldoPendiente, 0))}
                    </td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </main>
      </div>

      {/* ══════════════ MODAL: NUEVO CRÉDITO ══════════════ */}
      {modalNuevo && (
        <div className="modal-overlay" onClick={() => setModalNuevo(false)}>
          <div className="modal-box" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">💳 Registrar Nuevo Crédito</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono', display: 'block', marginBottom: 5 }}>
                  Nombre del cliente *
                </label>
                <input className="inp" style={{ width: '100%', borderColor: errNuevo.nombre ? 'rgba(248,113,113,.6)' : undefined }}
                  placeholder="Ej: Juan García" value={nuevoCliente.nombre}
                  onChange={e => { setNuevoCliente({ ...nuevoCliente, nombre: e.target.value }); setErrNuevo(p => ({ ...p, nombre: '' })); }} />
                {errNuevo.nombre && <span style={{ fontSize: 11, color: '#f87171', fontFamily: 'JetBrains Mono' }}>⚠ {errNuevo.nombre}</span>}
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono', display: 'block', marginBottom: 5 }}>Teléfono</label>
                <input className="inp" style={{ width: '100%' }} placeholder="Ej: 449-123-4567" value={nuevoCliente.telefono}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono', display: 'block', marginBottom: 5 }}>
                  Descripción / Concepto
                </label>
                <input className="inp" style={{ width: '100%' }} placeholder="Ej: Reparación de laptop, compra de celular..." value={nuevoCliente.descripcion}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, descripcion: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono', display: 'block', marginBottom: 5 }}>
                    Monto Total $ *
                  </label>
                  <input className="inp" style={{ width: '100%', fontFamily: 'JetBrains Mono', fontSize: 16, color: '#f87171', borderColor: errNuevo.montoTotal ? 'rgba(248,113,113,.6)' : 'rgba(248,113,113,.35)' }}
                    type="number" step="0.01" min="0" placeholder="0.00" value={nuevoCliente.montoTotal}
                    onChange={e => { setNuevoCliente({ ...nuevoCliente, montoTotal: e.target.value }); setErrNuevo(p => ({ ...p, montoTotal: '' })); }} />
                  {errNuevo.montoTotal && <span style={{ fontSize: 11, color: '#f87171', fontFamily: 'JetBrains Mono' }}>⚠ {errNuevo.montoTotal}</span>}
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono', display: 'block', marginBottom: 5 }}>Fecha</label>
                  <input className="inp" style={{ width: '100%' }} type="date" value={nuevoCliente.fecha}
                    onChange={e => setNuevoCliente({ ...nuevoCliente, fecha: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="btn ghost" onClick={() => { setModalNuevo(false); setErrNuevo({}); }}>Cancelar</button>
              <button className="btn green" onClick={agregarCliente}>✅ Registrar Crédito</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: REGISTRAR ABONO ══════════════ */}
      {modalAbono && (
        <div className="modal-overlay" onClick={() => setModalAbono(null)}>
          <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">💵 Registrar Abono</div>
            <div style={{ background: '#0d0f14', border: '1px solid #1e2230', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{modalAbono.nombre}</div>
              <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#9ca3af', flexWrap: 'wrap' }}>
                <span>Total: <span className="mono" style={{ color: '#f87171' }}>{formatMoneda(modalAbono.montoTotal)}</span></span>
                <span>Abonado: <span className="mono" style={{ color: '#34d399' }}>{formatMoneda(modalAbono.abonos.reduce((s, a) => s + a.monto, 0))}</span></span>
                <span>Pendiente: <span className="mono" style={{ color: '#fbbf24', fontWeight: 700 }}>{formatMoneda(modalAbono.saldoPendiente)}</span></span>
              </div>
              <div style={{ marginTop: 10, height: 6, borderRadius: 4, background: '#1e2230', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, (modalAbono.abonos.reduce((s, a) => s + a.monto, 0) / modalAbono.montoTotal) * 100)}%`,
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
                  type="number" step="0.01" min="0" placeholder="0.00" value={montoAbono}
                  onChange={e => { setMontoAbono(e.target.value); setErrAbono(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') registrarAbono(); if (e.key === 'Escape') setModalAbono(null); }} />
                {errAbono && <span style={{ fontSize: 11, color: '#f87171', fontFamily: 'JetBrains Mono' }}>⚠ {errAbono}</span>}
              </div>
              {parseFloat(montoAbono) > 0 && parseFloat(montoAbono) <= modalAbono.saldoPendiente && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: 13, fontFamily: 'JetBrains Mono', padding: '8px 0' }}>
                  <span style={{ color: '#6b7280' }}>Nuevo saldo:</span>
                  <span style={{ color: '#22c55e', fontWeight: 700 }}>
                    {formatMoneda(modalAbono.saldoPendiente - parseFloat(montoAbono))}
                  </span>
                </div>
              )}
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono', display: 'block', marginBottom: 5 }}>
                  Nota (opcional)
                </label>
                <input className="inp" style={{ width: '100%' }} placeholder="Ej: Pago en efectivo" value={notaAbono}
                  onChange={e => setNotaAbono(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') registrarAbono(); }} />
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: 18 }}>
              <button className="btn ghost" onClick={() => setModalAbono(null)}>Cancelar</button>
              <button className="btn green" onClick={registrarAbono}>✅ Confirmar Abono</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: DETALLE / HISTORIAL ══════════════ */}
      {modalDetalle && (
        <div className="modal-overlay" onClick={() => setModalDetalle(null)}>
          <div className="modal-box" style={{ maxWidth: 560, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">📋 Detalle de Crédito</div>

            {/* Info cliente */}
            <div style={{ background: '#0d0f14', border: '1px solid #1e2230', borderRadius: 10, padding: '16px', marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{modalDetalle.nombre}</div>
              <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#9ca3af', flexWrap: 'wrap', marginBottom: 10 }}>
                {modalDetalle.telefono && <span>📞 {modalDetalle.telefono}</span>}
                {modalDetalle.descripcion && <span>📝 {modalDetalle.descripcion}</span>}
                <span>📅 {formatFecha(modalDetalle.fechaInicio)}</span>
                <span>👤 {modalDetalle.registradoPor}</span>
              </div>
              <div style={{ display: 'flex', gap: 24, fontSize: 13, flexWrap: 'wrap' }}>
                <span>Total: <span className="mono" style={{ color: '#f87171', fontWeight: 700 }}>{formatMoneda(modalDetalle.montoTotal)}</span></span>
                <span>Abonado: <span className="mono" style={{ color: '#34d399', fontWeight: 700 }}>{formatMoneda(modalDetalle.abonos.reduce((s, a) => s + a.monto, 0))}</span></span>
                <span>Pendiente: <span className="mono" style={{ color: '#fbbf24', fontWeight: 700 }}>{formatMoneda(modalDetalle.saldoPendiente)}</span></span>
              </div>
              <div style={{ marginTop: 12, height: 8, borderRadius: 4, background: '#1e2230', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, (modalDetalle.abonos.reduce((s, a) => s + a.monto, 0) / modalDetalle.montoTotal) * 100)}%`,
                  height: '100%', borderRadius: 4,
                  background: modalDetalle.saldoPendiente <= 0 ? '#22c55e' : '#fbbf24',
                  transition: 'width .3s',
                }} />
              </div>
            </div>

            {/* Historial de abonos */}
            <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'JetBrains Mono', marginBottom: 10 }}>
              HISTORIAL DE ABONOS ({modalDetalle.abonos.length})
            </div>
            {modalDetalle.abonos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#374151', fontSize: 13 }}>
                Aún no hay abonos registrados
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[...modalDetalle.abonos].reverse().map((a, i) => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#0d0f14', borderRadius: 8, border: '1px solid #1e2230' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(52,211,153,.15)', border: '1px solid rgba(52,211,153,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#34d399', fontFamily: 'JetBrains Mono', fontWeight: 700, flexShrink: 0 }}>
                      {modalDetalle.abonos.length - i}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="mono" style={{ color: '#34d399', fontWeight: 700, fontSize: 15 }}>{formatMoneda(a.monto)}</span>
                        <span className="mono" style={{ color: '#4b5563', fontSize: 11 }}>{formatFecha(a.fecha)} {a.hora}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 3, fontSize: 11, color: '#6b7280' }}>
                        {a.nota && <span>📝 {a.nota}</span>}
                        <span>👤 {a.registradoPor}</span>
                      </div>
                    </div>
                    {esAdmin && (
                      <button onClick={() => eliminarAbono(modalDetalle.id, a.id)}
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
              {modalDetalle.saldoPendiente > 0 && (
                <button className="btn green" onClick={() => { setModalAbono(clientes.find(c => c.id === modalDetalle.id)); setMontoAbono(''); setNotaAbono(''); setErrAbono(''); setModalDetalle(null); }}>
                  💵 Registrar Abono
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: ELIMINAR CLIENTE ══════════════ */}
      {modalEliminar && (
        <div className="modal-overlay" onClick={() => setModalEliminar(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🗑️ Eliminar Crédito</div>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16, lineHeight: 1.6 }}>
              ¿Confirmas que deseas eliminar el crédito de <strong style={{ color: '#e8eaf0' }}>{modalEliminar.nombre}</strong>? Se eliminarán también todos sus abonos. Esta acción no se puede deshacer.
            </p>
            <div style={{ background: '#0d0f14', border: '1px solid #1e2230', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#9ca3af' }}>
                <span>Monto: <span style={{ color: '#f87171', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{formatMoneda(modalEliminar.montoTotal)}</span></span>
                <span>Pendiente: <span style={{ color: '#fbbf24', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{formatMoneda(modalEliminar.saldoPendiente)}</span></span>
                <span>Abonos: <span style={{ color: '#4f9eff', fontWeight: 600 }}>{modalEliminar.abonos.length}</span></span>
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