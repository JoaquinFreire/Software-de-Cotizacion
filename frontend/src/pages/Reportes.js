import React from 'react';
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





const reportCards = [
    { // Reporte 1
        title: "Reporte de Estado de Cotizaciones",
        description: "Estado y seguimiento de cotizaciones",
        icon: <FileText size={32} />,
        className: "reporte-estado-cotizaciones",
        route: "/reportes/estado-cotizaciones",
        color: "#3b82f6"
    },
    { // Reporte 2
        title: "Análisis de Proyectos por Ubicación Geográfica",
        description: "Distribución geográfica de proyectos",
        icon: <MapPin size={32} />,
        className: "reporte-proyectos-ubicacion",
        route: "/reportes/ubicacion-geografica",
        color: "#ef4444"
    },
    { // Reporte 3
        title: "Análisis de Satisfacción del Cliente",
        description: "Métricas de satisfacción clientes",
        icon: <Smile size={32} />,
        className: "reporte-satisfaccion-cliente",
        route: "/reportes/analisis-satisfaccion-cliente",
        color: "#f59e0b"
    },
    { // Reporte 4
        title: "Reporte de Tendencias de Cotización por Mes",
        description: "Tendencias mensuales de cotizaciones",
        icon: <TrendingUp size={32} />,
        className: "reporte-tendencias-mensuales",
        route: "/reportes/tendencias-mensuales",
        color: "#8b5cf6"
    },
    { // Reporte 5
        title: "Reporte de Productividad por Cotizador",
        description: "Rendimiento por cotizador",
        icon: <UserCheck size={32} />,
        className: "reporte-productividad-cotizador",
        route: "/reportes/productividad-cotizador",
        color: "#06b6d4"
    },
    { // Reporte 6
        title: "Reporte de Oportunidades Perdidas",
        description: "Análisis de oportunidades no concretadas",
        icon: <Clock3 size={32} />,
        className: "reporte-Oportunidades-Perdidas",
        route: "/reportes/Oportunidades-Perdidas",
        color: "#64748b"
    },
    { // Reporte 7
        title: "Carga de Trabajo del Equipo de Cotización",
        description: "Desempeño del equipo de trabajo",
        icon: <User size={32} />,
        className: "reporte-productividad-vendedor",
        route: "/operational-dashboard",
        color: "#f97316"
    },
    { // Reporte 8
        title: "Beneficio en Cotizaciones por Tipo de Línea",
        description: "Rentabilidad por línea de producto",
        icon: <PieChart size={32} />,
        className: "reporte-beneficio-proyecto",
        route: "/reportes/beneficio-proyecto",
        color: "#ec4899"
    },
    { // Reporte 9
        title: "Reporte de Consumo de Complementos",
        description: "Uso de complementos en proyectos",
        icon: <UserCheck size={32} />,
        className: "reporte-consumo-complementos",
        route: "/reportes/consumo-complementos",
        color: "#0ea5e9"
    },
    { // Reporte 10
        title: "Trazabilidad de cotizaciones",
        description: "Duración y etapas de proyectos",
        icon: <Layers size={32} />,
        className: "reporte-ciclo-vida",
        route: "/reportes/LineaDeTiempoCotizaciones",
        color: "#14b8a6"
    },
    { // Reporte 11
        title: "Reporte de Material Usado en Cotización",
        description: "Uso de materiales en cotizaciones",
        icon: <Layers size={32} />,
        className: "reporte-material-usado",
        route: "/reportes/material-usado",
        color: "#10b981"
    },
    { // Reporte 12
        title: "Reporte de Desempeño Personal",
        description: "Analisis de metricas del rendimiento personal",
        icon: <LineChart size={32} />,
        className: "reporte-metrica-personal",
        route: "/reportes/metrica-personal",
        color: "#84cc16"
    },
    { // Reporte 13
        title: "Reporte de Clientes con Mayor Volumen",
        description: "Clientes principales por volumen",
        icon: <Users size={32} />,
        className: "reporte-clientes-mayor-volumen",
        route: "/reportes/cliente-mayor-volumen",
        color: "#6366f1"
    },
    { // Reporte 14
        title: "Reporte de Tiempo Ocioso de Producción",
        description: "Análisis de tiempos de inactividad",
        icon: <TrendingUp size={32} />,
        className: "reporte-tendencias-industria",
        route: "/reportes/tendencias-industria",
        color: "#f43f5e"
    },
    { // Reporte 15
        title: "Reporte de sostenibilidad económica",
        description: "Análisis de crecimiento monetario",
        icon: <Percent size={32} />,
        className: "reporte-sostenibilidad",
        route: "/reportes/sostenibilidad",
        color: "#d946ef"
    }
];

const Reportes = () => {
const navigate = useNavigate();
const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            
            <div className="reportes-header">
                <h2 className="reportes-title">Reportes Analíticos</h2>
                <p className="reportes-subtitle">
                    Acceda a informes detallados y análisis de datos para una mejor toma de decisiones
                </p>
            </div>
            
            <div className="reportes-grid">
                {reportCards.map((card, idx) => (
                    <a
                        key={idx}
                        href={card.route}
                        target="_blank"
                        rel="noopener noreferrer"
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
            
            <Footer />
        </div>
    );
};

export default Reportes;