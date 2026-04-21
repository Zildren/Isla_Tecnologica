import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Inventario from './pages/Inventario';
import Empresas from './pages/empresas';
import Abonos from './pages/Abonos';

const PrivateRoute = ({ children }) => {
  const usuario = localStorage.getItem('usuarioLogueado');
  return usuario ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/inventario" element={
        <PrivateRoute>
          <Inventario />
        </PrivateRoute>
      } />
      <Route path="/empresas" element={
        <PrivateRoute>
          <Empresas />
        </PrivateRoute>
      } />
      <Route path="/abonos" element={
        <PrivateRoute>
          <Abonos />
        </PrivateRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;