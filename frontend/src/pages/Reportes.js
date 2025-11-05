import React, { useState, useEffect } from 'react';
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import "../styles/reportes.css";
import {
    FileText,
    Layers,
    TrendingUp,
    UserCheck,
    User,
    Clock3,
    PieChart,
    MapPin,
    Smile,
    LineChart,
    Percent,
    Users,
    ArrowRight
} from 'lucide-react';

import { useNavigate } from "react-router-dom";

// Definición de reportes con sus permisos por rol
const reportCards = [
    //Reporte 1
    {
        title: "Reporte de Estado de Cotizaciones",
        description: "Estado y seguimiento de cotizaciones",
        icon: <FileText size={32} />,
        className: "reporte-estado-cotizaciones",
        route: "/reportes/estado-cotizaciones",
        color: "#3b82f6",
        roles: ['quotator', 'coordinator', 'manager'] // Todos los roles
    },
    //Reporte 2
    {
        title: "Análisis de Proyectos por Ubicación Geográfica",
        description: "Distribución geográfica de proyectos",
        icon: <MapPin size={32} />,
        className: "reporte-proyectos-ubicacion",
        route: "/reportes/ubicacion-geografica",
        color: "#ef4444",
        roles: ['coordinator', 'manager'] // Todos los roles
    },
    //Reporte 3
    {
        title: "Análisis de Satisfacción del Cliente",
        description: "Métricas de satisfacción clientes",
        icon: <Smile size={32} />,
        className: "reporte-satisfaccion-cliente",
        route: "/reportes/analisis-satisfaccion-cliente",
        color: "#f59e0b",
        roles: ['quotator', 'coordinator', 'manager'] // Todos los roles
    },
    //Reporte 4
    {
        title: "Reporte de Tendencias de Cotización por Mes",
        description: "Tendencias mensuales de cotizaciones",
        icon: <TrendingUp size={32} />,
        className: "reporte-tendencias-mensuales",
        route: "/reportes/tendencias-mensuales",
        color: "#8b5cf6",
        roles: ['coordinator', 'manager'] // Solo coordinador y gerente
    },
    //Reporte 5
    {
        title: "Reporte de Productividad por Cotizador",
        description: "Rendimiento por cotizador",
        icon: <UserCheck size={32} />,
        className: "reporte-productividad-cotizador",
        route: "/reportes/productividad-cotizador",
        color: "#06b6d4",
        roles: ['coordinator', 'manager'] // Solo coordinador y gerente
    },
    //Reporte 6
    {
        title: "Reporte de Oportunidades Perdidas",
        description: "Análisis de oportunidades no concretadas",
        icon: <Clock3 size={32} />,
        className: "reporte-Oportunidades-Perdidas",
        route: "/reportes/Oportunidades-Perdidas",
        color: "#64748b",
        roles: ['quotator', 'coordinator', 'manager'] // Todos los roles
    },
    //Reporte 7
    {
        title: "Carga de Trabajo del Equipo de Cotización",
        description: "Desempeño del equipo de trabajo",
        icon: <User size={32} />,
        className: "reporte-productividad-vendedor",
        route: "/operational-dashboard",
        color: "#f97316",
        roles: ['coordinator', 'manager'] // Solo coordinador y gerente
    },
    //Reporte 8
    {
        title: "Beneficio en Cotizaciones por Tipo de Línea",
        description: "Rentabilidad por línea de producto",
        icon: <PieChart size={32} />,
        className: "reporte-beneficio-proyecto",
        route: "/reportes/beneficio-proyecto",
        color: "#ec4899",
        roles: ['quotator', 'coordinator', 'manager'] // Todos los roles
    },
    //Reporte 9
    {
        title: "Reporte de Consumo de Complementos",
        description: "Uso de complementos en proyectos",
        icon: <UserCheck size={32} />,
        className: "reporte-consumo-complementos",
        route: "/reportes/consumo-complementos",
        color: "#0ea5e9",
        roles: ['quotator', 'coordinator', 'manager'] // Todos los roles
    },
    //Reporte 10
    {
        title: "Trazabilidad de cotizaciones",
        description: "Duración y etapas de proyectos",
        icon: <Layers size={32} />,
        className: "reporte-ciclo-vida",
        route: "/reportes/LineaDeTiempoCotizaciones",
        color: "#14b8a6",
        roles: ['quotator', 'coordinator', 'manager'] // Todos los roles
    },
    //Reporte 11
    {
        title: "Reporte de Material Usado en Cotización",
        description: "Uso de materiales en cotizaciones",
        icon: <Layers size={32} />,
        className: "reporte-material-usado",
        route: "/reportes/materiales-mas-utilizados",
        color: "#10b981"

    },
    //Reporte 12
    {
        title: "Reporte de Desempeño Personal",
        description: "Analisis de metricas del rendimiento personal",
        icon: <LineChart size={32} />,
        className: "reporte-metrica-personal",
        route: "/reportes/metrica-personal",
        color: "#84cc16",
        roles: ['quotator'] // Solo cotizador
    },
    //Reporte 13
    {
        title: "Reporte de Clientes con Mayor Volumen",
        description: "Clientes principales por volumen",
        icon: <Users size={32} />,
        className: "reporte-clientes-mayor-volumen",
        route: "/reportes/cliente-mayor-volumen",
        color: "#6366f1",
        roles: ['quotator', 'coordinator', 'manager'] // Todos los roles
    },
    //Reporte 14
    {
        title: "Reporte de Tiempo Ocioso de Producción",
        description: "Análisis de tiempos de inactividad",
        icon: <TrendingUp size={32} />,
        className: "reporte-tendencias-industria",
        route: "/reportes/tendencias-industria",
        color: "#f43f5e",
        roles: ['coordinator', 'manager'] // Coordinador y gerente
    },
    //Reporte 15
    {
        title: "Reporte de sostenibilidad económica",
        description: "Análisis de crecimiento monetario",
        icon: <Percent size={32} />,
        className: "reporte-sostenibilidad",
        route: "/reportes/sostenibilidad",
        color: "#d946ef",
        roles: ['manager'] // Solo gerente
    }
];

