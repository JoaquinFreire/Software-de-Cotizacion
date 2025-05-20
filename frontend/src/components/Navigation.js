import React, { useState, useEffect, useContext, useRef } from "react";
import { NavLink } from "react-router-dom";
import { UserContext } from "../context/UserContext"; // Importar el contexto del usuario
import anodalLogo from "../images/anodal_logo.png";
import menuIcon from "../images/menuIcon.png";
import "../styles/navigation.css";
import "../styles/scrollbar.css"; // Importar los estilos de la barra de desplazamiento

const Navigation = ({ onLogout }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [adminMenuOpen, setAdminMenuOpen] = useState(false); // Estado para el submenú de Admin
    const { user, loading } = useContext(UserContext); // Obtener datos del usuario desde el contexto
    const menuRef = useRef(null); // Referencia para el menú principal
    const adminMenuRef = useRef(null); // Referencia para el menú de Admin

    // Inicializar el estado de isFilterActive con el valor almacenado en localStorage
    const [isFilterActive, setIsFilterActive] = useState(() => {
        const savedFilterState = localStorage.getItem("blueLightFilter");
        return savedFilterState === "true";
    });

    const [isScrolled, setIsScrolled] = useState(false); // Estado para manejar el scroll

    // Modo claro/oscuro
    const getSystemTheme = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || getSystemTheme());

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
        if (theme === "light") {
            document.body.classList.add("light-mode");
        } else {
            document.body.classList.remove("light-mode");
        }
        localStorage.setItem("theme", theme);
    }, [theme]);

    const handleToggleFilter = () => {
        const newState = !isFilterActive;
        setIsFilterActive(newState);
        localStorage.setItem("blueLightFilter", newState);
    };

    const handleToggleTheme = () => {
        setTheme(prev => prev === "light" ? "dark" : "light");
    };

    // Cerrar menús al hacer clic fuera de ellos
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
            if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
                setAdminMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="dashboard-header">
            <NavLink to="/dashboard">
                <img src={anodalLogo} alt="Logo Anodal" className="logo" />
            </NavLink>
            <nav className={`nav-links ${isScrolled ? "nav-linksF" : ""}`}>
                <NavLink to="/dashboard">Inicio</NavLink>
                <NavLink to="/historial">Historial</NavLink>
                <NavLink to="/reportes">Reportes</NavLink>
                <div className="menu admin-menu" ref={adminMenuRef}>
                    <button
                        className="menu-button2"
                        onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                    >
                        Admin
                    </button>
                    {adminMenuOpen && (
                        <div className="dropdown-menu">
                            <NavLink to="/admin/usuarios">Administrar Usuarios</NavLink>
                            <NavLink to="/admin/materiales">Administrar Materiales</NavLink>
                            <NavLink to="/admin/descuentos">Administrar Descuentos</NavLink>
                            <NavLink to="/admin">Administrar</NavLink>
                            <NavLink to="/admin/lineas">Administrar Líneas</NavLink>
                        </div>
                    )}
                </div>
            </nav>

            <div className="menu" ref={menuRef}>
                <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)}>
                    <img src={menuIcon} alt="Menú" className="menu-icon" />
                </button>

                {menuOpen && (
                    <div className="dropdown-menu">
                        {loading ? (
                            <p className="user-text">Cargando...</p>
                        ) : (
                            <>
                                <p className="user-text">User: <span>{user?.name || "Desconocido"}</span></p>
                                <p className="user-text">Rol: <span>{user?.role || "Sin rol"}</span></p>
                            </>
                        )}
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
                        <div className="toggle-container">
                            <span className="toggle-label user-text">Tema:</span>
                            <button
                                className="theme-toggle-btn"
                                onClick={handleToggleTheme}
                                aria-label="Cambiar tema claro/oscuro"
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    marginLeft: 8,
                                    display: "flex",
                                    alignItems: "center"
                                }}
                            >
                                {theme === "light" ? (
                                    // Sol SVG
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="5" fill="#FFD600"/>
                                        <g stroke="#FFD600" strokeWidth="2">
                                            <line x1="12" y1="1" x2="12" y2="4"/>
                                            <line x1="12" y1="20" x2="12" y2="23"/>
                                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                                            <line x1="1" y1="12" x2="4" y2="12"/>
                                            <line x1="20" y1="12" x2="23" y2="12"/>
                                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                                        </g>
                                    </svg>
                                ) : (
                                    // Luna SVG
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M21 12.79A9 9 0 0111.21 3c-.09 0-.18 0-.27.01a1 1 0 00-.62 1.7A7 7 0 1019.29 13.4a1 1 0 00.7-.61c.02-.09.01-.18.01-.27z"
                                            fill="#FFD600"
                                            stroke="#FFD600"
                                            strokeWidth="2"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <button onClick={onLogout}>Cerrar Sesión</button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Navigation;
