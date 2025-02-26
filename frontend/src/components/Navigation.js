import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import anodalLogo from "../images/anodal_logo.png";
import menuIcon from "../images/menuIcon.png";

const Navigation = ({ onLogout }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [userName, setUserName] = useState(); // Estado para el nombre del usuario
    const [userRol, setUserRol] = useState(); // Estado para el nombre del usuario

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("http://localhost:5187/api/auth/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUserName(response.data.name); // Asigna el nombre del usuario logueado
                setUserRol(response.data.role);
            } catch (error) {
                console.error("Error obteniendo usuario:", error);
                setUserName("Usuario desconocido");
            }
        };

        fetchUser();
    }, []);

    return (
        <header className="dashboard-header">
            <img src={anodalLogo} alt="Logo Anodal" className="logo" />
            <nav>
                <NavLink to="/dashboard">Inicio</NavLink>
                <NavLink to="/historial">Historial</NavLink>
                <NavLink to="/reportes">Reportes</NavLink>
                <NavLink to="/actualizar">Admin</NavLink>
            </nav>

            <div className="menu">
                <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)}>
                    <img src={menuIcon} alt="Menú" className="menu-icon" />
                </button>

                {menuOpen && (
                    <div className="dropdown-menu">
                        <p className="user-text">User: <span>{userName}</span></p> {/* Nombre dinámico */}
                        <p className="user-text">Rol: <span>{userRol}</span></p> {/* rol dinámico */}
                        <div className="toggle-container">
                            <span className="toggle-label">Modo Oscuro</span>
                            <label className="switch">
                                <input type="checkbox" />
                                <span className="slider"></span>
                            </label>
                        </div>
                        <button onClick={onLogout}>Cerrar Sesión</button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Navigation;
