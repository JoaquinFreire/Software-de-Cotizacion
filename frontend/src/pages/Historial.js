import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import FooterLogo from "../components/FooterLogo"; // Importar el componente FooterLogo
import "../styles/historial.css"; // Importar los estilos

const Historial = () => {
    const [quotations, setQuotations] = useState([]);
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
                        <div className="quote-details">
                            <p>{quotation.Customer.name} {quotation.Customer.lastname}</p>
                            <p>{new Date(quotation.CreationDate).toLocaleDateString()}</p>
                            <p>{quotation.Status}</p> {/* Mostrar el estado de la cotización */}
                            <p>{quotation.Customer.tel}</p>
                            <p>{quotation.Customer.mail}</p>
                        </div>
                    </div>
                ))}
            </div>
            <FooterLogo /> {/* Incluir el componente FooterLogo */}
        </div>
    );
};

export default Historial;
