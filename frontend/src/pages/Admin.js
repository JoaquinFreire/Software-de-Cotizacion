import React from 'react';
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import "../styles/admin.css"; // Importar los estilos
import {Layers, FileText, Clock3, PieChart, Users } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };
  return (
    <div className="dashboard-container">
      <Navigation onLogout={handleLogout} />
            <h2 className="title">Panel de Administracion</h2>
      <div className="home-buttons-container">
        <button className="new-quote AdminUser" onClick={() => navigate("/admin/usuarios")}>
          <div className="quote-overlay">
            <Users size={22} className="home-btn-icon" />
            <b>Administrar Usuario</b>
          </div>
        </button>
        <button className="new-quote AdminMaterials" onClick={() => navigate("/admin/materiales")}>
          <div className="quote-overlay">
            <Layers size={22} className="home-btn-icon" />
            <b>Administrar Materiales</b>
          </div>
        </button>
        <button className="new-quote AdminDescuent" onClick={() => navigate("/admin/descuentos")}>
          <div className="quote-overlay">
            <Clock3 size={22} className="home-btn-icon" />
            <b>Administrar Descuentos</b>
          </div>
        </button>
        </div>
       <div className="home-buttons-container">
        <button className="new-quote AdminLine" onClick={() => navigate("/admin/aberturas")}>
          <div className="quote-overlay">
            <PieChart size={22} className="home-btn-icon" />
            <b>Administrar Aberturas</b>
          </div>
        </button>
        <button className="new-quote AdminGeneal" onClick={() => navigate("/admin/Administrar")}>
          <div className="quote-overlay">
            <FileText size={22} className="home-btn-icon" />
            <b>Administrar General</b>
          </div>
        </button>
      </div>
      <Footer />
    </div>
  );
};

export default Admin;
