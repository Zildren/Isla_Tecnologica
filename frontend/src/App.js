import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Inventario from './pages/Inventario';
import Empresas from './pages/Empresas';
import Abonos from './pages/Abonos';

const PrivateRoute = ({ children }) => {
  const usuario = localStorage.getItem('usuarioLogueado');
  return usuario ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;