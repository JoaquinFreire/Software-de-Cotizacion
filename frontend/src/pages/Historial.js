import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import QuotationList from "../components/QuotationList";
import logo_busqueda from "../images/logo_busqueda.png";
import { QuotationContext } from "../context/QuotationContext";
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';
import { ToastContainer, toast, Slide } from 'react-toastify';
import '../styles/pagination.css';
const API_URL = process.env.REACT_APP_API_URL;

const Historial = () => {
    const {
        historialState, pageSize, goToHistorialPage, switchToHistorial
    } = useContext(QuotationContext);
    const { quotations, page, total, loading } = historialState;
    const navigate = useNavigate();
    const [filteredQuotations, setFilteredQuotations] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [quotationToDelete, setQuotationToDelete] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        switchToHistorial();
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        setFilteredQuotations(Array.isArray(quotations) ? quotations : []);
    }, [quotations]);

    // Scroll arriba al cambiar de página
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [historialState.page]);

    const handleDelete = async () => {
        const token = localStorage.getItem("token");
        try {
            await axios.delete(`${API_URL}/api/quotations/${quotationToDelete}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setShowModal(false);
            setSuccessMessage("Cotización eliminada con éxito.");
            // Recarga la página actual después de borrar
            goToHistorialPage(page);
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error) {
            console.error("Error deleting quotation:", error);
        }
    };

    const handleDeleteSuccess = () => {
        // Ya no necesitas modificar el estado localmente
    };

    const handleStatusChange = async (id, newStatus) => {
        const token = localStorage.getItem("token");
        try {
            await axios.put(`${API_URL}/api/quotations/${id}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Recarga la página actual después de cambiar estado
            goToHistorialPage(page);
            toast.success("Estado de la cotización actualizado con éxito.");
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
            <ToastContainer autoClose={4000} theme="dark" transition={Slide} position="bottom-right" />
            <div className="quote-container">
                <div className="quote-card">
                    <div className="search-bar">
                        <div className="search-container">
                            <input
                                type="text"
                                placeholder="Buscar por nombre..."
                                className="search-input"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                            <button className="clear-button-q" onClick={() => setSearchTerm("")}>✖</button>
                            <button className="search-button">
                                <img src={logo_busqueda} alt="Buscar" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {loading ? (
                <div className="quote-container">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="quote-card">
                            <div className="quote-details">
                                <p>
                                    <Skeleton width="70%" height={20} baseColor="#e0e0e0" highlightColor="#a9acac" duration={1.2} />
                                </p>
                                <p>
                                    <Skeleton width="70%" height={20} baseColor="#e0e0e0" highlightColor="#a9acac" duration={1.2} />
                                </p>
                                <p>
                                    <Skeleton width="70%" height={20} baseColor="#e0e0e0" highlightColor="#a9acac" duration={1.2} />
                                </p>
                                <p>
                                    <Skeleton width="70%" height={20} baseColor="#e0e0e0" highlightColor="#a9acac" duration={1.2} />
                                </p>
                            </div>
                            <div className="quote-actions" style={{ display: 'flex', gap: 10 }}>
                                <Skeleton width="100px" height="30px" baseColor="#00ffff" highlightColor="#f2f8f8" duration={1.2} />
                                <Skeleton width="100px" height="30px" baseColor="#00bcd4" highlightColor="#f2f8f8" duration={1.2} />
                                <Skeleton width="100px" height="30px" baseColor="#f44336" highlightColor="#f2f8f8" duration={1.2} />
                                <Skeleton width="100px" height="30px" baseColor="#ffeb3b" highlightColor="#f2f8f8" duration={1.2} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <QuotationList
                        quotations={filteredQuotations}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                        showModal={showModal}
                        setShowModal={setShowModal}
                        setQuotationToDelete={setQuotationToDelete}
                        successMessage={successMessage}
                        onDeleteSuccess={handleDeleteSuccess}
                    />
                    <div className="pagination-nav">
                        <button
                            onClick={() => goToHistorialPage(page - 1)}
                            disabled={page <= 1}
                        >Anterior</button>
                        <span>
                            Página {page} de {Math.ceil(total / pageSize)}
                        </span>
                        <button
                            onClick={() => goToHistorialPage(page + 1)}
                            disabled={page >= Math.ceil(total / pageSize)}
                        >Siguiente</button>
                    </div>
                </>
            )}
            <Footer />
        </div>
    );
};

export default Historial;
