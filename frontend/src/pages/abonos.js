import React from 'react';
import { useNavigate } from 'react-router-dom';

const Abonos = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0f14',
      color: '#e8eaf0',
      fontFamily: 'JetBrains Mono, monospace',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    }}>
      <span style={{ fontSize: 52 }}>💳</span>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
        Módulo de <span style={{ color: '#34d399' }}>Abonos</span>
      </h1>
      <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
        En construcción...
      </p>
      <button
        onClick={() => navigate('/inventario')}
        style={{
          marginTop: 10,
          padding: '10px 24px',
          borderRadius: 10,
          border: '1px solid #2a3045',
          background: 'rgba(79,158,255,.1)',
          color: '#4f9eff',
          cursor: 'pointer',
          fontSize: 14,
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        ← Volver al Inventario
      </button>
    </div>
  );
};

export default Abonos;