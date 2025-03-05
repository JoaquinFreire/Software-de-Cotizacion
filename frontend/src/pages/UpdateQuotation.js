import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Navigation from "../components/Navigation";
import Charger from "../components/charger"; // Importar el componente Charger
import "../styles/quotation.css"; // Importar los estilos

const UpdateQuotation = () => {
    const { id } = useParams();
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
    const [loading, setLoading] = useState(false); // Estado para el logo de cargando
    const [successMessage, setSuccessMessage] = useState('');
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

        const fetchQuotation = async () => {
            try {
                const response = await axios.get(`http://localhost:5187/api/quotations/${id}`);
                const quotation = response.data;
                setCustomerId(quotation.CustomerId);
                setNewCustomer({
                    name: quotation.Customer.name,
                    lastname: quotation.Customer.lastname,
                    tel: quotation.Customer.tel,
                    mail: quotation.Customer.mail,
                    address: quotation.Customer.address
                });
                setWorkPlaceId(quotation.WorkPlaceId);
                setTotalPrice(quotation.TotalPrice);
            } catch (error) {
                console.error('Error fetching quotation:', error);
            }
        };

        fetchUser();
        fetchCustomers();
        fetchQuotation();
    }, [navigate, id]);

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
        setLoading(true); // Mostrar el logo de cargando
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
                setLoading(false); // Ocultar el logo de cargando
                return;
            }
        }

        try {
            await axios.put(`http://localhost:5187/api/quotations/${id}`, {
                CustomerId: customerIdToUse,
                UserId: userId,
                WorkPlaceId: workPlaceId,
                TotalPrice: totalPrice
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccessMessage("Cotización actualizada con éxito.");
            setTimeout(() => {
                setLoading(false); // Ocultar el logo de cargando después de 5 segundos
                setSuccessMessage("");
                navigate('/dashboard'); // Redirigir al dashboard después de actualizar la cotización
            }, 5000);
        } catch (error) {
            console.error('Error updating quotation:', error);
            setLoading(false); // Ocultar el logo de cargando
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            <h2 className="title">Actualizar Cotización</h2>
            {successMessage && <div className="success-message">{successMessage}</div>}
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
                    <h3>Actualizar cotización</h3>
                    <label>Nombre:</label>
                    <input
                        type="text"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    />
                    <label>Apellido:</label>
                    <input
                        type="text"
                        value={newCustomer.lastname}
                        onChange={(e) => setNewCustomer({ ...newCustomer, lastname: e.target.value })}
                    />
                    <label>Teléfono:</label>
                    <input
                        type="text"
                        value={newCustomer.tel}
                        onChange={(e) => setNewCustomer({ ...newCustomer, tel: e.target.value })}
                    />
                    <label>Email:</label>
                    <input
                        type="email"
                        value={newCustomer.mail}
                        onChange={(e) => setNewCustomer({ ...newCustomer, mail: e.target.value })}
                    />
                    <label>Dirección:</label>
                    <input
                        type="text"
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
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
                <button className="submit-button" type="submit" disabled={loading}>
                    {loading ? <Charger color="#15edff" size="large" text="Cargando" textColor="#000000" /> : "Actualizar"}
                </button>
            </form>
        </div>
    );
};

export default UpdateQuotation;
