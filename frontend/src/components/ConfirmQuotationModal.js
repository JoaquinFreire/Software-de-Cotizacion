import React from 'react';
import '../styles/confirmQuotationModal.css';

const ConfirmQuotationModal = ({
    isOpen,
    onConfirm,
    onCancel,
    summary,
    customer,
    agents,
    workPlace,
    comment,
    isSubmitting
}) => {
    if (!isOpen) return null;

    const getTotalComplementsFromSummary = () => {
        return summary?.totalComplements || 0;
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content confirm-quotation-modal">
                <div className="modal-header">
                    <h2>Confirmar Cotización</h2>
                    <button
                        type="button"
                        className="modal-close-btn"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    <p className="modal-subtitle">Revise los datos antes de confirmar:</p>

                    {/* Datos del Cliente */}
                    <div className="modal-section">
                        <h4>Cliente</h4>
                        <div className="modal-info-row">
                            <span className="label">Nombre:</span>
                            <span className="value">{customer?.name} {customer?.lastname}</span>
                        </div>
                        <div className="modal-info-row">
                            <span className="label">DNI:</span>
                            <span className="value">{customer?.dni}</span>
                        </div>
                        <div className="modal-info-row">
                            <span className="label">Teléfono:</span>
                            <span className="value">{customer?.tel}</span>
                        </div>
                        <div className="modal-info-row">
                            <span className="label">Email:</span>
                            <span className="value">{customer?.mail}</span>
                        </div>
                        <div className="modal-info-row">
                            <span className="label">Dirección:</span>
                            <span className="value">{customer?.address}</span>
                        </div>
                    </div>

                    {/* Agentes (si existen) */}
                    {agents && agents.length > 0 && (
                        <div className="modal-section">
                            <h4>Agentes</h4>
                            {agents.map((agent, idx) => (
                                <div key={idx} className="modal-agent-info">
                                    <div className="modal-info-row">
                                        <span className="label">Nombre:</span>
                                        <span className="value">{agent.name} {agent.lastname}</span>
                                    </div>
                                    <div className="modal-info-row">
                                        <span className="label">DNI:</span>
                                        <span className="value">{agent.dni}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Espacio de trabajo */}
                    {workPlace && (
                        <div className="modal-section">
                            <h4>Espacio de Trabajo</h4>
                            <div className="modal-info-row">
                                <span className="label">Nombre:</span>
                                <span className="value">{workPlace.name}</span>
                            </div>
                            <div className="modal-info-row">
                                <span className="label">Ubicación:</span>
                                <span className="value">{workPlace.location}</span>
                            </div>
                            <div className="modal-info-row">
                                <span className="label">Dirección:</span>
                                <span className="value">{workPlace.address}</span>
                            </div>
                        </div>
                    )}

                    {/* Resumen de Totales */}
                    <div className="modal-section modal-summary">
                        <h4>Resumen de Cálculos</h4>
                        <div className="modal-total-row">
                            <span>Total aberturas:</span>
                            <span className="amount">${summary?.totalOpenings?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="modal-total-row">
                            <span>Total complementos:</span>
                            <span className="amount">${getTotalComplementsFromSummary().toFixed(2)}</span>
                        </div>
                        <div className="modal-total-row modal-subtotal">
                            <span><strong>Subtotal:</strong></span>
                            <span className="amount"><strong>${summary?.subtotalGeneral?.toFixed(2) || '0.00'}</strong></span>
                        </div>
                        <div className="modal-total-row modal-cost-detail">
                            <span>Costo fabricación (10%):</span>
                            <span className="amount">${summary?.costoFabricacion?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="modal-total-row modal-cost-detail">
                            <span>Costo administrativo (5%):</span>
                            <span className="amount">${summary?.costoAdministrativo?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="modal-total-row modal-final-total">
                            <span><strong>TOTAL GENERAL:</strong></span>
                            <span className="amount modal-final-amount"><strong>${summary?.totalGeneral?.toFixed(2) || '0.00'}</strong></span>
                        </div>
                    </div>

                   
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        className="modal-btn modal-btn-cancel"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="modal-btn modal-btn-confirm"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Enviando...' : 'Confirmar Cotización'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmQuotationModal;
