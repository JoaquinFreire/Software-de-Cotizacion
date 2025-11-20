import React, { useState, useEffect, useContext, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import anodalLogo from "../images/anodal_logo.webp";
import Logonegro from "../images/anodal_logo_Negro.webp";
import "../styles/navigation.css";
import "../styles/scrollbar.css";
import axios from "axios";

const Navigation = ({ onLogout }) => {
    const { user, loading } = useContext(UserContext);
    const [isFilterActive, setIsFilterActive] = useState(() => {
        const savedFilterState = localStorage.getItem("blueLightFilter");
        return savedFilterState === "true";
    });
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    const [adminMenuOpen, setAdminMenuOpen] = useState(false);
    const adminMenuRef = useRef(null);

    const location = useLocation();
    const navigate = useNavigate();

    // Detecta si es móvil
    const isMobile = () => window.innerWidth <= 768;

    // Sidebar abierto/cerrado: lee de localStorage o inicia cerrado en móvil
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem("sidebarOpen");
        if (saved !== null) return saved === "true";
        return !isMobile() ? true : false;
    });

    // Guarda el estado del sidebar en localStorage
    useEffect(() => {
        localStorage.setItem("sidebarOpen", sidebarOpen);
    }, [sidebarOpen]);

    // Cierra el sidebar por defecto en móvil al cambiar de ruta
    useEffect(() => {
        if (isMobile()) setSidebarOpen(false);
    }, [location.pathname]);

    // Actualiza sidebarOpen si cambia el tamaño de pantalla (desktop <-> mobile)
    useEffect(() => {
        const handleResize = () => {
            if (isMobile() && sidebarOpen) setSidebarOpen(false);
            if (!isMobile() && localStorage.getItem("sidebarOpen") === null) setSidebarOpen(true);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [sidebarOpen]);

    useEffect(() => {
        if (theme === "light") {
            document.body.classList.add("light-mode");
        } else {
            document.body.classList.remove("light-mode");
        }
        localStorage.setItem("theme", theme);
    }, [theme]);

    // Cambiado: aplicar/remover el filtro directamente según el estado y persistir en localStorage.
    useEffect(() => {
        const overlayId = 'blue-light-overlay';
        try {
            // crear overlay si no existe
            let overlay = document.getElementById(overlayId);
            if (isFilterActive) {
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = overlayId;
                    Object.assign(overlay.style, {
                        position: 'fixed',
                        top: '0',
                        left: '0',
                        right: '0',
                        bottom: '0',
                        pointerEvents: 'none',
                        backgroundColor: "#fcc42bc8",
                        mixBlendMode: 'multiply',
                        zIndex: '900' // por debajo de los modales (modales usan 1000)
                    });
                    document.body.appendChild(overlay);
                } else {
                    overlay.style.display = '';
                }
                document.body.classList.add('filtro'); // compatibilidad con CSS existente
            } else {
                if (overlay) overlay.style.display = 'none';
                document.body.classList.remove('filtro');
            }
            localStorage.setItem("blueLightFilter", isFilterActive ? "true" : "false");
        } catch (err) {
            console.debug("Error applying blue light filter:", err);
        }
        // cleanup opcional: no removemos overlay aquí para que persista hasta reinicio; removemos en desmontaje abajo
    }, [isFilterActive]);

    // Limpiar overlay al desmontar el componente (evita restos si la app se destruye)
    useEffect(() => {
        return () => {
            const overlay = document.getElementById('blue-light-overlay');
            if (overlay) {
                overlay.remove();
            }
            document.body.classList.remove('filtro');
        };
    }, []);

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

    // Helper para saber si es móvil (se usa en render)
    const mobile = isMobile();

    // --- NEW: helper to decode JWT payload (base64url) safely ---
    const decodeJwtPayload = (token) => {
        try {
            const parts = token.split('.');
            if (parts.length < 2) return null;
            const payload = parts[1];
            // base64url -> base64
            const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
            // atob then decode URI components safely
            const json = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(json);
        } catch (e) {
            console.debug("decodeJwtPayload error", e);
            return null;
        }
    };

    // Claims constants para evitar magic strings (MOVIDO arriba para evitar ReferenceError)
    const ClaimTypes = {
        NameIdentifier: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
        Name: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
        Role: "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
        GivenName: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
        Surname: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
    };

    // --- MEJORADO: helper to normalize user shape ---
    const normalizeUser = (u) => {
        if (!u) return null;
        
        // Mantener lo que venga en u.firstName/u.lastName si existe; si falta cualquiera, intentar extraer de name (rawName)
        const existingFirstName = (u.firstName || "").trim();
        const existingLastName = (u.lastName || "").trim();
        const rawName = (u.name || u.firstName || u.unique_name || "").trim();
        
        let firstName = existingFirstName;
        let lastName = existingLastName;

        if (rawName && (!firstName || !lastName)) {
            // dividir rawName en partes y rellenar los campos que falten sin sobrescribir los que ya existen
            const parts = String(rawName).trim().split(/\s+/);
            if (!firstName && parts.length > 0) {
                firstName = parts[0];
            }
            if (!lastName && parts.length > 1) {
                lastName = parts.slice(1).join(" ");
            }
        }
 
        const role = u.role || u.role_name || (u.role?.role_name) || "";
        const id = u.id || u.userId || u.sub || u.nameid || null;
        const name = `${firstName}${lastName ? " " + lastName : ""}`.trim();
 
        return {
            ...u,
            firstName,
            lastName,
            name,
            role,
            id
        };
    };

    // Inicializar fetchedUser a partir del token (si está) para mostrar nombre/rol inmediatamente
    const [fetchedUser, setFetchedUser] = useState(() => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return null;
            const payload = decodeJwtPayload(token);
            if (!payload) return null;

            // Leer claims comunes sin depender de variables no inicializadas
            const firstNameFromClaims =
                payload[ClaimTypes.GivenName]
                || payload["given_name"]
                || payload["givenname"]
                || "";
            const lastNameFromClaims =
                payload[ClaimTypes.Surname]
                || payload["family_name"]
                || payload["surname"]
                || "";
            const fullName = payload[ClaimTypes.Name] || payload["name"] || payload["unique_name"] || "";
            const role = payload[ClaimTypes.Role] || payload["role"] || "";
            const id = payload[ClaimTypes.NameIdentifier] || payload["nameid"] || payload["sub"] || null;

            const tokenUser = {
                firstName: firstNameFromClaims,
                lastName: lastNameFromClaims,
                name: fullName,
                role,
                id
            };

            return normalizeUser(tokenUser);
        } catch (e) {
            console.debug("init fetchedUser error", e);
            return null;
        }
    });

    // Preferir fetchedUser (token o API) y luego el contexto user
    const userRole = (fetchedUser?.role && typeof fetchedUser.role === "string")
        ? String(fetchedUser.role).toLowerCase()
        : (user?.role?.role_name ? String(user.role.role_name).toLowerCase() : (user?.role ? String(user.role).toLowerCase() : null));

    useEffect(() => {
        if (location.pathname.startsWith("/gestion")) {
            setAdminMenuOpen(true);
        }
    }, [location.pathname]);

    const API_URL = process.env.REACT_APP_API_URL;

    // Obtener usuario desde API al montar el componente - MEJORADO para mantener los nombres del token
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token || !API_URL) return;

        let mounted = true;
        (async () => {
            try {
                const resp = await axios.get(`${API_URL}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const u = resp.data?.user || resp.data;
                if (mounted && u) {
                    // Preservar los nombres del token y solo actualizar otros datos
                    const currentUser = fetchedUser || {};
                    const updatedUser = {
                        ...currentUser, // Mantener nombres del token
                        ...u, // Datos de la API
                        // No sobrescribir firstName y lastName a menos que la API los provea explícitamente
                        firstName: u.firstName || currentUser.firstName,
                        lastName: u.lastName || currentUser.lastName,
                        name: u.name || currentUser.name
                    };
                    setFetchedUser(normalizeUser(updatedUser));
                }
            } catch (err) {
                console.debug("Navigation: no se pudo obtener user desde API", err);
                // Si falla la API, mantener los datos del token
            }
        })();
        return () => { mounted = false; };
    }, [API_URL]); // Solo dependencia de API_URL

    // Función para obtener iniciales - MEJORADA para ser más robusta
    const getInitials = (userData) => {
        if (!userData) return "US";
        
        // Priorizar firstName + lastName, luego name completo
        const firstName = userData.firstName || "";
        const lastName = userData.lastName || "";
        const fullName = userData.name || "";
        
        if (firstName && lastName) {
            return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
        }
        
        if (fullName) {
            const parts = fullName.trim().split(/\s+/);
            if (parts.length >= 2) {
                return `${parts[0].charAt(0).toUpperCase()}${parts[parts.length - 1].charAt(0).toUpperCase()}`;
            }
            return parts[0].charAt(0).toUpperCase();
        }
        
        return "US";
    };

    // Componente reutilizable para el menú de usuario - MEJORADO
    const UserMenu = () => {
        const firstName = fetchedUser?.firstName || "";
        const lastName = fetchedUser?.lastName || "";
        const fullNameFromAPI = fetchedUser?.name || "";
        
        // Determinar el nombre completo a mostrar
        let displayName = "";
        if (firstName && lastName) {
            displayName = `${firstName} ${lastName}`.trim();
        } else if (fullNameFromAPI) {
            displayName = fullNameFromAPI;
        } else {
            displayName = "Usuario";
        }

        return (
            <div className="user-menu-container" ref={userMenuRef}>
                <button
                    className="user-initials-btn"
                    title="Usuario"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    aria-label="Usuario"
                >
                    <div className="nav-profile-initials">
                        {getInitials(fetchedUser)}
                    </div>
                </button>
                {userMenuOpen && (
                    <div className={`dropdown-menu user-dropdown ${theme === "light" ? "opcionesuser" : ""}`}>
                        {!fetchedUser ? (
                            <div className="user-text">Cargando...</div>
                        ) : (
                            <>
                                <div className="user-text"><strong>{displayName}</strong></div>
                                <div className="user-text">Rol: <span>
                                    {userRole === "manager"
                                        ? "Gerente"
                                        : userRole === "coordinator"
                                            ? "Coordinador"
                                            : userRole === "quotator"
                                                ? "Cotizador"
                                                : userRole}
                                </span></div>

                                <button className="dropdown-link" onClick={() => { setUserMenuOpen(false); navigate('/config-user'); }}>Configuración</button>
                                <button className="dropdown-link" onClick={onLogout}>Cerrar Sesión</button>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="navigation-root">
            {/* Header superior */}
            <header className={`dashboard-header new-header${theme === "light" ? " light-header" : ""}${mobile ? " mobile-header-margin" : ""}`}>
                <div className="header-center-logo">
                    <NavLink to="/home">
                        <img
                            src={theme === "light" ? Logonegro : anodalLogo}
                            alt="Logo Anodal"
                            className="logo-centered"
                        />
                    </NavLink>
                </div>
                {/* Botones debajo del logo en móvil */}
                {mobile && (
                    <div className="header-mobile-actions">
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
                                    <circle cx="12" cy="12" r="5" fill="#FFD600" />
                                    <g stroke="#FFD600" strokeWidth="2">
                                        <line x1="12" y1="1" x2="12" y2="4" />
                                        <line x1="12" y1="20" x2="12" y2="23" />
                                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                        <line x1="1" y1="12" x2="4" y2="12" />
                                        <line x1="20" y1="12" x2="23" y2="12" />
                                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
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
                        <UserMenu />
                    </div>
                )}
                {/* Botones a la derecha solo en desktop */}
                {!mobile && (
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
                                    <circle cx="12" cy="12" r="5" fill="#FFD600" />
                                    <g stroke="#FFD600" strokeWidth="2">
                                        <line x1="12" y1="1" x2="12" y2="4" />
                                        <line x1="12" y1="20" x2="12" y2="23" />
                                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                        <line x1="1" y1="12" x2="4" y2="12" />
                                        <line x1="20" y1="12" x2="23" y2="12" />
                                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
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
                        <UserMenu />
                    </div>
                )}
            </header>
            {/* Sidebar vertical */}
            <aside
                src={theme === "light" ? "open" : "closed"}
                className={`sidebar-nav${sidebarOpen ? " open" : " closed"}`}
                style={{
                    width: sidebarOpen ? "250px" : "0px",
                    background: theme === "light"
                        ? "linear-gradient(135deg, #26b7cd 0%, #93d3db 50%, #cce3e1 100%)"
                        : "#121212",
                }}
            >
                <button
                    className="sidebar-toggle-btn"
                    title="Ocultar navegación"
                    onClick={() => setSidebarOpen(false)}
                >
                    {/* Flecha izquierda SVG */}
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <path d="M15 6l-6 6 6 6" stroke="#00FFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <NavLink to="/" className="sidebar-link">
                    Inicio
                </NavLink>
                <NavLink to="/quotation" className="sidebar-link">
                    Nueva Cotización
                </NavLink>
                <NavLink to="/cotizaciones" className="sidebar-link">
                    Cotizaciones pendientes
                </NavLink>
                <NavLink to="/historial" className="sidebar-link">
                    Todas las cotizaciones
                </NavLink>
                <NavLink to="/reportes" className="sidebar-link">
                    Reportes
                </NavLink>
                <NavLink to="/customers" className="sidebar-link">
                    Clientes
                </NavLink>
                <NavLink to="/materiales" className="sidebar-link">
                    Acabados
                </NavLink>
                <NavLink to="/aberturas" className="sidebar-link">
                    Gama completa
                </NavLink>

                {/* Solo mostrar sección "Gestionar" si NO es quotator */}
                {userRole !== "quotator" && (
                    <div className="sidebar-admin-menu" ref={adminMenuRef}>
                        <button
                            className="sidebar-link sidebar-admin-btn"
                            onClick={() => {
                                setAdminMenuOpen(true); // Siempre deja abierto
                                navigate("/gestion");
                            }}
                        >
                            Gestionar
                            <span style={{ marginLeft: 6, fontSize: 14 }}>{adminMenuOpen ? "▲" : "▼"}</span>
                        </button>
                        {adminMenuOpen && (
                            <div className={`sidebar-admin-dropdown${theme === "light" ? "adminopciones" : ""}`}>
                                <NavLink
                                 to="/gestion/usuarios" className="sidebar-link">Gestionar Usuarios</NavLink>
                                <NavLink to="/gestion/materiales" className="sidebar-link">Gestionar Materiales</NavLink>
                                <NavLink to="/gestion/prices" className="sidebar-link">Gestionar Precios</NavLink>
                                <NavLink to="/gestion/aberturas" className="sidebar-link">Gestionar Aberturas</NavLink>
                            </div>
                        )}
                    </div>
                )}
            </aside>
            {/* Botón para mostrar el sidebar cuando está oculto */}
            {!sidebarOpen && (
                <button
                    className="sidebar-show-btn"
                    title="Mostrar navegación"
                    onClick={() => setSidebarOpen(true)}
                    style={mobile ? { top: 18, left: 0, zIndex: 210 } : undefined}
                >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path d="M9 6l6 6-6 6" stroke="#00FFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            )}
        </div>
    );
};

export default Navigation;