import React, { useState } from 'react';
import '../styles/confirmationModal.css';
import ReactLoading from 'react-loading';

const ConfirmationModal = ({ show, onClose, onConfirm, title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar" }) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!show) {
    return null;
  }

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{title ?? "Confirmar eliminación"}</h2>
        <p>{message ?? "¿Está seguro de que desea eliminar?"}</p>
        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </button>

          <button
            className="confirm-button"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ReactLoading type="spin" color="#fff" height={20} width={20} />
                Eliminando...
              </div>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
