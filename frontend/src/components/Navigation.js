import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import anodalLogo from "../images/anodal_logo.png";
import menuIcon from "../images/menuIcon.png";
import "../styles/navigation.css";
import "../styles/scrollbar.css"; // Importar los estilos de la barra de desplazamiento

const Navigation = ({ onLogout }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [userName, setUserName] = useState(); // Estado para el nombre del usuario
    const [userRol, setUserRol] = useState(); // Estado para el nombre del usuario


    // Inicializar el estado de isFilterActive con el valor almacenado en localStorage
    const [isFilterActive, setIsFilterActive] = useState(() => {
        const savedFilterState = localStorage.getItem("blueLightFilter");
        return savedFilterState === "true";
    });

    const [isScrolled, setIsScrolled] = useState(false); // Estado para manejar el scroll

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 100) { // Ajusta el valor según sea necesario
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    useEffect(() => {
        const currentPath = window.location.pathname;
        if (currentPath === "/") {
            document.body.classList.remove("filtro");
            setIsFilterActive(false);
        } else {
            if (isFilterActive) {
                document.body.classList.add("filtro");
            } else {
                document.body.classList.remove("filtro");
            }
        }
        localStorage.setItem("blueLightFilter", isFilterActive);
    }, [isFilterActive]);
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

    const handleToggleFilter = () => {
        const newState = !isFilterActive;
        setIsFilterActive(newState);
        localStorage.setItem("blueLightFilter", newState);
    };

    return (
        <header className="dashboard-header">
            <img src={anodalLogo} alt="Logo Anodal" className="logo" />
            <nav className={`nav-links ${isScrolled ? "nav-linksF" : ""}`}>
                <NavLink to="/dashboard">Inicio</NavLink>
                <NavLink to="/historial">Historial</NavLink>
                <NavLink to="/reportes">Reportes</NavLink>
                <NavLink to="/admin">Admin</NavLink>
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
                            <span className="toggle-label user-text">Filtro de Luz:</span>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={isFilterActive}
                                    onChange={handleToggleFilter}
                                />
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
