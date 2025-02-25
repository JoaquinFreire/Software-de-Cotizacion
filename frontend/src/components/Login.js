import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/login.css'; // Importamos los estilos
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
            
            if (response.data.token) {
                localStorage.setItem('token', response.data.token); // Guardar token en localStorage
                navigate('/dashboard'); // Redirigir al Dashboard
            } else {
                setError('Error en la autenticación');
            }
        } catch (err) {
            setError('Credenciales inválidas. Inténtelo de nuevo.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-overlay"></div>
            <div className="login-box">
                <img src={anodalLogo} alt="Logo de Anodal" className="login-logo" />
                <h2 className="subtitle">Cotizaciones</h2>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label htmlFor="legajo">Legajo</label>
                        <input
                            type="text"
                            id="legajo"
                            placeholder="Ingrese su legajo"
                            value={legajo}
                            onChange={(e) => setLegajo(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Ingrese su contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">Siguiente</button>
                </form>
                {error && <p className="error-message">{error}</p>}
                <p className="forgot-password">Recuperar contraseña</p>
            </div>
        </div>
    );
};

export default Login;
