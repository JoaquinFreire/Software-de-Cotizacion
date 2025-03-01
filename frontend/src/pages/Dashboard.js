import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";
import Navigation from "../components/Navigation";
import ConfirmationModal from "../components/ConfirmationModal";
import logo_busqueda from "../images/logo_busqueda.png";

const Dashboard = () => {
  const [quotations, setQuotations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuotations = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("http://localhost:5187/api/quotations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuotations(response.data);
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
      setShowModal(false);
    } catch (error) {
      console.error("Error deleting quotation:", error);
    }
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
          <input type="text" placeholder="Buscar..." className="search-input" />
          <button className="clear-button">✖</button>
          <button className="search-button">
            <img src={logo_busqueda} alt="Buscar" />
          </button>
        </div>
        <button className="new-quote" onClick={() => navigate("/new-quotation")}>Nueva Cotización</button>
      </div>

      <div className="quote-container">
        {quotations.map((quotation) => (
          <div key={quotation.Id} className="quote-card">
            <div className="quote-details">
              <p>{quotation.Customer.name} {quotation.Customer.lastname}</p>
              <p>{new Date(quotation.CreationDate).toLocaleDateString()}</p>
              <p>{quotation.Status}</p> {/* Mostrar el estado de la cotización */}
              <p>{quotation.Customer.tel}</p>
              <p>{quotation.Customer.mail}</p>
            </div>
            <div className="quote-actions">
              <button className="go-button" onClick={() => navigate(`/quotation/${quotation.Id}`)}>View Details</button>
              <button className="update-button" onClick={() => navigate(`/update-quotation/${quotation.Id}`)}>Update</button>
              <button className="delete-button" onClick={() => handleShowModal(quotation.Id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmationModal
        show={showModal}
        onClose={handleCloseModal}
        onConfirm={() => handleDelete(quotationToDelete)}
      />
    </div>
  );
};

export default Dashboard;
