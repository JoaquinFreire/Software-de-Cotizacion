import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";
import Navigation from "../components/Navigation";
import FooterLogo from "../components/FooterLogo"; // Importar el componente FooterLogo
import ConfirmationModal from "../components/ConfirmationModal";
import logo_busqueda from "../images/logo_busqueda.png";

const Dashboard = () => {
  const [quotations, setQuotations] = useState([]);
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuotations = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("http://localhost:5187/api/quotations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const pendingQuotations = response.data.filter(quotation => quotation.Status === "pending");
        setQuotations(pendingQuotations);
        setFilteredQuotations(pendingQuotations);
      } catch (error) {
        console.error("Error fetching quotations:", error);
      }
    };

    fetchQuotations();
  }, []);

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:5187/api/quotations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuotations(quotations.filter((quotation) => quotation.Id !== id));
      setFilteredQuotations(filteredQuotations.filter((quotation) => quotation.Id !== id));
      setShowModal(false);
      setSuccessMessage("Cotización eliminada con éxito.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting quotation:", error);
    }
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

  const handleShowModal = (id) => {
    setQuotationToDelete(id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setQuotationToDelete(null);
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

      <div className="quote-container">
        {filteredQuotations.map((quotation) => (
          <div key={quotation.Id} className="quote-card">
            <div className="quote-details">
              <p><b><u>Nombre</u>:  </b>{quotation.Customer.name} {quotation.Customer.lastname}</p>
              <p><b><u>Fecha</u>:  </b>{new Date(quotation.CreationDate).toLocaleDateString()}</p>
              <p><b><u>Estado</u>:  </b>{quotation.Status}</p> {/* Mostrar el estado de la cotización */}
              <p><b><u>Teléfono</u>:  </b>{quotation.Customer.tel}</p>
              <p><b><u>Correo</u>:  </b>{quotation.Customer.mail}</p>
            </div>
            <div className="quote-actions">
              <button className="go-button" onClick={() => navigate(`/quotation/${quotation.Id}`)}>Ver Detalles</button>
              <button className="update-button" onClick={() => navigate(`/update-quotation/${quotation.Id}`)}>Actualizar</button>
              <button className="delete-button" onClick={() => handleShowModal(quotation.Id)}>Eliminar</button>
              <select className="status-select" value={quotation.Status} onChange={(e) => handleStatusChange(quotation.Id, e.target.value)}>
                <option value="pending">Pendientes</option>
                <option value="approved">Aprobados</option>
                <option value="rejected">Rechazado</option>
                <option value="finished">Finalizado</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      <ConfirmationModal
        show={showModal}
        onClose={handleCloseModal}
        onConfirm={() => handleDelete(quotationToDelete)}
      />
      <FooterLogo /> {/* Incluir el componente FooterLogo */}
    </div>
  );
};

export default Dashboard;
