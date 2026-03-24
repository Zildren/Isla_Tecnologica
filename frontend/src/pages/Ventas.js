import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerProductos } from '../services/productoService';
import { registrarVenta } from '../services/ventaService';

const Ventas = () => {
    const navigate = useNavigate();
    const [productos, setProductos] = useState([]);
    const [seleccion, setSeleccion] = useState({
        productoId: '', codigo: '', nombre: '', precio: 0, cantidad: 1, stockDisponible: 0
    });
    const [listaVenta, setListaVenta] = useState([]);
    const [pago, setPago] = useState({ efectivo: 0, cambio: 0 });

    useEffect(() => {
        if (!localStorage.getItem('usuarioLogueado')) {
            navigate("/");
        } else {
            obtenerProductos().then(setProductos);
        }
    }, [navigate]);

    const totalVenta = listaVenta.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

    useEffect(() => {
        setPago(prev => ({ ...prev, cambio: prev.efectivo > 0 ? prev.efectivo - totalVenta : 0 }));
    }, [pago.efectivo, totalVenta]);

    const seleccionarProducto = (e) => {
        const prod = productos.find(p => p.id.toString() === e.target.value);
        if (prod) {
            setSeleccion({
                productoId: prod.id, codigo: prod.codigo, nombre: prod.nombre,
                precio: prod.precioVenta, cantidad: 1, stockDisponible: prod.stock
            });
        }
    };

    const agregarALista = () => {
        if (!seleccion.productoId) return alert("Selecciona un producto");
        if (seleccion.cantidad > seleccion.stockDisponible) return alert("Stock insuficiente");
        setListaVenta([...listaVenta, { ...seleccion }]);
        setSeleccion({ productoId: '', codigo: '', nombre: '', precio: 0, cantidad: 1, stockDisponible: 0 });
    };

    // ✅ Genera el PDF solo del ticket
    const generarTicketPDF = (venta) => {
        import('jspdf').then(({ default: jsPDF }) => {
            const doc = new jsPDF({ unit: 'mm', format: [80, 200] });

            const x = 5;
            let y = 10;
            const lh = 6;

            doc.setFontSize(13);
            doc.setFont('courier', 'bold');
            doc.text('ISLA TECNOLÓGICA', 40, y, { align: 'center' }); y += lh;

            doc.setFontSize(8);
            doc.setFont('courier', 'normal');
            doc.text('VNSA Jose A. Pinedo 301', 40, y, { align: 'center' }); y += lh - 1;
            doc.text('Aguascalientes, México', 40, y, { align: 'center' }); y += lh;
            doc.text('449-540-5568', 40, y, { align: 'center' }); y += lh;
            doc.text('--------------------------------', 40, y, { align: 'center' }); y += lh;

            doc.setFontSize(9);
            doc.text(`Venta: ${venta.id}`, x, y);
            doc.text(new Date().toLocaleDateString(), 75, y, { align: 'right' }); y += lh;
            doc.text(`Atendido por: ${venta.vendedorMatricula}`, x, y); y += lh;
            doc.text('--------------------------------', 40, y, { align: 'center' }); y += lh;

            // Productos
            venta.productos.forEach(item => {
                doc.setFont('courier', 'bold');
                doc.text(`${item.cantidad} x ${item.nombre}`, x, y); y += lh;
                doc.setFont('courier', 'normal');
                doc.text(`$${parseFloat(item.precio).toFixed(2)} c/u`, x, y);
                doc.text(`$${(item.precio * item.cantidad).toFixed(2)}`, 75, y, { align: 'right' }); y += lh;
            });

            doc.text('--------------------------------', 40, y, { align: 'center' }); y += lh;

            doc.setFontSize(11);
            doc.setFont('courier', 'bold');
            doc.text('TOTAL:', x, y);
            doc.text(`MXN $${venta.total.toFixed(2)}`, 75, y, { align: 'right' }); y += lh;

            doc.setFontSize(9);
            doc.setFont('courier', 'normal');
            doc.text('Efectivo:', x, y);
            doc.text(`$${parseFloat(venta.efectivo).toFixed(2)}`, 75, y, { align: 'right' }); y += lh;
            doc.text('Cambio:', x, y);
            doc.text(`$${venta.cambio.toFixed(2)}`, 75, y, { align: 'right' }); y += lh + 3;

            doc.text('--------------------------------', 40, y, { align: 'center' }); y += lh;
            doc.text('¡Gracias por su preferencia!', 40, y, { align: 'center' }); y += lh;
            doc.setFontSize(7);
            doc.text(`${venta.id}-${Math.random().toString(36).substr(2, 5)}`, 40, y, { align: 'center' });

            doc.save(`ticket-${venta.id}.pdf`);
        });
    };

    const handleVenta = async (e) => {
        e.preventDefault();
        if (listaVenta.length === 0) return alert("La lista está vacía");
        if (pago.efectivo < totalVenta) return alert("❌ Efectivo insuficiente");

        for (let item of listaVenta) {
            await registrarVenta({
                codigoProducto: item.codigo,
                nombreProducto: item.nombre,
                cantidad: item.cantidad,
                precioVenta: item.precio,
                vendedorMatricula: localStorage.getItem('usuarioLogueado')
            });
        }

        const venta = {
            id: Math.floor(Math.random() * 10000),
            productos: listaVenta,
            total: totalVenta,
            efectivo: pago.efectivo,
            cambio: pago.cambio,
            vendedorMatricula: localStorage.getItem('usuarioLogueado')
        };

        // ✅ Genera solo el PDF del ticket, sin imprimir toda la pantalla
        generarTicketPDF(venta);

        // Limpiar todo
        setListaVenta([]);
        setPago({ efectivo: 0, cambio: 0 });
    };

    return (
        <div style={{ padding: '30px', fontFamily: 'Arial', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <button onClick={() => navigate("/inventario")} style={{ backgroundColor: '#6c757d', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>⬅️ Inventario</button>
                <h2 style={{ color: '#007bff' }}>🛒 Terminal - Isla Tecnológica</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                {/* FORMULARIO */}
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <label><b>Seleccionar Producto</b></label>
                    <select value={seleccion.productoId} onChange={seleccionarProducto} style={{ width: '100%', padding: '12px', margin: '10px 0', borderRadius: '8px' }}>
                        <option value="">-- Buscar --</option>
                        {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.codigo})</option>)}
                    </select>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <input type="number" placeholder="Cant" value={seleccion.cantidad} onChange={e => setSeleccion({...seleccion, cantidad: e.target.value})} style={{ padding: '10px', borderRadius: '8px' }} />
                        <input type="number" placeholder="Precio $" value={seleccion.precio} onChange={e => setSeleccion({...seleccion, precio: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #007bff' }} />
                    </div>

                    <button onClick={agregarALista} style={{ width: '100%', padding: '15px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', marginTop: '15px', fontWeight: 'bold', cursor: 'pointer' }}>
                        ➕ AÑADIR A LA VENTA
                    </button>

                    <div style={{ marginTop: '20px', borderTop: '2px dashed #eee', paddingTop: '20px' }}>
                        <label><b>Paga con (Efectivo):</b></label>
                        <input type="number" value={pago.efectivo} onChange={e => setPago({...pago, efectivo: e.target.value})} style={{ width: '100%', padding: '15px', fontSize: '20px', borderRadius: '8px', marginTop: '5px' }} />
                        <button onClick={handleVenta} style={{ width: '100%', padding: '15px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '8px', marginTop: '20px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' }}>
                            ✅ COBRAR E IMPRIMIR
                        </button>
                    </div>
                </div>

                {/* VISTA PREVIA */}
                <div style={{ background: '#e9ecef', padding: '15px', borderRadius: '12px', border: '1px solid #ccc' }}>
                    <h4 style={{ textAlign: 'center', margin: '0' }}>Resumen de Venta</h4>
                    <div style={{ background: '#fff', padding: '15px', marginTop: '10px', minHeight: '350px', fontSize: '13px', fontFamily: 'monospace' }}>
                        <center><b>ISLA TECNOLÓGICA</b></center>
                        <hr/>
                        {listaVenta.map((item, i) => (
                            <div key={i} style={{ marginBottom: '5px' }}>
                                <div>{item.cantidad} x {item.nombre}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>${item.precio}</span> <span>${(item.precio * item.cantidad).toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                        <hr/>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
                            <span>TOTAL:</span> <span>${totalVenta.toFixed(2)}</span>
                        </div>
                        <p>Cambio: <span style={{ color: 'blue' }}>${pago.cambio.toFixed(2)}</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Ventas;