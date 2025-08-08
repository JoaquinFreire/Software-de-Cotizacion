import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/login.css'; // Archivo de estilos
import anodalLogo from '../images/anodal_logo.png';

const API_URL = process.env.REACT_APP_API_URL;
const Login = () => {
    const [legajo, setLegajo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showRecover, setShowRecover] = useState(false);
    const [recoverDni, setRecoverDni] = useState('');
    const [recoverMsg, setRecoverMsg] = useState('');
    const [recoverError, setRecoverError] = useState('');
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

    const handleRecover = async (e) => {
        e.preventDefault();
        setRecoverMsg('');
        setRecoverError('');
        try {
            const res = await axios.post(`${API_URL}/api/user-invitations/recover`, { dni: recoverDni });
            if (res.data && res.data.maskedMail) {
                setRecoverMsg(`Se enviaron los pasos para la recuperación al mail ${res.data.maskedMail}`);
            } else if (res.data && res.data.error) {
                setRecoverError("Este dni no existe, pida al administrador que genere su usuario.");
            } else {
                setRecoverError("Este dni no existe, pida al administrador que genere su usuario.");
            }
        } catch (err) {
            setRecoverError("Este dni no existe, pida al administrador que genere su usuario.");
        }
    };

    return (
        <div className="login-container">
            <div className="login-overlay"></div>
            <div className="login-box">
                <img src={anodalLogo} alt="Logo de Anodal" height={60} width={250}/>
                <h2 className="subtitle">Cotizaciones</h2>
                {!showRecover ? (
                    <form onSubmit={handleLogin}>
                        <label htmlFor="legajo">Legajo</label>
                        <input
                            className="Legajo"
                            type="text"
                            placeholder="Ingrese su legajo"
                            id="legajo"
                            value={legajo}
                            onChange={(e) => setLegajo(e.target.value)}
                            required
                        />
                        <label className="label" htmlFor="password">Contraseña</label>
                        <input
                            className="password"
                            type="password"
                            placeholder="Ingrese su contraseña"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button className="bottonLogin" type="submit">Siguiente</button>
                    </form>
                ) : (
                    <form onSubmit={handleRecover}>
                        <label htmlFor="recover-dni">Ingrese su DNI</label>
                        <input
                            type="text"
                            id="recover-dni"
                            value={recoverDni}
                            onChange={e => setRecoverDni(e.target.value)}
                            required
                        />
                        <button className="bottonLogin" type="submit">Recuperar</button>
                        {recoverMsg && <p className="info-message">{recoverMsg}</p>}
                        {recoverError && <p className="error-message">{recoverError}</p>}
                        <p className="forgot-password" style={{cursor: "pointer"}} onClick={() => { setShowRecover(false); setRecoverMsg(''); setRecoverError(''); }}>
                            Volver al login
                        </p>
                    </form>
                )}
                {!showRecover && (
                    <>
                        {error && <p className="error-message">{error}</p>}
                        <p className="forgot-password" style={{cursor: "pointer"}} onClick={() => setShowRecover(true)}>
                            Recuperar contraseña
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;