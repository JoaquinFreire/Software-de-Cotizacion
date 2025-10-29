import React, { useRef, useState } from 'react';
import axios from 'axios';
import "../../styles/quotation.css";

const API_URL = process.env.REACT_APP_API_URL;

const Customer = ({
    newCustomer,
    setNewCustomer,
    errors = {},
    isCustomerFound,
    setIsCustomerFound,
    readOnlyFields = [],
    onAddClientToSummary,
    isCustomerAdded,
    setIsCustomerAdded
}) => {
    const [loading, setLoading] = useState(false);
    const debounceTimeout = useRef(null);

    const isFieldReadOnly = (fieldName) => readOnlyFields.includes(fieldName);

    const searchCustomerByDni = async (dniValue) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/customers/dni/${dniValue}`, {
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
                    dni: customer.dni
                });
                setIsCustomerFound(true);
            } else {
                setNewCustomer({ name: '', lastname: '', tel: '', mail: '', address: '', dni: dniValue });
                setIsCustomerFound(false);
            }
        } catch (error) {
            setNewCustomer({ name: '', lastname: '', tel: '', mail: '', address: '', dni: dniValue });
            setIsCustomerFound(false);
        } finally {
            setLoading(false);
        }
    };

    const handleAddClient = () => {
        if (onAddClientToSummary) {
            onAddClientToSummary();
        }
        setIsCustomerAdded(true);
    };

    const handleSearchOtherDni = () => {
        setIsCustomerFound(false);
        setIsCustomerAdded(false);
        setNewCustomer({ name: '', lastname: '', tel: '', mail: '', address: '', dni: '' });
    };

    const handleDniChange = (e) => {
        const enteredDni = e.target.value;
        setNewCustomer((prev) => ({ ...prev, dni: enteredDni }));

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        if (enteredDni.trim() === '') {
            setNewCustomer({ name: '', lastname: '', tel: '', mail: '', address: '', dni: '' });
            setIsCustomerFound(false);
            return;
        }

        if (enteredDni.length >= 8) {
            debounceTimeout.current = setTimeout(() => {
                searchCustomerByDni(enteredDni);
            }, 400);
        } else {
            setIsCustomerFound(false);
            setNewCustomer((prev) => ({
                ...prev,
                name: '',
                lastname: '',
                tel: '',
                mail: '',
                address: ''
            }));
        }
    };

    const handleInputChange = (field, value) => {
        if (isCustomerFound || isFieldReadOnly(field)) return;
        setNewCustomer((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            errors[field] = undefined;
        }
    };

    return (
        <div className="customer-container">
            <h3>Cliente</h3>
            <div className="form-group">
                <label>Buscar Cliente por DNI:</label>
                <input
                    type="text"
                    value={newCustomer.dni || ''}
                    onChange={(e) => {
                        const onlyNumbers = e.target.value.replace(/\D/g, '');
                        handleDniChange({ target: { value: onlyNumbers } });
                        if (errors.dni) errors.dni = undefined;
                    }}
                    placeholder="Ingrese el DNI del cliente"
                    maxLength={10}
                    disabled={isCustomerFound || isFieldReadOnly('dni')}
                    className={`${errors.dni ? "input-error" : ""} ${isFieldReadOnly('dni') ? 'read-only-field' : ''}`}
                />
                {errors.dni && <span className="error-message">{errors.dni}</span>}
                {isCustomerFound && !isFieldReadOnly('dni') && (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                            className="botton-DNI"
                            onClick={handleSearchOtherDni}
                        >
                            Buscar otro DNI
                        </button>
                        <button
                            type="button"
                            className="botton-DNI"
                            onClick={handleAddClient}
                            title="Agregar cliente al resumen"
                        >
                            Agregar este cliente
                        </button>
                    </div>
                )}
            </div>
            {loading ? (
                <p className='embla__button'>Buscando cliente...</p>
            ) : (
                <div>
                    <h4>{isCustomerFound ? "Cliente Encontrado" : "Crear Nuevo Cliente"}</h4>
                    <div className="form-group">
                        <label>DNI:</label>
                        <input
                            type="text"
                            value={newCustomer.dni || ''}
                            disabled={isCustomerFound || isFieldReadOnly('dni')}
                            className={isFieldReadOnly('dni') ? 'read-only-field' : ''}
                        />
                    </div>
                    <div className="form-group">
                        <label>Nombre:</label>
                        <input
                            type="text"
                            value={newCustomer.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            disabled={isCustomerFound || isFieldReadOnly('name')}
                            className={`${errors.name ? "input-error" : ""} ${isFieldReadOnly('name') ? 'read-only-field' : ''}`}
                            placeholder="Ingrese nombre del cliente"
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>
                    <div className="form-group">
                        <label>Apellido:</label>
                        <input
                            type="text"
                            value={newCustomer.lastname}
                            onChange={(e) => handleInputChange('lastname', e.target.value)}
                            disabled={isCustomerFound || isFieldReadOnly('lastname')}
                            className={`${errors.lastname ? "input-error" : ""} ${isFieldReadOnly('lastname') ? 'read-only-field' : ''}`}
                            placeholder="Ingrese apellido del cliente"
                        />
                        {errors.lastname && <span className="error-message">{errors.lastname}</span>}
                    </div>
                    <div className="form-group">
                        <label>Teléfono:</label>
                        <input
                            type="text"
                            value={newCustomer.tel}
                            onChange={(e) => handleInputChange('tel', e.target.value)}
                            disabled={isCustomerFound || isFieldReadOnly('tel')}
                            className={`${errors.tel ? "input-error" : ""} ${isFieldReadOnly('tel') ? 'read-only-field' : ''}`}
                            placeholder="Ingrese teléfono del cliente"
                        />
                        {errors.tel && <span className="error-message">{errors.tel}</span>}
                    </div>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={newCustomer.mail}
                            onChange={(e) => handleInputChange('mail', e.target.value)}
                            disabled={isCustomerFound || isFieldReadOnly('mail')}
                            className={`${errors.mail ? "input-error" : ""} ${isFieldReadOnly('mail') ? 'read-only-field' : ''}`}
                            placeholder="Ingrese email del cliente"
                        />
                        {errors.mail && <span className="error-message">{errors.mail}</span>}
                    </div>
                    <div className="form-group">
                        <label>Dirección:</label>
                        <input
                            type="text"
                            value={newCustomer.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            disabled={isCustomerFound || isFieldReadOnly('address')}
                            className={`${errors.address ? "input-error" : ""} ${isFieldReadOnly('address') ? 'read-only-field' : ''}`}
                            placeholder="Ingrese dirección del cliente"
                        />
                        {errors.address && <span className="error-message">{errors.address}</span>}
                    </div>
                    {!isFieldReadOnly('name') && (
                        <div className="form-group">
                            <button
                                type="button"
                                className="botton-DNI"
                                onClick={handleAddClient}
                                title="Agregar cliente al resumen"
                            >
                                Agregar este cliente
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Customer;