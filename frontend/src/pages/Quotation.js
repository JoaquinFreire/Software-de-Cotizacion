import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navigation from "../components/Navigation";
import FooterLogo from "../components/FooterLogo"; // Importar el componente FooterLogo
import "../styles/quotation.css"; // Importar los estilos
import { QuotationContext } from "../context/QuotationContext"; // Importar el contexto

const Quotation = () => {
    const { setQuotations } = useContext(QuotationContext); // Obtener la función para actualizar las cotizaciones
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
    const [userId, setUserId] = useState('');
    const [customers, setCustomers] = useState([]);
    const [selectedType, setSelectedType] = useState('');
    const [selectedComplement, setSelectedComplement] = useState('');
    const [complementQuantity, setComplementQuantity] = useState(1);
    const [selectedComplements, setSelectedComplements] = useState([]);
    const [subtotal, setSubtotal] = useState(0);
    const [complements, setComplements] = useState([]);
    const [complementTypes, setComplementTypes] = useState([]);
    const [openingTypes, setOpeningTypes] = useState([]); // Estado para los tipos de abertura
    const [selectedOpenings, setSelectedOpenings] = useState([]); // Estado para las aberturas seleccionadas
    const [openingForm, setOpeningForm] = useState({
        typeId: '',
        width: '',
        height: '',
        quantity: 1
    });
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
                    timeout: 20000 // Configurar tiempo de espera
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
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }
            try {
                const response = await axios.get('http://localhost:5187/api/customers', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCustomers(response.data);
            } catch (error) {
                console.error('Error fetching customers:', error);
            }
        };

        const fetchWorkTypes = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }
            try {
                const response = await axios.get('http://localhost:5187/api/worktypes', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('WorkTypes response:', response.data); // Verificar la respuesta del backend
                setWorkTypes(response.data);
                console.log('workTypes set to:', response.data); // Verificar el valor de workTypes
            } catch (error) {
                console.error('Error fetching work types:', error);
            }
        };
        const fetchComplementsData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }
            try {
                const [typesResponse, complementsResponse] = await Promise.all([
                    axios.get('http://localhost:5187/api/complement-types', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5187/api/complements', { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setComplementTypes(typesResponse.data);
                setComplements(complementsResponse.data);
            } catch (error) {
                console.error('Error fetching complements data:', error);
            }
        };

        const fetchOpeningTypes = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }
            try {
                const response = await axios.get('http://localhost:5187/api/opening-types', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOpeningTypes(response.data);
            } catch (error) {
                console.error('Error fetching opening types:', error);
            }
        };

        fetchUser();
        fetchCustomers();
        fetchWorkTypes();
        /* fetchMaterialsData(); */
        fetchComplementsData();
        fetchOpeningTypes();
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
                    const token = localStorage.getItem('token');
                    if (!token) {
                        navigate('/');
                        return;
                    }
                    try {
                        const response = await axios.get(`http://localhost:5187/api/customer-agents/${selectedCustomer.agentId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
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
            setNewCustomer({name: '', lastname: '',
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
        if (!customerIdToUse || !userId || !workPlace.name || !workPlace.address || !workPlace.workTypeId || subtotal <= 0) {
            console.error('Missing required fields');
            console.log('customerIdToUse:', customerIdToUse);
            console.log('userId:', userId);
            console.log('workPlace:', workPlace);
            console.log('subtotal:', subtotal);
            return;
        }

        try {
            const response = await axios.post('http://localhost:5187/api/quotations', {
                CustomerId: customerIdToUse,
                UserId: userId,
                WorkPlace: workPlace,
                TotalPrice: subtotal // Subir el subtotal como TotalPrice
            }, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000 // Aumentar tiempo de espera
            });
            console.log('Quotation created:', response.data);
            setQuotations(prevQuotations => [...prevQuotations, response.data]); // Agregar la nueva cotización al contexto
            navigate('/dashboard'); // Redirigir al dashboard después de crear la cotización
        } catch (error) {
            console.error('Error creating quotation:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    const handleAddComplement = () => {
        if (!selectedComplement || complementQuantity <= 0) return;

        const complement = complements.find(m => m.id === parseInt(selectedComplement));
        if (!complement) return;

        setSelectedComplements(prev => {
            const existingComplement = prev.find(m => m.id === complement.id);
            if (existingComplement) {
                // Actualizar cantidad y total si el complement ya existe
                const updatedComplements = prev.map(c =>
                    c.id === complement.id
                        ? {
                            ...c,
                            quantity: c.quantity + complementQuantity,
                            total: (c.quantity + complementQuantity) * c.price
                        }
                        : c
                );
                setSubtotal(updatedComplements.reduce((sum, c) => sum + c.total, 0));
                return updatedComplements;
            } else {
                // Agregar nuevo complement si no existe
                const newComplement = {
                    id: complement.id,
                    name: complement.name,
                    price: complement.price,
                    quantity: complementQuantity,
                    total: complement.price * complementQuantity
                };
                setSubtotal(prevSubtotal => prevSubtotal + newComplement.total);
                return [...prev, newComplement];
            }
        });

        setSelectedComplement('');
        setComplementQuantity(1);
    };

    const handleRemoveComplement = (id) => {
        setSelectedComplements(prev => {
            const updatedComplements = prev.filter(c => c.id !== id);
            setSubtotal(updatedComplements.reduce((sum, c) => sum + c.total, 0));
            return updatedComplements;
        });
    };

    const handleAddOpening = () => {
        const { typeId, width, height, quantity } = openingForm;
        if (!typeId || !width || !height || quantity <= 0) return;

        const openingType = openingTypes.find(type => type.id === parseInt(typeId));
        if (!openingType) return;

        setSelectedOpenings(prev => [
            ...prev,
            {
                id: Date.now(),
                typeId,
                typeName: openingType.name,
                width: parseFloat(width),
                height: parseFloat(height),
                quantity: parseInt(quantity)
            }
        ]);

        setOpeningForm({ typeId: '', width: '', height: '', quantity: 1 });
    };

    const handleRemoveOpening = (id) => {
        setSelectedOpenings(prev => prev.filter(opening => opening.id !== id));
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

                <div className='form-group'>
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
                <div className='form-group'>
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
                <div className="form-group">
                    <h3>Complementos</h3>
                    <label>Tipo:</label>
                    <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                        <option value="">Seleccionar tipo</option>
                        {complementTypes
                            .map(type => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                    </select>
                    <label>Complemento:</label>
                    <select value={selectedComplement} onChange={(e) => setSelectedComplement(e.target.value)}>
                        <option value="">Seleccionar complemento</option>
                        {complements
                            .filter(complement => complement.type_id === parseInt(selectedType))
                            .map(complement => (
                                <option key={complement.id} value={complement.id}>{complement.name} - ${complement.price}</option>
                            ))}
                    </select>
                    <label>Cantidad:</label>
                    <input
                        type="number"
                        value={complementQuantity}
                        onChange={(e) => setComplementQuantity(parseInt(e.target.value))}
                        min="1"
                    />
                    <button type="button" onClick={handleAddComplement}>Agregar complemento</button>
                </div>
                <div className="form-group">
                    <h3>Complementos Seleccionados</h3>
                    <ul>
                        {selectedComplements.map(complement => (
                            <li key={complement.id}>
                                {complement.name} - {complement.quantity} x ${complement.price} = ${complement.total}
                                <button type="button" onClick={() => handleRemoveComplement(complement.id)}>Eliminar</button>
                            </li>
                        ))}
                    </ul>
                    <p>Subtotal: ${subtotal}</p>
                </div>
                <div className="form-group">
                    <h3>Tipos de Abertura</h3>
                    <label>Tipo de Abertura:</label>
                    <select
                        value={openingForm.typeId}
                        onChange={(e) => setOpeningForm({ ...openingForm, typeId: e.target.value })}
                    >
                        <option value="">Seleccionar tipo de abertura</option>
                        {openingTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                    </select>
                    <label>Ancho (m):</label>
                    <input
                        type="number"
                        value={openingForm.width}
                        onChange={(e) => setOpeningForm({ ...openingForm, width: e.target.value })}
                        min="0"
                        step="0.01"
                    />
                    <label>Alto (m):</label>
                    <input
                        type="number"
                        value={openingForm.height}
                        onChange={(e) => setOpeningForm({ ...openingForm, height: e.target.value })}
                        min="0"
                        step="0.01"
                    />
                    <label>Cantidad:</label>
                    <input
                        type="number"
                        value={openingForm.quantity}
                        onChange={(e) => setOpeningForm({ ...openingForm, quantity: e.target.value })}
                        min="1"
                    />
                    <button type="button" onClick={handleAddOpening}>Agregar Abertura</button>
                </div>
                <div className="form-group">
                    <h3>Aberturas Seleccionadas</h3>
                    <ul>
                        {selectedOpenings.map(opening => (
                            <li key={opening.id}>
                                {opening.typeName} - {opening.width}m x {opening.height}m - {opening.quantity} unidades
                                <button type="button" onClick={() => handleRemoveOpening(opening.id)}>Eliminar</button>
                            </li>
                        ))}
                    </ul>
                </div>
                <button className="submit-button" type="submit">Siguiente</button>
            </form>
            <FooterLogo /> {/* Incluir el componente FooterLogo */}
        </div>
    );
};

export default Quotation;