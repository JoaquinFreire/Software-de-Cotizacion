import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import anodalLogo from '../images/anodal_logo.png';
import menuIcon from '../images/menuIcon.png';

const Dashboard = () => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const handleLogout = () => {
        console.log("y ella");localStorage.removeItem('token'); // Elimina el token
        navigate('/'); // Redirige al login
    
    };
    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <img src={anodalLogo} alt="Logo Anodal" className="logo" />
                <nav>
                    <a href="#">Cotizar</a>
                    <a href="#">Historial</a>
                    <a href="#">Reportes</a>
                    <a href="#">Actualizar</a>
                </nav>
                
                <div className="menu">
                    <button 
                        className="menu-button" 
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        <img src={menuIcon} alt="Menú" className="menu-icon" />
                    </button>
                    
                    {menuOpen && (
                        <div className="dropdown-menu">
                            <p className="user-text">Usuario</p>
                            <div className="toggle-container">
                                <span className="toggle-label">Modo Oscuro</span>
                                <label className="switch">
                                    <input type="checkbox" />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <button onClick={handleLogout}>Cerrar Sesión</button>
                        </div>
                    )}
                </div>
            </header>

            <h2 className="title">Cotizaciones Pendientes</h2>

            <div className="search-bar">
                <input type="text" placeholder="Buscar..." className="search-input"/>
                <button className="search-button">🔍</button>
                <button className="new-quote">Nueva Cotización</button>
            </div>

            <div className="quote-container">
                {[...Array(6)].map((_, index) => (
                    <div key={index} className="quote-card">
                        <p><strong>Cliente:</strong> Bruno Fontanari</p>
                        <p><strong>Fecha:</strong> 19/02/2025</p>
                        <p><strong>Dirección:</strong> Pj. Austral 41</p>
                        <p><strong>Teléfono:</strong> 3543694696</p>
                        <p><strong>Mail:</strong> Fontanaribruno21@gmail.com</p>
                        <button className="go-button">Ir</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
