import React from 'react';
import '../styles/sessionModal.css';

const SessionModal = ({ show, onExtend, onLogout, onCancel }) => {
    if (!show) return null;

    return (
        <div className="session-modal">
            <div className="session-modal-content">
                <h2>Advertencia de Sesión</h2>
                <p>Tu sesión expirará en breve. ¿Deseas extender la sesión?</p>
                <div className="session-modal-actions">
                    <button onClick={onExtend}>Extender Sesión</button>
                    <button onClick={onLogout}>Cerrar Sesión</button>
                    <button onClick={onCancel}>Cancelar</button>
                </div>
            </div>
        </div>
    );
};

export default SessionModal;
