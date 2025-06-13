import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/login.css'; // Archivo de estilos
import anodalLogo from '../images/anodal_logo.png';
import ojo from '../images/ojo.png'; // Icono de ojo para mostrar/ocultar contraseña

const API_URL = process.env.REACT_APP_API_URL;
const Login = () => {
    const [legajo, setLegajo] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // Estado para mostrar/ocultar contraseña
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        document.body.classList.remove("filtro"); // Remover la clase de filtro de luz azul
        localStorage.setItem("blueLightFilter", "false"); // Desactivar el filtro de luz azul
    }, []);
    
    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); // Limpiar errores previos

        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, { legajo, password });
            localStorage.setItem('token', response.data.token); // Guardar el token
            navigate('/'); // Redirigir si el login es exitoso
            window.location.reload(); // Recargar la página del dashboard
        } catch (err) { // Manejar errores de la API o de conexión con el servidor
            if (err.response && err.response.data.error) { // Verificar si el error proviene de la API y mostrarlo en caso afirmativo
                setError(err.response.data.error); // Mostrar el error específico
            } else {
                setError('Error en la conexión con el servidor'); // Mostrar un error genérico si no se puede obtener el error específico
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
                    <div className="password-container">
                        <input
                            type={showPassword ? "text" : "password"} // Cambiar el tipo de input
                            placeholder="Ingrese su contraseña"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="toggle-password"
                            onClick={() => setShowPassword(!showPassword)} // Alternar visibilidad
                            
                        >
                            <div className="eye-icon">
                            <img src={ojo} alt="Icono de ojo" />
                            
                            </div>
                        </button>
                    </div>
                    <button type="submit">Siguiente</button>
                </form>
                {error && <p className="error-message">{error}</p>} {/* Mostrar errores aquí */}
                <p className="forgot-password">Recuperar contraseña</p>
            </div>
        </div>
    );
};

export default Login;