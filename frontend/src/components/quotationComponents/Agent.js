import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;
const Agent = ({ customerId, newAgent, setNewAgent, setIsAgentComplete, errors = {} }) => {
    const [agent, setAgent] = useState(null); // Estado para almacenar el agente del cliente seleccionado

    useEffect(() => {
        const fetchAgent = async () => {
            if (!customerId) {
                setAgent(null); // Limpiar agente si no hay cliente seleccionado
                return;
            }

            const token = localStorage.getItem('token');
            try {
                const response = await axios.get(`${API_URL}/api/customer-agents/${customerId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAgent(response.data);
            } catch (error) {
                console.error('Error fetching agent:', error);
                setAgent(null); // Si no hay agente, permitir completar uno nuevo
            }
        };

        fetchAgent();
    }, [customerId]);

    useEffect(() => {
        if (newAgent.name && newAgent.lastname && newAgent.tel && newAgent.mail) {
            setIsAgentComplete(true);
        } else {
            setIsAgentComplete(false);
        }
    }, [newAgent, setIsAgentComplete]);

    const handleInputChange = (field, value) => {
        setNewAgent((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            errors[field] = undefined;
        }
    };

    return (
        <div className="agent-container">
            <h3>Agente</h3>
            {agent ? (
                <div className="agent-details">
                    <h4>Datos del Agente</h4>
                    <p><strong>Nombre:</strong> {agent.name}</p>
                    <p><strong>Apellido:</strong> {agent.lastname}</p>
                    <p><strong>Teléfono:</strong> {agent.tel}</p>
                    <p><strong>Email:</strong> {agent.mail}</p>
                </div>
            ) : (
                <div>
                    <p>No hay agente asociado. Complete los datos del agente:</p>
                    <div className="form-group">
                        <label>Nombre:</label>
                        <input
                            type="text"
                            value={newAgent.name}
                            onChange={e => handleInputChange("name", e.target.value)}
                            className={errors.name ? "input-error" : ""}
                            placeholder="Ingrese el nombre del agente"
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>
                    <div className="form-group">
                        <label>Apellido:</label>
                        <input
                            type="text"
                            value={newAgent.lastname}
                            onChange={e => handleInputChange("lastname", e.target.value)}
                            className={errors.lastname ? "input-error" : ""}
                            placeholder="Ingrese el apellido del agente"
                        />
                        {errors.lastname && <span className="error-message">{errors.lastname}</span>}
                    </div>
                    <div className="form-group">
                        <label>Teléfono:</label>
                        <input
                            type="text"
                            value={newAgent.tel}
                            onChange={e => handleInputChange("tel", e.target.value)}
                            className={errors.tel ? "input-error" : ""}
                            placeholder="Ingrese el teléfono del agente"
                        />
                        {errors.tel && <span className="error-message">{errors.tel}</span>}
                    </div>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={newAgent.mail}
                            onChange={e => handleInputChange("mail", e.target.value)}
                            className={errors.mail ? "input-error" : ""}
                            placeholder="Ingrese el email del agente"
                        />
                        {errors.mail && <span className="error-message">{errors.mail}</span>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Agent;
