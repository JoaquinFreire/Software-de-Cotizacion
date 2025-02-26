import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import Navigation from "../components/Navigation";

const Reportes = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <Navigation onLogout={handleLogout} />
    </div>
  );
};

export default Reportes;
