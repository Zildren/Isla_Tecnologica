// ═══════════════════════════════════════════════════════════════════
// PerfilModal.jsx — Modal de perfil de usuario
// Colócalo en: src/components/PerfilModal.jsx
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect } from 'react';

// ── Estilos inline del modal ──────────────────────────────────────
const S = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(5, 7, 12, 0.85)',
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20,
    animation: 'fadeIn .2s ease',
  },
  box: {
    background: '#111318',
    border: '1px solid #1e2230',
    borderRadius: 18,
    width: '100%',
    maxWidth: 540,
    maxHeight: '92vh',
    overflowY: 'auto',
    boxShadow: '0 30px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.04)',
    animation: 'slideUp .25s ease',
  },
  header: {
    padding: '28px 28px 0',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  closeBtn: {
    background: 'rgba(255,255,255,.06)',
    border: '1px solid #1e2230',
    borderRadius: 10,
    color: '#6b7280',
    cursor: 'pointer',
    width: 34, height: 34,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16,
    transition: 'all .15s',
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#4b5563',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontFamily: 'JetBrains Mono, monospace',
    marginBottom: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  divider: {
    height: 1,
    background: '#1e2230',
    margin: '24px 0',
  },
  inp: {
    width: '100%',
    background: '#0d0f14',
    border: '1px solid #1e2230',
    borderRadius: 10,
    color: '#e8eaf0',
    fontSize: 13,
    fontFamily: 'JetBrains Mono, monospace',
    padding: '11px 14px',
    outline: 'none',
    transition: 'border-color .15s',
    boxSizing: 'border-box',
  },
  label: {
    fontSize: 11,
    color: '#6b7280',
    fontFamily: 'JetBrains Mono, monospace',
    marginBottom: 6,
    display: 'block',
  },
  btn: {
    padding: '10px 20px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    fontFamily: 'JetBrains Mono, monospace',
    transition: 'all .15s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
  },
  toast: {
    position: 'fixed',
    bottom: 28,
    right: 28,
    zIndex: 2000,
    background: '#1a1d28',
    border: '1px solid #22c55e',
    borderRadius: 12,
    padding: '12px 20px',
    fontSize: 13,
    color: '#22c55e',
    fontFamily: 'JetBrains Mono, monospace',
    boxShadow: '0 8px 30px rgba(0,0,0,.5)',
    animation: 'slideUp .2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
};

// ── Estadísticas del sistema (solo admin) ───────────────────────
const StatRow = ({ label, value, color = '#e8eaf0' }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', borderRadius: 8, background: '#0d0f14', border: '1px solid #1e2230', marginBottom: 8 }}>
    <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// Props:
//   onClose       — función para cerrar el modal
//   productos     — array de productos (para stats admin)
//   todasLasVentas— array de ventas   (para stats admin)
//   gastos        — array de gastos   (para stats admin)
//   usuarios      — array de usuarios (para stats admin)
//   limiteStock   — número del límite de stock
//   API_USUARIOS  — URL base de usuarios (para cambiar contraseña)
// ═══════════════════════════════════════════════════════════════════
const PerfilModal = ({
  onClose,
  productos = [],
  todasLasVentas = [],
  gastos = [],
  usuarios = [],
  limiteStock = 5,
  API_USUARIOS = 'http://localhost:8080/api/usuarios',
}) => {
  const matricula = localStorage.getItem('usuarioLogueado') || 'desconocido';
  const rol       = localStorage.getItem('rolUsuario') || 'VENDEDOR';
  const esAdmin   = rol === 'ADMIN';

  // ── Foto de perfil (guardada en localStorage por usuario) ──────
  const fotoKey = `perfil_foto_${matricula}`;
  const [foto, setFoto] = useState(() => localStorage.getItem(fotoKey) || '');
  const fileRef = useRef(null);

  // ── Cambio de contraseña ───────────────────────────────────────
  const [passForm, setPassForm] = useState({ actual: '', nueva: '', confirmar: '' });
  const [showPass, setShowPass] = useState({ actual: false, nueva: false, confirmar: false });
  const [savingPass, setSavingPass] = useState(false);

  // ── Ajustes rápidos admin ──────────────────────────────────────
  const [limiteTemp, setLimiteTemp] = useState('');

  // ── Toast ──────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (msg, color = '#22c55e') => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Cerrar con Escape ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // ── Subir foto ─────────────────────────────────────────────────
  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { showToast('La imagen debe pesar menos de 3MB', '#f87171'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setFoto(base64);
      localStorage.setItem(fotoKey, base64);
      showToast('✅ Foto actualizada');
    };
    reader.readAsDataURL(file);
  };

  const quitarFoto = () => {
    setFoto('');
    localStorage.removeItem(fotoKey);
    showToast('Foto eliminada', '#f87171');
  };

  // ── Cambiar contraseña ─────────────────────────────────────────
  const cambiarPassword = async () => {
    if (!passForm.actual.trim())    return showToast('Ingresa tu contraseña actual', '#f87171');
    if (passForm.nueva.length < 4)  return showToast('La nueva contraseña debe tener al menos 4 caracteres', '#f87171');
    if (passForm.nueva !== passForm.confirmar) return showToast('Las contraseñas no coinciden', '#f87171');
    setSavingPass(true);
    try {
      const res = await fetch(`${API_USUARIOS}/cambiar-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricula, passwordActual: passForm.actual, passwordNueva: passForm.nueva }),
      });
      if (res.ok) {
        showToast('✅ Contraseña actualizada correctamente');
        setPassForm({ actual: '', nueva: '', confirmar: '' });
      } else if (res.status === 401) {
        showToast('❌ Contraseña actual incorrecta', '#f87171');
      } else {
        showToast(`❌ Error del servidor (${res.status})`, '#f87171');
      }
    } catch {
      showToast('❌ No se pudo conectar al backend', '#f87171');
    } finally {
      setSavingPass(false);
    }
  };

  // ── Stats admin ────────────────────────────────────────────────
  const hoy = new Date();
  const ventasHoy = todasLasVentas.filter(v => new Date(v.fechaVenta).toDateString() === hoy.toDateString());
  const ingresoHoy = ventasHoy.reduce((s, v) => s + (v.total ?? 0), 0);
  const totalInvertido = productos.reduce((s, p) => s + p.precioCompra * p.stock, 0);
  const totalGananciaAprox = productos.reduce((s, p) => s + (p.precioVenta - p.precioCompra) * p.stock, 0);
  const bajoStock = productos.filter(p => p.stock <= limiteStock).length;
  const gastosTotal = gastos.reduce((s, g) => s + g.monto, 0);
  const usuariosActivos = usuarios.filter(u => !u.bloqueado).length;

  // ── Vista ──────────────────────────────────────────────────────
  return (
    <>
      {/* CSS animation keyframes */}
      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform: translateY(16px) } to { opacity:1; transform: translateY(0) } }
        .perf-inp:focus { border-color: #4f9eff !important; }
        .perf-btn-blue  { background: rgba(79,158,255,.12); border:1px solid rgba(79,158,255,.35); color:#4f9eff; }
        .perf-btn-blue:hover  { background: rgba(79,158,255,.22); }
        .perf-btn-green { background: #22c55e; color:#000; border:none; }
        .perf-btn-green:hover { background: #16a34a; }
        .perf-btn-red   { background: rgba(239,68,68,.12); border:1px solid rgba(239,68,68,.3); color:#ef4444; }
        .perf-btn-red:hover { background: rgba(239,68,68,.22); }
        .perf-btn-ghost { background: transparent; border:1px solid #1e2230; color:#6b7280; }
        .perf-btn-ghost:hover { background: #1a1d28; color:#9ca3af; }
        .close-btn:hover { background:rgba(255,255,255,.1); color:#e8eaf0; }
        .foto-overlay { opacity:0; transition:opacity .2s; }
        .foto-wrap:hover .foto-overlay { opacity:1; }
      `}</style>

      <div style={S.overlay} onClick={onClose}>
        <div style={S.box} onClick={e => e.stopPropagation()}>

          {/* ── HEADER ── */}
          <div style={S.header}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e8eaf0', marginBottom: 4 }}>
                Mi Perfil
              </div>
              <div style={{ fontSize: 12, color: '#4b5563', fontFamily: 'JetBrains Mono, monospace' }}>
                {esAdmin ? '🔑 Administrador' : '👤 Vendedor'} · {matricula}
              </div>
            </div>
            <button className="close-btn" style={S.closeBtn} onClick={onClose}>✕</button>
          </div>

          <div style={{ padding: '24px 28px 28px' }}>

            {/* ══════════════════════════════════════
                SECCIÓN 1: FOTO + INFO BÁSICA
            ══════════════════════════════════════ */}
            <div style={S.sectionTitle}>
              <span>👤</span> Información de Usuario
            </div>

            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              {/* Avatar interactivo */}
              <div style={{ flexShrink: 0 }}>
                <div
                  className="foto-wrap"
                  style={{ position: 'relative', width: 96, height: 96, borderRadius: 18, cursor: 'pointer', overflow: 'hidden', border: '2px solid #1e2230', background: '#0d0f14' }}
                  onClick={() => fileRef.current?.click()}
                  title="Cambiar foto"
                >
                  {foto ? (
                    <img src={foto} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700, color: esAdmin ? '#4f9eff' : '#22c55e', fontFamily: 'JetBrains Mono, monospace', background: esAdmin ? 'rgba(79,158,255,.1)' : 'rgba(34,197,94,.1)' }}>
                      {matricula.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Overlay hover */}
                  <div className="foto-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <span style={{ fontSize: 20 }}>📷</span>
                    <span style={{ fontSize: 10, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>Cambiar</span>
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFoto} />
                {foto && (
                  <button
                    className="perf-btn-red" style={{ ...S.btn, padding: '5px 10px', fontSize: 10, marginTop: 7, width: '100%', justifyContent: 'center' }}
                    onClick={quitarFoto}
                  >✕ Quitar</button>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ background: '#0d0f14', border: '1px solid #1e2230', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <div style={S.label}>Matrícula / Usuario</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#e8eaf0', fontFamily: 'JetBrains Mono, monospace' }}>{matricula}</div>
                  </div>
                  <div>
                    <div style={S.label}>Rol en el sistema</div>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', padding: '4px 12px', borderRadius: 20, background: esAdmin ? 'rgba(79,158,255,.12)' : 'rgba(34,197,94,.12)', color: esAdmin ? '#4f9eff' : '#22c55e', border: `1px solid ${esAdmin ? 'rgba(79,158,255,.3)' : 'rgba(34,197,94,.3)'}` }}>
                      {esAdmin ? '🔑 ADMIN' : '👤 VENDEDOR'}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#374151', marginTop: 8, fontFamily: 'JetBrains Mono, monospace' }}>
                  💡 Haz clic en la foto para cambiarla (máx. 3MB)
                </div>
              </div>
            </div>

            <div style={S.divider} />

            {/* ══════════════════════════════════════
                SECCIÓN 2: CAMBIAR CONTRASEÑA
            ══════════════════════════════════════ */}
            <div style={S.sectionTitle}><span>🔐</span> Cambiar Contraseña</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'actual', label: 'Contraseña actual', placeholder: '••••••••' },
                { key: 'nueva',  label: 'Nueva contraseña',  placeholder: 'Mínimo 4 caracteres' },
                { key: 'confirmar', label: 'Confirmar nueva contraseña', placeholder: 'Repite la nueva contraseña' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={S.label}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="perf-inp"
                      style={{ ...S.inp, paddingRight: 44 }}
                      type={showPass[key] ? 'text' : 'password'}
                      placeholder={placeholder}
                      value={passForm[key]}
                      onChange={e => setPassForm({ ...passForm, [key]: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') cambiarPassword(); }}
                    />
                    <button
                      onClick={() => setShowPass(prev => ({ ...prev, [key]: !prev[key] }))}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#6b7280', padding: 4 }}
                    >
                      {showPass[key] ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              ))}

              {/* Barra de seguridad visual */}
              {passForm.nueva.length > 0 && (() => {
                const len = passForm.nueva.length;
                const hasNum = /\d/.test(passForm.nueva);
                const hasSym = /[^a-zA-Z0-9]/.test(passForm.nueva);
                const score = (len >= 4 ? 1 : 0) + (len >= 8 ? 1 : 0) + (hasNum ? 1 : 0) + (hasSym ? 1 : 0);
                const labels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte'];
                const colors = ['#ef4444', '#f87171', '#fbbf24', '#4f9eff', '#22c55e'];
                return (
                  <div>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                      {[0,1,2,3].map(i => (
                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i < score ? colors[score - 1] : '#1e2230', transition: 'background .2s' }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 10, color: colors[score - 1] || '#4b5563', fontFamily: 'JetBrains Mono, monospace' }}>
                      Seguridad: {labels[score - 1] || 'Muy débil'}
                    </div>
                  </div>
                );
              })()}

              <button
                className="perf-btn-green"
                style={{ ...S.btn, opacity: savingPass ? 0.7 : 1, alignSelf: 'flex-start' }}
                onClick={cambiarPassword}
                disabled={savingPass}
              >
                {savingPass ? '⏳ Guardando...' : '🔐 Actualizar Contraseña'}
              </button>
            </div>

            {/* ══════════════════════════════════════
                SECCIÓN 3 (solo ADMIN): PANEeeL ADMIN
            ══════════════════════════════════════ */}
            {esAdmin && (
              <>
                <div style={S.divider} />

                <div style={S.sectionTitle}><span>🔑</span> Panel Exclusivo Admin</div>

                {/* Stats del sistema */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
                  <StatRow label="Ingresos hoy"         value={`$${ingresoHoy.toFixed(2)}`}   color="#22c55e" />
                  <StatRow label="Ventas hoy"           value={ventasHoy.length}               color="#4f9eff" />
                  <StatRow label="Capital en stock"     value={`$${totalInvertido.toFixed(2)}`} color="#f87171" />
                  <StatRow label="Ganancia aprox."      value={`+$${totalGananciaAprox.toFixed(2)}`} color="#34d399" />
                  <StatRow label="Bajo stock"           value={`${bajoStock} prods`}            color="#fbbf24" />
                  <StatRow label="Gastos registrados"   value={`$${gastosTotal.toFixed(2)}`}   color="#f87171" />
                  <StatRow label="Usuarios activos"     value={usuariosActivos}                 color="#4f9eff" />
                  <StatRow label="Total usuarios"       value={usuarios.length}                 color="#9ca3af" />
                </div>

                {/* Configuración rápida */}
                <div style={{ background: 'rgba(79,158,255,.05)', border: '1px solid rgba(79,158,255,.15)', borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ fontSize: 12, color: '#4f9eff', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    ⚙️ Configuración Rápida
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ ...S.label, color: '#4b5563' }}>Límite de stock bajo (actual: {limiteStock})</label>
                      <input
                        className="perf-inp"
                        style={{ ...S.inp, borderColor: 'rgba(79,158,255,.3)' }}
                        type="number"
                        min="0"
                        placeholder={String(limiteStock)}
                        value={limiteTemp}
                        onChange={e => setLimiteTemp(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const v = parseInt(limiteTemp);
                            if (isNaN(v) || v < 0) { showToast('Valor inválido', '#f87171'); return; }
                            localStorage.setItem('limiteStock', v);
                            showToast(`✅ Límite actualizado a ${v} unidades`);
                            setLimiteTemp('');
                            window.location.reload(); // refresca para que el padre lo tome
                          }
                        }}
                      />
                    </div>
                    <button
                      className="perf-btn-blue"
                      style={{ ...S.btn, whiteSpace: 'nowrap' }}
                      onClick={() => {
                        const v = parseInt(limiteTemp);
                        if (isNaN(v) || v < 0) { showToast('Valor inválido', '#f87171'); return; }
                        localStorage.setItem('limiteStock', v);
                        showToast(`✅ Límite actualizado a ${v} unidades`);
                        setLimiteTemp('');
                        window.location.reload();
                      }}
                    >
                      💾 Guardar
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: '#374151', marginTop: 8, fontFamily: 'JetBrains Mono, monospace' }}>
                    💡 Productos con stock ≤ este número se marcan como bajo stock.
                  </div>
                </div>

                {/* Acciones admin */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ ...S.sectionTitle, marginBottom: 10 }}>⚡ Acciones Admin</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button
                      className="perf-btn-red"
                      style={{ ...S.btn }}
                      onClick={() => {
                        if (!window.confirm('¿Limpiar todos los gastos registrados? Esta acción no se puede deshacer.')) return;
                        localStorage.removeItem('gastos_pos');
                        showToast('🧹 Gastos eliminados');
                      }}
                    >
                      🧹 Limpiar gastos
                    </button>
                    <button
                      className="perf-btn-blue"
                      style={{ ...S.btn }}
                      onClick={() => {
                        const info = {
                          exportadoPor: matricula,
                          fecha: new Date().toISOString(),
                          gastos: JSON.parse(localStorage.getItem('gastos_pos') || '[]'),
                        };
                        const blob = new Blob([JSON.stringify(info, null, 2)], { type: 'application/json' });
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = `gastos-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        showToast('📥 Gastos exportados como JSON');
                      }}
                    >
                      📥 Exportar gastos JSON
                    </button>
                    <button
                      className="perf-btn-ghost"
                      style={{ ...S.btn }}
                      onClick={() => {
                        const claves = Object.keys(localStorage).filter(k => k.startsWith('perfil_foto_'));
                        showToast(`💡 ${claves.length} foto(s) en almacenamiento local`, '#fbbf24');
                      }}
                    >
                      📊 Info sistema
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ ...S.toast, borderColor: toast.color, color: toast.color }}>
          {toast.msg}
        </div>
      )}
    </>
  );
};

export default PerfilModal;

// ═══════════════════════════════════════════════════════════════════
// CÓMO INTEGRAR EN Inventario.jsx
// ═══════════════════════════════════════════════════════════════════
//
// 1) Importa el componente al inicio de Inventario.jsx:
//    import PerfilModal from '../components/PerfilModal';
//
// 2) Agrega este estado:
//    const [modalPerfil, setModalPerfil] = useState(false);
//
// 3) Haz clickeable el avatar del sidebar. Busca la sección
//    "sb-user" en el sidebar y cambia el div por:
//
//    <div className="sb-user" style={{cursor:'pointer'}} onClick={() => setModalPerfil(true)}>
//      <div className={`sb-avatar ${esAdmin ? 'admin' : 'vendedor'}`}
//           style={{ backgroundImage: fotoUrl ? `url(${fotoUrl})` : 'none',
//                    backgroundSize:'cover', backgroundPosition:'center' }}>
//        {!fotoUrl && matricula.charAt(0).toUpperCase()}
//      </div>
//      ...
//    </div>
//
//    Para mostrar la foto en el sidebar agrega este estado:
//    const [fotoUrl, setFotoUrl] = useState(() => localStorage.getItem(`perfil_foto_${matricula}`) || '');
//    // Actualízalo con: setFotoUrl(localStorage.getItem(`perfil_foto_${matricula}`) || '');
//
// 4) Renderiza el modal al final del componente (antes del cierre del <>):
//
//    {modalPerfil && (
//      <PerfilModal
//        onClose={() => setModalPerfil(false)}
//        productos={productos}
//        todasLasVentas={todasLasVentas}
//        gastos={gastos}
//        usuarios={usuarios}
//        limiteStock={limiteStock}
//        API_USUARIOS="http://localhost:8080/api/usuarios"
//      />
//    )}
//
// 5) En el backend (Spring Boot), agrega este endpoint en UsuarioController.java:
//
//    @PutMapping("/cambiar-password")
//    public ResponseEntity<?> cambiarPassword(@RequestBody Map<String, String> body) {
//        String matricula       = body.get("matricula");
//        String passwordActual  = body.get("passwordActual");
//        String passwordNueva   = body.get("passwordNueva");
//        // Verifica passwordActual, actualiza si es correcto
//        // Devuelve 200 OK o 401 Unauthorized
//    }
// ═══════════════════════════════════════════════════════════════════