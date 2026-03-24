import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerVentas } from '../services/ventaService';

const Reportes = () => {
    const navigate = useNavigate();
    const [todasLasVentas, setTodasLasVentas] = useState([]);
    const [filtro, setFiltro] = useState('dia');
    const [busquedaFecha, setBusquedaFecha] = useState(new Date().toISOString().split('T')[0]);
    const [textoBusqueda, setTextoBusqueda] = useState('');

    useEffect(() => {
        if (!localStorage.getItem('usuarioLogueado')) {
            navigate("/");
        } else {
            cargarDatos();
        }
    }, [navigate]);

    const cargarDatos = async () => {
        const data = await obtenerVentas();
        if (data) {
            if (data.length > 0) {
                console.log(">>> [DEBUG] Ejemplo venta recibida:", {
                    producto: data[0].nombreProducto,
                    precioCompra: data[0].precioCompra,
                    precioVenta: data[0].precioVenta,
                    cantidad: data[0].cantidad,
                    total: data[0].total
                });
            }
            setTodasLasVentas(data);
        }
    };

    // PROCESAMIENTO DE FECHAS Y FILTRADO
    const fechaRef = new Date(busquedaFecha + "T12:00:00");

    const ventasFiltradas = todasLasVentas.filter(v => {
        // Fecha siempre llega como string ISO desde el backend
        const fechaV = new Date(v.fechaVenta);

        const coincideTiempo =
            filtro === 'dia'
                ? fechaV.toDateString() === fechaRef.toDateString()
                : filtro === 'mes'
                ? fechaV.getMonth() === fechaRef.getMonth() &&
                  fechaV.getFullYear() === fechaRef.getFullYear()
                : fechaV.getFullYear() === fechaRef.getFullYear();

        const coincideTexto =
            v.vendedorMatricula?.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
            v.nombreProducto?.toLowerCase().includes(textoBusqueda.toLowerCase());

        return coincideTiempo && coincideTexto;
    });

    // CÁLCULOS FINANCIEROS
    const totalVendido = ventasFiltradas.reduce((acc, v) => acc + (v.total ?? 0), 0);
    const totalGastos = ventasFiltradas.reduce((acc, v) => {
        const costo = v.precioCompra ?? 0;
        const cant = v.cantidad ?? 0;
        return acc + costo * cant;
    }, 0);
    const gananciaNeta = totalVendido - totalGastos;

    const formatearFecha = (fv) => {
        try {
            return new Date(fv).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '--:--';
        }
    };

    return (
        <div style={{ padding: '30px', fontFamily: 'Arial', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: '#2c3e50', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '30px' }}>📊</span> Dashboard Financiero - Isla Tecnológica
                </h2>
                <button
                    onClick={() => navigate("/inventario")}
                    style={{ backgroundColor: '#34495e', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                >
                    ⬅️ Volver al Inventario
                </button>
            </div>

            {/* PANEL DE FILTROS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr auto', gap: '15px', background: '#fff', padding: '25px', borderRadius: '15px', marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', alignItems: 'flex-end' }}>
                <div>
                    <label style={{ fontWeight: 'bold', color: '#555' }}>Periodo:</label>
                    <select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #dcdde1', marginTop: '8px', outline: 'none' }}>
                        <option value="dia">Vista por Día</option>
                        <option value="mes">Vista por Mes</option>
                        <option value="año">Vista por Año</option>
                    </select>
                </div>
                <div>
                    <label style={{ fontWeight: 'bold', color: '#555' }}>Seleccionar Fecha:</label>
                    <input
                        type="date"
                        value={busquedaFecha}
                        onChange={(e) => setBusquedaFecha(e.target.value)}
                        style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #dcdde1', marginTop: '8px', outline: 'none' }}
                    />
                </div>
                <div>
                    <label style={{ fontWeight: 'bold', color: '#555' }}>Buscador Rápido:</label>
                    <input
                        type="text"
                        placeholder="Buscar por vendedor o producto..."
                        value={textoBusqueda}
                        onChange={(e) => setTextoBusqueda(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #3498db', marginTop: '8px', outline: 'none' }}
                    />
                </div>
                <button
                    onClick={cargarDatos}
                    style={{ backgroundColor: '#3498db', color: 'white', padding: '13px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    🔄 Actualizar
                </button>
            </div>

            {/* TARJETAS DE MÉTRICAS FINANCIERAS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '40px' }}>
                <div style={{ background: '#fff', padding: '30px', borderRadius: '20px', borderBottom: '6px solid #3498db', textAlign: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '14px', color: '#7f8c8d', fontWeight: 'bold', textTransform: 'uppercase' }}>Ingresos Totales</span>
                    <h2 style={{ color: '#2980b9', fontSize: '32px', margin: '10px 0' }}>
                        ${totalVendido.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </h2>
                </div>
                <div style={{ background: '#fff', padding: '30px', borderRadius: '20px', borderBottom: '6px solid #e74c3c', textAlign: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '14px', color: '#7f8c8d', fontWeight: 'bold', textTransform: 'uppercase' }}>Costo de Inversión</span>
                    <h2 style={{ color: '#c0392b', fontSize: '32px', margin: '10px 0' }}>
                        ${totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </h2>
                </div>
                <div style={{ background: '#fff', padding: '30px', borderRadius: '20px', borderBottom: '6px solid #27ae60', textAlign: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '14px', color: '#7f8c8d', fontWeight: 'bold', textTransform: 'uppercase' }}>Ganancia Neta</span>
                    <h2 style={{ color: gananciaNeta >= 0 ? '#27ae60' : '#e74c3c', fontSize: '32px', margin: '10px 0' }}>
                        ${gananciaNeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </h2>
                </div>
            </div>

            {/* TABLA DE VENTAS */}
            <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#2c3e50', color: 'white' }}>
                        <tr>
                            <th style={{ padding: '18px' }}>Hora</th>
                            <th style={{ textAlign: 'left', paddingLeft: '20px' }}>Producto</th>
                            <th>Cant.</th>
                            <th>Vendedor</th>
                            <th>Precio Compra</th>
                            <th>Venta</th>
                            <th>Margen Ganancia</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ventasFiltradas.length > 0 ? ventasFiltradas.map((v, i) => {
                            const costo = (v.precioCompra ?? 0) * (v.cantidad ?? 0);
                            const margen = (v.total ?? 0) - costo;
                            return (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f2f6', textAlign: 'center', backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    <td style={{ padding: '15px', color: '#7f8c8d' }}>{formatearFecha(v.fechaVenta)}</td>
                                    <td style={{ textAlign: 'left', paddingLeft: '20px', fontWeight: '500' }}>{v.nombreProducto}</td>
                                    <td><span style={{ background: '#f1f2f6', padding: '4px 10px', borderRadius: '20px', fontSize: '13px' }}>{v.cantidad}</span></td>
                                    <td><b style={{ color: '#34495e' }}>{v.vendedorMatricula}</b></td>
                                    <td style={{ color: '#c0392b' }}>${((v.precioCompra ?? 0) * (v.cantidad ?? 0)).toFixed(2)}</td>
                                    <td style={{ fontWeight: 'bold' }}>${(v.total ?? 0).toFixed(2)}</td>
                                    <td style={{ color: margen >= 0 ? '#27ae60' : '#e74c3c', fontWeight: 'bold' }}>
                                        {margen >= 0 ? '+' : ''}${margen.toFixed(2)}
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="7" style={{ padding: '50px', color: '#bdc3c7', textAlign: 'center', fontSize: '18px' }}>
                                    No hay movimientos registrados para este periodo.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Reportes;