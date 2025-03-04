import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navigation from "../components/Navigation";

const Quotation = () => {
    const [customerId, setCustomerId] = useState('');
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        lastname: '',
        tel: '',
        mail: '',
        address: '',
        agentId: null
    });
    const [newAgent, setNewAgent] = useState({
        name: '',
        lastname: '',
        tel: '',
        mail: ''
    });
    const [workPlace, setWorkPlace] = useState({
        name: '',
        address: '',
        workTypeId: ''
    });
    const [workTypes, setWorkTypes] = useState([]);
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
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000 // Configurar tiempo de espera
                });
                console.log('User response:', response.data); // Verificar la respuesta del backend
                setUserId(response.data.userId);
                console.log('userId set to:', response.data.userId); // Verificar el valor de userId
            } catch (error) {
                console.error('Error fetching user:', error);
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

        const fetchWorkTypes = async () => {
            try {
                const response = await axios.get('http://localhost:5187/api/worktypes'); // Asegúrate de que la URL sea correcta
                console.log('WorkTypes response:', response.data); // Verificar la respuesta del backend
                setWorkTypes(response.data);
                console.log('workTypes set to:', response.data); // Verificar el valor de workTypes
            } catch (error) {
                console.error('Error fetching work types:', error);
            }
        };

        fetchUser();
        fetchCustomers();
        fetchWorkTypes();
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
                address: selectedCustomer.address,
                agentId: selectedCustomer.agentId
            });

            if (selectedCustomer.agentId) {
                const fetchAgent = async () => {
                    try {
                        const response = await axios.get(`http://localhost:5187/api/customer-agents/${selectedCustomer.agentId}`);
                        const selectedAgent = response.data;
                        setNewAgent({
                            name: selectedAgent.name,
                            lastname: selectedAgent.lastname,
                            tel: selectedAgent.tel,
                            mail: selectedAgent.mail
                        });
                    } catch (error) {
                        console.error('Error fetching agent:', error);
                    }
                };
                fetchAgent();
            } else {
                setNewAgent({
                    name: '',
                    lastname: '',
                    tel: '',
                    mail: ''
                });
            }
        } else {
            setNewCustomer({
                name: '',
                lastname: '',
                tel: '',
                mail: '',
                address: '',
                agentId: null
            });
            setNewAgent({
                name: '',
                lastname: '',
                tel: '',
                mail: ''
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
                let agentId = null;
                if (newAgent.name || newAgent.tel || newAgent.mail || newAgent.lastname) {
                    const agentResponse = await axios.post('http://localhost:5187/api/customer-agents', newAgent, {
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 10000 // Aumentar tiempo de espera
                    });
                    agentId = agentResponse.data.id;
                }

                const customerResponse = await axios.post('http://localhost:5187/api/customers', {
                    ...newCustomer,
                    agentId: agentId
                }, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 10000 // Aumentar tiempo de espera
                });
                customerIdToUse = customerResponse.data.id;
            } catch (error) {
                console.error('Error creating customer or agent:', error);
                return;
            }
        }

        // Verificar que todos los campos requeridos estén presentes
        if (!customerIdToUse || !userId || !workPlace.name || !workPlace.address || !workPlace.workTypeId || !totalPrice) {
            console.error('Missing required fields');
            console.log('customerIdToUse:', customerIdToUse);
            console.log('userId:', userId);
            console.log('workPlace:', workPlace);
            console.log('totalPrice:', totalPrice);
            return;
        }

        try {
            const response = await axios.post('http://localhost:5187/api/quotations', {
                CustomerId: customerIdToUse,
                UserId: userId,
                WorkPlace: workPlace,
                TotalPrice: totalPrice
            }, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000 // Aumentar tiempo de espera
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
            <h1>New Quotation</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Customer:</label>
                    <select value={customerId} onChange={handleCustomerChange}>
                        <option value="">Select existing customer</option>
                        {customers.map(customer => (
                            <option key={customer.id} value={customer.id}>
                                {customer.name} {customer.lastname}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <h3>Or create a new customer</h3>
                    <label>Name:</label>
                    <input
                        type="text"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                        disabled={!!customerId}
                    />
                    <label>Last Name:</label>
                    <input
                        type="text"
                        value={newCustomer.lastname}
                        onChange={(e) => setNewCustomer({ ...newCustomer, lastname: e.target.value })}
                        disabled={!!customerId}
                    />
                    <label>Phone:</label>
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
                    <label>Address:</label>
                    <input
                        type="text"
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                        disabled={!!customerId}
                    />
                </div>
                <div>
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
                <div>
                    <h3>Work Place</h3>
                    <label>Name:</label>
                    <input
                        type="text"
                        value={workPlace.name}
                        onChange={(e) => setWorkPlace({ ...workPlace, name: e.target.value })}
                        required
                    />
                    <label>Address:</label>
                    <input
                        type="text"
                        value={workPlace.address}
                        onChange={(e) => setWorkPlace({ ...workPlace, address: e.target.value })}
                        required
                    />
                    <label>Work Type:</label>
                    <select
                        value={workPlace.workTypeId}
                        onChange={(e) => setWorkPlace({ ...workPlace, workTypeId: e.target.value })}
                        required
                    >
                        <option value="">Select work type</option>
                        {workTypes.map(workType => (
                            <option key={workType.id} value={workType.id}>
                                {workType.type}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Total Price:</label>
                    <input
                        type="number"
                        value={totalPrice}
                        onChange={(e) => setTotalPrice(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Create Quotation</button>
            </form>
        </div>
    );
};

export default Quotation;
