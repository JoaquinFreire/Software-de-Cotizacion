import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [legajo, setLegajo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5187/api/auth/login', { legajo, password });
            localStorage.setItem('token', response.data.token); // Guardar token
            navigate('/dashboard'); // Redirigir al dashboard
        } catch (err) {
            setError('Credenciales inválidas');
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <input type='text' placeholder='Legajo' value={legajo} onChange={(e) => setLegajo(e.target.value)} required />
                <input type='password' placeholder='Contraseña' value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type='submit'>Ingresar</button>
            </form>
            {error && <p>{error}</p>}
        </div>
    );
};

export default Login;
