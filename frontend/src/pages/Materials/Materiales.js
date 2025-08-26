import React from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";
import {Layers } from "lucide-react";
import "../../styles/Materials.css"; // Importar los estilos



const Materiales = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };
  return (
    <div className="dashboard-container">
      <Navigation onLogout={handleLogout} />
            <h2 className="title">Panel de Materiales</h2>
      <div className="home-buttons-container">
        <button className="new-quote coating" onClick={() => navigate("/Materials/coating")}>
          <div className="quote-overlay">
            <Layers size={22} className="home-btn-icon" />
            <b>Revestimietos</b>
          </div>
        </button>
        <button className="new-quote tratamet" onClick={() => navigate("/Materials/aluminumTreatment")}>
          <div className="quote-overlay">
            <Layers size={22} className="home-btn-icon" />
            <b>Tratamiento de Aluminio</b>
          </div>
        </button>
        <button className="new-quote glass" onClick={() => navigate("/Materials/TypeGlass")}>
          <div className="quote-overlay">
            <Layers size={22} className="home-btn-icon" />
            <b>Vidrios</b>
          </div>
        </button>
        </div>
        <Footer />
    </div>
  );
};

export default Materiales;
