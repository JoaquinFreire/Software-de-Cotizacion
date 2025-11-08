import React, { useState } from 'react';
import '../styles/sessionModal.css';
import ReactLoading from 'react-loading';

const SessionModal = ({ show, onExtend, onLogout }) => {
    const [isRecovering, setIsRecovering] = useState(false);

    if (!show) return null;

    return (
        <div className="session-modal">
            <div className="session-modal-content">
                <h2>Advertencia de Sesión</h2>
                <p>Tu sesión expirará en breve. ¿Deseas extender la sesión?</p>
                <div className="session-modal-actions">
                    {isRecovering ? (
                        <div className="spinner-container">
                            <ReactLoading type="spin" color="#26b7cd" height={20} width={20} />
                            <div style={{ marginTop: 14, fontSize: 14, color: '#26b7cd' }}>Cargando...</div>
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                setIsRecovering(true);
                                onExtend();
                            }}
                        >
                            Extender Sesión
                        </button>
                    )}
                    <button onClick={onLogout}>Cerrar Sesión</button>
                </div>
            </div>
        </div>
    );
};

export default SessionModal;
