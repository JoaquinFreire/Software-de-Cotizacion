import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";
import Navigation from "../components/Navigation";
import FooterLogo from "../components/FooterLogo"; // Importar el componente FooterLogo
import logo_busqueda from "../images/logo_busqueda.png";
import QuotationList from "../components/QuotationList"; // Importar el componente QuotationList
import { QuotationContext } from "../context/QuotationContext";
const Dashboard = () => {
  const { quotations, setQuotations} = useContext(QuotationContext);
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setFilteredQuotations(quotations.filter(quotation => quotation.Status === "pending"));
  }, [quotations]);

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:5187/api/quotations/${quotationToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowModal(false);
      setSuccessMessage("Cotización eliminada con éxito.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting quotation:", error);
    }
  };

  const handleDeleteSuccess = () => {
    setQuotations(quotations.filter((quotation) => quotation.Id !== quotationToDelete));
    setFilteredQuotations(filteredQuotations.filter((quotation) => quotation.Id !== quotationToDelete));
  };

  const handleStatusChange = async (id, newStatus) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(`http://localhost:5187/api/quotations/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuotations(quotations.map(quotation => 
        quotation.Id === id ? { ...quotation, Status: newStatus } : quotation
      ));
      setFilteredQuotations(filteredQuotations.map(quotation => 
        quotation.Id === id ? { ...quotation, Status: newStatus } : quotation
      ));
      setSuccessMessage("Estado de la cotización actualizado con éxito.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating quotation status:", error);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setFilteredQuotations(quotations.filter(quotation =>
      `${quotation.Customer.name} ${quotation.Customer.lastname}`.toLowerCase().includes(term)
    ));
  };

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
          <input
            type="text"
            placeholder="Buscar por nombre..."
            className="search-input"
            value={searchTerm}
            onChange={handleSearch}
          />
          <button className="clear-button" onClick={() => setSearchTerm("")}>✖</button>
          <button className="search-button">
            <img src={logo_busqueda} alt="Buscar" />
          </button>
        </div>
        <button className="new-quote" onClick={() => navigate("/new-quotation")}>Nueva Cotización</button>
      </div>

      {successMessage && <div className="success-message">{successMessage}</div>}

      <QuotationList
        quotations={filteredQuotations}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        showModal={showModal}
        setShowModal={setShowModal}
        setQuotationToDelete={setQuotationToDelete}
        successMessage={successMessage}
        onDeleteSuccess={handleDeleteSuccess} // Pasar la función de éxito
      />

      <FooterLogo /> {/* Incluir el componente FooterLogo */}
    </div>
  );
};

export default Dashboard;
