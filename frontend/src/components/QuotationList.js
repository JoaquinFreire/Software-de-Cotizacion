import { useNavigate } from "react-router-dom";
import ConfirmationModal from "./ConfirmationModal";
import "../styles/quotationList.css";
import 'react-loading-skeleton/dist/skeleton.css'
import { safeArray } from "../utils/safeArray";
import React, { useState } from "react";
import ReactLoading from 'react-loading';

const QuotationList = ({ quotations, onDelete, onStatusChange, showModal, setShowModal, setQuotationToDelete, onDeleteSuccess }) => {
  const navigate = useNavigate();
  const [isRecovering, setIsRecovering] = useState(false); 
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [quotationToReject, setQuotationToReject] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);

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

  const handleStatusChange = (id, newStatus) => {
    if (newStatus === "rejected") {
      setQuotationToReject(id);
      setPendingStatus(newStatus);
      setRejectReason("");
      setShowRejectModal(true);
    } else {
      onStatusChange(id, newStatus);
    }
  };

  const handleConfirmReject = async () => {
    if (quotationToReject && pendingStatus) {
      setIsRecovering(true);
      try {
        localStorage.setItem(`motivoRechazo_${quotationToReject}`, rejectReason.trim());
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

  return (
    <div className="quote-container">
      {safeArray(quotations).map((quotation) => (
        <div key={quotation.Id} className="quote-card">
          <div className="quote-details">
            <p><b><u>Cliente</u>:  </b>{quotation.Customer.name} {quotation.Customer.lastname}</p>
            <p><b><u>Creación</u>:  </b>{new Date(quotation.CreationDate).toLocaleDateString()}</p>
            <p><b><u>Estado</u>:  </b>{quotation.Status}</p>
            <p><b><u>Teléfono</u>:  </b>{quotation.Customer.tel}</p>
            <p><b><u>Correo</u>:  </b>{quotation.Customer.mail}</p>
          </div>
          <div className="quote-details">
            <p><b><u>Precio</u>:  </b>${quotation.TotalPrice}</p>
            <p><b><u>Lugar</u>:  </b>{quotation.WorkPlace.name}</p>
            <p><b><u>Dirección</u>:  </b>{quotation.WorkPlace.address}</p>
            <p><b><u>Entrega</u>:  </b>{new Date(quotation.CreationDate).toLocaleDateString()}</p>
            <p><b><u>Vencimiento</u>:</b> {quotation.ExpirationDate ? new Date(quotation.ExpirationDate).toLocaleDateString() : "No especificado"}</p>
          </div>
          <div className="quote-actions">
            <button className="go-button" onClick={() => navigate(`/quotation/${quotation.Id}`)}>Ver Detalles</button>
            <button className="update-button" onClick={() => navigate(`/update-quotation/${quotation.Id}`)}>Actualizar</button>
            <button className="delete-button" onClick={() => handleShowModal(quotation.Id)}>Eliminar</button>
            <select
              className="status-select"
              value={quotation.Status}
              onChange={(e) => handleStatusChange(quotation.Id, e.target.value)}
            >
              <option className="dropdown" value="pending">Pendientes</option>
              <option className="dropdown" value="approved">Aprobados</option>
              <option className="dropdown" value="rejected">Rechazado</option>
              <option className="dropdown" value="finished">Finalizado</option>
            </select>
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
                    <ReactLoading type="spin" color="#26b7cd" height={24} width={24}/>
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