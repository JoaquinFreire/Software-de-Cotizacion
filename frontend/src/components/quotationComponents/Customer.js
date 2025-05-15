import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import "../../styles/quotation.css";

const Customer = ({ newCustomer, setNewCustomer, setIsCustomerComplete }) => {
    const [dni, setDni] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCustomerFound, setIsCustomerFound] = useState(false);
    const debounceTimeout = useRef(null);

    const searchCustomerByDni = async (dniValue) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5187/api/customers/dni/${dniValue}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200) {
                const customer = response.data;
                setNewCustomer({
                    name: customer.name,
                    lastname: customer.lastname,
                    tel: customer.tel,
                    mail: customer.mail,
                    address: customer.address,
                    agentId: customer.agentId,
                });
                setIsCustomerComplete(true);
                setIsCustomerFound(true);
            } else {
                setNewCustomer({ name: '', lastname: '', tel: '', mail: '', address: '', agentId: null });
                setIsCustomerComplete(false);
                setIsCustomerFound(false);
            }
        } catch (error) {
            setNewCustomer({ name: '', lastname: '', tel: '', mail: '', address: '', agentId: null });
            setIsCustomerComplete(false);
            setIsCustomerFound(false);
        } finally {
            setLoading(false);
        }
    };

    const handleDniChange = (e) => {
        const enteredDni = e.target.value;
        setDni(enteredDni);

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        if (enteredDni.trim() === '') {
            setNewCustomer({ name: '', lastname: '', tel: '', mail: '', address: '', agentId: null });
            setIsCustomerComplete(false);
            setIsCustomerFound(false);
            return;
        }

        debounceTimeout.current = setTimeout(() => {
            searchCustomerByDni(enteredDni);
        }, 400);
    };

    const handleInputChange = (field, value) => {
        if (isCustomerFound) return;
        setNewCustomer((prev) => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        const isComplete =
            newCustomer.name.trim() &&
            newCustomer.lastname.trim() &&
            newCustomer.tel.trim() &&
            newCustomer.mail.trim() &&
            newCustomer.address.trim();
        setIsCustomerComplete(isComplete);
    }, [newCustomer, setIsCustomerComplete]);

    return (
        <div>
            <h3>Cliente</h3>
            <div className="form-group">
                <label>Buscar Cliente por DNI:</label>
                <input
                    type="text"
                    value={dni}
                    onChange={handleDniChange}
                    placeholder="Ingrese el DNI del cliente"
                />
            </div>
            {loading ? (
                <p>Buscando cliente...</p>
            ) : (
                <div>
                    <h4>{isCustomerFound ? "Cliente Encontrado" : "Crear Nuevo Cliente"}</h4>
                    <div className="form-group">
                        <label>DNI:</label>
                        <input type="text" value={dni} disabled />
                    </div>
                    <div className="form-group">
                        <label>Nombre:</label>
                        <input
                            type="text"
                            value={newCustomer.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            disabled={isCustomerFound}
                        />
                    </div>
                    <div className="form-group">
                        <label>Apellido:</label>
                        <input
                            type="text"
                            value={newCustomer.lastname}
                            onChange={(e) => handleInputChange('lastname', e.target.value)}
                            disabled={isCustomerFound}
                        />
                    </div>
                    <div className="form-group">
                        <label>Teléfono:</label>
                        <input
                            type="text"
                            value={newCustomer.tel}
                            onChange={(e) => handleInputChange('tel', e.target.value)}
                            disabled={isCustomerFound}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={newCustomer.mail}
                            onChange={(e) => handleInputChange('mail', e.target.value)}
                            disabled={isCustomerFound}
                        />
                    </div>
                    <div className="form-group">
                        <label>Dirección:</label>
                        <input
                            type="text"
                            value={newCustomer.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            disabled={isCustomerFound}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customer;
