import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const PLANES = {
  FREE: {
    id: 'FREE',
    nombre: 'Free Trial',
    precio: 0,
    color: '#34d399',
    colorBg: 'rgba(52,211,153,.12)',
    colorBorder: 'rgba(52,211,153,.25)',
    emoji: '🎁',
    duracionDias: 30,
    requiereTarjeta: false,
    limites: {
      productos: 100,
      usuarios: 3,
      ventas_mes: 500,
      gastos: true,
      reportes: true,
      catalogo: true,
      abonos: false,
    },
    descripcion: '30 días gratis · Sin tarjeta · Acceso directo',
  },
  BASIC: {
    id: 'BASIC',
    nombre: 'Basic',
    precio: 199,
    color: '#4f9eff',
    colorBg: 'rgba(79,158,255,.12)',
    colorBorder: 'rgba(79,158,255,.25)',
    emoji: '⚡',
    limites: {
      productos: 200,
      usuarios: 5,
      ventas_mes: 1000,
      gastos: true,
      reportes: true,
      catalogo: true,
      abonos: false,
    },
  },
  PRO: {
    id: 'PRO',
    nombre: 'Pro',
    precio: 499,
    color: '#a78bfa',
    colorBg: 'rgba(167,139,250,.12)',
    colorBorder: 'rgba(167,139,250,.25)',
    emoji: '🚀',
    limites: {
      productos: 1000,
      usuarios: 15,
      ventas_mes: 10000,
      gastos: true,
      reportes: true,
      catalogo: true,
      abonos: true,
    },
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    nombre: 'Enterprise',
    precio: 999,
    color: '#fbbf24',
    colorBg: 'rgba(251,191,36,.12)',
    colorBorder: 'rgba(251,191,36,.25)',
    emoji: '👑',
    limites: {
      productos: -1,
      usuarios: -1,
      ventas_mes: -1,
      gastos: true,
      reportes: true,
      catalogo: true,
      abonos: true,
    },
  },
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const diasRestantes = (fechaVenc) => {
  if (!fechaVenc) return null;
  const hoy = new Date();
  const venc = new Date(fechaVenc + 'T23:59:59');
  const diff = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
  return diff;
};

const formatFecha = (f) => {
  if (!f) return '—';
  try {
    return new Date(f + 'T12:00:00').toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return f; }
};

const limiteLabel = (val) =>
  val === -1 ? '∞ Ilimitado' : val === false ? '✕' : val === true ? '✓' : String(val);

const StatusBadge = ({ empresa }) => {
  const dias = diasRestantes(empresa.fechaVencimiento);
  const activo = empresa.activo !== false;
  if (!activo) return <span style={badge('#ef4444')}>🔴 Inactiva</span>;
  if (dias === null) return <span style={badge('#6b7280')}>⚪ Sin plan</span>;
  if (dias < 0) return <span style={badge('#ef4444')}>🔴 Vencida</span>;
  if (dias <= 5) return <span style={badge('#fbbf24')}>⚠️ Vence en {dias}d</span>;
  return <span style={badge('#22c55e')}>✅ Activa</span>;
};

const badge = (color) => ({
  fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
  padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
  background: `${color}18`, color, border: `1px solid ${color}35`,
});

const ModalPlan = ({ empresa, onClose, onGuardar }) => {
  const [planSel, setPlanSel] = useState(empresa.plan || 'FREE');
  const [meses, setMeses] = useState(1);
  const plan = PLANES[planSel];
  const esFree = planSel === 'FREE';

  const calcFechaVenc = () => {
    const hoy = new Date();
    if (esFree) hoy.setDate(hoy.getDate() + 30);
    else hoy.setMonth(hoy.getMonth() + meses);
    return hoy.toISOString().split('T')[0];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">📦 Asignar Plan — {empresa.nombre}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          {Object.values(PLANES).map((p) => (
            <button key={p.id} onClick={() => setPlanSel(p.id)} style={{
              padding: '14px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
              border: `2px solid ${planSel === p.id ? p.color : '#2a3045'}`,
              background: planSel === p.id ? p.colorBg : 'transparent',
              transition: 'all .15s', position: 'relative',
            }}>
              {p.id === 'FREE' && (
                <span style={{
                  position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700,
                  fontFamily: 'JetBrains Mono', padding: '2px 6px', borderRadius: 6,
                  background: 'rgba(52,211,153,.2)', color: '#34d399', border: '1px solid rgba(52,211,153,.35)',
                }}>30 DÍAS</span>
              )}
              <div style={{ fontSize: 18, marginBottom: 4 }}>{p.emoji}</div>
              <div style={{ fontWeight: 700, color: planSel === p.id ? p.color : '#e8eaf0', fontSize: 14 }}>{p.nombre}</div>
              <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                {p.id === 'FREE' ? '🎁 Gratis · Sin tarjeta' : `$${p.precio}/mes`}
              </div>
            </button>
          ))}
        </div>
        {esFree && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 14,
            background: 'rgba(52,211,153,.08)', border: '1px solid rgba(52,211,153,.25)', borderRadius: 10,
            fontSize: 12, color: '#34d399', fontFamily: 'JetBrains Mono',
          }}>
            <span style={{ fontSize: 18 }}>🎁</span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>Free Trial — 30 días automáticos</div>
              <div style={{ color: '#4b5563', fontSize: 11 }}>Sin tarjeta · Acceso directo · Se cancela automáticamente al vencer</div>
            </div>
          </div>
        )}
        {!esFree && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono', display: 'block', marginBottom: 6 }}>
              Duración (meses)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 3, 6, 12].map((m) => (
                <button key={m} onClick={() => setMeses(m)} style={{
                  flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${meses === m ? plan.color : '#2a3045'}`,
                  background: meses === m ? plan.colorBg : 'transparent',
                  color: meses === m ? plan.color : '#6b7280',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, transition: 'all .15s',
                }}>{m === 12 ? '1 año' : `${m} mes${m > 1 ? 'es' : ''}`}</button>
              ))}
            </div>
          </div>
        )}
        <div style={{ background: '#0d0f14', border: `1px solid ${plan.colorBorder}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Plan seleccionado</span>
            <span style={{ color: plan.color, fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{plan.emoji} {plan.nombre}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{esFree ? 'Prueba hasta' : 'Vence el'}</span>
            <span style={{ color: '#e8eaf0', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{formatFecha(calcFechaVenc())}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{esFree ? 'Costo' : 'Total a cobrar'}</span>
            {esFree ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#34d399', fontWeight: 700, fontFamily: 'JetBrains Mono', fontSize: 16 }}>$0.00</span>
                <span style={{ fontSize: 10, color: '#34d399', background: 'rgba(52,211,153,.15)', border: '1px solid rgba(52,211,153,.3)', borderRadius: 6, padding: '1px 6px', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>SIN TARJETA</span>
              </span>
            ) : (
              <span style={{ color: '#fbbf24', fontWeight: 700, fontFamily: 'JetBrains Mono', fontSize: 16 }}>${(plan.precio * meses).toFixed(2)} MXN</span>
            )}
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: '#4b5563', fontFamily: 'JetBrains Mono', marginBottom: 8 }}>LÍMITES DEL PLAN</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              ['Productos', plan.limites.productos],
              ['Usuarios', plan.limites.usuarios],
              ['Ventas/mes', plan.limites.ventas_mes],
              ['Gastos', plan.limites.gastos],
              ['Reportes', plan.limites.reportes],
              ['Abonos/créditos', plan.limites.abonos],
            ].map(([label, val]) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 10px', background: '#0d0f14', borderRadius: 7,
                border: '1px solid #1e2230', fontSize: 12,
              }}>
                <span style={{ color: '#6b7280' }}>{label}</span>
                <span style={{
                  color: val === false ? '#ef4444' : val === true || val === -1 ? '#34d399' : '#e8eaf0',
                  fontFamily: 'JetBrains Mono', fontWeight: 600,
                }}>{limiteLabel(val)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn green"
            onClick={() => onGuardar({ plan: planSel, fechaVencimiento: calcFechaVenc(), meses })}
            style={{ background: plan.colorBg, border: `1px solid ${plan.colorBorder}`, color: plan.color }}>
            {esFree ? '🎁 Activar prueba gratuita' : '✅ Confirmar Plan'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// MODAL NUEVA EMPRESA
// ══════════════════════════════════════════════════════
const ModalNuevaEmpresa = ({ onClose, onGuardar }) => {
  const [form, setForm] = useState({
    nombre: '', propietario: '', telefono: '', email: '', plan: 'FREE',
  });
  const [usuario, setUsuario] = useState({ username: '', password: '', confirmar: '' });
  const [meses, setMeses] = useState(1);
  const [showPass, setShowPass] = useState(false);

  const plan = PLANES[form.plan];
  const esFree = form.plan === 'FREE';

  const calcFechaVenc = () => {
    const hoy = new Date();
    if (esFree) hoy.setDate(hoy.getDate() + 30);
    else hoy.setMonth(hoy.getMonth() + meses);
    return hoy.toISOString().split('T')[0];
  };

  const handleCrear = () => {
    if (!form.nombre.trim()) return alert('El nombre de la empresa es requerido');
    if (!usuario.username.trim()) return alert('El usuario es requerido');
    if (usuario.password.length < 6) return alert('La contraseña debe tener al menos 6 caracteres');
    if (usuario.password !== usuario.confirmar) return alert('Las contraseñas no coinciden');
    onGuardar({ ...form, fechaVencimiento: calcFechaVenc(), adminUser: usuario.username, adminPass: usuario.password });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* ✅ maxHeight + overflowY en el modal-box para scroll completo */}
      <div className="modal-box" style={{ maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">🏢 Nueva Empresa</div>

        {/* ── SECCIÓN 1: Datos de la empresa ── */}
        <div style={{ fontSize: 10, color: '#4b5563', fontFamily: 'JetBrains Mono', letterSpacing: 1, marginBottom: 10 }}>
          DATOS DE LA EMPRESA
        </div>
        {[
          ['Nombre de la empresa *', 'nombre', 'text', 'Ej: Ferretería García'],
          ['Propietario / Contacto', 'propietario', 'text', 'Ej: Carlos García'],
          ['Teléfono', 'telefono', 'tel', '449-000-0000'],
          ['Email', 'email', 'email', 'contacto@empresa.com'],
        ].map(([label, key, type, ph]) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono', display: 'block', marginBottom: 4 }}>
              {label}
            </label>
            <input
              className="inp" style={{ width: '100%' }} type={type} placeholder={ph}
              value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </div>
        ))}

        {/* ── SECCIÓN 2: Usuario administrador ── */}
        <div style={{
          fontSize: 10, color: '#a78bfa', fontFamily: 'JetBrains Mono',
          letterSpacing: 1, marginTop: 18, marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>👤 USUARIO ADMINISTRADOR</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(167,139,250,.2)' }} />
        </div>
        <div style={{ background: 'rgba(167,139,250,.06)', border: '1px solid rgba(167,139,250,.2)', borderRadius: 10, padding: '14px', marginBottom: 14 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono', display: 'block', marginBottom: 4 }}>Usuario *</label>
            <input className="inp" style={{ width: '100%' }} type="text" placeholder="Ej: admin_garcia"
              value={usuario.username}
              onChange={(e) => setUsuario({ ...usuario, username: e.target.value.toLowerCase().replace(/\s/g, '') })} />
            <div style={{ fontSize: 10, color: '#4b5563', marginTop: 4, fontFamily: 'JetBrains Mono' }}>Solo letras, números y guiones bajos</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono', display: 'block', marginBottom: 4 }}>
              Contraseña * (mínimo 6 caracteres)
            </label>
            <div style={{ position: 'relative' }}>
              <input className="inp" style={{ width: '100%', paddingRight: 40 }}
                type={showPass ? 'text' : 'password'} placeholder="••••••••"
                value={usuario.password}
                onChange={(e) => setUsuario({ ...usuario, password: e.target.value })} />
              <button onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#6b7280',
              }}>{showPass ? '🙈' : '👁️'}</button>
            </div>
            {usuario.password && (
              <div style={{ marginTop: 6, display: 'flex', gap: 4, alignItems: 'center' }}>
                {[
                  { ok: usuario.password.length >= 6, label: '6+ chars' },
                  { ok: /[A-Z]/.test(usuario.password), label: 'Mayúscula' },
                  { ok: /[0-9]/.test(usuario.password), label: 'Número' },
                  { ok: /[^A-Za-z0-9]/.test(usuario.password), label: 'Símbolo' },
                ].map(({ ok, label }) => (
                  <span key={label} style={{
                    fontSize: 9, padding: '2px 6px', borderRadius: 4, fontFamily: 'JetBrains Mono',
                    background: ok ? 'rgba(52,211,153,.15)' : '#1e2230',
                    color: ok ? '#34d399' : '#4b5563',
                    border: `1px solid ${ok ? 'rgba(52,211,153,.3)' : '#2a3045'}`,
                  }}>{ok ? '✓' : '·'} {label}</span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono', display: 'block', marginBottom: 4 }}>Confirmar contraseña *</label>
            <input className="inp" style={{
              width: '100%',
              borderColor: usuario.confirmar && usuario.confirmar !== usuario.password ? 'rgba(239,68,68,.5)' : undefined,
            }}
              type={showPass ? 'text' : 'password'} placeholder="••••••••"
              value={usuario.confirmar}
              onChange={(e) => setUsuario({ ...usuario, confirmar: e.target.value })} />
            {usuario.confirmar && usuario.confirmar !== usuario.password && (
              <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4, fontFamily: 'JetBrains Mono' }}>⚠️ Las contraseñas no coinciden</div>
            )}
            {usuario.confirmar && usuario.confirmar === usuario.password && (
              <div style={{ fontSize: 10, color: '#34d399', marginTop: 4, fontFamily: 'JetBrains Mono' }}>✓ Contraseñas coinciden</div>
            )}
          </div>
        </div>

        {/* ── SECCIÓN 3: Plan ── */}
        <div style={{ fontSize: 10, color: '#4b5563', fontFamily: 'JetBrains Mono', letterSpacing: 1, marginBottom: 10 }}>PLAN INICIAL</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
          {Object.values(PLANES).map((p) => (
            <button key={p.id} onClick={() => setForm({ ...form, plan: p.id })} style={{
              padding: '10px 6px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
              border: `2px solid ${form.plan === p.id ? p.color : '#2a3045'}`,
              background: form.plan === p.id ? p.colorBg : 'transparent', transition: 'all .15s',
            }}>
              <div style={{ fontSize: 16 }}>{p.emoji}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: form.plan === p.id ? p.color : '#6b7280', marginTop: 3 }}>{p.nombre}</div>
            </button>
          ))}
        </div>

        {esFree ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 14,
            background: 'rgba(52,211,153,.08)', border: '1px solid rgba(52,211,153,.25)', borderRadius: 10,
            fontSize: 12, color: '#34d399', fontFamily: 'JetBrains Mono',
          }}>
            <span style={{ fontSize: 18 }}>🎁</span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>Free Trial — 30 días automáticos</div>
              <div style={{ color: '#4b5563', fontSize: 11 }}>Sin tarjeta · Acceso directo</div>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono', display: 'block', marginBottom: 6 }}>Duración</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 3, 6, 12].map((m) => (
                <button key={m} onClick={() => setMeses(m)} style={{
                  flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${meses === m ? plan.color : '#2a3045'}`,
                  background: meses === m ? plan.colorBg : 'transparent',
                  color: meses === m ? plan.color : '#6b7280',
                  fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, transition: 'all .15s',
                }}>{m === 12 ? '1 año' : `${m} mes${m > 1 ? 'es' : ''}`}</button>
              ))}
            </div>
          </div>
        )}

        {/* Resumen */}
        <div style={{ background: '#0d0f14', border: `1px solid ${plan.colorBorder}`, borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Plan</span>
            <span style={{ color: plan.color, fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{plan.emoji} {plan.nombre}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Vence el</span>
            <span style={{ color: '#e8eaf0', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{formatFecha(calcFechaVenc())}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Admin</span>
            <span style={{ color: '#a78bfa', fontFamily: 'JetBrains Mono', fontSize: 12 }}>👤 {usuario.username || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Total</span>
            <span style={{ color: esFree ? '#34d399' : '#fbbf24', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
              {esFree ? '$0.00 — GRATIS' : `$${(plan.precio * meses).toFixed(2)} MXN`}
            </span>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn green"
            style={{ background: plan.colorBg, border: `1px solid ${plan.colorBorder}`, color: plan.color }}
            onClick={handleCrear}>
            🏢 Crear Empresa
          </button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// CARD DE EMPRESA
// ══════════════════════════════════════════════════════
const EmpresaCard = ({ empresa, onPlan, onToggle, onEliminar, onRenovar, seleccionada, onSeleccionar }) => {
  const plan = PLANES[empresa.plan] || PLANES.FREE;
  const dias = diasRestantes(empresa.fechaVencimiento);
  const vencida = dias !== null && dias < 0;

  return (
    <div onClick={() => onSeleccionar(empresa.id)} style={{
      background: seleccionada ? plan.colorBg : '#0d0f14',
      border: `1.5px solid ${seleccionada ? plan.color : vencida ? 'rgba(239,68,68,.3)' : '#1e2230'}`,
      borderRadius: 14, padding: '18px 20px', cursor: 'pointer',
      transition: 'all .2s', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${plan.color}, transparent)`,
        opacity: seleccionada ? 1 : 0.4,
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 8, background: '#1e2230', color: '#4b5563',
            }}>ID #{empresa.id}</span>
            <StatusBadge empresa={empresa} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#e8eaf0', marginTop: 6 }}>{empresa.nombre}</div>
          {empresa.propietario && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>👤 {empresa.propietario}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: plan.color,
            background: plan.colorBg, border: `1px solid ${plan.colorBorder}`,
            borderRadius: 8, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>{plan.emoji} {plan.nombre}</div>
          <div style={{ fontSize: 11, color: '#4b5563', fontFamily: 'JetBrains Mono', marginTop: 5 }}>
            {plan.precio === 0 ? 'Gratis' : `$${plan.precio}/mes`}
          </div>
        </div>
      </div>
      {empresa.fechaVencimiento && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
          padding: '6px 10px', borderRadius: 8,
          background: vencida ? 'rgba(239,68,68,.08)' : dias <= 5 ? 'rgba(251,191,36,.08)' : '#1e2230',
          border: `1px solid ${vencida ? 'rgba(239,68,68,.2)' : dias <= 5 ? 'rgba(251,191,36,.2)' : '#2a3045'}`,
        }}>
          <span style={{ fontSize: 13 }}>{vencida ? '🔴' : dias <= 5 ? '⚠️' : '📅'}</span>
          <span style={{ fontSize: 12, color: vencida ? '#ef4444' : dias <= 5 ? '#fbbf24' : '#6b7280', fontFamily: 'JetBrains Mono' }}>
            {vencida ? `Venció hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}` : `Vence: ${formatFecha(empresa.fechaVencimiento)} (${dias}d)`}
          </span>
          {vencida && (
            <button onClick={(e) => { e.stopPropagation(); onRenovar(empresa); }} style={{
              marginLeft: 'auto', fontSize: 11, color: '#4f9eff',
              background: 'rgba(79,158,255,.12)', border: '1px solid rgba(79,158,255,.3)',
              borderRadius: 12, padding: '2px 10px', cursor: 'pointer', fontWeight: 700,
            }}>Renovar →</button>
          )}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {[
          ['📦', plan.limites.productos === -1 ? '∞ prod.' : `${plan.limites.productos} prod.`],
          ['👤', plan.limites.usuarios === -1 ? '∞ users' : `${plan.limites.usuarios} users`],
          ['🛒', plan.limites.ventas_mes === -1 ? '∞ ventas' : `${plan.limites.ventas_mes} ventas/mes`],
          ['💳', plan.limites.abonos ? 'Abonos ✓' : 'Sin abonos'],
          ['📈', plan.limites.reportes ? 'Reportes ✓' : 'Sin reportes'],
        ].map(([icon, text], i) => (
          <span key={i} style={{
            fontSize: 10, color: '#4b5563', fontFamily: 'JetBrains Mono',
            background: '#1e2230', border: '1px solid #2a3045', borderRadius: 6, padding: '2px 8px',
          }}>{icon} {text}</span>
        ))}
      </div>
      {(empresa.telefono || empresa.email) && (
        <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 12, display: 'flex', gap: 12 }}>
          {empresa.telefono && <span>📞 {empresa.telefono}</span>}
          {empresa.email && <span>✉️ {empresa.email}</span>}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
        <button className="btn blue" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => onPlan(empresa)}>📦 Plan</button>
        <button onClick={() => onToggle(empresa)} style={{
          padding: '6px 14px', fontSize: 12, borderRadius: 8, cursor: 'pointer', fontWeight: 600,
          border: `1px solid ${empresa.activo !== false ? 'rgba(251,191,36,.4)' : 'rgba(34,197,94,.4)'}`,
          background: empresa.activo !== false ? 'rgba(251,191,36,.1)' : 'rgba(34,197,94,.1)',
          color: empresa.activo !== false ? '#fbbf24' : '#22c55e',
        }}>{empresa.activo !== false ? '🔒 Desactivar' : '🔓 Activar'}</button>
        <button className="btn red" style={{ padding: '6px 14px', fontSize: 12, background: '#ef4444', color: '#fff' }}
          onClick={() => onEliminar(empresa)}>🗑️</button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════
const Empresas = () => {
  const navigate = useNavigate();
  const matricula = localStorage.getItem('usuarioLogueado') || '';
  const esriempy = matricula === 'riempy';

  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroPlan, setFiltroPlan] = useState('TODOS');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [seleccionada, setSeleccionada] = useState(null);
  const [modalPlan, setModalPlan] = useState(null);
  const [modalNueva, setModalNueva] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(null);

  useEffect(() => {
    if (!esriempy) {
      alert('⛔ Acceso denegado. Solo riempy puede acceder a esta sección.');
      navigate('/inventario');
      return;
    }
    cargarEmpresas();
  }, []);

  const cargarEmpresas = useCallback(async () => {
    setCargando(true);
    try {
      const r = await fetch('/api/empresas', { headers: authHeaders() });
      if (r.status === 401) { navigate('/'); return; }
      if (!r.ok) throw new Error('Error al obtener empresas');
      const data = await r.json();
      setEmpresas(Array.isArray(data) ? data.map(e => ({
        ...e, plan: e.plan || 'FREE', activo: e.activo !== false,
      })) : []);
    } catch (err) {
      console.error(err);
      setEmpresas([
        { id: 1, nombre: 'Isla Tecnológica', propietario: 'riempy', telefono: '449-540-5568', email: 'riempy@isla.mx', plan: 'ENTERPRISE', fechaVencimiento: '2026-12-31', activo: true },
        { id: 2, nombre: 'Ferretería García', propietario: 'Carlos García', telefono: '449-111-2222', email: 'garcia@gmail.com', plan: 'BASIC', fechaVencimiento: '2026-05-10', activo: true },
        { id: 3, nombre: 'Papelería López', propietario: 'Ana López', telefono: '449-333-4444', email: '', plan: 'FREE', fechaVencimiento: null, activo: true },
        { id: 4, nombre: 'Zapatería Estilo', propietario: 'Roberto Martínez', telefono: '', email: 'estilo@zap.com', plan: 'PRO', fechaVencimiento: '2026-04-20', activo: true },
        { id: 5, nombre: 'Tienda Sin Pagar', propietario: 'Juan Mora', telefono: '', email: '', plan: 'BASIC', fechaVencimiento: '2026-04-01', activo: false },
      ]);
    } finally {
      setCargando(false);
    }
  }, [navigate]);

  const verificarVencimientos = useCallback(() => {
    setEmpresas(prev => prev.map(e => {
      const dias = diasRestantes(e.fechaVencimiento);
      if (dias !== null && dias < 0 && e.activo) return { ...e, activo: false };
      return e;
    }));
  }, []);

  useEffect(() => {
    verificarVencimientos();
    const interval = setInterval(verificarVencimientos, 60000);
    return () => clearInterval(interval);
  }, [verificarVencimientos]);

  const handleToggle = async (empresa) => {
    const nuevo = empresa.activo === false ? true : false;
    try {
      await fetch(`/api/empresas/${empresa.id}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ ...empresa, activo: nuevo }),
      });
      const rUsuarios = await fetch('/api/usuarios', { headers: authHeaders() });
      if (rUsuarios.ok) {
        const todosUsuarios = await rUsuarios.json();
        const usuariosEmpresa = todosUsuarios.filter(
          u => u.empresa?.id === empresa.id || u.empresaId === empresa.id
        );
        await Promise.all(
          usuariosEmpresa.map(u =>
            fetch(`/api/usuarios/${u.id}/bloquear`, {
              method: 'PUT', headers: authHeaders(),
              body: JSON.stringify({ bloqueado: !nuevo }),
            })
          )
        );
      }
    } catch (err) {
      alert('❌ Error al cambiar el estado de la empresa');
      return;
    }
    setEmpresas(prev => prev.map(e => e.id === empresa.id ? { ...e, activo: nuevo } : e));
    const accion = nuevo ? 'activada y sus usuarios desbloqueados' : 'desactivada y sus usuarios bloqueados';
    alert(`✅ Empresa "${empresa.nombre}" ${accion}`);
  };

  const handleEliminar = async () => {
    try {
      await fetch(`/api/empresas/${modalEliminar.id}`, { method: 'DELETE', headers: authHeaders() });
    } catch {}
    setEmpresas(prev => prev.filter(e => e.id !== modalEliminar.id));
    setModalEliminar(null);
    if (seleccionada === modalEliminar.id) setSeleccionada(null);
  };

  const handleGuardarPlan = async ({ plan, fechaVencimiento }) => {
    const emp = { ...modalPlan, plan, fechaVencimiento, activo: true };
    try {
      await fetch(`/api/empresas/${emp.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(emp) });
    } catch {}
    setEmpresas(prev => prev.map(e => e.id === emp.id ? emp : e));
    setModalPlan(null);
    alert(`✅ Plan ${PLANES[plan].nombre} asignado a "${modalPlan.nombre}" hasta ${formatFecha(fechaVencimiento)}`);
  };

  const handleCrearEmpresa = async (form) => {
    try {
      const r = await fetch('/api/empresas', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({
          nombre: form.nombre, propietario: form.propietario,
          telefono: form.telefono, email: form.email,
          plan: form.plan, activo: true,
          fechaVencimiento: form.fechaVencimiento,
          adminUser: form.adminUser, adminPass: form.adminPass,
        }),
      });
      if (r.ok) {
        const nueva = await r.json();
        setEmpresas(prev => [...prev, { ...nueva, plan: form.plan, activo: true }]);
      } else {
        const id = Math.max(...empresas.map(e => e.id), 0) + 1;
        setEmpresas(prev => [...prev, { id, ...form, activo: true }]);
      }
    } catch {
      const id = Math.max(...empresas.map(e => e.id), 0) + 1;
      setEmpresas(prev => [...prev, { id, ...form, activo: true }]);
    }
    setModalNueva(false);
    alert(`✅ Empresa "${form.nombre}" creada con usuario "${form.adminUser}"`);
  };

  const empresasFiltradas = empresas.filter(e => {
    const matchText =
      e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (e.propietario || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      String(e.id).includes(busqueda);
    const matchPlan = filtroPlan === 'TODOS' || e.plan === filtroPlan;
    const dias = diasRestantes(e.fechaVencimiento);
    const matchEstado =
      filtroEstado === 'TODOS' ? true :
      filtroEstado === 'ACTIVA' ? e.activo !== false && (dias === null || dias >= 0) :
      filtroEstado === 'VENCIDA' ? (dias !== null && dias < 0) :
      filtroEstado === 'INACTIVA' ? e.activo === false :
      filtroEstado === 'POR_VENCER' ? (dias !== null && dias >= 0 && dias <= 7) : true;
    return matchText && matchPlan && matchEstado;
  });

  const statsPlanes = Object.fromEntries(Object.keys(PLANES).map(k => [k, empresas.filter(e => e.plan === k).length]));
  const totalActivas = empresas.filter(e => e.activo !== false && (diasRestantes(e.fechaVencimiento) ?? 1) >= 0).length;
  const totalVencidas = empresas.filter(e => { const d = diasRestantes(e.fechaVencimiento); return d !== null && d < 0; }).length;
  const totalPorVencer = empresas.filter(e => { const d = diasRestantes(e.fechaVencimiento); return d !== null && d >= 0 && d <= 7; }).length;
  const mrr = empresas.filter(e => e.activo !== false).reduce((s, e) => s + (PLANES[e.plan]?.precio || 0), 0);
  const empresaSel = empresas.find(e => e.id === seleccionada);

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sb-logo">
            <img src="/logo.png" alt="logo" />
            <div className="sb-logo-text">
              <div className="sb-logo-name">Puerto Central</div>
              <div className="sb-logo-sub">Admin Global</div>
            </div>
          </div>
          <div className="sb-user">
            <div className="sb-avatar admin">R</div>
            <div className="sb-user-info">
              <div className="sb-user-name">riempy</div>
              <div className="sb-user-role">⭐ Super Admin</div>
            </div>
          </div>
          <nav className="sb-nav">
            <button className="sb-item" onClick={() => navigate('/inventario')} title="Volver">
              <span className="sb-icon">◀</span><span className="sb-label">Inventario</span>
            </button>
            <button className="sb-item active">
              <span className="sb-icon">🏢</span><span className="sb-label">Empresas</span>
            </button>
            <button className="sb-item" onClick={() => navigate('/abonos')}>
              <span className="sb-icon">💳</span><span className="sb-label">Abonos</span>
            </button>
          </nav>
        </aside>

        <main className="main-content">
          <div className="topbar">
            <div className="topbar-title"><span>Empresas</span> — Panel de Administración</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{
                fontSize: 11, color: '#a78bfa', fontFamily: 'JetBrains Mono',
                background: 'rgba(167,139,250,.1)', border: '1px solid rgba(167,139,250,.25)',
                borderRadius: 16, padding: '4px 12px',
              }}>⭐ riempy · Super Admin</span>
              <button className="btn ghost" style={{ fontSize: 12, padding: '7px 14px' }} onClick={cargarEmpresas}>🔄 Actualizar</button>
              <button className="btn green" style={{ fontSize: 12, padding: '8px 16px' }} onClick={() => setModalNueva(true)}>➕ Nueva Empresa</button>
            </div>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: 20 }}>
            <div className="stat-card"><div className="stat-label">Total Empresas</div><div className="stat-val c-blue">{empresas.length}</div></div>
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFiltroEstado('ACTIVA')}>
              <div className="stat-label">Activas</div><div className="stat-val" style={{ color: '#22c55e' }}>{totalActivas}</div>
            </div>
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFiltroEstado('VENCIDA')}>
              <div className="stat-label">Vencidas</div><div className="stat-val" style={{ color: '#ef4444' }}>{totalVencidas}</div>
            </div>
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFiltroEstado('POR_VENCER')}>
              <div className="stat-label">Por vencer (7d)</div><div className="stat-val" style={{ color: '#fbbf24' }}>{totalPorVencer}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">MRR Estimado</div>
              <div className="stat-val" style={{ color: '#34d399' }}>${mrr.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: '#4b5563', fontFamily: 'JetBrains Mono', marginTop: 2 }}>/mes</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">ARR Estimado</div>
              <div className="stat-val" style={{ color: '#a78bfa' }}>${(mrr * 12).toLocaleString()}</div>
              <div style={{ fontSize: 10, color: '#4b5563', fontFamily: 'JetBrains Mono', marginTop: 2 }}>/año</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {Object.values(PLANES).map((p) => (
              <div key={p.id} style={{
                flex: 1, minWidth: 120, padding: '12px 16px', borderRadius: 10,
                background: p.colorBg, border: `1px solid ${p.colorBorder}`,
                cursor: 'pointer', transition: 'all .15s',
                outline: filtroPlan === p.id ? `2px solid ${p.color}` : 'none',
              }} onClick={() => setFiltroPlan(filtroPlan === p.id ? 'TODOS' : p.id)}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{p.emoji}</div>
                <div style={{ fontWeight: 700, color: p.color, fontSize: 22, fontFamily: 'JetBrains Mono' }}>{statsPlanes[p.id] || 0}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{p.nombre}</div>
                <div style={{ fontSize: 11, color: '#4b5563', fontFamily: 'JetBrains Mono' }}>
                  {p.id === 'FREE' ? '🎁 30 días · Sin tarjeta' : p.precio === 0 ? 'Gratis' : `$${p.precio}/mes`}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-wrap" style={{ marginBottom: 0, flex: 1, maxWidth: 320 }}>
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Buscar por nombre, propietario o ID..."
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { val: 'TODOS', label: 'Todas' },
                { val: 'ACTIVA', label: '✅ Activas', color: '#22c55e' },
                { val: 'VENCIDA', label: '🔴 Vencidas', color: '#ef4444' },
                { val: 'POR_VENCER', label: '⚠️ Por vencer', color: '#fbbf24' },
                { val: 'INACTIVA', label: '⚫ Inactivas', color: '#6b7280' },
              ].map(f => (
                <button key={f.val} onClick={() => setFiltroEstado(f.val)} style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
                  border: `1px solid ${filtroEstado === f.val ? (f.color || '#4f9eff') : '#2a3045'}`,
                  background: filtroEstado === f.val ? `${f.color || '#4f9eff'}22` : 'transparent',
                  color: filtroEstado === f.val ? (f.color || '#4f9eff') : '#6b7280',
                  transition: 'all .15s',
                }}>{f.label}</button>
              ))}
            </div>
            <span style={{ fontSize: 12, color: '#4b5563', marginLeft: 'auto' }}>
              {empresasFiltradas.length} empresa{empresasFiltradas.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: seleccionada ? '1fr 360px' : '1fr', gap: 16 }}>
            <div>
              {cargando ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#4b5563', fontSize: 14 }}>⏳ Cargando empresas...</div>
              ) : empresasFiltradas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#374151', fontSize: 14 }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🏢</div>Sin resultados
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                  {empresasFiltradas.map(e => (
                    <EmpresaCard key={e.id} empresa={e}
                      seleccionada={seleccionada === e.id}
                      onSeleccionar={(id) => setSeleccionada(prev => prev === id ? null : id)}
                      onPlan={setModalPlan}
                      onToggle={handleToggle}
                      onEliminar={setModalEliminar}
                      onRenovar={setModalPlan}
                    />
                  ))}
                </div>
              )}
            </div>

            {seleccionada && empresaSel && (() => {
              const plan = PLANES[empresaSel.plan] || PLANES.FREE;
              const dias = diasRestantes(empresaSel.fechaVencimiento);
              return (
                <div style={{
                  background: '#0d0f14', border: `1.5px solid ${plan.colorBorder}`,
                  borderRadius: 14, padding: '20px', position: 'sticky', top: 20, height: 'fit-content',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#e8eaf0' }}>Detalle Empresa</div>
                    <button onClick={() => setSeleccionada(null)}
                      style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 16 }}>✕</button>
                  </div>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{
                      width: 60, height: 60, borderRadius: '50%', margin: '0 auto 10px',
                      background: plan.colorBg, border: `2px solid ${plan.colorBorder}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                    }}>{plan.emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: '#e8eaf0' }}>{empresaSel.nombre}</div>
                    <div style={{ fontSize: 12, color: plan.color, fontWeight: 700, marginTop: 4 }}>Plan {plan.nombre}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {[
                      ['🆔 ID', `#${empresaSel.id}`],
                      ['👤 Propietario', empresaSel.propietario || '—'],
                      ['📞 Teléfono', empresaSel.telefono || '—'],
                      ['✉️ Email', empresaSel.email || '—'],
                      ['📅 Vencimiento', formatFecha(empresaSel.fechaVencimiento)],
                      ['⏱️ Días restantes', dias === null ? '—' : dias < 0 ? `Venció hace ${Math.abs(dias)}d` : `${dias} días`],
                      ['💰 Precio', plan.precio === 0 ? 'Gratis' : `$${plan.precio}/mes`],
                    ].map(([label, val]) => (
                      <div key={label} style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '7px 10px', background: '#1e2230', borderRadius: 8, fontSize: 12,
                      }}>
                        <span style={{ color: '#6b7280' }}>{label}</span>
                        <span style={{ color: '#e8eaf0', fontFamily: 'JetBrains Mono', fontWeight: 600, maxWidth: 160, textAlign: 'right', wordBreak: 'break-all' }}>{val}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: '#4b5563', fontFamily: 'JetBrains Mono', marginBottom: 8 }}>LÍMITES ACTUALES</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 16 }}>
                    {[
                      ['📦 Productos', plan.limites.productos],
                      ['👥 Usuarios', plan.limites.usuarios],
                      ['🛒 Ventas/mes', plan.limites.ventas_mes],
                      ['🧾 Gastos', plan.limites.gastos],
                      ['📈 Reportes', plan.limites.reportes],
                      ['💳 Abonos', plan.limites.abonos],
                    ].map(([label, val]) => (
                      <div key={label} style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '6px 10px', background: '#1e2230', borderRadius: 8, fontSize: 11,
                      }}>
                        <span style={{ color: '#6b7280' }}>{label}</span>
                        <span style={{
                          fontFamily: 'JetBrains Mono', fontWeight: 700,
                          color: val === false ? '#ef4444' : val === true || val === -1 ? '#34d399' : '#e8eaf0',
                        }}>{limiteLabel(val)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="btn blue" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                      onClick={() => setModalPlan(empresaSel)}>📦 Cambiar / Renovar Plan</button>
                    <button onClick={() => handleToggle(empresaSel)} style={{
                      width: '100%', padding: '10px', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
                      border: `1px solid ${empresaSel.activo !== false ? 'rgba(251,191,36,.4)' : 'rgba(34,197,94,.4)'}`,
                      background: empresaSel.activo !== false ? 'rgba(251,191,36,.1)' : 'rgba(34,197,94,.1)',
                      color: empresaSel.activo !== false ? '#fbbf24' : '#22c55e', fontSize: 13,
                    }}>{empresaSel.activo !== false ? '🔒 Desactivar empresa' : '🔓 Activar empresa'}</button>
                    <button className="btn red"
                      style={{ width: '100%', justifyContent: 'center', padding: '10px', background: '#ef4444', color: '#fff' }}
                      onClick={() => setModalEliminar(empresaSel)}>🗑️ Eliminar empresa</button>
                  </div>
                </div>
              );
            })()}
          </div>
        </main>
      </div>

      {modalPlan && (
        <ModalPlan empresa={modalPlan} onClose={() => setModalPlan(null)} onGuardar={handleGuardarPlan} />
      )}

      {modalNueva && (
        <ModalNuevaEmpresa onClose={() => setModalNueva(false)} onGuardar={handleCrearEmpresa} />
      )}

      {modalEliminar && (
        <div className="modal-overlay" onClick={() => setModalEliminar(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">🗑️ Eliminar Empresa</div>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16, lineHeight: 1.6 }}>
              ¿Confirmas que deseas eliminar la empresa <strong style={{ color: '#e8eaf0' }}>"{modalEliminar.nombre}"</strong>? Esta acción no se puede deshacer y eliminará todos sus datos.
            </p>
            <div style={{ background: '#0d0f14', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#ef4444' }}>⚠️ Esta acción es permanente</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>
                ID: #{modalEliminar.id} · Plan: {PLANES[modalEliminar.plan]?.nombre || 'FREE'} · Propietario: {modalEliminar.propietario || '—'}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setModalEliminar(null)}>Cancelar</button>
              <button className="btn red" style={{ background: '#ef4444', color: '#fff', fontWeight: 700 }}
                onClick={handleEliminar}>🗑️ Sí, eliminar empresa</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Empresas;