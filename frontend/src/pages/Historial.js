import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import FooterLogo from "../components/FooterLogo";
import QuotationList from "../components/QuotationList"; // Importar el componente QuotationList
import "../styles/historial.css";
import logo_busqueda from "../images/logo_busqueda.png";

const Historial = () => {
    const [quotations, setQuotations] = useState([]);
    const [filteredQuotations, setFilteredQuotations] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [quotationToDelete, setQuotationToDelete] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const navigate = useNavigate();
    const [filteredQuotations, setFilteredQuotations] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [quotationToDelete, setQuotationToDelete] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const fetchQuotations = async () => {
            const token = localStorage.getItem("token");
            try {
                const response = await axios.get("http://localhost:5187/api/quotations", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setQuotations(response.data);
                setFilteredQuotations(response.data);
            } catch (error) {
                console.error("Error fetching quotations:", error);
            }
        };

        fetchQuotations();
    }, []);
    const handleDelete = async () => {
        const token = localStorage.getItem("token");
        try {
            await axios.delete(`http://localhost:5187/api/quotations/${quotationToDelete}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setQuotations(quotations.filter((quotation) => quotation.Id !== quotationToDelete));
            setFilteredQuotations(filteredQuotations.filter((quotation) => quotation.Id !== quotationToDelete));
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

    const handleDelete = async () => {
        const token = localStorage.getItem("token");
        try {
            await axios.delete(`http://localhost:5187/api/quotations/${quotationToDelete}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setQuotations(quotations.filter((quotation) => quotation.Id !== quotationToDelete));
            setFilteredQuotations(filteredQuotations.filter((quotation) => quotation.Id !== quotationToDelete));
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

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            <h2 className="title">Historial de Cotizaciones</h2>
            <div className="quote-container">
                {quotations.map((quotation) => (
                    <div key={quotation.Id} className="quote-card">
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
                        </div>
                    </div>
                ))}
            </div>
            <QuotationList
                quotations={filteredQuotations}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                showModal={showModal}
                setShowModal={setShowModal}
                setQuotationToDelete={setQuotationToDelete}
                successMessage={successMessage}
            />
            <FooterLogo /> {/* Incluir el componente FooterLogo */}
        </div>
    );
};

export default Historial;
