import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;
const Agent = ({ customerId, newAgent, setNewAgent, setIsAgentComplete }) => {
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
                            onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                            placeholder="Ingrese el nombre del agente"
                        />
                    </div>
                    <div className="form-group">
                        <label>Apellido:</label>
                        <input
                            type="text"
                            value={newAgent.lastname}
                            onChange={(e) => setNewAgent({ ...newAgent, lastname: e.target.value })}
                            placeholder="Ingrese el apellido del agente"
                        />
                    </div>
                    <div className="form-group">
                        <label>Teléfono:</label>
                        <input
                            type="text"
                            value={newAgent.tel}
                            onChange={(e) => setNewAgent({ ...newAgent, tel: e.target.value })}
                            placeholder="Ingrese el teléfono del agente"
                        />
                    </div>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={newAgent.mail}
                            onChange={(e) => setNewAgent({ ...newAgent, mail: e.target.value })}
                            placeholder="Ingrese el email del agente"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Agent;
