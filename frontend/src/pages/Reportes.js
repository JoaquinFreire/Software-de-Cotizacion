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

const reportCards = [
    {
        title: "Reporte de Estado de Cotizaciones",
        description: "Estado y seguimiento de cotizaciones",
        icon: <FileText size={32} />,
        className: "reporte-estado-cotizaciones",
        route: "/reportes/estado-cotizaciones",
        color: "#3b82f6"
    },
    {
        title: "Análisis de Proyectos por Ubicación Geográfica",
        description: "Distribución geográfica de proyectos",
        icon: <MapPin size={32} />,
        className: "reporte-proyectos-ubicacion",
        route: "/reportes/ubicacion-geografica",
        color: "#ef4444"
    },
    {
        title: "Análisis de Satisfacción del Cliente",
        description: "Métricas de satisfacción clientes",
        icon: <Smile size={32} />,
        className: "reporte-satisfaccion-cliente",
        route: "/reportes/analisis-satisfaccion-cliente",
        color: "#f59e0b"
    },
    {
        title: "Reporte de Material Usado en Cotización",
        description: "Uso de materiales en cotizaciones",
        icon: <Layers size={32} />,
        className: "reporte-material-usado",
        route: "/reportes/material-usado",
        color: "#10b981"
    },
    {
        title: "Reporte de Tendencias de Cotización por Mes",
        description: "Tendencias mensuales de cotizaciones",
        icon: <TrendingUp size={32} />,
        className: "reporte-tendencias-mensuales",
        route: "/reportes/tendencias-mensuales",
        color: "#8b5cf6"
    },
    {
        title: "Reporte de Productividad por Cotizador",
        description: "Rendimiento por cotizador",
        icon: <UserCheck size={32} />,
        className: "reporte-productividad-cotizador",
        route: "/reportes/productividad-cotizador",
        color: "#06b6d4"
    },
    {
        title: "Reporte de Oportunidades Perdidas",
        description: "Análisis de oportunidades no concretadas",
        icon: <Clock3 size={32} />,
        className: "reporte-Oportunidades-Perdidas",
        route: "/reportes/Oportunidades-Perdidas",
        color: "#64748b"
    },
    {
        title: "Carga de trabajo del equipo de cotización",
        description: "Análisis de cotizaciónes pendientes",
        icon: <User size={32} />,
        className: "reporte-productividad-vendedor",
        route: "/operational-dashboard",
        color: "#f97316"
    },
    {
        title: "Beneficio en Cotizaciones por Tipo de Línea",
        description: "Rentabilidad por línea de producto",
        icon: <PieChart size={32} />,
        className: "reporte-beneficio-proyecto",
        route: "/reportes/beneficio-proyecto",
        color: "#ec4899"
    },
    {
        title: "Reporte de Simulación de Cambios de Precio",
        description: "Simulaciones de ajustes de precios",
        icon: <LineChart size={32} />,
        className: "reporte-tendencias-anuales",
        route: "/reportes/tendencias-anuales",
        color: "#84cc16"
    },
    {
        title: "Reporte de Clientes con Mayor Volumen",
        description: "Clientes principales por volumen",
        icon: <Users size={32} />,
        className: "reporte-clientes-mayor-volumen",
        route: "/reportes/cliente-mayor-volumen",
        color: "#6366f1"
    },
    {
        title: "Trazabilidad de cotizaciones",
        description: "Duración y etapas de proyectos",
        icon: <Layers size={32} />,
        className: "reporte-ciclo-vida",
        route: "/reportes/LineaDeTiempoCotizaciones",
        color: "#14b8a6"
    },
    {
        title: "Reporte de Tiempo Ocioso de Producción",
        description: "Análisis de tiempos de inactividad",
        icon: <TrendingUp size={32} />,
        className: "reporte-tendencias-industria",
        route: "/reportes/tendencias-industria",
        color: "#f43f5e"
    },
    {
        title: "Reporte de Promociones y Descuentos",
        description: "Efectividad de promociones",
        icon: <Percent size={32} />,
        className: "reporte-promociones-descuentos",
        route: "/reportes/promociones-descuentos",
        color: "#d946ef"
    },
    {
        title: "Reporte de Consumo de Complementos",
        description: "Uso de complementos en proyectos",
        icon: <UserCheck size={32} />,  
        className: "reporte-consumo-complementos",
        route: "/reportes/consumo-complementos",
        color: "#0ea5e9"
    }
];

const Reportes = () => {
    return (
        <div className="dashboard-container">
            <Navigation />
            
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