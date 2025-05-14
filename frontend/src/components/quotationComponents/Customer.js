import React, { useEffect, useState } from 'react';
import "../../styles/quotation.css";

const Customer = ({ newCustomer, setNewCustomer, setIsCustomerComplete }) => {
    const [dni, setDni] = useState(''); // Estado para almacenar el DNI ingresado
    const [loading, setLoading] = useState(false); // Estado para indicar si se está buscando el cliente
    const [isCustomerFound, setIsCustomerFound] = useState(false); // Estado para indicar si el cliente fue encontrado

    const handleDniChange = async (e) => {
        const enteredDni = e.target.value;
        setDni(enteredDni);

        if (enteredDni.trim() === '') {
            setNewCustomer({ name: '', lastname: '', tel: '', mail: '', address: '', agentId: null });
            setIsCustomerComplete(false);
            setIsCustomerFound(false);
            return;
        }

        setLoading(true); // Mostrar mensaje de búsqueda
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5187/api/customers/dni/${enteredDni}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const customer = await response.json();
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
            console.error('Error searching customer by DNI:', error);
        } finally {
            setLoading(false); // Ocultar mensaje de búsqueda
        }
    };

    const handleInputChange = (field, value) => {
        if (isCustomerFound) return; // Evitar cambios si el cliente fue encontrado
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
                            disabled={isCustomerFound} // Deshabilitar si el cliente fue encontrado
                        />
                    </div>
                    <div className="form-group">
                        <label>Apellido:</label>
                        <input
                            type="text"
                            value={newCustomer.lastname}
                            onChange={(e) => handleInputChange('lastname', e.target.value)}
                            disabled={isCustomerFound} // Deshabilitar si el cliente fue encontrado
                        />
                    </div>
                    <div className="form-group">
                        <label>Teléfono:</label>
                        <input
                            type="text"
                            value={newCustomer.tel}
                            onChange={(e) => handleInputChange('tel', e.target.value)}
                            disabled={isCustomerFound} // Deshabilitar si el cliente fue encontrado
                        />
                    </div>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={newCustomer.mail}
                            onChange={(e) => handleInputChange('mail', e.target.value)}
                            disabled={isCustomerFound} // Deshabilitar si el cliente fue encontrado
                        />
                    </div>
                    <div className="form-group">
                        <label>Dirección:</label>
                        <input
                            type="text"
                            value={newCustomer.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            disabled={isCustomerFound} // Deshabilitar si el cliente fue encontrado
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customer;
