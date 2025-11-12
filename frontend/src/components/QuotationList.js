import { useNavigate } from "react-router-dom";
import ConfirmationModal from "./ConfirmationModal";
import "../styles/quotationList.css";
import 'react-loading-skeleton/dist/skeleton.css'
import { safeArray } from "../utils/safeArray";
import React, { useState, useEffect } from "react";
import ReactLoading from 'react-loading';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5187";

const QuotationList = ({ quotations, onDelete, onStatusChange, showModal, setShowModal, setQuotationToDelete, onDeleteSuccess }) => {
    const navigate = useNavigate();
    const [isRecovering, setIsRecovering] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [quotationToReject, setQuotationToReject] = useState(null);
    const [pendingStatus, setPendingStatus] = useState(null);
    const [changingId, setChangingId] = useState(null);
    const [versionsMap, setVersionsMap] = useState({}); // { quotationId: versions[] }

    // Función para obtener las versiones de cada cotización
    const fetchQuotationVersions = async (quotationId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/Mongo/GetBudgetVersions/${quotationId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Procesar la respuesta igual que en BudgetDetail
            const rawList = Array.isArray(res.data)
                ? res.data
                : (res.data && Array.isArray(res.data.$values) ? res.data.$values : []);

            return rawList;
        } catch (error) {
            console.error(`Error fetching versions for quotation ${quotationId}:`, error);
            return [];
        }
    };

    // Cargar versiones para todas las cotizaciones
    useEffect(() => {
        const loadAllVersions = async () => {
            const newVersionsMap = {};
            
            for (const quotation of safeArray(quotations)) {
                const versions = await fetchQuotationVersions(quotation.Id);
                newVersionsMap[quotation.Id] = versions;
            }
            
            setVersionsMap(newVersionsMap);
        };

        if (quotations && quotations.length > 0) {
            loadAllVersions();
        }
    }, [quotations]);

    // Función para obtener la última versión de una cotización
    const getLatestVersion = (quotationId) => {
        const versions = versionsMap[quotationId] || [];
        if (versions.length === 0) return "1"; // Valor por defecto
        
        const latestVersion = versions[0]; // La primera es la más reciente
        return latestVersion.version || latestVersion.Version || "1";
    };

    

    const handleShowModal = (id) => {
        setQuotationToDelete(id);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setQuotationToDelete(null);
    };

    const handleDeleteConfirm = async () => {
        await onDelete();
        onDeleteSuccess();
    };

    const handleStatusChange = async (id, newStatus) => {
        if (newStatus === "rejected") {
            setQuotationToReject(id);
            setPendingStatus(newStatus);
            setRejectReason("");
            setShowRejectModal(true);
            return;
        }

        setChangingId(id);
        try {
            await onStatusChange(id, newStatus);
        } catch (err) {
            // manejo de errores
        } finally {
            setChangingId(null);
        }
    };

    const handleConfirmReject = async () => {
        if (quotationToReject && pendingStatus) {
            setIsRecovering(true);
            try {
                await onStatusChange(quotationToReject, pendingStatus, rejectReason.trim());
            } finally {
                setIsRecovering(false);
                setShowRejectModal(false);
                setQuotationToReject(null);
                setPendingStatus(null);
                setRejectReason("");
            }
        }
    };

    const handleCancelReject = () => {
        setShowRejectModal(false);
        setQuotationToReject(null);
        setPendingStatus(null);
        setRejectReason("");
    };

    const isQuotationRejected = (quotation) => {
        return quotation.Status?.toLowerCase() === "rejected";
    };

    return (
        <div className="quote-container">
            {safeArray(quotations).map((quotation) => (
                <div key={quotation.Id} className="quote-card">
                    <div className="quote-details">
                        <p><b><u>Cliente</u>:  </b>{quotation.Customer.name} {quotation.Customer.lastname}</p>
                        <p><b><u>DNI</u>:   </b>{quotation.Customer.dni}</p>
                        <p><b><u>Teléfono</u>:  </b>{quotation.Customer.tel}</p>
                        <p><b><u>Correo</u>:  </b>{quotation.Customer.mail}</p>
                        <p><b><u>Lugar</u>:  </b>{quotation.WorkPlace.name}</p>
                    </div>
                    <div className="quote-details">
                        <p><b><u>Precio</u>:  </b>${quotation.TotalPrice}</p>
                        <p><b><u>Creación</u>:  </b>{new Date(quotation.CreationDate).toLocaleDateString()}</p>
                        <p><b><u>Dirección</u>:  </b>{quotation.WorkPlace.address}</p>
                        <p><b><u>Versión actual</u>:  </b>v{getLatestVersion(quotation.Id)}</p>

                    </div>
                    <div className="quote-actions">
                        <button className="go-button" onClick={() => window.open(`/quotation/${quotation.Id}`)}>Ver Detalles</button>

                        {/* Botón Actualizar - Solo disponible para cotizaciones rechazadas */}
                        <div className="tooltip-container">
                            <button
                                className={`update-button ${!isQuotationRejected(quotation) ? 'disabled' : ''}`}
                                onClick={() => isQuotationRejected(quotation) && navigate(`/quotation-new-version/${quotation.Id}`)}
                                disabled={!isQuotationRejected(quotation)}
                            >
                                Actualizar
                            </button>
                            {!isQuotationRejected(quotation) && (
                                <div className="tooltip">
                                    La cotización debe ser rechazada para generar una nueva versión.
                                </div>
                            )}
                        </div>

                        <button className="delete-button" onClick={() => handleShowModal(quotation.Id)}>Eliminar</button>

                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <select
                                className="status-select"
                                value={changingId === quotation.Id ? "updating" : quotation.Status}
                                onChange={(e) => handleStatusChange(quotation.Id, e.target.value)}
                                disabled={changingId === quotation.Id}
                            >
                                {changingId === quotation.Id ? (
                                    <option value="updating">Actualizando</option>
                                ) : (
                                    <>
                                        <option className="dropdown" value="pending">Pendientes</option>
                                        <option className="dropdown" value="approved">Aprobados</option>
                                        <option className="dropdown" value="rejected">Rechazado</option>
                                        <option className="dropdown" value="finished">Finalizado</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>
                </div>
            ))}
            <ConfirmationModal
                show={showModal}
                onClose={handleCloseModal}
                onConfirm={handleDeleteConfirm}
            />
            {showRejectModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Motivo de rechazo</h3>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Ingrese el motivo del rechazo"
                            rows={4}
                            className="reject-textarea"
                        />
                        <div className="modal-actions">
                            <button className="Cancel-botton" onClick={handleCancelReject} disabled={isRecovering}>Cancelar</button>
                            <button
                                onClick={handleConfirmReject}
                                disabled={!rejectReason.trim() || isRecovering}
                                className="delete-button-modal"
                                style={{ position: 'relative', minWidth: 120 }}
                            >
                                {isRecovering ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ReactLoading type="spin" color="#26b7cd" height={24} width={24} />
                                    </span>
                                ) : (
                                    "Confirmar Rechazo"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuotationList;