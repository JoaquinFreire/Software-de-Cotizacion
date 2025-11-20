import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/login.css'; // Archivo de estilos
import anodalLogo from '../images/anodal_logo.webp';
import ReactLoading from 'react-loading';

const API_URL = process.env.REACT_APP_API_URL;

const Login = () => {
    const [legajo, setLegajo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showRecover, setShowRecover] = useState(false);
    const [recoverDni, setRecoverDni] = useState('');
    const [recoverMsg, setRecoverMsg] = useState('');
    const [recoverError, setRecoverError] = useState('');
    const [isLoading, setIsLoading] = useState(false); // ⬅️ Login spinner
    const [isRecovering, setIsRecovering] = useState(false); // ⬅️ Recuperación spinner
    const [isServerWaking, setIsServerWaking] = useState(false); // indicates backend is booting
    const [serverMsg, setServerMsg] = useState('');
    const retryIntervalRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        document.body.classList.remove("filtro");
        localStorage.setItem("blueLightFilter", "false");
    }, []);

    // Cleanup any running retry interval when component unmounts
    useEffect(() => {
        return () => {
            if (retryIntervalRef.current) {
                clearInterval(retryIntervalRef.current);
                retryIntervalRef.current = null;
            }
        };
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        setIsServerWaking(false);
        setServerMsg('');

        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, { legajo, password });
            localStorage.setItem('token', response.data.token);
            // If there was a retry running, clear it
            if (retryIntervalRef.current) {
                clearInterval(retryIntervalRef.current);
                retryIntervalRef.current = null;
            }
            navigate('/');
            window.location.reload();
        } catch (err) {
            // If server did not respond or returned a server error, start retry loop
            const status = err.response?.status;
            const hasServerResponse = !!err.response;

            if (!hasServerResponse || (status >= 500 && status < 600)) {
                // Backend is likely sleeping - show message and keep retrying
                setIsServerWaking(true);
                setServerMsg('Servidor apagado, encendiendo...');

                // Clear any existing interval first
                if (retryIntervalRef.current) {
                    clearInterval(retryIntervalRef.current);
                    retryIntervalRef.current = null;
                }

                // Start retrying periodically using the same credentials
                retryIntervalRef.current = setInterval(async () => {
                    try {
                        const retryRes = await axios.post(`${API_URL}/api/auth/login`, { legajo, password });
                        localStorage.setItem('token', retryRes.data.token);
                        if (retryIntervalRef.current) {
                            clearInterval(retryIntervalRef.current);
                            retryIntervalRef.current = null;
                        }
                        setIsServerWaking(false);
                        setServerMsg('');
                        setIsLoading(false);
                        navigate('/');
                        window.location.reload();
                    } catch (retryErr) {
                        // If retry fails due to invalid credentials (401), stop retrying and show error
                        if (retryErr.response?.status === 401) {
                            if (retryIntervalRef.current) {
                                clearInterval(retryIntervalRef.current);
                                retryIntervalRef.current = null;
                            }
                            setIsServerWaking(false);
                            setServerMsg('');
                            setIsLoading(false);
                            const errMsg = retryErr.response?.data?.error || 'Credenciales inválidas';
                            setError(errMsg);
                        }
                        // Otherwise continue retrying
                    }
                }, 3000);
                // Keep showing loader while retrying
            } else {
                // Permanent/auth error - show it and stop loading
                if (err.response?.data?.error) {
                    setError(err.response.data.error);
                } else {
                    setError('Error en la conexión con el servidor');
                }
                setIsLoading(false);
            }
        }
    };

    const handleRecover = async (e) => {
        e.preventDefault();
        setRecoverMsg('');
        setRecoverError('');
        setIsRecovering(true); // ⬅️ Mostrar spinner

        try {
            const res = await axios.post(`${API_URL}/api/user-invitations/recover`, { dni: recoverDni });
            if (res.data?.maskedMail) {
                setRecoverMsg(`Se enviaron los pasos para la recuperación al mail ${res.data.maskedMail}`);
            } else {
                setRecoverError("Este dni no existe, pida al Coordinador que genere su usuario.");
            }
        } catch (err) {
            setRecoverError("Este dni no existe, pida al Coordinador que genere su usuario.");
        } finally {
            setIsRecovering(false); // ⬅️ Ocultar spinner
        }
    };

    return (
        <div className="login-container">
            <div className="login-overlay"></div>
            <div className="login-box">
                <img src={anodalLogo} alt="Logo de Anodal" height={60} width={250} />
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
                            disabled={isLoading}
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
                            disabled={isLoading}
                        />

                        {isLoading ? (
                            <div className="spinner-container">
                                <ReactLoading type="spin" color="#26b7cd" height={40} width={40}/>
                                <div style={{marginTop: 14, fontSize: 18, color: '#26b7cd'}}>{isServerWaking ? serverMsg : 'Cargando...'}</div>
                            </div>
                        ) : (
                            <button className="bottonLogin" type="submit">Siguiente</button>
                        )}
                    </form>
                ) : (
                    <form onSubmit={handleRecover}>
                        <label htmlFor="recover-dni">Ingrese su Legajo</label>
                        <input
                            type="text"
                            id="recover-dni"
                            value={recoverDni}
                            onChange={e => setRecoverDni(e.target.value)}
                            required
                            disabled={isRecovering}
                            placeholder='Ingrese su Legajo'
                        />

                        {isRecovering ? (
                            <div className="spinner-container">
                                <ReactLoading type="spin" color="#26b7cd" height={40} width={40}/>
                                <div style={{marginTop: 14, fontSize: 18, color: '#26b7cd'}}>Cargando...</div>
                            </div>
                        ) : (
                            <button className="bottonLogin" type="submit">Recuperar</button>
                        )}

                        {recoverMsg && <p className="info-message">{recoverMsg}</p>}
                        {recoverError && <p className="error-message">{recoverError}</p>}
                        <p className="forgot-password" style={{ cursor: "pointer" }} onClick={() => {
                            setShowRecover(false);
                            setRecoverMsg('');
                            setRecoverError('');
                        }}>
                            Volver al login
                        </p>
                    </form>
                )}

                {!showRecover && (
                    <>
                        {error && <p className="error-message">{error}</p>}
                        <p className="forgot-password" style={{ cursor: "pointer" }} onClick={() => setShowRecover(true)}>
                            Recuperar contraseña
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;
