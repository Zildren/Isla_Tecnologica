import React from 'react';
import { useNavigate } from 'react-router-dom';

const empresas = () => {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 40, color: '#e8eaf0' }}>
      <button onClick={() => navigate('/inventario')}
        style={{ background: 'none', border: '1px solid #2a3045', color: '#9ca3af',
          padding: '8px 16px', borderRadius: 8, cursor: 'pointer', marginBottom: 24 }}>
        ← Volver
      </button>
      <h2>🏢 Empresas</h2>
      <p style={{ color: '#6b7280' }}>Próximamente...</p>
    </div>
  );
};

export default empresas;