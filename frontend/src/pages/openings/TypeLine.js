import React, { useState, useEffect } from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";
import { Layers, Grid3X3, Puzzle, Wrench, Type } from "lucide-react";
import "../../styles/Aberturas.css";
import axios from "axios";
import { safeArray } from '../../utils/safeArray';
import ReactLoading from 'react-loading';
const API_URL = process.env.REACT_APP_API_URL;

const TypeLine = () => {
    const navigate = useNavigate();
    const [openings, setOpenings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalOpening, setModalOpening] = useState(null);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    const openModal = (opening) => {
        setModalOpening(opening);
        setShowModal(true);
    };
    const closeModal = () => {
        setShowModal(false);
        setModalOpening(null);
    };

    useEffect(() => {
        let mounted = true;
        const fetchOpenings = async () => {
            if (!mounted) return;
            setIsLoading(true);
            try {
                const token = localStorage.getItem("token");
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const resp = await axios.get(`${API_URL}/api/opening-types`, { headers });

                // CORRECCIÓN: usar safeArray con los datos del response
                if (!mounted) return;
                setOpenings(safeArray(resp.data));
            } catch (err) {
                // Si el backend responde 401 => redirigir a login
                if (axios.isAxiosError(err) && err.response?.status === 401) {
                    console.warn("No autorizado, redirigiendo al login");
                    navigate("/");
                    return;
                }
                console.error("Error fetching openings:", err);
                if (mounted) setOpenings([]);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        fetchOpenings();
        return () => { mounted = false; };
    }, [navigate]);

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />

            <div className="materials-header">
                <h2 className="materials-title">Panel de Aberturas</h2>
                <p className="materials-subtitle">
                    Descubra los diferentes tipos de aberturas y sus componentes
                </p>
            </div>

            {isLoading ? (
                <div className="spinner-container" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ReactLoading type="spin" color="#26b7cd" height={44} width={44} />
                </div>
            ) : (
                <>
                    {openings.length === 0 ? (
                        <p style={{ textAlign: 'center' }}>No hay aberturas registradas.</p>
                    ) : (
                        <div className="materials-grid">
                            {openings.map((opening) => (
                                <button
                                    key={opening.id}
                                    className={`material-card`}
                                    onClick={() => openModal(opening)} // <-- abrir modal
                                    style={{ '--card-color': '#26b7cd' }}
                                >
                                    <div
                                        className="card-background"
                                        style={opening.image_url ? { backgroundImage: `url(${opening.image_url})` } : undefined}
                                    ></div>
                                    <div className="card-content">
                                        <div className="card-icon-wrapper">
                                            <Grid3X3 size={32} />
                                        </div>
                                        <h3 className="card-title">{opening.name}</h3>
                                        <p className="card-description">Peso: {opening.weight} — Medida: {opening.predefined_size}</p>
                                        <div className="card-arrow">→</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {showModal && modalOpening && (
                <div className="modal modal-opening" onClick={closeModal}>
                    <div className="modal-content modal-opening-form" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>Cerrar</button>
                        <h3 className="modal-title">{modalOpening.name}</h3>
                        {modalOpening.image_url && (
                            <img src={modalOpening.image_url} alt={modalOpening.name} style={{ maxWidth: '100%', marginBottom: 12 }} />
                        )}
                        {modalOpening.description && (
                            <p>{modalOpening.description}</p>
                        )}
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default TypeLine;