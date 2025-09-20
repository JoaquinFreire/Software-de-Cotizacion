import React, { useState } from 'react';
import '../styles/confirmationModal.css';
import ReactLoading from 'react-loading';

const ConfirmationModal = ({ show, onClose, onConfirm }) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!show) {
    return null;
  }

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      // Ejecuta la acción que recibís por props
      await onConfirm();
    } finally {
      // 🔹 Si querés que se cierre solo al terminar
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Se eliminará la cotización</h2>
        <p>¿Está seguro de su eliminación?</p>
        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose} disabled={isLoading}>
            Cancelar
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
              'Confirmar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
