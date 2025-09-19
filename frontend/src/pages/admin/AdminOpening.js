import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import "../../styles/adminOpeninig.css";
import axios from "axios";
import ReactLoading from 'react-loading';
import ConfirmationModal from "../../components/ConfirmationModal";
 

import { safeArray } from "../../utils/safeArray";

const API_URL = process.env.REACT_APP_API_URL;

const AdminOpening = () => {
    const navigate = useNavigate();
    const [openings, setOpenings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    // Modal and form state
    const [showModal, setShowModal] = useState(false);
    const [editingOpening, setEditingOpening] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        weight: "",
        predefined_size: "",
    });
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        fetchOpenings();
    }, []);

    const fetchOpenings = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
            return;
        }
        try {
            const resp = await axios.get(`${API_URL}/api/opening-types`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setOpenings(safeArray(resp.data));
        } catch (err) {
            console.error("Error fetching current opening:", err);
            navigate("/");
        }
        setIsLoading(false);
    };

    const handleDelete = async (id) => {
        const token = localStorage.getItem("token");
        setDeletingId(id);
        try {
            await axios.delete(
                `${API_URL}/api/opening-types/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setOpenings(prev => prev.filter(opening => opening.id !== id));
        } catch (error) {
            console.error("Error deleting opening:", error);
        }
        setDeletingId(null);
        setShowDeleteModal(false);
        setPendingDeleteId(null);
    };

    const openDeleteModal = (id) => {
        setPendingDeleteId(id);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setPendingDeleteId(null);
    };

    const handleOpenModal = (opening = null) => {
        setEditingOpening(opening);
        setValidationErrors({});
        setFormData(
            opening
                ? {
                    name: opening.name || "",
                    weight: opening.weight || "",
                    predefined_size: opening.predefined_size || "",
                }
                : {
                    name: "",
                    weight: "",
                    predefined_size: "",
                }
        );
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingOpening(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationErrors({});
        const token = localStorage.getItem("token");
        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                weight: formData.weight,
                predefined_size: formData.predefined_size,
            };
            if (editingOpening) {
                await axios.put(`${API_URL}/api/opening-types/${editingOpening.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                await axios.post(`${API_URL}/api/opening-types`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            await fetchOpenings();
            handleCloseModal();
        } catch (error) {
            setValidationErrors({
                general: editingOpening
                    ? "Error al actualizar la abertura."
                    : "Error al crear la abertura.",
            });
            console.error("Error saving opening:", error);
        }
        setLoading(false);
    };

    return (
        <div className="dashboard-container">
            <Navigation />
            <div className="admin-opening">
                <h2>Administrar Aberturas</h2>
                <button
                    className="create-opeinig-button"
                    onClick={() => handleOpenModal(null)}
                >
                    Crear Nueva Abertura
                </button>
                {isLoading ? (
                    <div className="admin-opening-loading">
                        <ReactLoading type="spin" color="#007bff" height={40} width={40} />
                    </div>
                ) : (
                    <div className="openings-list">
                        {safeArray(openings).length === 0 ? (
                            <p className="no-openings">No hay aberturas registradas.</p>
                        ) : (
                            // Agrupar en filas de 4
                            Array.from({ length: Math.ceil(openings.length / 4) }).map((_, rowIdx) => (
                                <div className="openings-row" key={rowIdx}>
                                    {openings.slice(rowIdx * 4, rowIdx * 4 + 4).map((opening) => (
                                        <div className='AdminOpeningCard' key={opening.id}>
                                            <div className="opening-info">
                                                <h3 className="opening-name">{opening.name}</h3>
                                                <p className="opening-weight"><strong>Peso:</strong> {opening.weight}</p>
                                                <p className="opening-size"><strong>Medida Predefinadia:</strong> {opening.predefined_size}</p>
                                            </div>
                                            <div className="opening-actions">
                                                <button className="update-button" onClick={() => handleOpenModal(opening)}>
                                                    Actualizar
                                                </button>
                                                <button
                                                    className="delete-button"
                                                    onClick={() => openDeleteModal(opening.id)}
                                                    disabled={deletingId === opening.id}
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Modal para actualizar abertura */}
                {showModal && (
                    <div className="modal modal-opening">
                        <div className="modal-content modal-opening-form">
                            <h3 className="modal-title">
                                {editingOpening ? "Actualizar Abertura" : "Crear Nueva Abertura"}
                            </h3>
                            <form onSubmit={handleSubmit} noValidate>
                                {validationErrors.general && (
                                    <div className="validation-error">{validationErrors.general}</div>
                                )}
                                <label className="modal-label">
                                    Nombre:
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="modal-input"
                                    />
                                </label>
                                <label className="modal-label">
                                    Peso:
                                    <input
                                        type="text"
                                        name="weight"
                                        value={formData.weight}
                                        onChange={handleInputChange}
                                        required
                                        className="modal-input"
                                    />
                                </label>
                                <label className="modal-label">
                                    Medida:
                                    <input
                                        type="text"
                                        name="predefined_size"
                                        value={formData.predefined_size}
                                        onChange={handleInputChange}
                                        required
                                        className="modal-input"
                                    />
                                </label>
                                <div className="modal-actions">
                                    <button
                                        type="submit"
                                        className="modal-submit-btn"
                                        disabled={loading}
                                    >
                                        {loading
                                            ? "Guardando..."
                                            : editingOpening
                                                ? "Actualizar"
                                                : "Crear"                                                }
                                    </button>
                                    <button type="button" onClick={handleCloseModal} className="modal-cancel-btn">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal de confirmación de eliminación */}
                <ConfirmationModal
                    show={showDeleteModal}
                    onClose={closeDeleteModal}
                    onConfirm={() => handleDelete(pendingDeleteId)}
                />

                <Footer />
            </div>
        </div>
    );
};

export default AdminOpening;