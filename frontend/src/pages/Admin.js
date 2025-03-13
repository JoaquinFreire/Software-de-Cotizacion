import React from 'react';
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import FooterLogo from "../components/FooterLogo"; // Importar el componente FooterLogo
import "../styles/admin.css"; // Importar los estilos

const Admin = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <Navigation onLogout={handleLogout} />
      <h2 className="title">Administración</h2>
      {/* Contenido de la página de administración */}
      <FooterLogo /> {/* Incluir el componente FooterLogo */}
    </div>
  );
};

export default Admin;
