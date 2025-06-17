import React, { useState, useEffect, useContext, useRef } from "react";
import { NavLink } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import anodalLogo from "../images/anodal_logo.png";
import Logonegro from "../images/anodal_logo_Negro.png";
import "../styles/navigation.css";
import "../styles/scrollbar.css";

const Navigation = ({ onLogout }) => {
    const { user, loading } = useContext(UserContext);
    const [isFilterActive, setIsFilterActive] = useState(() => {
        const savedFilterState = localStorage.getItem("blueLightFilter");
        return savedFilterState === "true";
    });
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    // Sidebar admin submenu
    const [adminMenuOpen, setAdminMenuOpen] = useState(false);
    const adminMenuRef = useRef(null);

    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (theme === "light") {
            document.body.classList.add("light-mode");
            
        } else {
            document.body.classList.remove("light-mode");
            <img src={Logonegro} alt="Logo Anodal" />
        }
        localStorage.setItem("theme", theme);
    }, [theme]);

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

    // Cerrar menú usuario al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Cerrar admin sidebar submenu al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
                setAdminMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggleFilter = () => setIsFilterActive((prev) => !prev);
    const handleToggleTheme = () => setTheme((prev) => prev === "light" ? "dark" : "light");

    return (
        <>
            {/* Header superior */}
            <header className="dashboard-header new-header" style={{ backgroundColor: "black"}}>
                <div className="header-center-logo">
    <NavLink to="/dashboard">
        <img
            src={theme === "light" ? Logonegro : anodalLogo}
            alt="Logo Anodal"
            className="logo-centered"
            
        />
    </NavLink>
                </div>
                <div className="header-right">
                    <button
                        className="icon-btn"
                        title="Filtro de luz"
                        onClick={handleToggleFilter}
                        aria-label="Filtro de luz"
                    >
                        {/* Filtro SVG */}
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke={isFilterActive ? "#00FFFF" : "#888"} strokeWidth="2" fill={isFilterActive ? "#00FFFF33" : "none"} />
                            <rect x="8" y="11" width="8" height="2" rx="1" fill={isFilterActive ? "#00FFFF" : "#888"} />
                        </svg>
                    </button>
                    <button
                        className="icon-btn"
                        title="Tema claro/oscuro"
                        onClick={handleToggleTheme}
                        aria-label="Tema claro/oscuro"
                    >
                        {theme === "light" ? (
                            // Sol SVG
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
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
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M21 12.79A9 9 0 0111.21 3c-.09 0-.18 0-.27.01a1 1 0 00-.62 1.7A7 7 0 1019.29 13.4a1 1 0 00.7-.61c.02-.09.01-.18.01-.27z"
                                    fill="#FFD600"
                                    stroke="#FFD600"
                                    strokeWidth="2"
                                />
                            </svg>
                        )}
                    </button>
                    <div className="user-menu-container" ref={userMenuRef}>
                        <button
                            className="icon-btn"
                            title="Usuario"
                            onClick={() => setUserMenuOpen((prev) => !prev)}
                            aria-label="Usuario"
                        >
                            {/* Usuario SVG */}
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="8" r="4" stroke="#00FFFF" strokeWidth="2" fill="none"/>
                                <path d="M4 20c0-3.3137 3.134-6 7-6s7 2.6863 7 6" stroke="#00FFFF" strokeWidth="2" fill="none"/>
                            </svg>
                        </button>
                        {userMenuOpen && (
                            <div className="dropdown-menu user-dropdown">
                                {loading ? (
                                    <p className="user-text">Cargando...</p>
                                ) : (
                                    <>
                                        <p className="user-text"><strong>{user?.name || "Desconocido"}</strong></p>
                                        <p className="user-text">Rol: <span>{user?.role || "Sin rol"}</span></p>
                                        <button className="dropdown-link" onClick={() => { /* Configuración futura */ }}>Configuración</button>
                                        <button className="dropdown-link" onClick={onLogout}>Cerrar Sesión</button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>
            {/* Sidebar vertical */}
            <aside 
                src={theme === "light" ? "open" : "closed"}
                className={`sidebar-nav${sidebarOpen ? " open" : " closed"}`}
                style={{
                    transition: "transform 0.3s cubic-bezier(.4,2,.6,1), box-shadow 0.3s",
                    transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
                    boxShadow: sidebarOpen ? "2px 0 16px #00ffff33" : "none",
                    backgroundColor: theme === "light" ? "#dbcfcf" : "#121212"
                    
                }}
            >
                <button
                    className="sidebar-toggle-btn"
                    title="Ocultar navegación"
                    onClick={() => setSidebarOpen(false)}
                >
                    {/* Flecha izquierda SVG */}
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <path d="M15 6l-6 6 6 6" stroke="#00FFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <NavLink to="/dashboard" className="sidebar-link">
                    Inicio
                </NavLink>
                <NavLink to="/historial" className="sidebar-link">
                    Historial
                </NavLink>
                <NavLink to="/reportes" className="sidebar-link">
                    Reportes
                </NavLink>
                <div className="sidebar-admin-menu" ref={adminMenuRef}>
                    <button
                        className="sidebar-link sidebar-admin-btn"
                        onClick={() => setAdminMenuOpen((prev) => !prev)}
                    >
                        Admin
                        <span style={{ marginLeft: 6, fontSize: 14 }}>{adminMenuOpen ? "▲" : "▼"}</span>
                    </button>
                    {adminMenuOpen && (
                        <div className="sidebar-admin-dropdown">
                            <NavLink to="/admin/usuarios" className="sidebar-link">Administrar Usuarios</NavLink>
                            <NavLink to="/admin/materiales" className="sidebar-link">Administrar Materiales</NavLink>
                            <NavLink to="/admin/descuentos" className="sidebar-link">Administrar Descuentos</NavLink>
                            <NavLink to="/admin" className="sidebar-link">Administrar</NavLink>
                            <NavLink to="/admin/lineas" className="sidebar-link">Administrar Líneas</NavLink>
                        </div>
                    )}
                </div>
            </aside>
            {/* Botón para mostrar el sidebar cuando está oculto */}
            {!sidebarOpen && (
                <button
                    className="sidebar-show-btn"
                    title="Mostrar navegación"
                    onClick={() => setSidebarOpen(true)}
                >
                    {/* Flecha derecha SVG */}
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path d="M9 6l6 6-6 6" stroke="#00FFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            )}
        </>
    );
};

export default Navigation;
