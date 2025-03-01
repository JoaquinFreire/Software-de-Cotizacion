import React from 'react';
import '../styles/confirmationModal.css';

const ConfirmationModal = ({ show, onClose, onConfirm }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Confirm Deletion</h2>
        <p>Are you sure you want to delete this quotation?</p>
        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose}>Cancel</button>
          <button className="confirm-button" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
