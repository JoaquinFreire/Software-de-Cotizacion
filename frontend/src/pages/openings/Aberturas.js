import React from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";
import { BrickWall } from "lucide-react";
import "../../styles/Aberturas.css"; // Importar los estilos

const Aberturas = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };
  return (
    <div className="dashboard-container">
      <Navigation onLogout={handleLogout} />
            <h2 className="title">Panel de Aberturas</h2>
      <div className="home-buttons-container">
        <button className="new-quote Line" onClick={() => navigate("/openings/TypesLines")}>
          <div className="quote-overlay">
            <BrickWall size={22} className="home-btn-icon" />
            <b>Tipos de Lineas</b>
          </div>
        </button>
        <button className="new-quote Complement" onClick={() => navigate("/openings/Complement")}>
          <div className="quote-overlay">
            <BrickWall size={22} className="home-btn-icon" />
            <b>Complementos</b>
          </div>
        </button>
        <button className="new-quote Accesories" onClick={() => navigate("/openings/Accessories")}>
          <div className="quote-overlay">
            <BrickWall size={22} className="home-btn-icon" />
            <b>Accesorios</b>
          </div>
        </button>
        </div>
        <Footer />
    </div>
  );
};

export default Aberturas;
