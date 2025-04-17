import React, { useState } from 'react';
import "../../styles/quotation.css"; // Asegurarnos de que los estilos estén disponibles

const Customer = ({ customers, customerId, setCustomerId, newCustomer, setNewCustomer, handleCustomerChange }) => {
    const [isNewCustomer, setIsNewCustomer] = useState(false); // Alternar entre cliente nuevo y existente

    const selectedCustomer = customers.find((customer) => customer.id === parseInt(customerId));

    const handleOptionChange = (isNew) => {
        setIsNewCustomer(isNew);
        if (!isNew) {
            setCustomerId(''); // Limpiar cliente seleccionado si se cambia a "Nuevo Cliente"
            setNewCustomer({ name: '', lastname: '', tel: '', mail: '', address: '', agentId: null });
        }
    };

    return (
        <div>
            <h3>Cliente</h3>
            <div className="form-group customer-options">
                <label className={`customer-option ${!isNewCustomer ? 'active' : ''}`}>
                    <input
                        type="radio"
                        name="customerOption"
                        value="existing"
                        checked={!isNewCustomer}
                        onChange={() => handleOptionChange(false)}
                    />
                    Seleccionar Cliente Existente
                </label>
                <label className={`customer-option ${isNewCustomer ? 'active' : ''}`}>
                    <input
                        type="radio"
                        name="customerOption"
                        value="new"
                        checked={isNewCustomer}
                        onChange={() => handleOptionChange(true)}
                    />
                    Completar Cliente
                </label>
            </div>

            {!isNewCustomer ? (
                <div>
                    <div className="form-group">
                        <label>Seleccionar Cliente:</label>
                        <select value={customerId} onChange={handleCustomerChange}>
                            <option value="">Seleccione un cliente</option>
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name} {customer.lastname}
                                </option>
                            ))}
                        </select>
                    </div>
                    {selectedCustomer && (
                        <div className="customer-details">
                            <h4>Datos del Cliente</h4>
                            <p><strong>Nombre:</strong> {selectedCustomer.name}</p>
                            <p><strong>Apellido:</strong> {selectedCustomer.lastname}</p>
                            <p><strong>Teléfono:</strong> {selectedCustomer.tel}</p>
                            <p><strong>Email:</strong> {selectedCustomer.mail}</p>
                            <p><strong>Dirección:</strong> {selectedCustomer.address}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <h4>Completar Datos del Cliente</h4>
                    <div className="form-group">
                        <label>Nombre:</label>
                        <input
                            type="text"
                            value={newCustomer.name}
                            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Apellido:</label>
                        <input
                            type="text"
                            value={newCustomer.lastname}
                            onChange={(e) => setNewCustomer({ ...newCustomer, lastname: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Teléfono:</label>
                        <input
                            type="text"
                            value={newCustomer.tel}
                            onChange={(e) => setNewCustomer({ ...newCustomer, tel: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={newCustomer.mail}
                            onChange={(e) => setNewCustomer({ ...newCustomer, mail: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Dirección:</label>
                        <input
                            type="text"
                            value={newCustomer.address}
                            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customer;
