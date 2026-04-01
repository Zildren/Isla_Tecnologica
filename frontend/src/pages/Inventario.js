import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerProductos, guardarProducto, eliminarProducto as deleteProducto } from '../services/productoService';
import { obtenerVentas, registrarVenta, eliminarVenta as deleteVenta } from '../services/ventaService';
import { obtenerGastos, registrarGasto, actualizarGasto, eliminarGasto as deleteGasto } from '../services/gastoService';
import './Inventario.css';

// ═══════════════════════════════════════════
// GRÁFICA DE ÁREA SVG
// ═══════════════════════════════════════════
const AreaChartSVG = ({ data }) => {
  const [tooltip, setTooltip] = useState(null);
  const W = 500, H = 180, padL = 52, padR = 12, padT = 10, padB = 28;
  const iW = W - padL - padR;
  const iH = H - padT - padB;
  const maxVal = Math.max(...data.map(d => Math.max(d.ingresos, d.ganancia)), 1);
  const yTicks = 4;
  const toX = i => padL + (i / (data.length - 1 || 1)) * iW;
  const toY = v => padT + iH - (v / maxVal) * iH;
  const pathD = (key) => data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d[key]).toFixed(1)}`).join(' ');
  const areaD = (key) => `${pathD(key)} L${toX(data.length-1).toFixed(1)},${(padT+iH).toFixed(1)} L${padL},${(padT+iH).toFixed(1)} Z`;
  const xLabels = data.filter((_, i) => i === 0 || (i + 1) % 5 === 0 || i === data.length - 1);

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f9eff" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#4f9eff" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#34d399" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const y = padT + (i / yTicks) * iH;
          const val = maxVal - (i / yTicks) * maxVal;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#1e2230" strokeWidth="1"/>
              <text x={padL - 6} y={y + 4} textAnchor="end" fill="#4b5563" fontSize="10" fontFamily="JetBrains Mono, monospace">
                ${val >= 1000 ? (val/1000).toFixed(1)+'k' : val.toFixed(0)}
              </text>
            </g>
          );
        })}
        <path d={areaD('ingresos')} fill="url(#gI)"/>
        <path d={areaD('ganancia')} fill="url(#gG)"/>
        <path d={pathD('ingresos')} fill="none" stroke="#4f9eff" strokeWidth="2" strokeLinejoin="round"/>
        <path d={pathD('ganancia')} fill="none" stroke="#34d399" strokeWidth="2" strokeLinejoin="round"/>
        {xLabels.map((d) => {
          const origIdx = data.indexOf(d);
          return (
            <text key={origIdx} x={toX(origIdx)} y={H - 6} textAnchor="middle" fill="#4b5563" fontSize="10" fontFamily="JetBrains Mono, monospace">
              {d.dia}
            </text>
          );
        })}
        {data.map((d, i) => (
          <rect key={i}
            x={toX(i) - iW / data.length / 2} y={padT}
            width={iW / data.length} height={iH}
            fill="transparent"
            onMouseEnter={() => setTooltip({ x: toX(i), y: Math.min(toY(d.ingresos), toY(d.ganancia)), d, i })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
        {tooltip && (
          <g>
            <line x1={tooltip.x} y1={padT} x2={tooltip.x} y2={padT + iH} stroke="#2a3045" strokeWidth="1" strokeDasharray="4 2"/>
            <circle cx={tooltip.x} cy={toY(tooltip.d.ingresos)} r="4" fill="#4f9eff"/>
            <circle cx={tooltip.x} cy={toY(tooltip.d.ganancia)} r="4" fill="#34d399"/>
          </g>
        )}
      </svg>
      {tooltip && (
        <div style={{ position:'absolute', top: 10, left: Math.min(tooltip.x * 0.72 + 10, 260), pointerEvents:'none',
          background:'#1a1d28', border:'1px solid #2a3045', borderRadius:8, padding:'10px 14px', fontSize:12, zIndex:10, whiteSpace:'nowrap' }}>
          <div style={{ color:'#6b7280', fontFamily:'JetBrains Mono', fontSize:10, marginBottom:6 }}>Día {tooltip.d.dia}</div>
          <div style={{ color:'#4f9eff', fontFamily:'JetBrains Mono', marginBottom:3 }}>Ingresos: <strong>${tooltip.d.ingresos.toFixed(2)}</strong></div>
          <div style={{ color:'#34d399', fontFamily:'JetBrains Mono' }}>Ganancia: <strong>${tooltip.d.ganancia.toFixed(2)}</strong></div>
        </div>
      )}
      <div style={{ display:'flex', gap:16, marginTop:8, paddingLeft:padL }}>
        <span style={{ fontSize:11, color:'#4f9eff', fontFamily:'JetBrains Mono', display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:12, height:2, background:'#4f9eff', display:'inline-block', borderRadius:2 }}/>Ingresos
        </span>
        <span style={{ fontSize:11, color:'#34d399', fontFamily:'JetBrains Mono', display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:12, height:2, background:'#34d399', display:'inline-block', borderRadius:2 }}/>Ganancia
        </span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// GRÁFICA DE BARRAS SVG
// ═══════════════════════════════════════════
const BarChartSVG = ({ data }) => {
  const [tooltip, setTooltip] = useState(null);
  const W = 500, H = 180, padL = 52, padR = 12, padT = 10, padB = 28;
  const iW = W - padL - padR;
  const iH = H - padT - padB;
  const maxVal = Math.max(...data.map(d => Math.max(d.ingresos, d.costo, d.ganancia)), 1);
  const yTicks = 4;
  const groupW = iW / data.length;
  const barW = Math.min(groupW * 0.22, 18);
  const colors = { ingresos: '#4f9eff', costo: '#f87171', ganancia: '#34d399' };
  const keys = ['ingresos', 'costo', 'ganancia'];
  const toY = v => padT + iH - (v / maxVal) * iH;
  const barH = v => Math.max((v / maxVal) * iH, 0);

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto', display:'block' }}>
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const y = padT + (i / yTicks) * iH;
          const val = maxVal - (i / yTicks) * maxVal;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#1e2230" strokeWidth="1"/>
              <text x={padL - 6} y={y + 4} textAnchor="end" fill="#4b5563" fontSize="10" fontFamily="JetBrains Mono, monospace">
                ${val >= 1000 ? (val/1000).toFixed(1)+'k' : val.toFixed(0)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const gx = padL + i * groupW + groupW / 2;
          const totalW = barW * 3 + 4;
          return (
            <g key={i}>
              {keys.map((k, ki) => {
                const bx = gx - totalW / 2 + ki * (barW + 2);
                const bh = barH(d[k]);
                const by = toY(d[k]);
                return (
                  <rect key={k} x={bx} y={by} width={barW} height={bh}
                    fill={colors[k]} rx="3" opacity={tooltip?.i === i ? 1 : 0.85}
                    onMouseEnter={() => setTooltip({ i, d, x: gx })}
                    onMouseLeave={() => setTooltip(null)}
                    style={{ cursor: 'pointer', transition: 'opacity .15s' }}
                  />
                );
              })}
              <text x={gx} y={H - 6} textAnchor="middle" fill="#4b5563" fontSize="10" fontFamily="JetBrains Mono, monospace">
                {d.mes}
              </text>
            </g>
          );
        })}
      </svg>
      {tooltip && (
        <div style={{ position:'absolute', top:10, left: Math.min(tooltip.x * 0.72, 270), pointerEvents:'none',
          background:'#1a1d28', border:'1px solid #2a3045', borderRadius:8, padding:'10px 14px', fontSize:12, zIndex:10, whiteSpace:'nowrap' }}>
          <div style={{ color:'#6b7280', fontFamily:'JetBrains Mono', fontSize:10, marginBottom:6 }}>{tooltip.d.mes}</div>
          <div style={{ color:'#4f9eff', fontFamily:'JetBrains Mono', marginBottom:3 }}>Ingresos: <strong>${tooltip.d.ingresos.toFixed(2)}</strong></div>
          <div style={{ color:'#f87171', fontFamily:'JetBrains Mono', marginBottom:3 }}>Costo: <strong>${tooltip.d.costo.toFixed(2)}</strong></div>
          <div style={{ color:'#34d399', fontFamily:'JetBrains Mono' }}>Ganancia: <strong>${tooltip.d.ganancia.toFixed(2)}</strong></div>
        </div>
      )}
      <div style={{ display:'flex', gap:16, marginTop:8, paddingLeft:padL }}>
        {[['#4f9eff','Ingresos'],['#f87171','Costo'],['#34d399','Ganancia']].map(([c,l]) => (
          <span key={l} style={{ fontSize:11, color:c, fontFamily:'JetBrains Mono', display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:10, height:10, background:c, display:'inline-block', borderRadius:2 }}/>{l}
          </span>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// SELECTOR DE CATEGORÍA CON AGREGAR CUSTOM
// ═══════════════════════════════════════════
const CATEGORIAS_DEFAULT = [
  'Otros',
];

const STORAGE_KEY_CATS = 'categorias_producto_v2';

const getCategorias = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CATS);
    if (stored) {
      const parsed = JSON.parse(stored);
      const all = [...CATEGORIAS_DEFAULT];
      parsed.forEach(c => { if (!all.includes(c)) all.push(c); });
      return all;
    }
  } catch {}
  return [...CATEGORIAS_DEFAULT];
};

const saveCategorias = (cats) => {
  const custom = cats.filter(c => !CATEGORIAS_DEFAULT.includes(c));
  localStorage.setItem(STORAGE_KEY_CATS, JSON.stringify(custom));
};

const CategoriaSelector = ({ value, onChange }) => {
  const [categorias, setCategorias] = useState(getCategorias);
  const [modo, setModo] = useState('select');
  const [nuevaCat, setNuevaCat] = useState('');
  const [error, setError] = useState('');

  const handleAgregar = () => {
    const trimmed = nuevaCat.trim();
    if (!trimmed) { setError('Escribe un nombre'); return; }
    if (categorias.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      setError('Esa categoría ya existe');
      return;
    }
    const updated = [...categorias, trimmed];
    setCategorias(updated);
    saveCategorias(updated);
    onChange(trimmed);
    setNuevaCat('');
    setError('');
    setModo('select');
  };

  const handleCancelar = () => {
    setModo('select');
    setNuevaCat('');
    setError('');
  };

  if (modo === 'nueva') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 220 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            className="inp"
            style={{ flex: 1, minWidth: 140, borderColor: error ? 'rgba(248,113,113,.6)' : undefined }}
            placeholder="Nombre de la categoría..."
            value={nuevaCat}
            autoFocus
            onChange={e => { setNuevaCat(e.target.value); setError(''); }}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); handleAgregar(); }
              if (e.key === 'Escape') handleCancelar();
            }}
          />
          <button
            type="button"
            title="Guardar categoría"
            onClick={handleAgregar}
            style={{
              width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(52,211,153,.5)',
              background: 'rgba(52,211,153,.15)', color: '#34d399', cursor: 'pointer',
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all .15s', fontWeight: 700,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(52,211,153,.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(52,211,153,.15)'; }}
          >✓</button>
          <button
            type="button"
            title="Cancelar"
            onClick={handleCancelar}
            style={{
              width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(248,113,113,.4)',
              background: 'rgba(248,113,113,.1)', color: '#f87171', cursor: 'pointer',
              fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,.1)'; }}
          >✕</button>
        </div>
        {error && (
          <span style={{ fontSize: 11, color: '#f87171', fontFamily: 'JetBrains Mono, monospace', paddingLeft: 2 }}>
            ⚠ {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 220 }}>
      <select
        className="inp"
        style={{ flex: 1, minWidth: 160 }}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
      >
        <option value="" disabled>— Categoría —</option>
        {categorias.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <button
        type="button"
        title="Agregar nueva categoría"
        onClick={() => setModo('nueva')}
        style={{
          width: 34, height: 34, borderRadius: 8, border: '1px solid #2a3045',
          background: 'rgba(79,158,255,.1)', color: '#4f9eff', cursor: 'pointer',
          fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'all .15s', fontWeight: 300, lineHeight: 1,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(79,158,255,.25)';
          e.currentTarget.style.borderColor = 'rgba(79,158,255,.5)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(79,158,255,.1)';
          e.currentTarget.style.borderColor = '#2a3045';
        }}
      >+</button>
    </div>
  );
};

const stockStatus = (stock, limit) => stock === 0 ? 'critical' : stock <= limit ? 'low' : 'ok';
const stockLabel  = { ok: '✅', low: '⚠️', critical: '🔴' };

const CATEGORIAS_GASTO = [
  'Operativo', 'Renta / Local', 'Servicios (luz, agua, internet)',
  'Transporte / Envíos', 'Salarios', 'Compra de mercancía',
  'Marketing / Publicidad', 'Mantenimiento', 'Equipo / Herramientas', 'Otros',
];

const PROD_VACIO = { codigo:'', nombre:'', stock:0, precioCompra:0, precioVenta:0, categoria:'', imagen:'' };

// ═══════════════════════════════════════════
// HELPER JWT
// ═══════════════════════════════════════════
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

const Inventario = () => {
  const navigate = useNavigate();

  // ── Inventario ──
  const [productos, setProductos]   = useState([]);
  const [busqueda, setBusqueda]     = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [nuevoProd, setNuevoProd]   = useState(PROD_VACIO);
  const [editandoStockId, setEditandoStockId] = useState(null);
  const [nuevoStock, setNuevoStock]           = useState('');
  const [limiteStock, setLimiteStock] = useState(() => parseInt(localStorage.getItem('limiteStock') || '5'));
  const [modalLimite, setModalLimite] = useState(false);
  const [limiteTemp, setLimiteTemp]   = useState('');
  const [modalAgregarStock, setModalAgregarStock] = useState(null);
  const [cantidadAgregar, setCantidadAgregar]     = useState('');

  // ── Catálogo ──
  const [busquedaCatalogo, setBusquedaCatalogo] = useState('');
  const [filtroCat, setFiltroCat]               = useState('Todas');
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);

  // ── Reportes ──
  const [todasLasVentas, setTodasLasVentas] = useState([]);
  const [filtro, setFiltro]                = useState('dia');
  const [busquedaFecha, setBusquedaFecha]  = useState(new Date().toISOString().split('T')[0]);
  const [textoBusqueda, setTextoBusqueda]  = useState('');
  const [modalConfirmarEliminar, setModalConfirmarEliminar] = useState(null);

  // ── Stock General ──
  const [busquedaStock, setBusquedaStock]   = useState('');
  const [filtroEstStock, setFiltroEstStock] = useState('todos');
  const [generandoPDF, setGenerandoPDF]     = useState(false);

  // ── Ventas ──
  const [busquedaVenta, setBusquedaVenta] = useState('');
  const [seleccion, setSeleccion]   = useState({ productoId:'', codigo:'', nombre:'', precio:0, cantidad:1, stockDisponible:0 });
  const [listaVenta, setListaVenta] = useState([]);
  const [pago, setPago]             = useState({ efectivo:0, cambio:0 });
  const [ventaExitosa, setVentaExitosa] = useState(null);

  // ── Usuarios ──
  const [usuarios, setUsuarios]         = useState([]);
  const [formUser, setFormUser]         = useState({ matricula:'', password:'', rol:'VENDEDOR' });
  const [cargandoUser, setCargandoUser] = useState(false);

  // ── Gastos ──
  const [gastos, setGastos] = useState([]);
  const [nuevoGasto, setNuevoGasto] = useState({
    descripcion: '', monto: '', categoria: 'Operativo',
    fecha: new Date().toISOString().split('T')[0],
  });
  const [busquedaGasto, setBusquedaGasto]           = useState('');
  const [filtroCategGasto, setFiltroCategGasto]     = useState('Todas');
  const [modalEliminarGasto, setModalEliminarGasto] = useState(null);
  const [gastoEditando, setGastoEditando]           = useState(null);

  // ── Layout ──
  const [tab, setTab]             = useState('inventario');
  const [collapsed, setCollapsed] = useState(false);

  const matricula = localStorage.getItem('usuarioLogueado') || 'desconocido';
  const rol       = localStorage.getItem('rolUsuario') || 'VENDEDOR';
  const empresaId = parseInt(localStorage.getItem('empresaId') || '0');
  const userId    = parseInt(localStorage.getItem('userId') || '0');
  const esAdmin   = rol === 'ADMIN';
  // Solo usuario riempy (id=1 O matrícula 'riempy') ve Empresas
  const esriempy = matricula === 'riempy';

  // ── Cargar productos con filtro de empresa ──
  const cargarProductos = useCallback(async () => {
  try {
    const d = await obtenerProductos();
    if (Array.isArray(d)) {
      setProductos(d); // ✅ Backend ya filtra por empresa vía JWT
    }
  } catch (err) {
    console.error('Error cargando productos:', err);
  }
}, []);

  const cargarGastos = async () => {
    const data = await obtenerGastos();
    setGastos(data.map(g => ({
      ...g,
      registradoPor: g.registradoPor,
      fecha: g.fecha,
    })));
  };

  const agregarGasto = async () => {
    const desc  = nuevoGasto.descripcion.trim();
    const monto = parseFloat(nuevoGasto.monto);
    if (!desc)                      return alert('Escribe una descripción');
    if (isNaN(monto) || monto <= 0) return alert('Ingresa un monto válido mayor a 0');
    try {
      await registrarGasto({
        descripcion: desc,
        monto,
        categoria: nuevoGasto.categoria,
        fecha: nuevoGasto.fecha,
        registradoPor: matricula,
      });
      setNuevoGasto({ descripcion:'', monto:'', categoria:'Operativo', fecha: new Date().toISOString().split('T')[0] });
      cargarGastos();
    } catch (e) {
      alert('❌ Error al registrar gasto: ' + e.message);
    }
  };

  const guardarEdicionGasto = async () => {
    const monto = parseFloat(gastoEditando.monto);
    if (!gastoEditando.descripcion.trim()) return alert('Descripción requerida');
    if (isNaN(monto) || monto <= 0)        return alert('Monto inválido');
    try {
      await actualizarGasto(gastoEditando.id, {
        descripcion: gastoEditando.descripcion.trim(),
        monto,
        categoria: gastoEditando.categoria,
        fecha: gastoEditando.fecha,
      });
      setGastoEditando(null);
      cargarGastos();
    } catch (e) {
      alert('❌ Error al editar gasto: ' + e.message);
    }
  };

  const confirmarEliminarGasto = async () => {
    try {
      await deleteGasto(modalEliminarGasto.id);
      setModalEliminarGasto(null);
      cargarGastos();
    } catch (e) {
      alert('❌ Error al eliminar: ' + e.message);
      setModalEliminarGasto(null);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      alert('⚠️ Acceso denegado. Por favor, inicia sesión.');
      navigate('/');
    } else {
      cargarProductos();
      cargarVentas();
      cargarGastos();
    }
  }, [navigate, cargarProductos]);

  // ── Recarga de productos al entrar al Catálogo ──
  useEffect(() => {
    if (tab === 'catalogo') {
      setCargandoCatalogo(true);
      cargarProductos().finally(() => setCargandoCatalogo(false));
    }
  }, [tab, cargarProductos]);

  const cargarVentas    = async () => { const d = await obtenerVentas(); if (d) setTodasLasVentas(d); };

  const categoriasProducto = [...new Set(productos.map(p => p.categoria).filter(Boolean))].sort();

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!esAdmin) return;
    try {
      const resultado = await guardarProducto({ ...nuevoProd, id: editandoId, registradoPorMatricula: matricula });
      if (!resultado) { alert('❌ Error al guardar. Revisa la consola (F12 → Network).'); return; }
      alert(editandoId ? '✅ Producto actualizado' : '✅ Producto guardado');
      setNuevoProd(PROD_VACIO);
      setEditandoId(null);
      cargarProductos();
    } catch (err) {
      console.error('Error al guardar producto:', err);
      alert('❌ Error: ' + err.message);
    }
  };

  const prepararEdicion = (p) => {
    setEditandoId(p.id);
    setNuevoProd({ codigo:p.codigo, nombre:p.nombre, stock:p.stock, precioCompra:p.precioCompra, precioVenta:p.precioVenta, categoria:p.categoria || '', imagen:p.imagen||'' });
  };

  const iniciarEditStock   = (p) => { setEditandoStockId(p.id); setNuevoStock(String(p.stock)); };
  const guardarStockInline = async (p) => {
    const n = parseInt(nuevoStock);
    if (isNaN(n) || n < 0) { alert('Stock inválido'); return; }
    await guardarProducto({ ...p, stock: n, registradoPorMatricula: matricula });
    setEditandoStockId(null); cargarProductos();
  };

  const guardarLimite = () => {
    const v = parseInt(limiteTemp);
    if (isNaN(v) || v < 0) { alert('Valor inválido'); return; }
    setLimiteStock(v); localStorage.setItem('limiteStock', v); setModalLimite(false);
  };

  const abrirAgregarStock = (p) => { setModalAgregarStock(p); setCantidadAgregar(''); };

  const eliminarProducto = async (p) => {
    if (!window.confirm(`¿Eliminar el producto "${p.nombre}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      await deleteProducto(p.id);
      setProductos(prev => prev.filter(x => x.id !== p.id));
      alert(`✅ Producto "${p.nombre}" eliminado`);
    } catch (e) {
      alert('❌ ' + e.message);
    }
  };

  const confirmarAgregarStock = async () => {
    const n = parseInt(cantidadAgregar);
    if (isNaN(n) || n <= 0) { alert('Ingresa una cantidad válida'); return; }
    await guardarProducto({ ...modalAgregarStock, stock: modalAgregarStock.stock + n, registradoPorMatricula: matricula });
    setModalAgregarStock(null);
    cargarProductos();
  };

  const handleLogout = () => {
    localStorage.removeItem('usuarioLogueado');
    localStorage.removeItem('rolUsuario');
    localStorage.removeItem('token');
    localStorage.removeItem('empresaId');
    localStorage.removeItem('userId');
    navigate('/');
  };

  // ── Usuarios helpers ──
  const cargarUsuarios = async () => {
    try {
      const r = await fetch('/api/usuarios', { headers: authHeaders() });
      if (r.status === 401) { handleLogout(); return; }
      if (!r.ok) throw new Error('Error al obtener la lista');
      setUsuarios(await r.json());
    } catch (e) { console.error('Error cargando usuarios:', e); }
  };

  const agregarUsuario = async () => {
    if (!formUser.matricula || !formUser.password) return alert('Llena todos los campos');
    setCargandoUser(true);
    try {
      const r = await fetch('/api/usuarios', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          matricula: formUser.matricula,
          password: formUser.password,
          rol: formUser.rol,
          empresa: { id: empresaId },
        }),
      });
      if (r.status === 401) { handleLogout(); return; }
      if (!r.ok) { const msg = await r.text(); throw new Error(msg); }
      setFormUser({ matricula: '', password: '', rol: 'VENDEDOR' });
      alert('✅ Usuario agregado con éxito');
      cargarUsuarios();
    } catch (e) {
      alert('Error al agregar usuario: ' + e.message);
    } finally { setCargandoUser(false); }
  };

  const toggleBloqueo = async (id, bloqueado) => {
    try {
      const r = await fetch(`/api/usuarios/${id}/bloquear`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ bloqueado: !bloqueado }),
      });
      if (r.status === 401) { handleLogout(); return; }
      if (!r.ok) throw new Error('No se pudo cambiar el estado');
      cargarUsuarios();
    } catch (e) { console.error(e); alert('Error al cambiar estado'); }
  };

  const eliminarUsuario = async (id, matriculaU) => {
    if (!window.confirm(`¿Eliminar al usuario "${matriculaU}"?`)) return;
    try {
      const r = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (r.status === 401) { handleLogout(); return; }
      if (!r.ok) throw new Error('Error en el servidor al eliminar');
      const resData = await r.json();
      console.log(resData.message);
      cargarUsuarios();
    } catch (e) { alert('Error al eliminar: ' + e.message); }
  };

  // ── Ventas helpers ──
  const totalVenta = listaVenta.reduce((s, i) => s + i.precio * i.cantidad, 0);

  useEffect(() => {
    setPago(prev => ({ ...prev, cambio: prev.efectivo > 0 ? parseFloat(prev.efectivo) - totalVenta : 0 }));
  }, [pago.efectivo, totalVenta]);

  const seleccionarProducto = (e) => {
    const prod = productos.find(p => p.id.toString() === e.target.value);
    if (prod) setSeleccion({ productoId:prod.id, codigo:prod.codigo, nombre:prod.nombre, precio:prod.precioVenta, cantidad:1, stockDisponible:prod.stock });
    else setSeleccion({ productoId:'', codigo:'', nombre:'', precio:0, cantidad:1, stockDisponible:0 });
  };

  const agregarALista = () => {
    if (!seleccion.productoId) return alert('Selecciona un producto');
    if (seleccion.cantidad > seleccion.stockDisponible) return alert('Stock insuficiente');
    setListaVenta(prev => [...prev, { ...seleccion }]);
    setSeleccion({ productoId:'', codigo:'', nombre:'', precio:0, cantidad:1, stockDisponible:0 });
    setBusquedaVenta('');
  };

  const quitarDeLista = (idx) => setListaVenta(prev => prev.filter((_, i) => i !== idx));

  const generarTicketPDF = (venta) => {
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF({ unit:'mm', format:[80, 200] });
      const x = 5; let y = 10; const lh = 6;
      doc.setFontSize(13); doc.setFont('courier','bold');
      doc.text('ISLA TECNOLÓGICA', 40, y, { align:'center' }); y += lh;
      doc.setFontSize(8); doc.setFont('courier','normal');
      doc.text('VNSA Jose A. Pinedo 301', 40, y, { align:'center' }); y += lh - 1;
      doc.text('Aguascalientes, México', 40, y, { align:'center' }); y += lh;
      doc.text('449-540-5568', 40, y, { align:'center' }); y += lh;
      doc.text('--------------------------------', 40, y, { align:'center' }); y += lh;
      doc.setFontSize(9);
      doc.text(`Venta: ${venta.id}`, x, y);
      doc.text(new Date().toLocaleDateString(), 75, y, { align:'right' }); y += lh;
      doc.text(`Atendido por: ${venta.vendedorMatricula}`, x, y); y += lh;
      doc.text('--------------------------------', 40, y, { align:'center' }); y += lh;
      venta.productos.forEach(item => {
        doc.setFont('courier','bold');
        doc.text(`${item.cantidad} x ${item.nombre}`, x, y); y += lh;
        doc.setFont('courier','normal');
        doc.text(`$${parseFloat(item.precio).toFixed(2)} c/u`, x, y);
        doc.text(`$${(item.precio * item.cantidad).toFixed(2)}`, 75, y, { align:'right' }); y += lh;
      });
      doc.text('--------------------------------', 40, y, { align:'center' }); y += lh;
      doc.setFontSize(11); doc.setFont('courier','bold');
      doc.text('TOTAL:', x, y);
      doc.text(`MXN $${venta.total.toFixed(2)}`, 75, y, { align:'right' }); y += lh;
      doc.setFontSize(9); doc.setFont('courier','normal');
      doc.text('Efectivo:', x, y);
      doc.text(`$${parseFloat(venta.efectivo).toFixed(2)}`, 75, y, { align:'right' }); y += lh;
      doc.text('Cambio:', x, y);
      doc.text(`$${venta.cambio.toFixed(2)}`, 75, y, { align:'right' }); y += lh + 3;
      doc.text('--------------------------------', 40, y, { align:'center' }); y += lh;
      doc.text('¡Gracias por su preferencia!', 40, y, { align:'center' }); y += lh;
      doc.setFontSize(7);
      doc.text(`${venta.id}-${Math.random().toString(36).substr(2,5)}`, 40, y, { align:'center' });
      doc.save(`ticket-${venta.id}.pdf`);
    });
  };

  const handleVenta = async () => {
    if (listaVenta.length === 0) return alert('La lista está vacía');
    if (parseFloat(pago.efectivo) < totalVenta) return alert('❌ Efectivo insuficiente');
    const ventasGuardadas = [];
    for (let item of listaVenta) {
      const res = await registrarVenta({ codigoProducto:item.codigo, nombreProducto:item.nombre, cantidad:item.cantidad, precioVenta:item.precio, vendedorMatricula:matricula });
      if (res) ventasGuardadas.push(res);
    }
    const idReal = ventasGuardadas.length > 0 ? ventasGuardadas[0].id : Math.floor(Math.random()*10000);
    const venta = { id: idReal, productos:listaVenta, total:totalVenta, efectivo:pago.efectivo, cambio:pago.cambio, vendedorMatricula:matricula };
    generarTicketPDF(venta);
    setVentaExitosa(venta);
    setListaVenta([]);
    setPago({ efectivo:0, cambio:0 });
    cargarProductos();
    cargarVentas();
  };

  const eliminarVenta = async (venta) => {
    try {
      await deleteVenta(venta.id);
      setTodasLasVentas(prev => prev.filter(v => v.id !== venta.id));
      setModalConfirmarEliminar(null);
    } catch (e) {
      alert('❌ ' + e.message);
      setModalConfirmarEliminar(null);
    }
  };

  // ── Stats inventario ──
  const totalProductos     = productos.length;
  const totalUnidades      = productos.reduce((s,p) => s + p.stock, 0);
  const totalInvertido     = productos.reduce((s,p) => s + p.precioCompra * p.stock, 0);
  const totalGananciaAprox = productos.reduce((s,p) => s + (p.precioVenta - p.precioCompra) * p.stock, 0);
  const totalVentaAprox    = productos.reduce((s,p) => s + p.precioVenta * p.stock, 0);
  const bajoStock          = productos.filter(p => p.stock <= limiteStock).length;

  // ── Reportes: filtrado ──
  const fechaRef = new Date(busquedaFecha + 'T12:00:00');
  const ventasFiltradas = todasLasVentas.filter(v => {
    const fv = new Date(v.fechaVenta);
    const coincideTiempo =
      filtro === 'dia'  ? fv.toDateString() === fechaRef.toDateString() :
      filtro === 'mes'  ? fv.getMonth() === fechaRef.getMonth() && fv.getFullYear() === fechaRef.getFullYear() :
                          fv.getFullYear() === fechaRef.getFullYear();
    const coincideTexto =
      v.vendedorMatricula?.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
      v.nombreProducto?.toLowerCase().includes(textoBusqueda.toLowerCase());
    return coincideTiempo && coincideTexto;
  });

  const totalVendido  = ventasFiltradas.reduce((s,v) => s + (v.total ?? 0), 0);
  const totalGastos   = ventasFiltradas.reduce((s,v) => s + (v.precioCompra ?? 0) * (v.cantidad ?? 0), 0);
  const totalTickets  = ventasFiltradas.length;

  const gastosPeriodo = gastos.filter(g => {
    const fg = new Date(g.fecha + 'T12:00:00');
    return filtro === 'dia'
      ? fg.toDateString() === fechaRef.toDateString()
      : filtro === 'mes'
      ? fg.getMonth() === fechaRef.getMonth() && fg.getFullYear() === fechaRef.getFullYear()
      : fg.getFullYear() === fechaRef.getFullYear();
  });
  const totalGastosExtra = gastosPeriodo.reduce((s, g) => s + g.monto, 0);
  const ingresosNetos    = totalVendido - totalGastosExtra;
  const gananciaNeta     = totalVendido - totalGastos - totalGastosExtra;

  const topProductos = ventasFiltradas.reduce((acc, v) => {
    acc[v.nombreProducto] = (acc[v.nombreProducto] || 0) + (v.cantidad ?? 0);
    return acc;
  }, {});
  const topProducto  = Object.entries(topProductos).sort((a,b) => b[1]-a[1])[0];
  const periodoLabel = { dia: 'hoy', mes: 'este mes', año: 'este año' };

  const mesActual  = fechaRef.getMonth();
  const añoActual  = fechaRef.getFullYear();
  const diasDelMes = new Date(añoActual, mesActual + 1, 0).getDate();

  const ventasPorDia = Array.from({ length: diasDelMes }, (_, i) => {
    const dia = i + 1;
    const ventasDia = todasLasVentas.filter(v => {
      const fv = new Date(v.fechaVenta);
      return fv.getDate() === dia && fv.getMonth() === mesActual && fv.getFullYear() === añoActual;
    });
    return {
      dia: `${dia}`,
      ingresos: parseFloat(ventasDia.reduce((s,v) => s + (v.total ?? 0), 0).toFixed(2)),
      ganancia: parseFloat(ventasDia.reduce((s,v) => s + ((v.total ?? 0) - (v.precioCompra ?? 0) * (v.cantidad ?? 0)), 0).toFixed(2)),
    };
  });

  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const comparacionMensual = Array.from({ length: 6 }, (_, i) => {
    const fecha = new Date(añoActual, mesActual - 5 + i, 1);
    const m = fecha.getMonth();
    const a = fecha.getFullYear();
    const ventasMes = todasLasVentas.filter(v => {
      const fv = new Date(v.fechaVenta);
      return fv.getMonth() === m && fv.getFullYear() === a;
    });
    return {
      mes: MESES[m],
      ingresos: parseFloat(ventasMes.reduce((s,v) => s + (v.total ?? 0), 0).toFixed(2)),
      ganancia: parseFloat(ventasMes.reduce((s,v) => s + ((v.total ?? 0) - (v.precioCompra ?? 0) * (v.cantidad ?? 0)), 0).toFixed(2)),
      costo:    parseFloat(ventasMes.reduce((s,v) => s + (v.precioCompra ?? 0) * (v.cantidad ?? 0), 0).toFixed(2)),
    };
  });

  // ── Catálogo: filtrado por empresa + texto + categoría ──
  const categoriasCat = ['Todas', ...new Set(productos.map(p => p.categoria).filter(Boolean))];

  const prodsCatalogo = productos.filter(p => {
  const matchCat  = filtroCat === 'Todas' || p.categoria === filtroCat;
  const matchText = p.nombre.toLowerCase().includes(busquedaCatalogo.toLowerCase()) ||
                    p.codigo.toLowerCase().includes(busquedaCatalogo.toLowerCase());
  return matchCat && matchText; // ✅ Backend ya garantiza que son de esta empresa
});

  const productosFiltradosVenta = productos.filter(p =>
    p.nombre.toLowerCase().includes(busquedaVenta.toLowerCase()) ||
    p.codigo.toLowerCase().includes(busquedaVenta.toLowerCase())
  );

  const productosStock = [...productos]
    .filter(p => {
      const matchText = p.nombre.toLowerCase().includes(busquedaStock.toLowerCase()) ||
                        p.codigo.toLowerCase().includes(busquedaStock.toLowerCase());
      const st = stockStatus(p.stock, limiteStock);
      const matchEst =
        filtroEstStock === 'todos'    ? true :
        filtroEstStock === 'ok'       ? st === 'ok' :
        filtroEstStock === 'low'      ? st === 'low' :
                                        st === 'critical';
      return matchText && matchEst;
    })
    .sort((a, b) => b.stock - a.stock);

  const filtroEstLabel = {
    todos: 'Stock General', ok: 'Productos OK', low: 'Stock Bajo', critical: 'Sin Stock',
  }[filtroEstStock];

  const gastosCategs     = ['Todas', ...new Set(gastos.map(g => g.categoria))];
  const gastosFiltrados  = gastos
    .filter(g => {
      const matchText = g.descripcion.toLowerCase().includes(busquedaGasto.toLowerCase()) ||
                        g.categoria.toLowerCase().includes(busquedaGasto.toLowerCase());
      const matchCat  = filtroCategGasto === 'Todas' || g.categoria === filtroCategGasto;
      return matchText && matchCat;
    })
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const totalGastosGeneral   = gastos.reduce((s, g) => s + g.monto, 0);
  const totalGastosFiltrados = gastosFiltrados.reduce((s, g) => s + g.monto, 0);

  const gastosPorCategoria = gastos.reduce((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] || 0) + g.monto;
    return acc;
  }, {});
  const topCategoria = Object.entries(gastosPorCategoria).sort((a, b) => b[1]-a[1])[0];

  const exportarStockPDF = () => {
    setGenerandoPDF(true);
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const fecha = new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' });
      const hora  = new Date().toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' });
      const unidadesFiltradas = productosStock.reduce((s,p) => s + p.stock, 0);
      const capitalFiltrado   = productosStock.reduce((s,p) => s + p.precioCompra * p.stock, 0);
      const gananciaFiltrada  = productosStock.reduce((s,p) => s + (p.precioVenta - p.precioCompra) * p.stock, 0);
      const badgeColor =
        filtroEstStock === 'ok'       ? [22,163,74] :
        filtroEstStock === 'low'      ? [202,138,4] :
        filtroEstStock === 'critical' ? [220,38,38] : [79,158,255];
      import('jspdf-autotable').then(({ default: autoTable }) => {
        doc.setFillColor(13, 15, 20); doc.rect(0, 0, 297, 34, 'F');
        doc.setDrawColor(...badgeColor); doc.setLineWidth(0.8); doc.line(0, 34, 297, 34);
        doc.setTextColor(255, 255, 255); doc.setFontSize(17); doc.setFont('helvetica', 'bold');
        doc.text('ISLA TECNOLÓGICA', 14, 13);
        doc.setFillColor(...badgeColor); doc.roundedRect(14, 16, 40, 7, 2, 2, 'F');
        doc.setFontSize(7); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
        doc.text(filtroEstLabel.toUpperCase(), 34, 21, { align:'center' });
        doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(150,150,180);
        doc.text(`Reporte: ${filtroEstLabel}  ·  Generado: ${fecha} a las ${hora}  ·  Por: ${matricula}`, 58, 21);
        doc.setTextColor(200,200,220); doc.setFontSize(8);
        doc.text(`Productos: ${productosStock.length}`, 210, 10);
        doc.text(`Unidades: ${unidadesFiltradas}`, 210, 16);
        doc.text(`Capital: $${capitalFiltrado.toFixed(2)}`, 210, 22);
        doc.text(`Ganancia aprox.: +$${gananciaFiltrada.toFixed(2)}`, 210, 28);
        const filas = productosStock.map(p => {
          const st = stockStatus(p.stock, limiteStock);
          return [p.codigo, p.nombre, p.categoria || '—', p.stock,
            st === 'critical' ? 'SIN STOCK' : st === 'low' ? 'STOCK BAJO' : 'OK',
            `$${p.precioCompra.toFixed(2)}`, `$${p.precioVenta.toFixed(2)}`,
            `+$${(p.precioVenta - p.precioCompra).toFixed(2)}`, `$${(p.precioCompra * p.stock).toFixed(2)}`];
        });
        autoTable(doc, {
          startY: 39,
          head: [['Código','Nombre','Categoría','Stock','Estado','Costo Unit.','Precio Venta','Gan. Unit.','Valor Stock']],
          body: filas,
          styles: { fontSize:8, cellPadding:3, font:'helvetica', textColor:[30,34,48] },
          headStyles: { fillColor:[30,34,48], textColor:[255,255,255], fontStyle:'bold', fontSize:8 },
          alternateRowStyles: { fillColor:[248,249,252] },
          columnStyles: {
            0:{cellWidth:22},1:{cellWidth:60},2:{cellWidth:28},3:{halign:'center',cellWidth:18},
            4:{halign:'center',cellWidth:24},5:{halign:'right',cellWidth:24},6:{halign:'right',cellWidth:26},
            7:{halign:'right',cellWidth:22},8:{halign:'right',cellWidth:26},
          },
          willDrawCell: (data) => { if (data.column.index === 4 && data.section === 'body') data.cell.text = []; },
          didDrawCell: (data) => {
            if (data.column.index === 4 && data.section === 'body') {
              const val = filas[data.row.index]?.[4];
              if (!val) return;
              const color = val === 'SIN STOCK' ? [220,38,38] : val === 'STOCK BAJO' ? [202,138,4] : [22,163,74];
              doc.setTextColor(...color); doc.setFontSize(7); doc.setFont('helvetica','bold');
              doc.text(val, data.cell.x + data.cell.width/2, data.cell.y + data.cell.height/2 + 2.5, { align:'center' });
              doc.setTextColor(30,34,48); doc.setFont('helvetica','normal');
            }
          },
        });
        const finalY = doc.lastAutoTable.finalY + 6;
        doc.setFillColor(30,34,48); doc.rect(14, finalY, 269, 14, 'F');
        doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','bold');
        doc.text('RESUMEN DEL FILTRO', 18, finalY + 5);
        doc.setFont('helvetica','normal'); doc.setTextColor(150,200,255);
        doc.text(`Capital invertido: $${capitalFiltrado.toFixed(2)}`, 18, finalY + 11);
        doc.text(`Valor venta aprox.: $${productosStock.reduce((s,p)=>s+p.precioVenta*p.stock,0).toFixed(2)}`, 100, finalY + 11);
        doc.setTextColor(100,220,160);
        doc.text(`Ganancia aprox.: +$${gananciaFiltrada.toFixed(2)}`, 200, finalY + 11);
        doc.setTextColor(150,150,170); doc.setFontSize(7); doc.setFont('helvetica','normal');
        doc.text(`Isla Tecnológica — Sistema POS  ·  Filtro: ${filtroEstLabel}`, 14, doc.internal.pageSize.height - 5);
        doc.save(`stock-${filtroEstStock}-isla-tecnologica-${new Date().toISOString().split('T')[0]}.pdf`);
        setGenerandoPDF(false);
      }).catch(() => {
        doc.save(`stock-fallback-${new Date().toISOString().split('T')[0]}.pdf`);
        setGenerandoPDF(false);
      });
    });
  };

  const formatHora = (fv) => {
    try { return new Date(fv).toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' }); }
    catch { return '--:--'; }
  };

  const formatFecha = (f) => {
    try { return new Date(f + 'T12:00:00').toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' }); }
    catch { return f; }
  };

  const colorCategoria = (cat) => {
    const mapa = {
      'Operativo':'#4f9eff','Renta / Local':'#a78bfa',
      'Servicios (luz, agua, internet)':'#34d399','Transporte / Envíos':'#fbbf24',
      'Salarios':'#f472b6','Compra de mercancía':'#f87171',
      'Marketing / Publicidad':'#fb923c','Mantenimiento':'#60a5fa',
      'Equipo / Herramientas':'#2dd4bf','Otros':'#9ca3af',
    };
    return mapa[cat] || '#6b7280';
  };

  // ════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════
  return (
    <>
      <div className="app-shell">
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

            {/* ══ BOTÓN EMPRESAS — solo visible para riempy (id=1) ══ */}
            {esriempy && (
              <button
                className="sb-item"
                onClick={() => navigate('/empresas')}
                title={collapsed ? 'Empresas' : ''}
                style={{
                  background: 'linear-gradient(90deg, rgba(167,139,250,.15) 0%, transparent 100%)',
                  borderLeft: '3px solid #a78bfa',
                  marginBottom: 4,
                }}
              >
                <span className="sb-icon">🏢</span>
                {!collapsed && (
                  <span className="sb-label" style={{ color: '#a78bfa', fontWeight: 700 }}>
                    Empresas
                  </span>
                )}
              </button>
            )}

            <button className={`sb-item ${tab==='inventario'?'active':''}`} onClick={() => setTab('inventario')} title={collapsed?'Inventario':''}>
              <span className="sb-icon">📦</span>
              {!collapsed && <span className="sb-label">Inventario</span>}
              {!collapsed && bajoStock > 0 && <span className="sb-badge">{bajoStock}</span>}
            </button>
            <button className={`sb-item ${tab==='stock'?'active':''}`} onClick={() => setTab('stock')} title={collapsed?'Stock General':''}>
              <span className="sb-icon">📋</span>
              {!collapsed && <span className="sb-label">Stock General</span>}
            </button>
            <button className={`sb-item ${tab==='catalogo'?'active':''}`} onClick={() => setTab('catalogo')} title={collapsed?'Catálogo':''}>
              <span className="sb-icon">🏷️</span>
              {!collapsed && <span className="sb-label">Catálogo</span>}
            </button>
            {esAdmin && (
              <button className={`sb-item ${tab==='costos'?'active':''}`} onClick={() => setTab('costos')} title={collapsed?'Costos':''}>
                <span className="sb-icon">💰</span>
                {!collapsed && <span className="sb-label">Costos & Capital</span>}
              </button>
            )}
            {esAdmin && (
              <button className={`sb-item ${tab==='gastos'?'active':''}`} onClick={() => setTab('gastos')} title={collapsed?'Gastos':''}>
                <span className="sb-icon">🧾</span>
                {!collapsed && <span className="sb-label">Gastos</span>}
                {!collapsed && gastos.length > 0 && (
                  <span className="sb-badge" style={{background:'rgba(248,113,113,.25)',color:'#f87171',border:'1px solid rgba(248,113,113,.35)'}}>
                    {gastos.length}
                  </span>
                )}
              </button>
            )}
            <button className={`sb-item ${tab==='ventas'?'active':''}`} onClick={() => setTab('ventas')} title={collapsed?'Ventas':''}>
              <span className="sb-icon">🛒</span>
              {!collapsed && <span className="sb-label">Ventas</span>}
            </button>
            {esAdmin && (
              <>
                <button className={`sb-item ${tab==='reportes'?'active':''}`} onClick={() => { setTab('reportes'); cargarVentas(); }} title={collapsed?'Reportes':''}>
                  <span className="sb-icon">📈</span>
                  {!collapsed && <span className="sb-label">Reportes</span>}
                </button>
                <button className={`sb-item ${tab==='usuarios'?'active':''}`} onClick={() => { setTab('usuarios'); cargarUsuarios(); }} title={collapsed?'Usuarios':''}>
                  <span className="sb-icon">👥</span>
                  {!collapsed && <span className="sb-label">Usuarios</span>}
                </button>
              </>
            )}
            {esAdmin && (
              <>
                {!collapsed && <div className="sb-section-label" style={{marginTop:10}}>Configuración</div>}
                <button className="sb-item" onClick={() => { setLimiteTemp(String(limiteStock)); setModalLimite(true); }} title={collapsed?'Límite Stock':''}>
                  <span className="sb-icon">⚙️</span>
                  {!collapsed && <span className="sb-label">Límite Stock</span>}
                </button>
              </>
            )}
          </nav>

          <div className="sb-bottom">
            <div className="sb-logout" style={{padding:'10px'}}>
              <button className="sb-item" onClick={handleLogout} title={collapsed?'Cerrar Sesión':''}>
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

        <main className={`main-content ${collapsed ? 'collapsed' : ''}`}>
          <div className="topbar">
            <div className="topbar-title">
              {tab === 'inventario' && <><span>Inventario</span> de Productos</>}
              {tab === 'stock'      && <><span>Stock</span> General</>}
              {tab === 'catalogo'   && <><span>Catálogo</span> de Productos</>}
              {tab === 'costos'     && <><span>Costos</span> & Capital</>}
              {tab === 'gastos'     && <><span>Gastos</span> Operativos</>}
              {tab === 'reportes'   && <><span>Reportes</span> Financieros</>}
              {tab === 'ventas'     && <><span>Terminal</span> de Ventas</>}
              {tab === 'usuarios'   && <><span>Usuarios</span> del Sistema</>}
            </div>
            <div style={{display:'flex', alignItems:'center', gap:12}}>
              {tab === 'inventario' && bajoStock > 0 && (
                <div style={{fontSize:13, color:'#fbbf24', display:'flex', alignItems:'center', gap:6}}>
                  ⚠️ <strong>{bajoStock}</strong> productos con stock bajo (≤{limiteStock})
                </div>
              )}
              {tab === 'reportes' && (
                <button className="btn ghost" style={{fontSize:12, padding:'7px 14px'}} onClick={cargarVentas}>🔄 Actualizar</button>
              )}
              {tab === 'stock' && (
                <button className="btn ghost" style={{fontSize:12, padding:'7px 14px'}} onClick={cargarProductos}>🔄 Actualizar</button>
              )}
              {/* ── Botón actualizar catálogo + info empresa ── */}
              {tab === 'catalogo' && (
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  <div style={{
                    fontSize:11, color:'#a78bfa', fontFamily:'JetBrains Mono',
                    background:'rgba(167,139,250,.1)', border:'1px solid rgba(167,139,250,.25)',
                    borderRadius:16, padding:'4px 12px', display:'flex', alignItems:'center', gap:5
                  }}>
                    🏢 Empresa ID: <strong>{empresaId}</strong>
                    {esriempy && <span style={{color:'#fbbf24', marginLeft:4}}>· riempy</span>}
                  </div>
                  <button
                    className="btn ghost"
                    style={{fontSize:12, padding:'7px 14px'}}
                    onClick={() => {
                      setCargandoCatalogo(true);
                      cargarProductos().finally(() => setCargandoCatalogo(false));
                    }}
                    disabled={cargandoCatalogo}
                  >
                    {cargandoCatalogo ? '⏳ Cargando...' : '🔄 Actualizar'}
                  </button>
                </div>
              )}
              {tab === 'gastos' && (
                <div style={{display:'flex', alignItems:'center', gap:12}}>
                  {gastos.length > 0 && (
                    <div style={{fontSize:13, color:'#f87171', display:'flex', alignItems:'center', gap:6, fontFamily:'JetBrains Mono'}}>
                      Total gastado: <strong>${totalGastosGeneral.toFixed(2)}</strong>
                    </div>
                  )}
                  <button className="btn ghost" style={{fontSize:12, padding:'7px 14px'}} onClick={cargarGastos}>🔄 Actualizar</button>
                </div>
              )}
            </div>
          </div>

          {/* ── TAB INVENTARIO ── */}
          {tab === 'inventario' && (
            <>
              {esAdmin && (
                <div className="stats-grid">
                  <div className="stat-card"><div className="stat-label">Productos</div><div className="stat-val c-blue">{totalProductos}</div></div>
                  <div className="stat-card"><div className="stat-label">Unidades Totales</div><div className="stat-val c-blue">{totalUnidades}</div></div>
                  <div className="stat-card"><div className="stat-label">Capital Invertido</div><div className="stat-val c-red">${totalInvertido.toFixed(2)}</div></div>
                  <div className="stat-card"><div className="stat-label">Bajo Stock</div><div className="stat-val c-amber">{bajoStock} prods</div></div>
                </div>
              )}
              {esAdmin && (
                <div className={`prod-form ${editandoId ? 'editing' : ''}`}>
                  <div className="prod-form-title">{editandoId ? '✏️ Editando Producto' : '➕ Agregar Nuevo Producto'}</div>
                  <form onSubmit={handleGuardar}>
                    <div className="prod-form-grid">
                      <input className="inp" placeholder="Código" value={nuevoProd.codigo} onChange={e => setNuevoProd({...nuevoProd, codigo:e.target.value})} required />
                      <input className="inp flex1" placeholder="Nombre" value={nuevoProd.nombre} onChange={e => setNuevoProd({...nuevoProd, nombre:e.target.value})} required />
                      <input className="inp" style={{width:85}} type="number" placeholder="Stock" value={nuevoProd.stock} onChange={e => setNuevoProd({...nuevoProd, stock:parseInt(e.target.value)})} required />
                      <input className="inp" style={{width:120}} type="number" step="0.01" placeholder="Costo $" value={nuevoProd.precioCompra} onChange={e => setNuevoProd({...nuevoProd, precioCompra:parseFloat(e.target.value)})} required />
                      <input className="inp" style={{width:120}} type="number" step="0.01" placeholder="Venta $" value={nuevoProd.precioVenta} onChange={e => setNuevoProd({...nuevoProd, precioVenta:parseFloat(e.target.value)})} required />
                      <CategoriaSelector
                        value={nuevoProd.categoria}
                        onChange={val => setNuevoProd({...nuevoProd, categoria: val})}
                      />
                    </div>
                    <div style={{marginTop:12}}>
                      <div style={{fontSize:11, color:'#6b7280', marginBottom:6, fontFamily:'JetBrains Mono'}}>🖼️ Imagen del producto</div>
                      <div style={{display:'flex', gap:10, alignItems:'flex-start'}}>
                        <div style={{flex:1, display:'flex', flexDirection:'column', gap:8}}>
                          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', background:'#0d0f14', border:'1px dashed #2a3045', borderRadius:8, padding:'9px 14px', fontSize:12, color:'#9ca3af', transition:'border-color .2s' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor='#4f9eff'}
                            onMouseLeave={e => e.currentTarget.style.borderColor='#2a3045'}
                          >
                            <span style={{fontSize:16}}>📁</span>
                            <span>Subir imagen desde tu computadora</span>
                            <input type="file" accept="image/*" style={{display:'none'}}
                              onChange={e => {
                                const file = e.target.files[0];
                                if (!file) return;
                                if (file.size > 2 * 1024 * 1024) { alert('La imagen debe pesar menos de 2MB'); return; }
                                const reader = new FileReader();
                                reader.onload = ev => setNuevoProd(prev => ({...prev, imagen: ev.target.result}));
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                          <div style={{display:'flex', alignItems:'center', gap:8}}>
                            <span style={{fontSize:10, color:'#4b5563', whiteSpace:'nowrap', fontFamily:'JetBrains Mono'}}>o pega una URL:</span>
                            <input className="inp" style={{flex:1, fontSize:12}}
                              placeholder="https://ejemplo.com/imagen.jpg"
                              value={nuevoProd.imagen && !nuevoProd.imagen.startsWith('data:') ? nuevoProd.imagen : ''}
                              onChange={e => setNuevoProd({...nuevoProd, imagen: e.target.value})}
                            />
                          </div>
                        </div>
                        <div style={{ width:70, height:70, borderRadius:10, border:'1px solid #1e2230', background:'#0d0f14', flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>
                          {nuevoProd.imagen ? <img src={nuevoProd.imagen} alt="preview" style={{width:'100%', height:'100%', objectFit:'cover'}} onError={e => { e.target.style.display='none'; }} /> : null}
                          {!nuevoProd.imagen && <span>📦</span>}
                        </div>
                      </div>
                      {nuevoProd.imagen && (
                        <button type="button" style={{ marginTop:6, fontSize:11, color:'#f87171', background:'none', border:'none', cursor:'pointer', fontFamily:'JetBrains Mono', padding:0 }}
                          onClick={() => setNuevoProd({...nuevoProd, imagen:''})}>✕ Quitar imagen</button>
                      )}
                    </div>
                    <div style={{display:'flex', gap:10, marginTop:14}}>
                      <button type="submit" className={`btn ${editandoId?'orange':'green'}`}>{editandoId ? 'Actualizar' : 'Guardar'}</button>
                      {editandoId && (
                        <button type="button" className="btn ghost" onClick={() => { setEditandoId(null); setNuevoProd(PROD_VACIO); }}>Cancelar</button>
                      )}
                    </div>
                  </form>
                </div>
              )}
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input className="search-input" placeholder="Buscar por nombre o código..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
              </div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{width:52}}>Img</th>
                      <th>Código</th><th>Nombre</th><th>Stock</th>
                      {esAdmin && <th>Costo</th>}
                      <th>Venta</th>
                      {esAdmin && <th>Gan. Unit.</th>}
                      {esAdmin && <th>Val. Stock</th>}
                      {esAdmin && <th>Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {productosFiltrados.map(p => {
                      const st = stockStatus(p.stock, limiteStock);
                      const editing = editandoStockId === p.id;
                      return (
                        <tr key={p.id}>
                          <td>
                            {p.imagen
                              ? <img src={p.imagen} alt={p.nombre} style={{width:38,height:38,borderRadius:7,objectFit:'cover',border:'1px solid #1e2230',background:'#0d0f14',display:'block'}} onError={e=>{e.target.style.display='none';}} />
                              : <div style={{width:38,height:38,borderRadius:7,background:'#0d0f14',border:'1px solid #1e2230',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>📦</div>
                            }
                          </td>
                          <td><span className="mono" style={{color:'#6b7280'}}>{p.codigo}</span></td>
                          <td style={{fontWeight:500}}>{p.nombre}</td>
                          <td>
                            {editing ? (
                              <div className="stock-row">
                                <input className="stock-inp" type="number" min="0" value={nuevoStock} autoFocus onChange={e => setNuevoStock(e.target.value)} onKeyDown={e => { if(e.key==='Enter') guardarStockInline(p); if(e.key==='Escape') setEditandoStockId(null); }} />
                                <button className="ico-btn save" onClick={() => guardarStockInline(p)}>✓</button>
                                <button className="ico-btn cancel" onClick={() => setEditandoStockId(null)}>✕</button>
                              </div>
                            ) : (
                              <div className="stock-row">
                                <span className={`stock-badge ${st}`}>{stockLabel[st]} {p.stock}</span>
                                {esAdmin && <button className="ico-btn edit" onClick={() => iniciarEditStock(p)}>✎</button>}
                              </div>
                            )}
                          </td>
                          {esAdmin && <td className="mono" style={{color:'#f87171'}}>${p.precioCompra.toFixed(2)}</td>}
                          <td className="mono">${p.precioVenta.toFixed(2)}</td>
                          {esAdmin && <td><span className="profit-pill pos">+${(p.precioVenta-p.precioCompra).toFixed(2)}</span></td>}
                          {esAdmin && <td className="mono" style={{color:'#4f9eff'}}>${(p.precioCompra*p.stock).toFixed(2)}</td>}
                          {esAdmin && (
                            <td>
                              <div style={{display:'flex', gap:6}}>
                                <button className="btn blue" style={{padding:'5px 12px',fontSize:12}} onClick={() => prepararEdicion(p)}>✏️ Editar</button>
                                <button className="btn green" style={{padding:'5px 12px',fontSize:12}} onClick={() => abrirAgregarStock(p)}>➕ Stock</button>
                                <button className="btn red" style={{padding:'5px 12px',fontSize:12,background:'#ef4444',color:'#fff'}} onClick={() => eliminarProducto(p)}>🗑️</button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── TAB STOCK ── */}
          {tab === 'stock' && (
            <>
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-label">Total Productos</div><div className="stat-val c-blue">{totalProductos}</div></div>
                <div className="stat-card"><div className="stat-label">Unidades Totales</div><div className="stat-val c-blue">{totalUnidades}</div></div>
                <div className="stat-card"><div className="stat-label">Sin / Bajo Stock</div><div className="stat-val c-amber">{bajoStock} prods</div></div>
                <div className="stat-card"><div className="stat-label">Capital en Stock</div><div className="stat-val c-red">${totalInvertido.toFixed(2)}</div></div>
              </div>
              <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16, flexWrap:'wrap' }}>
                <div className="search-wrap" style={{ marginBottom:0, flex:1, minWidth:220, maxWidth:360 }}>
                  <span className="search-icon">🔍</span>
                  <input className="search-input" placeholder="Buscar por nombre o código..." value={busquedaStock} onChange={e => setBusquedaStock(e.target.value)} />
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  {[
                    { val:'todos', label:'Todos', color:'#6b7280' },
                    { val:'ok', label:'✅ OK', color:'#22c55e' },
                    { val:'low', label:'⚠️ Bajo', color:'#fbbf24' },
                    { val:'critical', label:'🔴 Sin stock', color:'#ef4444' },
                  ].map(f => (
                    <button key={f.val} onClick={() => setFiltroEstStock(f.val)} style={{
                      padding:'6px 14px', borderRadius:20, fontSize:12, cursor:'pointer',
                      fontFamily:'JetBrains Mono, monospace', fontWeight:600,
                      border:`1px solid ${filtroEstStock === f.val ? f.color : '#2a3045'}`,
                      background: filtroEstStock === f.val ? `${f.color}22` : 'transparent',
                      color: filtroEstStock === f.val ? f.color : '#6b7280', transition:'all .15s'
                    }}>{f.label}</button>
                  ))}
                </div>
                <div style={{ marginLeft:'auto', display:'flex', gap:10, alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'#4b5563' }}>{productosStock.length} resultado{productosStock.length !== 1 ? 's' : ''}</span>
                  <button className="btn green" style={{ padding:'9px 20px', fontSize:13, opacity: generandoPDF ? 0.7 : 1, display:'flex', alignItems:'center', gap:8 }}
                    onClick={exportarStockPDF} disabled={generandoPDF || productosStock.length === 0}>
                    {generandoPDF ? '⏳ Generando...' : <>📄 PDF — <span style={{fontFamily:'JetBrains Mono', fontSize:11}}>{filtroEstLabel}</span></>}
                  </button>
                </div>
              </div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{width:52}}>Img</th>
                      <th>Código</th><th>Nombre</th><th>Categoría</th><th>Stock</th><th>Estado</th>
                      {esAdmin && <th>Costo Unit.</th>}
                      <th>Precio Venta</th>
                      {esAdmin && <th>Gan. Unit.</th>}
                      {esAdmin && <th>Valor en Stock</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {productosStock.length === 0 ? (
                      <tr><td colSpan={esAdmin ? 10 : 6} style={{padding:'50px', textAlign:'center', color:'#374151', fontSize:14}}>No se encontraron productos</td></tr>
                    ) : productosStock.map(p => {
                      const st = stockStatus(p.stock, limiteStock);
                      return (
                        <tr key={p.id}>
                          <td>
                            {p.imagen
                              ? <img src={p.imagen} alt={p.nombre} style={{width:38,height:38,borderRadius:7,objectFit:'cover',border:'1px solid #1e2230',background:'#0d0f14',display:'block'}} onError={e=>{e.target.style.display='none';}} />
                              : <div style={{width:38,height:38,borderRadius:7,background:'#0d0f14',border:'1px solid #1e2230',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>📦</div>
                            }
                          </td>
                          <td><span className="mono" style={{color:'#6b7280'}}>{p.codigo}</span></td>
                          <td style={{fontWeight:500}}>{p.nombre}</td>
                          <td><span style={{fontSize:11, color:'#9ca3af'}}>{p.categoria || '—'}</span></td>
                          <td><span className={`stock-badge ${st}`}>{stockLabel[st]} {p.stock}</span></td>
                          <td>
                            <span style={{fontSize:11, fontWeight:700, fontFamily:'JetBrains Mono, monospace', padding:'3px 12px', borderRadius:20,
                              background: st==='critical'?'rgba(239,68,68,.12)':st==='low'?'rgba(251,191,36,.12)':'rgba(34,197,94,.12)',
                              color: st==='critical'?'#ef4444':st==='low'?'#fbbf24':'#22c55e',
                              border:`1px solid ${st==='critical'?'rgba(239,68,68,.25)':st==='low'?'rgba(251,191,36,.25)':'rgba(34,197,94,.25)'}`}}>
                              {st==='critical'?'Sin stock':st==='low'?'Stock bajo':'OK'}
                            </span>
                          </td>
                          {esAdmin && <td className="mono" style={{color:'#f87171'}}>${p.precioCompra.toFixed(2)}</td>}
                          <td className="mono">${p.precioVenta.toFixed(2)}</td>
                          {esAdmin && <td><span className="profit-pill pos">+${(p.precioVenta - p.precioCompra).toFixed(2)}</span></td>}
                          {esAdmin && <td className="mono" style={{color:'#4f9eff', fontWeight:600}}>${(p.precioCompra * p.stock).toFixed(2)}</td>}
                        </tr>
                      );
                    })}
                  </tbody>
                  {esAdmin && productosStock.length > 0 && (
                    <tfoot>
                      <tr style={{background:'#0d0f14', borderTop:'2px solid #1e2230'}}>
                        <td colSpan={9} style={{padding:'13px 15px', fontWeight:700, fontSize:13}}>TOTALES — {filtroEstLabel} ({productosStock.length} productos)</td>
                        <td className="mono" style={{color:'#4f9eff', fontWeight:700, padding:'13px 15px'}}>
                          ${productosStock.reduce((s,p) => s + p.precioCompra * p.stock, 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════
              ── TAB CATÁLOGO ──
              Muestra productos filtrados por empresaId.
              Se recarga automáticamente al entrar al tab.
          ══════════════════════════════════════════ */}
          {tab === 'catalogo' && (
            <>
              {/* Banner de empresa activa */}
              <div style={{
                display:'flex', alignItems:'center', gap:10, marginBottom:16,
                padding:'10px 16px', borderRadius:10,
                background:'rgba(167,139,250,.07)', border:'1px solid rgba(167,139,250,.2)',
                fontSize:12, color:'#a78bfa', fontFamily:'JetBrains Mono',
              }}>
                <span style={{fontSize:15}}>🏢</span>
                <span>
                  Mostrando catálogo de <strong>Empresa ID: {empresaId}</strong>
                  {esriempy && <span style={{color:'#fbbf24', marginLeft:6}}>· riempy (admin global)</span>}
                  {' '}· {productos.length} producto{productos.length !== 1 ? 's' : ''} en inventario
                </span>
              </div>

              <div className="cat-toolbar">
                <div className="search-wrap" style={{marginBottom:0, flex:1, maxWidth:320}}>
                  <span className="search-icon">🔍</span>
                  <input className="search-input" placeholder="Buscar producto..." value={busquedaCatalogo} onChange={e => setBusquedaCatalogo(e.target.value)} />
                </div>
                <div className="cat-filtros">
                  {categoriasCat.map(c => (
                    <button key={c} className={`cat-filtro-btn ${filtroCat===c?'active':''}`} onClick={() => setFiltroCat(c)}>{c}</button>
                  ))}
                </div>
                <div style={{fontSize:12, color:'#4b5563', whiteSpace:'nowrap'}}>
                  {cargandoCatalogo
                    ? <span style={{color:'#4f9eff'}}>⏳ Cargando...</span>
                    : <>{prodsCatalogo.length} producto{prodsCatalogo.length !== 1 ? 's' : ''}</>
                  }
                </div>
              </div>

              {/* Estado vacío diferenciado */}
              {!cargandoCatalogo && prodsCatalogo.length === 0 && (
                <div style={{
                  textAlign:'center', padding:'60px 0', color:'#374151',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:14,
                }}>
                  <span style={{fontSize:40}}>📦</span>
                  <div style={{fontSize:15, color:'#4b5563', fontWeight:600}}>
                    {productos.length === 0
                      ? `Sin productos para la empresa ID ${empresaId}`
                      : 'Sin resultados para esta búsqueda'}
                  </div>
                  {productos.length === 0 && (
                    <div style={{fontSize:12, color:'#374151', fontFamily:'JetBrains Mono', maxWidth:360, lineHeight:1.7}}>
                      Asegúrate de que los productos estén asignados a la empresa con ID <strong style={{color:'#a78bfa'}}>{empresaId}</strong>.
                      Puedes agregar productos desde la sección <strong>Inventario</strong>.
                    </div>
                  )}
                  {esAdmin && productos.length === 0 && (
                    <button
                      className="btn blue"
                      style={{marginTop:6, padding:'9px 22px', fontSize:13}}
                      onClick={() => setTab('inventario')}
                    >
                      ➕ Ir a Inventario
                    </button>
                  )}
                </div>
              )}

              {/* Skeleton de carga */}
              {cargandoCatalogo && (
                <div className="cat-grid">
                  {Array.from({length: 8}).map((_, i) => (
                    <div key={i} style={{
                      background:'#0d0f14', border:'1px solid #1e2230',
                      borderRadius:14, overflow:'hidden', animation:'pulse 1.5s ease-in-out infinite',
                      opacity: 0.5 + (i % 3) * 0.1,
                    }}>
                      <div style={{height:160, background:'#1e2230'}}/>
                      <div style={{padding:'14px 16px', display:'flex', flexDirection:'column', gap:8}}>
                        <div style={{height:10, background:'#1e2230', borderRadius:4, width:'40%'}}/>
                        <div style={{height:14, background:'#1e2230', borderRadius:4, width:'75%'}}/>
                        <div style={{height:18, background:'#1e2230', borderRadius:4, width:'50%', marginTop:4}}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Grid de productos */}
              {!cargandoCatalogo && prodsCatalogo.length > 0 && (
                <div className="cat-grid">
                  {prodsCatalogo.map(p => {
                    const st = stockStatus(p.stock, limiteStock);
                    return (
                      <div key={p.id} className={`cat-card ${p.stock===0?'agotado':''}`}>
                        <div className="cat-img-wrap">
                          {p.imagen ? <img src={p.imagen} alt={p.nombre} className="cat-img" onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}} /> : null}
                          <div className="cat-img-placeholder" style={{display: p.imagen ? 'none' : 'flex'}}>📦</div>
                          <div className={`cat-stock-badge ${st}`}>{p.stock===0?'Agotado':`Stock: ${p.stock}`}</div>
                          {p.categoria && <div className="cat-categoria-badge">{p.categoria}</div>}
                        </div>
                        <div className="cat-info">
                          <div className="cat-codigo">{p.codigo}</div>
                          <div className="cat-nombre">{p.nombre}</div>
                          <div className="cat-precio">${p.precioVenta.toFixed(2)}<span className="cat-precio-label">MXN</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── TAB COSTOS ── */}
          {tab === 'costos' && esAdmin && (
            <>
              <div className="costos-grid">
                <div className="costo-card total"><div className="costo-icon">📦</div><div className="costo-label">Total Productos</div><div className="costo-value c-blue">{totalProductos}</div><div className="costo-sub">{totalUnidades} unidades en stock</div></div>
                <div className="costo-card invertido"><div className="costo-icon">💸</div><div className="costo-label">Capital Invertido</div><div className="costo-value c-red">${totalInvertido.toFixed(2)}</div><div className="costo-sub">Costo total del inventario actual</div></div>
                <div className="costo-card" style={{background:'rgba(79,158,255,.06)',border:'1px solid rgba(79,158,255,.15)'}}><div className="costo-icon">🏷️</div><div className="costo-label">Valor de Venta Aprox.</div><div className="costo-value c-blue">${totalVentaAprox.toFixed(2)}</div><div className="costo-sub">Si se vende todo el stock</div></div>
                <div className="costo-card" style={{background:'rgba(52,211,153,.06)',border:'1px solid rgba(52,211,153,.15)'}}><div className="costo-icon">📈</div><div className="costo-label">Ganancia Aprox.</div><div className="costo-value" style={{color:'#34d399'}}>+${totalGananciaAprox.toFixed(2)}</div><div className="costo-sub">Margen: {totalVentaAprox > 0 ? ((totalGananciaAprox/totalVentaAprox)*100).toFixed(1) : 0}%</div></div>
                <div className="costo-card alertas"><div className="costo-icon">⚠️</div><div className="costo-label">Bajo Stock</div><div className="costo-value c-amber">{bajoStock}</div><div className="costo-sub">Productos con ≤{limiteStock} unidades</div></div>
              </div>
              <div className="section-title">📋 Desglose por Producto</div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr><th>Código</th><th>Producto</th><th>Stock</th><th>Costo Unit.</th><th>Precio Venta</th><th>Gan. Unit.</th><th>Capital Invertido</th><th>Ganancia Aprox.</th></tr>
                  </thead>
                  <tbody>
                    {[...productos].sort((a,b)=>(b.precioCompra*b.stock)-(a.precioCompra*a.stock)).map(p => {
                      const ganUnit  = p.precioVenta - p.precioCompra;
                      const ganTotal = ganUnit * p.stock;
                      const margen   = p.precioVenta > 0 ? ((ganUnit/p.precioVenta)*100).toFixed(1) : 0;
                      return (
                        <tr key={p.id}>
                          <td><span className="mono" style={{color:'#6b7280'}}>{p.codigo}</span></td>
                          <td style={{fontWeight:500}}>{p.nombre}</td>
                          <td><span className={`stock-badge ${stockStatus(p.stock,limiteStock)}`}>{p.stock}</span></td>
                          <td className="mono" style={{color:'#f87171'}}>${p.precioCompra.toFixed(2)}</td>
                          <td className="mono">${p.precioVenta.toFixed(2)}</td>
                          <td><span className={`profit-pill ${ganUnit>=0?'pos':'neg'}`}>{ganUnit>=0?'+':''}${ganUnit.toFixed(2)}<span style={{fontSize:10,opacity:.7,marginLeft:4}}>({margen}%)</span></span></td>
                          <td className="mono" style={{color:'#f87171',fontWeight:600}}>${(p.precioCompra*p.stock).toFixed(2)}</td>
                          <td><span className={`profit-pill ${ganTotal>=0?'pos':'neg'}`} style={{fontWeight:700}}>{ganTotal>=0?'+':''}${ganTotal.toFixed(2)}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{background:'#0d0f14',borderTop:'2px solid #1e2230'}}>
                      <td colSpan={6} style={{padding:'13px 15px',fontWeight:700,fontSize:13}}>TOTALES</td>
                      <td className="mono" style={{color:'#f87171',fontWeight:700,padding:'13px 15px'}}>${totalInvertido.toFixed(2)}</td>
                      <td style={{padding:'13px 15px'}}><span className="profit-pill pos" style={{fontWeight:700,fontSize:13}}>+${totalGananciaAprox.toFixed(2)}</span></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}

          {/* ── TAB GASTOS ── */}
          {tab === 'gastos' && esAdmin && (
            <>
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-label">Total Gastos Registrados</div><div className="stat-val" style={{color:'#f87171'}}>${totalGastosGeneral.toFixed(2)}</div></div>
                <div className="stat-card"><div className="stat-label">Nº de Gastos</div><div className="stat-val c-blue">{gastos.length}</div></div>
                <div className="stat-card">
                  <div className="stat-label">Categoría con más gasto</div>
                  <div className="stat-val" style={{fontSize:14, color:'#fbbf24', lineHeight:1.3, marginTop:4}}>{topCategoria ? topCategoria[0] : '—'}</div>
                  <div style={{fontSize:11, color:'#6b7280', fontFamily:'JetBrains Mono', marginTop:2}}>{topCategoria ? `$${topCategoria[1].toFixed(2)}` : ''}</div>
                </div>
                <div className="stat-card"><div className="stat-label">Promedio por gasto</div><div className="stat-val" style={{color:'#a78bfa'}}>${gastos.length > 0 ? (totalGastosGeneral / gastos.length).toFixed(2) : '0.00'}</div></div>
              </div>
              <div className="prod-form" style={{marginBottom:22}}>
                <div className="prod-form-title">➕ Registrar Nuevo Gasto</div>
                <div style={{display:'grid', gridTemplateColumns:'1fr auto auto auto auto', gap:10, alignItems:'flex-end'}}>
                  <div style={{display:'flex', flexDirection:'column', gap:5}}>
                    <label style={{fontSize:11, color:'#6b7280', fontFamily:'JetBrains Mono'}}>Descripción</label>
                    <input className="inp" style={{width:'100%'}} placeholder="Ej: Pago de renta de octubre"
                      value={nuevoGasto.descripcion} onChange={e => setNuevoGasto({...nuevoGasto, descripcion: e.target.value})}
                      onKeyDown={e => { if (e.key === 'Enter') agregarGasto(); }} />
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:5}}>
                    <label style={{fontSize:11, color:'#6b7280', fontFamily:'JetBrains Mono'}}>Monto $</label>
                    <input className="inp" style={{width:130, fontFamily:'JetBrains Mono', fontSize:15, color:'#f87171', borderColor:'rgba(248,113,113,.35)'}}
                      type="number" step="0.01" min="0" placeholder="0.00"
                      value={nuevoGasto.monto} onChange={e => setNuevoGasto({...nuevoGasto, monto: e.target.value})}
                      onKeyDown={e => { if (e.key === 'Enter') agregarGasto(); }} />
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:5}}>
                    <label style={{fontSize:11, color:'#6b7280', fontFamily:'JetBrains Mono'}}>Categoría</label>
                    <select className="inp" style={{minWidth:190}} value={nuevoGasto.categoria} onChange={e => setNuevoGasto({...nuevoGasto, categoria: e.target.value})}>
                      {CATEGORIAS_GASTO.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:5}}>
                    <label style={{fontSize:11, color:'#6b7280', fontFamily:'JetBrains Mono'}}>Fecha</label>
                    <input className="inp" type="date" value={nuevoGasto.fecha} onChange={e => setNuevoGasto({...nuevoGasto, fecha: e.target.value})} />
                  </div>
                  <button className="btn red" style={{padding:'10px 20px', fontSize:13, background:'rgba(248,113,113,.15)', color:'#f87171', border:'1px solid rgba(248,113,113,.35)', alignSelf:'flex-end'}} onClick={agregarGasto}>
                    💸 Registrar
                  </button>
                </div>
                <div style={{marginTop:10, fontSize:11, color:'#4b5563', fontFamily:'JetBrains Mono'}}>
                  💡 Los gastos registrados se descuentan automáticamente de los ingresos y ganancia neta en Reportes.
                </div>
              </div>
              {gastos.length > 0 && (
                <div style={{marginBottom:22}}>
                  <div className="section-title" style={{marginBottom:12}}>📊 Distribución por Categoría</div>
                  <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
                    {Object.entries(gastosPorCategoria).sort((a,b) => b[1]-a[1]).map(([cat, total]) => {
                      const pct = totalGastosGeneral > 0 ? ((total / totalGastosGeneral) * 100).toFixed(1) : 0;
                      const color = colorCategoria(cat);
                      return (
                        <div key={cat} style={{ background:`${color}12`, border:`1px solid ${color}30`, borderRadius:10, padding:'10px 16px', minWidth:160, cursor:'pointer', transition:'all .15s' }}
                          onClick={() => setFiltroCategGasto(filtroCategGasto === cat ? 'Todas' : cat)}>
                          <div style={{fontSize:11, color:'#6b7280', fontFamily:'JetBrains Mono', marginBottom:4}}>{cat}</div>
                          <div style={{fontSize:17, fontWeight:700, color, fontFamily:'JetBrains Mono'}}>${total.toFixed(2)}</div>
                          <div style={{marginTop:8, height:4, borderRadius:4, background:'#1e2230', overflow:'hidden'}}>
                            <div style={{width:`${pct}%`, height:'100%', background:color, borderRadius:4, transition:'width .3s'}}/>
                          </div>
                          <div style={{fontSize:10, color:'#4b5563', fontFamily:'JetBrains Mono', marginTop:4}}>{pct}% del total</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div style={{display:'flex', gap:12, alignItems:'center', marginBottom:16, flexWrap:'wrap'}}>
                <div className="search-wrap" style={{marginBottom:0, flex:1, minWidth:200, maxWidth:340}}>
                  <span className="search-icon">🔍</span>
                  <input className="search-input" placeholder="Buscar descripción o categoría..." value={busquedaGasto} onChange={e => setBusquedaGasto(e.target.value)} />
                </div>
                <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                  {gastosCategs.map(c => (
                    <button key={c} onClick={() => setFiltroCategGasto(c)} style={{
                      padding:'5px 12px', borderRadius:20, fontSize:11, cursor:'pointer',
                      fontFamily:'JetBrains Mono, monospace', fontWeight:600,
                      border:`1px solid ${filtroCategGasto===c?colorCategoria(c):'#2a3045'}`,
                      background: filtroCategGasto===c?`${colorCategoria(c)}20`:'transparent',
                      color: filtroCategGasto===c?colorCategoria(c):'#6b7280', transition:'all .15s'
                    }}>{c}</button>
                  ))}
                </div>
                <div style={{marginLeft:'auto', fontSize:12, color:'#4b5563'}}>
                  {gastosFiltrados.length} gasto{gastosFiltrados.length !== 1 ? 's' : ''} · Total: <span style={{color:'#f87171', fontFamily:'JetBrains Mono', fontWeight:700}}>${totalGastosFiltrados.toFixed(2)}</span>
                </div>
              </div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Monto</th><th>Registrado por</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {gastosFiltrados.length === 0 ? (
                      <tr><td colSpan={6} style={{padding:'50px', textAlign:'center', color:'#374151', fontSize:14}}>
                        {gastos.length === 0 ? 'Aún no hay gastos registrados' : 'Sin resultados para esta búsqueda'}
                      </td></tr>
                    ) : gastosFiltrados.map(g => (
                      <tr key={g.id}>
                        <td className="mono" style={{color:'#6b7280', whiteSpace:'nowrap'}}>{formatFecha(g.fecha)}</td>
                        <td style={{fontWeight:500}}>
                          {gastoEditando?.id === g.id ? (
                            <input className="inp" style={{width:'100%', minWidth:180}} value={gastoEditando.descripcion} autoFocus
                              onChange={e => setGastoEditando({...gastoEditando, descripcion: e.target.value})}
                              onKeyDown={e => { if(e.key==='Enter') guardarEdicionGasto(); if(e.key==='Escape') setGastoEditando(null); }} />
                          ) : g.descripcion}
                        </td>
                        <td>
                          {gastoEditando?.id === g.id ? (
                            <select className="inp" style={{minWidth:170}} value={gastoEditando.categoria} onChange={e => setGastoEditando({...gastoEditando, categoria: e.target.value})}>
                              {CATEGORIAS_GASTO.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          ) : (
                            <span style={{ fontSize:11, fontWeight:700, fontFamily:'JetBrains Mono, monospace', padding:'3px 10px', borderRadius:20,
                              background:`${colorCategoria(g.categoria)}18`, color: colorCategoria(g.categoria),
                              border:`1px solid ${colorCategoria(g.categoria)}35`, whiteSpace:'nowrap' }}>
                              {g.categoria}
                            </span>
                          )}
                        </td>
                        <td>
                          {gastoEditando?.id === g.id ? (
                            <input className="inp" style={{width:110, fontFamily:'JetBrains Mono', color:'#f87171'}} type="number" step="0.01" min="0"
                              value={gastoEditando.monto} onChange={e => setGastoEditando({...gastoEditando, monto: e.target.value})}
                              onKeyDown={e => { if(e.key==='Enter') guardarEdicionGasto(); if(e.key==='Escape') setGastoEditando(null); }} />
                          ) : (
                            <span className="mono" style={{color:'#f87171', fontWeight:700, fontSize:14}}>${g.monto.toFixed(2)}</span>
                          )}
                        </td>
                        <td><span style={{color:'#4f9eff', fontWeight:600, fontSize:13}}>{g.registradoPor}</span></td>
                        <td>
                          {gastoEditando?.id === g.id ? (
                            <div style={{display:'flex', gap:6}}>
                              <button className="btn green" style={{padding:'5px 12px', fontSize:12}} onClick={guardarEdicionGasto}>✓ Guardar</button>
                              <button className="btn ghost" style={{padding:'5px 10px', fontSize:12}} onClick={() => setGastoEditando(null)}>✕</button>
                            </div>
                          ) : (
                            <div style={{display:'flex', gap:6}}>
                              <button className="btn blue" style={{padding:'5px 12px', fontSize:12}}
                                onClick={() => setGastoEditando({ id:g.id, descripcion:g.descripcion, monto:String(g.monto), categoria:g.categoria, fecha:g.fecha })}>
                                ✏️ Editar
                              </button>
                              <button className="btn red" style={{padding:'5px 12px', fontSize:12, background:'#ef4444', color:'#fff'}}
                                onClick={() => setModalEliminarGasto(g)}>🗑️</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {gastosFiltrados.length > 0 && (
                    <tfoot>
                      <tr style={{background:'#0d0f14', borderTop:'2px solid #1e2230'}}>
                        <td colSpan={3} style={{padding:'13px 15px', fontWeight:700, fontSize:13}}>
                          TOTAL — {filtroCategGasto==='Todas'?'Todos los gastos':filtroCategGasto} ({gastosFiltrados.length})
                        </td>
                        <td className="mono" style={{color:'#f87171', fontWeight:700, padding:'13px 15px', fontSize:15}}>${totalGastosFiltrados.toFixed(2)}</td>
                        <td colSpan={2}/>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
          )}

          {/* ── TAB REPORTES ── */}
          {tab === 'reportes' && esAdmin && (
            <>
              <div className="rep-filtros">
                <div className="rep-filtro-item">
                  <label className="rep-label">Periodo</label>
                  <select className="inp" value={filtro} onChange={e => setFiltro(e.target.value)}>
                    <option value="dia">Por Día</option>
                    <option value="mes">Por Mes</option>
                    <option value="año">Por Año</option>
                  </select>
                </div>
                <div className="rep-filtro-item">
                  <label className="rep-label">Fecha</label>
                  <input className="inp" type="date" value={busquedaFecha} onChange={e => setBusquedaFecha(e.target.value)} />
                </div>
                <div className="rep-filtro-item" style={{flex:1}}>
                  <label className="rep-label">Buscar vendedor o producto</label>
                  <div className="search-wrap" style={{marginBottom:0}}>
                    <span className="search-icon">🔍</span>
                    <input className="search-input" placeholder="Buscar..." value={textoBusqueda} onChange={e => setTextoBusqueda(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="rep-kpi-grid" style={{gridTemplateColumns:'repeat(5, 1fr)'}}>
                <div className="rep-kpi-card ingresos">
                  <div className="rep-kpi-icon">💵</div>
                  <div className="rep-kpi-label">Ingresos Netos</div>
                  <div className="rep-kpi-value">${ingresosNetos.toLocaleString('es-MX',{minimumFractionDigits:2})}</div>
                  <div className="rep-kpi-sub">
                    {totalTickets} ventas · bruto ${totalVendido.toLocaleString('es-MX',{minimumFractionDigits:2})}
                    {totalGastosExtra > 0 && <span style={{display:'block', color:'#f87171', marginTop:2}}>− gastos ${totalGastosExtra.toFixed(2)}</span>}
                  </div>
                </div>
                <div className="rep-kpi-card costos">
                  <div className="rep-kpi-icon">📦</div>
                  <div className="rep-kpi-label">Costo de Mercancía</div>
                  <div className="rep-kpi-value">${totalGastos.toLocaleString('es-MX',{minimumFractionDigits:2})}</div>
                  <div className="rep-kpi-sub">Lo que costó lo vendido</div>
                </div>
                <div className="rep-kpi-card" style={{background:'rgba(248,113,113,.06)', border:'1px solid rgba(248,113,113,.18)'}}>
                  <div className="rep-kpi-icon">🧾</div>
                  <div className="rep-kpi-label">Gastos del Periodo</div>
                  <div className="rep-kpi-value" style={{color:'#f87171'}}>-${totalGastosExtra.toLocaleString('es-MX',{minimumFractionDigits:2})}</div>
                  <div className="rep-kpi-sub">
                    {gastosPeriodo.length} gasto{gastosPeriodo.length !== 1 ? 's' : ''} registrado
                    {gastosPeriodo.length > 0 && <span style={{display:'block', color:'#4f9eff', cursor:'pointer', marginTop:3}} onClick={() => setTab('gastos')}>Ver detalle →</span>}
                  </div>
                </div>
                <div className="rep-kpi-card ganancia">
                  <div className="rep-kpi-icon">📈</div>
                  <div className="rep-kpi-label">Ganancia Neta</div>
                  <div className={`rep-kpi-value ${gananciaNeta>=0?'pos':'neg'}`}>{gananciaNeta>=0?'+':''}${gananciaNeta.toLocaleString('es-MX',{minimumFractionDigits:2})}</div>
                  <div className="rep-kpi-sub">Ingresos − mercancía − gastos<br/>Margen: {totalVendido>0?((gananciaNeta/totalVendido)*100).toFixed(1):0}%</div>
                </div>
                <div className="rep-kpi-card top">
                  <div className="rep-kpi-icon">🏆</div>
                  <div className="rep-kpi-label">Top Producto</div>
                  <div className="rep-kpi-value" style={{fontSize:15,lineHeight:1.3,marginTop:6}}>{topProducto?topProducto[0]:'—'}</div>
                  <div className="rep-kpi-sub">{topProducto?`${topProducto[1]} unidades vendidas`:'Sin ventas'}</div>
                </div>
              </div>
              {totalGastosExtra > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', marginBottom:16,
                  background:'rgba(248,113,113,.07)', border:'1px solid rgba(248,113,113,.2)', borderRadius:10, fontSize:12, color:'#f87171', fontFamily:'JetBrains Mono, monospace' }}>
                  <span style={{fontSize:16}}>🧾</span>
                  <span>Se han deducido <strong>${totalGastosExtra.toFixed(2)}</strong> en gastos operativos ({gastosPeriodo.length} registro{gastosPeriodo.length !== 1 ? 's' : ''}) de los ingresos y ganancia neta {periodoLabel[filtro]}.</span>
                  <button style={{marginLeft:'auto', background:'none', border:'1px solid rgba(248,113,113,.35)', color:'#f87171', padding:'4px 12px', borderRadius:16, cursor:'pointer', fontSize:11}} onClick={() => setTab('gastos')}>Gestionar gastos →</button>
                </div>
              )}
              <div className="charts-grid">
                <div className="chart-card">
                  <div className="chart-title">📅 Ventas por Día<span className="chart-sub">{MESES[mesActual]} {añoActual}</span></div>
                  <AreaChartSVG data={ventasPorDia} />
                </div>
                <div className="chart-card">
                  <div className="chart-title">📊 Comparación Mensual<span className="chart-sub">Últimos 6 meses</span></div>
                  <BarChartSVG data={comparacionMensual} />
                </div>
              </div>
              <div className="section-title" style={{marginBottom:12}}>🧾 Detalle de Ventas</div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr><th>Hora</th><th>Producto</th><th>Cant.</th><th>Vendedor</th><th>Costo</th><th>Venta Total</th><th>Ganancia</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {ventasFiltradas.length > 0 ? ventasFiltradas.map((v, i) => {
                      const costo  = (v.precioCompra ?? 0) * (v.cantidad ?? 0);
                      const margen = (v.total ?? 0) - costo;
                      return (
                        <tr key={i}>
                          <td className="mono" style={{color:'#6b7280'}}>{formatHora(v.fechaVenta)}</td>
                          <td style={{fontWeight:500}}>{v.nombreProducto}</td>
                          <td><span style={{background:'#1e2230',padding:'3px 10px',borderRadius:20,fontSize:12,fontFamily:'JetBrains Mono, monospace'}}>{v.cantidad}</span></td>
                          <td><span style={{color:'#4f9eff',fontWeight:600,fontSize:13}}>{v.vendedorMatricula}</span></td>
                          <td className="mono" style={{color:'#f87171'}}>${costo.toFixed(2)}</td>
                          <td className="mono" style={{fontWeight:700}}>${(v.total??0).toFixed(2)}</td>
                          <td><span className={`profit-pill ${margen>=0?'pos':'neg'}`}>{margen>=0?'+':''}${margen.toFixed(2)}</span></td>
                          <td><button className="btn red" style={{padding:'5px 12px',fontSize:12,background:'#ef4444',color:'#fff'}} onClick={() => setModalConfirmarEliminar(v)}>🗑️ Eliminar</button></td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={8} style={{padding:'50px',textAlign:'center',color:'#374151',fontSize:14}}>Sin movimientos para este periodo</td></tr>
                    )}
                  </tbody>
                  {ventasFiltradas.length > 0 && (
                    <tfoot>
                      <tr style={{background:'#0d0f14',borderTop:'2px solid #1e2230'}}>
                        <td colSpan={4} style={{padding:'13px 15px',fontWeight:700,fontSize:13}}>TOTALES</td>
                        <td className="mono" style={{color:'#f87171',fontWeight:700,padding:'13px 15px'}}>${totalGastos.toFixed(2)}</td>
                        <td className="mono" style={{fontWeight:700,padding:'13px 15px'}}>
                          ${ingresosNetos.toFixed(2)}
                          {totalGastosExtra > 0 && <div style={{fontSize:10, color:'#6b7280', fontFamily:'JetBrains Mono', marginTop:2}}>bruto ${totalVendido.toFixed(2)}</div>}
                        </td>
                        <td style={{padding:'13px 15px'}}>
                          <span className={`profit-pill ${gananciaNeta>=0?'pos':'neg'}`}>{gananciaNeta>=0?'+':''}${gananciaNeta.toFixed(2)}</span>
                          {totalGastosExtra > 0 && <div style={{fontSize:10, color:'#f87171', fontFamily:'JetBrains Mono', marginTop:3}}>incl. -${totalGastosExtra.toFixed(2)} gastos</div>}
                        </td>
                        <td/>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
          )}

          {/* ── TAB VENTAS ── */}
          {tab === 'ventas' && (
            <>
              {ventaExitosa && (
                <div className="venta-flash" onClick={() => setVentaExitosa(null)}>
                  ✅ Venta #{ventaExitosa.id} registrada — Ticket descargado · <span style={{opacity:.7}}>Click para cerrar</span>
                </div>
              )}
              <div className="ventas-grid">
                <div className="venta-panel">
                  <div className="venta-section-title">🛍️ Seleccionar Producto</div>
                  <label className="rep-label" style={{marginBottom:6,display:'block'}}>Buscar producto</label>
                  <div className="search-wrap" style={{marginBottom:10}}>
                    <span className="search-icon">🔍</span>
                    <input className="search-input" placeholder="Nombre o código..." value={busquedaVenta}
                      onChange={e => { setBusquedaVenta(e.target.value); setSeleccion({productoId:'',codigo:'',nombre:'',precio:0,cantidad:1,stockDisponible:0}); }} />
                    {busquedaVenta && (
                      <button onClick={() => { setBusquedaVenta(''); setSeleccion({productoId:'',codigo:'',nombre:'',precio:0,cantidad:1,stockDisponible:0}); }}
                        style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#6b7280',cursor:'pointer',fontSize:14,padding:0}}>✕</button>
                    )}
                  </div>
                  <label className="rep-label" style={{marginBottom:6,display:'block'}}>Producto</label>
                  <select className="inp" style={{width:'100%',marginBottom:14}} value={seleccion.productoId} onChange={seleccionarProducto}>
                    <option value="">— Selecciona un producto —</option>
                    {productosFiltradosVenta.map(p => (
                      <option key={p.id} value={p.id} disabled={p.stock===0}>
                        {p.nombre} ({p.codigo}){p.stock===0?' — Sin stock':` — Stock: ${p.stock}`}
                      </option>
                    ))}
                  </select>
                  {seleccion.productoId && (
                    <div className="prod-seleccionado">
                      <div style={{fontWeight:600,fontSize:14}}>{seleccion.nombre}</div>
                      <div style={{display:'flex',gap:20,marginTop:6,fontSize:12,color:'#9ca3af'}}>
                        <span>Código: <span className="mono" style={{color:'#6b7280'}}>{seleccion.codigo}</span></span>
                        <span>Stock: <span style={{color:seleccion.stockDisponible<5?'#fbbf24':'#34d399',fontWeight:600}}>{seleccion.stockDisponible}</span></span>
                        <span>Precio: <span className="mono" style={{color:'#4f9eff',fontWeight:700}}>${seleccion.precio.toFixed(2)}</span></span>
                      </div>
                    </div>
                  )}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
                    <div>
                      <label className="rep-label" style={{marginBottom:6,display:'block'}}>Cantidad</label>
                      <input className="inp" style={{width:'100%'}} type="number" min="1" max={seleccion.stockDisponible} value={seleccion.cantidad}
                        onChange={e => setSeleccion({...seleccion,cantidad:parseInt(e.target.value)||1})} />
                    </div>
                    <div>
                      <label className="rep-label" style={{marginBottom:6,display:'block'}}>Precio unitario $</label>
                      <input className="inp" style={{width:'100%',borderColor:'rgba(79,158,255,.4)'}} type="number" step="0.01" placeholder="0.00"
                        value={seleccion.precio===0?'':seleccion.precio}
                        onChange={e => setSeleccion({...seleccion,precio:parseFloat(e.target.value)||0})} />
                    </div>
                  </div>
                  <button className="btn green" style={{width:'100%',padding:'13px',fontSize:14,justifyContent:'center'}} onClick={agregarALista}>
                    ➕ Añadir a la Venta
                  </button>
                  <div style={{borderTop:'1px solid #1e2230',marginTop:20,paddingTop:18}}>
                    <label className="rep-label" style={{marginBottom:6,display:'block'}}>💵 Pago con efectivo</label>
                    <input className="inp" style={{width:'100%',fontSize:22,fontFamily:'JetBrains Mono',color:'#fbbf24',borderColor:'rgba(251,191,36,.35)'}}
                      type="number" step="0.01" value={pago.efectivo} onChange={e => setPago({...pago,efectivo:e.target.value})} />
                    {parseFloat(pago.efectivo) > 0 && (
                      <div style={{display:'flex',justifyContent:'space-between',marginTop:10,padding:'10px 14px',background:'#0d0f14',borderRadius:8,border:'1px solid #1e2230'}}>
                        <span style={{fontSize:13,color:'#9ca3af'}}>Cambio:</span>
                        <span className="mono" style={{fontSize:18,fontWeight:700,color:pago.cambio>=0?'#34d399':'#ef4444'}}>${pago.cambio.toFixed(2)}</span>
                      </div>
                    )}
                    <button className="btn green" style={{width:'100%',padding:'15px',fontSize:16,justifyContent:'center',marginTop:14,background:listaVenta.length===0?'#1e2230':'#22c55e',color:listaVenta.length===0?'#4b5563':'#000'}}
                      onClick={handleVenta} disabled={listaVenta.length===0}>
                      ✅ Cobrar e Imprimir Ticket
                    </button>
                  </div>
                </div>
                <div className="venta-panel">
                  <div className="venta-section-title">🧾 Vista Previa del Ticket</div>
                  <div className="ticket-preview">
                    <div className="ticket-header">
                      <div style={{fontWeight:700,fontSize:15,letterSpacing:1}}>ISLA TECNOLÓGICA</div>
                      <div style={{fontSize:10,color:'#9ca3af',marginTop:3}}>VNSA Jose A. Pinedo 301</div>
                      <div style={{fontSize:10,color:'#9ca3af'}}>Aguascalientes, México · 449-540-5568</div>
                    </div>
                    <div className="ticket-divider"/>
                    <div style={{fontSize:11,color:'#6b7280',display:'flex',justifyContent:'space-between',marginBottom:10}}>
                      <span>Vendedor: <span style={{color:'#4f9eff'}}>{matricula}</span></span>
                      <span>{new Date().toLocaleDateString('es-MX')}</span>
                    </div>
                    {listaVenta.length === 0 ? (
                      <div style={{textAlign:'center',color:'#374151',fontSize:13,padding:'30px 0'}}>Sin productos aún...</div>
                    ) : listaVenta.map((item, i) => (
                      <div key={i} className="ticket-item">
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                          <div>
                            <div style={{fontWeight:600,fontSize:13}}>{item.nombre}</div>
                            <div style={{fontSize:11,color:'#6b7280'}}>{item.cantidad} × ${parseFloat(item.precio).toFixed(2)}</div>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <span className="mono" style={{fontWeight:700,color:'#e8eaf0'}}>${(item.precio*item.cantidad).toFixed(2)}</span>
                            <button className="ico-btn cancel" style={{width:22,height:22,fontSize:11}} onClick={() => quitarDeLista(i)}>✕</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="ticket-divider"/>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:13,color:'#9ca3af',fontWeight:600}}>TOTAL</span>
                      <span className="mono" style={{fontSize:24,fontWeight:700,color:'#22c55e'}}>${totalVenta.toFixed(2)}</span>
                    </div>
                    {parseFloat(pago.efectivo) > 0 && (
                      <div style={{marginTop:10,fontSize:12,color:'#6b7280',display:'flex',flexDirection:'column',gap:4}}>
                        <div style={{display:'flex',justifyContent:'space-between'}}><span>Efectivo:</span><span className="mono">${parseFloat(pago.efectivo).toFixed(2)}</span></div>
                        <div style={{display:'flex',justifyContent:'space-between',color:pago.cambio>=0?'#34d399':'#ef4444'}}><span>Cambio:</span><span className="mono" style={{fontWeight:700}}>${pago.cambio.toFixed(2)}</span></div>
                      </div>
                    )}
                    <div className="ticket-divider"/>
                    <div style={{textAlign:'center',fontSize:11,color:'#4b5563'}}>¡Gracias por su preferencia!</div>
                  </div>
                  {listaVenta.length > 0 && (
                    <div style={{marginTop:12,display:'flex',justifyContent:'space-between',fontSize:12,color:'#6b7280'}}>
                      <span>{listaVenta.length} producto(s)</span>
                      <span>{listaVenta.reduce((s,i)=>s+i.cantidad,0)} unidades</span>
                      <button className="btn ghost" style={{padding:'4px 10px',fontSize:11}} onClick={() => setListaVenta([])}>🗑️ Limpiar</button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── TAB USUARIOS ── */}
          {tab === 'usuarios' && esAdmin && (
            <>
              <div className="prod-form" style={{marginBottom:22}}>
                <div className="prod-form-title">➕ Agregar Nuevo Usuario</div>
                <div className="prod-form-grid" style={{alignItems:'flex-end'}}>
                  <div><label className="rep-label" style={{display:'block',marginBottom:6}}>Matrícula</label><input className="inp" placeholder="Ej: juan01" value={formUser.matricula} onChange={e => setFormUser({...formUser,matricula:e.target.value})} /></div>
                  <div><label className="rep-label" style={{display:'block',marginBottom:6}}>Contraseña</label><input className="inp" type="text" placeholder="Contraseña" value={formUser.password} onChange={e => setFormUser({...formUser,password:e.target.value})} /></div>
                  <div><label className="rep-label" style={{display:'block',marginBottom:6}}>Rol</label>
                    <select className="inp" value={formUser.rol} onChange={e => setFormUser({...formUser,rol:e.target.value})}>
                      <option value="VENDEDOR">VENDEDOR</option><option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <button className="btn green" onClick={agregarUsuario} disabled={cargandoUser}>{cargandoUser?'Guardando...':'✅ Agregar'}</button>
                </div>
              </div>
              <div className="stats-grid" style={{marginBottom:20}}>
                <div className="stat-card"><div className="stat-label">Total Usuarios</div><div className="stat-val c-blue">{usuarios.length}</div></div>
                <div className="stat-card"><div className="stat-label">Admins</div><div className="stat-val c-blue">{usuarios.filter(u=>u.rol==='ADMIN').length}</div></div>
                <div className="stat-card"><div className="stat-label">Vendedores</div><div className="stat-val c-blue">{usuarios.filter(u=>u.rol==='VENDEDOR').length}</div></div>
                <div className="stat-card"><div className="stat-label">Bloqueados</div><div className="stat-val c-amber">{usuarios.filter(u=>u.bloqueado).length}</div></div>
              </div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>ID</th><th>Matrícula</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {usuarios.length > 0 ? usuarios.map(u => (
                      <tr key={u.id}>
                        <td className="mono" style={{color:'#4b5563'}}>{u.id}</td>
                        <td style={{fontWeight:600}}>{u.matricula}</td>
                        <td>
                          <span className="inv-badge" style={{background:u.rol==='ADMIN'?'rgba(79,158,255,.15)':'rgba(34,197,94,.15)',border:`1px solid ${u.rol==='ADMIN'?'rgba(79,158,255,.35)':'rgba(34,197,94,.35)'}`,color:u.rol==='ADMIN'?'#4f9eff':'#34d399',fontSize:11,padding:'3px 10px',borderRadius:20,fontFamily:'JetBrains Mono,monospace',fontWeight:700}}>
                            {u.rol==='ADMIN'?'🔑':'👤'} {u.rol}
                          </span>
                        </td>
                        <td>
                          <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,fontFamily:'JetBrains Mono,monospace',background:u.bloqueado?'rgba(239,68,68,.12)':'rgba(34,197,94,.12)',color:u.bloqueado?'#ef4444':'#22c55e',border:`1px solid ${u.bloqueado?'rgba(239,68,68,.25)':'rgba(34,197,94,.25)'}`}}>
                            {u.bloqueado?'🔒 Bloqueado':'✅ Activo'}
                          </span>
                        </td>
                        <td>
                          <div style={{display:'flex',gap:8}}>
                            <button className={`btn ${u.bloqueado?'green':'orange'}`} style={{padding:'5px 12px',fontSize:12}} onClick={() => toggleBloqueo(u.id,u.bloqueado)}>
                              {u.bloqueado?'🔓 Desbloquear':'🔒 Bloquear'}
                            </button>
                            <button className="btn red" style={{padding:'5px 12px',fontSize:12,background:'#ef4444',color:'#fff'}} onClick={() => eliminarUsuario(u.id,u.matricula)}>🗑️ Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} style={{padding:'40px',textAlign:'center',color:'#374151',fontSize:14}}>No hay usuarios registrados.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ══════════════ MODALES ══════════════ */}
      {modalLimite && (
        <div className="modal-overlay" onClick={() => setModalLimite(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">⚙️ Configurar Límite de Stock Bajo</div>
            <p style={{fontSize:13,color:'#9ca3af',marginBottom:16,lineHeight:1.6}}>Productos con stock igual o menor a este número se marcarán como bajo stock o crítico.</p>
            <div className="modal-label">Límite mínimo de unidades</div>
            <input className="inp" style={{width:'100%'}} type="number" min="0" value={limiteTemp} onChange={e => setLimiteTemp(e.target.value)} placeholder={`Actual: ${limiteStock}`} autoFocus />
            <div style={{fontSize:12,color:'#6b7280',marginTop:8}}>💡 Ej: 5 → productos con ≤5 unidades se marcan como bajo stock.</div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setModalLimite(false)}>Cancelar</button>
              <button className="btn green" onClick={guardarLimite}>Guardar</button>
            </div>
          </div>
        </div>
      )}
      {modalAgregarStock && (
        <div className="modal-overlay" onClick={() => setModalAgregarStock(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">➕ Agregar Stock</div>
            <div style={{background:'#0d0f14',border:'1px solid #1e2230',borderRadius:10,padding:'14px 16px',marginBottom:18}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>{modalAgregarStock.nombre}</div>
              <div style={{display:'flex',gap:20,fontSize:12,color:'#9ca3af'}}>
                <span>Código: <span className="mono" style={{color:'#6b7280'}}>{modalAgregarStock.codigo}</span></span>
                <span>Stock actual: <span style={{color:'#fbbf24',fontWeight:700,fontFamily:'JetBrains Mono'}}>{modalAgregarStock.stock} uds</span></span>
              </div>
            </div>
            <div className="modal-label">¿Cuántas unidades quieres agregar?</div>
            <input className="inp" style={{width:'100%',fontSize:22,fontFamily:'JetBrains Mono',color:'#34d399',textAlign:'center',borderColor:'rgba(52,211,153,.35)'}}
              type="number" min="1" value={cantidadAgregar} autoFocus placeholder="0"
              onChange={e => setCantidadAgregar(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter') confirmarAgregarStock(); if(e.key==='Escape') setModalAgregarStock(null); }} />
            {parseInt(cantidadAgregar) > 0 && (
              <div style={{marginTop:12,display:'flex',alignItems:'center',justifyContent:'center',gap:12,fontSize:14,fontFamily:'JetBrains Mono'}}>
                <span style={{color:'#6b7280'}}>{modalAgregarStock.stock}</span>
                <span style={{color:'#4b5563',fontSize:18}}>+</span>
                <span style={{color:'#34d399',fontWeight:700}}>{cantidadAgregar}</span>
                <span style={{color:'#4b5563',fontSize:18}}>=</span>
                <span style={{color:'#e8eaf0',fontWeight:700,fontSize:16}}>{modalAgregarStock.stock+parseInt(cantidadAgregar)} uds</span>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setModalAgregarStock(null)}>Cancelar</button>
              <button className="btn green" onClick={confirmarAgregarStock}>✅ Confirmar</button>
            </div>
          </div>
        </div>
      )}
      {modalConfirmarEliminar && (
        <div className="modal-overlay" onClick={() => setModalConfirmarEliminar(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🗑️ Eliminar Venta</div>
            <p style={{fontSize:13,color:'#9ca3af',marginBottom:16,lineHeight:1.6}}>
              ¿Estás seguro de que deseas eliminar esta venta? Esta acción no se puede deshacer y <strong style={{color:'#fbbf24'}}>no restaurará automáticamente el stock</strong> del producto.
            </p>
            <div style={{background:'#0d0f14',border:'1px solid #1e2230',borderRadius:10,padding:'14px 16px',marginBottom:18}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:8,color:'#e8eaf0'}}>{modalConfirmarEliminar.nombreProducto}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:16,fontSize:12,color:'#9ca3af'}}>
                <span>Cantidad: <span style={{color:'#e8eaf0',fontWeight:600,fontFamily:'JetBrains Mono'}}>{modalConfirmarEliminar.cantidad}</span></span>
                <span>Total: <span style={{color:'#22c55e',fontWeight:700,fontFamily:'JetBrains Mono'}}>${(modalConfirmarEliminar.total??0).toFixed(2)}</span></span>
                <span>Vendedor: <span style={{color:'#4f9eff',fontWeight:600}}>{modalConfirmarEliminar.vendedorMatricula}</span></span>
                <span>Hora: <span style={{color:'#6b7280',fontFamily:'JetBrains Mono'}}>{formatHora(modalConfirmarEliminar.fechaVenta)}</span></span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setModalConfirmarEliminar(null)}>Cancelar</button>
              <button className="btn red" style={{background:'#ef4444',color:'#fff',fontWeight:700}} onClick={() => eliminarVenta(modalConfirmarEliminar)}>🗑️ Sí, eliminar venta</button>
            </div>
          </div>
        </div>
      )}
      {modalEliminarGasto && (
        <div className="modal-overlay" onClick={() => setModalEliminarGasto(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🗑️ Eliminar Gasto</div>
            <p style={{fontSize:13, color:'#9ca3af', marginBottom:16, lineHeight:1.6}}>¿Confirmas que deseas eliminar este gasto? Esta acción no se puede deshacer.</p>
            <div style={{background:'#0d0f14', border:'1px solid #1e2230', borderRadius:10, padding:'14px 16px', marginBottom:18}}>
              <div style={{fontWeight:700, fontSize:14, marginBottom:8, color:'#e8eaf0'}}>{modalEliminarGasto.descripcion}</div>
              <div style={{display:'flex', flexWrap:'wrap', gap:16, fontSize:12, color:'#9ca3af'}}>
                <span>Monto: <span style={{color:'#f87171', fontWeight:700, fontFamily:'JetBrains Mono'}}>${modalEliminarGasto.monto.toFixed(2)}</span></span>
                <span>Categoría: <span style={{color: colorCategoria(modalEliminarGasto.categoria), fontWeight:600}}>{modalEliminarGasto.categoria}</span></span>
                <span>Fecha: <span style={{color:'#6b7280', fontFamily:'JetBrains Mono'}}>{formatFecha(modalEliminarGasto.fecha)}</span></span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setModalEliminarGasto(null)}>Cancelar</button>
              <button className="btn red" style={{background:'#ef4444', color:'#fff', fontWeight:700}} onClick={confirmarEliminarGasto}>🗑️ Sí, eliminar gasto</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Inventario; 