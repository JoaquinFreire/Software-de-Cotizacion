import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/login.css'; // Archivo de estilos
import anodalLogo from '../images/anodal_logo.png';

const Login = () => {
    const [legajo, setLegajo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); // Limpiar errores previos

        try {
            const response = await axios.post('http://localhost:5187/api/auth/login', { legajo, password });
            localStorage.setItem('token', response.data.token); // Guardar el token
            navigate('/dashboard'); // Redirigir si el login es exitoso
        } catch (err) {
            if (err.response && err.response.data.error) {
                setError(err.response.data.error); // Mostrar el error específico
            } else {
                setError('Error en la conexión con el servidor');
            }
        }
    };

    return (
        <div className="login-container">
            <div className="login-overlay"></div>
            <div className="login-box">
                <img src={anodalLogo} alt="Logo de Anodal" />
                <h2 className="subtitle">Cotizaciones</h2>
                <form onSubmit={handleLogin}>
                    <label className="label" htmlFor="legajo">Legajo</label>
                    <input
                        type="text"
                        placeholder="Ingrese su legajo"
                        id="legajo"
                        value={legajo}
                        onChange={(e) => setLegajo(e.target.value)}
                        required
                    />
                    <label className="label" htmlFor="password">Contraseña</label>
                    <input
                        type="password"
                        placeholder="Ingrese su contraseña"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit">Siguiente</button>
                </form>
                {error && <p className="error-message">{error}</p>} {/* Mostrar errores aquí */}
                <p className="forgot-password">Recuperar contraseña</p>
            </div>
        </div>
    );
};

export default Login;
