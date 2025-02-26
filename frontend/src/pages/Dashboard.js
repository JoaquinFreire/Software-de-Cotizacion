import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import Navigation from "../components/Navigation";
import logo_busqueda from "../images/logo_busqueda.png";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <Navigation onLogout={handleLogout} />

      <h2 className="title">Cotizaciones Pendientes</h2>

      <div className="search-bar">
        <div className="search-container">
          <input type="text" placeholder="Buscar..." className="search-input" />
          <button className="clear-button">✖</button>
          <button className="search-button">
            <img src={logo_busqueda} alt="Buscar" />
          </button>
        </div>
        <button className="new-quote">Nueva Cotización</button>
      </div>

      <div className="quote-container">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="quote-card">
            <p>Bruno Fontanari</p>
            <p>19/02/2025</p>
            <p>Pj. Austral 41</p>
            <p>3543694696</p>
            <p>Fontanaribruno21@gmail.com</p>
            <button className="go-button">Ir</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
