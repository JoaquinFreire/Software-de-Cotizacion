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
  // id de cotización que está cambiando estado (muestra "Actualizando..." en el select)
  const [changingId, setChangingId] = useState(null);

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

    // mostrar indicador local en el select
    setChangingId(id);
    try {
      // esperar a que el padre complete la petición
      await onStatusChange(id, newStatus);
    } catch (err) {
      // el padre ya muestra toast; opcional: manejar errores locales si hace falta
    } finally {
      setChangingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (quotationToReject && pendingStatus) {
      setIsRecovering(true);
      try {
        // Ya no usamos localStorage; enviamos el motivo directamente al callback
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
            {/* Cuando changingId === quotation.Id mostramos un único option "Actualizando..." */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <select
                className="status-select"
                value={changingId === quotation.Id ? "updating" : quotation.Status}
                onChange={(e) => handleStatusChange(quotation.Id, e.target.value)}
                disabled={changingId === quotation.Id}
              >
                {changingId === quotation.Id ? (
                  <option value="updating">Actualizando...</option>
                ) : (
                  <>
                    <option className="dropdown" value="pending">Pendientes</option>
                    <option className="dropdown" value="approved">Aprobados</option>
                    <option className="dropdown" value="rejected">Rechazado</option>
                    <option className="dropdown" value="finished">Finalizado</option>
                  </>
                )}
              </select>
              {/* Pequeño spinner superpuesto a la derecha dentro del contenedor del select */}
              {changingId === quotation.Id && (
                <div style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}>
                  <ReactLoading type="spin" color="#26b7cd" height={16} width={16} />
                </div>
              )}
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