const Reportes = () => {
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    // Función para obtener el rol del usuario
    const getUserRole = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/");
                return;
            }

            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUserRole(data.user.role);
            } else {
                console.error('Error al obtener información del usuario');
                handleLogout();
            }
        } catch (error) {
            console.error('Error:', error);
            handleLogout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getUserRole();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    // Filtrar reportes según el rol del usuario
    const filteredReports = userRole
        ? reportCards.filter(card => card.roles.includes(userRole))
        : [];

    if (loading) {
        return (
            <div className="dashboard-container">
                <Navigation onLogout={handleLogout} />
                <div className="loading-container">
                    <p>Cargando reportes...</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />

            <div className="reportes-header">
                <h2 className="reportes-title">Reportes Analíticos</h2>
                <p className="reportes-subtitle">
                    Acceda a informes detallados y análisis de datos para una mejor toma de decisiones
                </p>
                <div className="user-role-badge">
                    Rol actual: <span className="role-text">{userRole}</span>
                </div>
            </div>

            <div className="reportes-grid">
                {filteredReports.map((card, idx) => (
                    <a
                        key={idx}
                        href={card.route}
                        onClick={(e) => { e.preventDefault(); navigate(card.route); }}
                        className={`reporte-card ${card.className}`}
                        style={{ '--card-color': card.color }}
                    >
                        <div className="card-header">
                            <div className="card-icon-wrapper">
                                {card.icon}
                            </div>
                            <ArrowRight size={20} className="card-arrow" />
                        </div>

                        <div className="card-content">
                            <h3 className="reporte-title">{card.title}</h3>
                            <p className="reporte-description">{card.description}</p>
                        </div>

                        <div className="card-hover-effect"></div>
                    </a>
                ))}
            </div>

            {filteredReports.length === 0 && !loading && (
                <div className="no-reports-message">
                    <p>No tienes reportes disponibles para tu rol.</p>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default Reportes;