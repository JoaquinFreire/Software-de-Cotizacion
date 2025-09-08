import React from 'react';
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import "../styles/reportes.css";
import { FileText, Layers, TrendingUp, UserCheck, User, Clock3, PieChart, MapPin, Smile, LineChart, Percent, Users } from 'lucide-react';

const reportCards = [
  {
    title: "Reporte de Estado de Cotizaciones",
    icon: <FileText size={40} />,
    className: "reporte-estado-cotizaciones",
    route: "/reportes/estado-cotizaciones"
  },
  {
    title: "Reporte de Material Usado en Cotización",
    icon: <Layers size={40} />,
    className: "reporte-material-usado",
    route: "/reportes/material-usado"
  },
  {
    title: "Reporte de Tendencias de Cotización por Mes",
    icon: <TrendingUp size={40} />,
    className: "reporte-tendencias-mensuales",
    route: "/reportes/tendencias-mensuales"
  },
  {
    title: "Reporte de Productividad por Cotizador",
    icon: <UserCheck size={40} />,
    className: "reporte-productividad-cotizador",
    route: "/reportes/productividad-cotizador"
  },
  {
    title: "Reporte de Productividad por Vendedor",
    icon: <User size={40} />,
    className: "reporte-productividad-vendedor",
    route: "/reportes/productividad-vendedor"
  },
  {
    title: "Tendencias de Cotización Anual",
    icon: <LineChart size={40} />,
    className: "reporte-tendencias-anuales",
    route: "/reportes/tendencias-anuales"
  },
  {
    title: "Análisis de Tiempo de Respuesta en la Generación de Cotizaciones",
    icon: <Clock3 size={40} />,
    className: "reporte-tiempo-respuesta",
    route: "/reportes/tiempo-respuesta"
  },
  {
    title: "Beneficio en Cotizaciones por Tipo de Proyecto",
    icon: <PieChart size={40} />,
    className: "reporte-beneficio-proyecto",
    route: "/reportes/beneficio-proyecto"
  },
  {
    title: "Reporte de Clientes con Mayor Volumen de Cotización",
    icon: <Users size={40} />,
    className: "reporte-clientes-mayor-volumen",
    route: "/reportes/clientes-mayor-volumen"
  },
  {
    title: "Análisis de Proyectos por Ubicación Geográfica",
    icon: <MapPin size={40} />,
    className: "reporte-proyectos-ubicacion",
    route: "/reportes/ubicacion-geografica"
  },
  {
    title: "Análisis de Ciclo de Vida de los Proyectos",
    icon: <Layers size={40} />,
    className: "reporte-ciclo-vida",
    route: "/reportes/ciclo-vida"
  },
  {
    title: "Análisis de Satisfacción del Cliente",
    icon: <Smile size={40} />,
    className: "reporte-satisfaccion-cliente",
    route: "/reportes/analisis-satisfaccion-cliente"
  },
  {
    title: "Tendencias de la Industria de Aberturas de Aluminio",
    icon: <TrendingUp size={40} />,
    className: "reporte-tendencias-industria",
    route: "/reportes/tendencias-industria"
  },
  {
    title: "Reporte de Promociones y Descuentos",
    icon: <Percent size={40} />,
    className: "reporte-promociones-descuentos",
    route: "/reportes/promociones-descuentos"
  },
  {
    title: "Reporte de Productividad por Cotizador",
    icon: <UserCheck size={40} />,
    className: "reporte-productividad-cotizador-2",
    route: "/reportes/productividad-cotizador-2"
  }
];

const Reportes = () => {
  return (
    <div className="dashboard-container">
      <Navigation />
      <h2 className="title">Reportes</h2>
      <div className="reportes-grid">
        {reportCards.map((card, idx) => (
          <a
            key={idx}
            href={card.route}
            target="_blank"
            rel="noopener noreferrer"
            className={`reporte-card ${card.className}`}
          >
            <div className="reporte-icon">{card.icon}</div>
            <div className="reporte-title">{card.title}</div>
          </a>
        ))}
      </div>
      <Footer />
    </div>
  );
};

export default Reportes;
