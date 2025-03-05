import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navigation from "../components/Navigation";
import FooterLogo from "../components/FooterLogo"; // Importar el componente FooterLogo
import "../styles/quotation.css"; // Importar los estilos

const Quotation = () => {
    const [customerId, setCustomerId] = useState('');
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        lastname: '',
        tel: '',
        mail: '',
        address: ''
    });
    const [workPlaceId, setWorkPlaceId] = useState('');
    const [totalPrice, setTotalPrice] = useState('');
    const [userId, setUserId] = useState('');
    const [customers, setCustomers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }
            try {
                const response = await axios.get('http://localhost:5187/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserId(response.data.userId);
            } catch (error) {
                console.error('Error fetching user data:', error);
                navigate('/');
            }
        };

        const fetchCustomers = async () => {
            try {
                const response = await axios.get('http://localhost:5187/api/customers');
                setCustomers(response.data);
            } catch (error) {
                console.error('Error fetching customers:', error);
            }
        };

        fetchUser();
        fetchCustomers();
    }, [navigate]);

    const handleCustomerChange = (e) => {
        const selectedCustomerId = e.target.value;
        setCustomerId(selectedCustomerId);

        if (selectedCustomerId) {
            const selectedCustomer = customers.find(customer => customer.id === parseInt(selectedCustomerId));
            setNewCustomer({
                name: selectedCustomer.name,
                lastname: selectedCustomer.lastname,
                tel: selectedCustomer.tel,
                mail: selectedCustomer.mail,
                address: selectedCustomer.address
            });
        } else {
            setNewCustomer({
                name: '',
                lastname: '',
                tel: '',
                mail: '',
                address: ''
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }
        let customerIdToUse = customerId;

        if (!customerId) {
            try {
                const customerResponse = await axios.post('http://localhost:5187/api/customers', newCustomer, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                customerIdToUse = customerResponse.data.id;
            } catch (error) {
                console.error('Error creating customer:', error);
                return;
            }
        }

        try {
            const response = await axios.post('http://localhost:5187/api/quotations', {
                CustomerId: customerIdToUse,
                UserId: userId,
                WorkPlaceId: workPlaceId,
                TotalPrice: totalPrice
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Quotation created:', response.data);
            navigate('/dashboard'); // Redirigir al dashboard después de crear la cotización
        } catch (error) {
            console.error('Error creating quotation:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            <h2 className="title">Nueva Cotización</h2>
            <form className="quotation-form" onSubmit={handleSubmit}>
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
                    <label>Work Place ID:</label>
                    <input
                        type="text"
                        value={workPlaceId}
                        onChange={(e) => setWorkPlaceId(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Precio total:</label>
                    <input
                        type="number"
                        value={totalPrice}
                        onChange={(e) => setTotalPrice(e.target.value)}
                        required
                    />
                </div>
                <button className="submit-button" type="submit">Siguiente</button>
            </form>
            <FooterLogo /> {/* Incluir el componente FooterLogo */}
        </div>
    );
};

export default Quotation;
