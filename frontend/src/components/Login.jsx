import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUsuario } from '../services/authService';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ matricula: '', password: '' });
    const [cargando, setCargando] = useState(false);
    const [verPassword, setVerPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const matriculaLimpia = form.matricula.trim();
        const passwordLimpia = form.password.trim();

        if (!matriculaLimpia || !passwordLimpia) {
            alert("Por favor, llena ambos campos");
            return;
        }

        setCargando(true);

        try {
            const resultado = await loginUsuario(matriculaLimpia, passwordLimpia);
            const status = resultado.status?.trim().toUpperCase();

            if (status === "BIENVENIDO_ADMIN" || status === "BIENVENIDO_VENDEDOR") {
                // 🔑 Guardar token y empresaId
                localStorage.setItem('token', resultado.token);
                localStorage.setItem('empresaId', resultado.empresaId);
                localStorage.setItem('usuarioLogueado', matriculaLimpia);
                localStorage.setItem('rolUsuario', status === "BIENVENIDO_ADMIN" ? 'ADMIN' : 'VENDEDOR');
                navigate("/inventario");
            } else {
                alert("Matrícula o contraseña incorrecta.");
            }
        } catch (error) {
            alert("Error de conexión con el servidor");
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="login-root">
            <div className="bg-mesh" />
            <div className="bg-grid" />
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <div className={`login-card ${mounted ? 'visible' : ''}`}>
                <div className="card-shine" />

                <img src="/logo.png" alt="Isla Tecnológica" className="brand-logo" />

                <div className="badge">
                    <span className="badge-dot" />
                    Sistema Seguro
                </div>

                <h1 className="brand-title">
                    Isla<br /><span>Tecnológica</span>
                </h1>
                <p className="brand-sub">Accede con tus credenciales</p>

                <div className="divider" />

                <form onSubmit={handleSubmit}>
                    {/* Matrícula */}
                    <div className={`field-group ${focusedField === 'matricula' ? 'focused' : ''}`}>
                        <label className="field-label">Matrícula</label>
                        <div className="input-wrapper">
                            <span className="input-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </span>
                            <input
                                className="field-input"
                                type="text"
                                placeholder="Tu matrícula"
                                value={form.matricula}
                                onFocus={() => setFocusedField('matricula')}
                                onBlur={() => setFocusedField(null)}
                                onChange={(e) => setForm({ ...form, matricula: e.target.value })}
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    {/* Contraseña */}
                    <div className={`field-group ${focusedField === 'password' ? 'focused' : ''}`}>
                        <label className="field-label">Contraseña</label>
                        <div className="input-wrapper">
                            <span className="input-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                            </span>
                            <input
                                className="field-input with-eye"
                                type={verPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={form.password}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="eye-btn"
                                onClick={() => setVerPassword(!verPassword)}
                                tabIndex={-1}
                                aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {verPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                        <line x1="1" y1="1" x2="23" y2="23"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={cargando}
                    >
                        {cargando ? (
                            <><span className="spinner" />Verificando...</>
                        ) : (
                            'Entrar al Sistema'
                        )}
                    </button>
                </form>

                <p className="login-footer">© 2026 · Isla Tecnológica · v3.0</p>
            </div>
        </div>
    );
};

export default Login;