import React from 'react';

const ClientAgent = ({ customerId, customers, newCustomer, setNewCustomer, newAgent, setNewAgent, handleCustomerChange }) => {
    return (
        <div>
            <div className="form-group">
                <label>Cotizaciones:</label>
                <select value={customerId} onChange={handleCustomerChange}>
                    <option value="">Seleccionar cotizaciones existentes</option>
                    {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                            {customer.name} {customer.lastname}
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <h3>Crear nueva cotización</h3>
                <label>Nombre:</label>
                <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    disabled={!!customerId}
                />
                <label>Apellido:</label>
                <input
                    type="text"
                    value={newCustomer.lastname}
                    onChange={(e) => setNewCustomer({ ...newCustomer, lastname: e.target.value })}
                    disabled={!!customerId}
                />
                <label>Teléfono:</label>
                <input
                    type="text"
                    value={newCustomer.tel}
                    onChange={(e) => setNewCustomer({ ...newCustomer, tel: e.target.value })}
                    disabled={!!customerId}
                />
                <label>Email:</label>
                <input
                    type="email"
                    value={newCustomer.mail}
                    onChange={(e) => setNewCustomer({ ...newCustomer, mail: e.target.value })}
                    disabled={!!customerId}
                />
                <label>Dirección:</label>
                <input
                    type="text"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    disabled={!!customerId}
                />
            </div>
            <div className="form-group">
                <h3>Customer Agent</h3>
                <label>Agent Name:</label>
                <input
                    type="text"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    disabled={!!customerId}
                />
                <label>Agent Last Name:</label>
                <input
                    type="text"
                    value={newAgent.lastname}
                    onChange={(e) => setNewAgent({ ...newAgent, lastname: e.target.value })}
                    disabled={!!customerId}
                />
                <label>Agent Phone:</label>
                <input
                    type="text"
                    value={newAgent.tel}
                    onChange={(e) => setNewAgent({ ...newAgent, tel: e.target.value })}
                    disabled={!!customerId}
                />
                <label>Agent Email:</label>
                <input
                    type="email"
                    value={newAgent.mail}
                    onChange={(e) => setNewAgent({ ...newAgent, mail: e.target.value })}
                    disabled={!!customerId}
                />
            </div>
        </div>
    );
};

export default ClientAgent;
