import React from 'react';
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import FooterLogo from "../components/FooterLogo"; // Importar el componente FooterLogo
import "../styles/reportes.css"; // Importar los estilos

const Reportes = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <Navigation onLogout={handleLogout} />
      <h2 className="title">Reportes</h2>
      {/* Contenido de la página de reportes */}
      <FooterLogo /> {/* Incluir el componente FooterLogo */}
    </div>
  );
};

export default Reportes;
