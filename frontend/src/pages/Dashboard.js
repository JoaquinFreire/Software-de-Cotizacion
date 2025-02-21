import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/'); // Si no hay token, redirigir al login
            return;
        }

        const fetchUserData = async () => {
            try {
                const response = await axios.get('http://localhost:5187/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(response.data); // Guardar datos del usuario
            } catch (error) {
                console.error('Error al obtener usuario', error);
                localStorage.removeItem('token'); // Eliminar token si es inválido
                navigate('/'); // Redirigir al login
            }
        };

        fetchUserData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token'); // Elimina el token
        navigate('/'); // Redirige al login
    };

    if (!user) return <p>Cargando...</p>;
    
    return (
        <div>
            <h2>Dashboard</h2>
            {user ? (
                <p>Hola {user.name}, tu rol es {user.role}.</p>
            ) : (
                <p>Cargando...</p>
            )}
            <button onClick={handleLogout}>Cerrar Sesión</button>
        </div>
    );
};

export default Dashboard;
