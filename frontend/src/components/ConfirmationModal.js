import React from 'react';
import '../styles/confirmationModal.css';

const ConfirmationModal = ({ show, onClose, onConfirm }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Se eliminara la cotizacion</h2>
        <p>¿Esta seguro de su eliminacion?</p>
        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose}>Cancelar</button>
          <button className="confirm-button" onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
