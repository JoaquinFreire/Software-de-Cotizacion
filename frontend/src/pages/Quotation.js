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
  /*   const [totalPrice, setTotalPrice] = useState(''); */
    const [userId, setUserId] = useState('');
    const [customers, setCustomers] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [materialCategories, setMaterialCategories] = useState([]);
    const [materialTypes, setMaterialTypes] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedMaterial, setSelectedMaterial] = useState('');
    const [materialQuantity, setMaterialQuantity] = useState(1);
    const [selectedMaterials, setSelectedMaterials] = useState([]);
    const [subtotal, setSubtotal] = useState(0);
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

        const fetchMaterialsData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }
            try {
                const [categoriesResponse, typesResponse, materialsResponse] = await Promise.all([
                    axios.get('http://localhost:5187/api/material-categories', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5187/api/material-types', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5187/api/materials', { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setMaterialCategories(categoriesResponse.data);
                setMaterialTypes(typesResponse.data);
                setMaterials(materialsResponse.data);
            } catch (error) {
                console.error('Error fetching materials data:', error);
            }
        };

        fetchUser();
        fetchCustomers();
        fetchWorkTypes();
        fetchMaterialsData();
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

    const handleAddMaterial = () => {
        if (!selectedMaterial || materialQuantity <= 0) return;

        const material = materials.find(m => m.id === parseInt(selectedMaterial));
        if (!material) return;

        setSelectedMaterials(prev => {
            const existingMaterial = prev.find(m => m.id === material.id);
            if (existingMaterial) {
                // Actualizar cantidad y total si el material ya existe
                const updatedMaterials = prev.map(m =>
                    m.id === material.id
                        ? {
                            ...m,
                            quantity: m.quantity + materialQuantity,
                            total: (m.quantity + materialQuantity) * m.price
                        }
                        : m
                );
                setSubtotal(updatedMaterials.reduce((sum, m) => sum + m.total, 0));
                return updatedMaterials;
            } else {
                // Agregar nuevo material si no existe
                const newMaterial = {
                    id: material.id,
                    name: material.name,
                    price: material.price,
                    quantity: materialQuantity,
                    total: material.price * materialQuantity
                };
                setSubtotal(prevSubtotal => prevSubtotal + newMaterial.total);
                return [...prev, newMaterial];
            }
        });

        setSelectedMaterial('');
        setMaterialQuantity(1);
    };

    const handleRemoveMaterial = (id) => {
        setSelectedMaterials(prev => {
            const updatedMaterials = prev.filter(m => m.id !== id);
            setSubtotal(updatedMaterials.reduce((sum, m) => sum + m.total, 0));
            return updatedMaterials;
        });
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
                    <h3>Materiales</h3>
                    <label>Categoría:</label>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                        <option value="">Seleccionar categoría</option>
                        {materialCategories.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                    </select>
                    <label>Tipo:</label>
                    <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                        <option value="">Seleccionar tipo</option>
                        {materialTypes
                            .filter(type => type.category_id === parseInt(selectedCategory))
                            .map(type => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                    </select>
                    <label>Material:</label>
                    <select value={selectedMaterial} onChange={(e) => setSelectedMaterial(e.target.value)}>
                        <option value="">Seleccionar material</option>
                        {materials
                            .filter(material => material.type_id === parseInt(selectedType))
                            .map(material => (
                                <option key={material.id} value={material.id}>{material.name} - ${material.price}</option>
                            ))}
                    </select>
                    <label>Cantidad:</label>
                    <input
                        type="number"
                        value={materialQuantity}
                        onChange={(e) => setMaterialQuantity(parseInt(e.target.value))}
                        min="1"
                    />
                    <button type="button" onClick={handleAddMaterial}>Agregar Material</button>
                </div>
                <div className="form-group">
                    <h3>Materiales Seleccionados</h3>
                    <ul>
                        {selectedMaterials.map(material => (
                            <li key={material.id}>
                                {material.name} - {material.quantity} x ${material.price} = ${material.total}
                                <button type="button" onClick={() => handleRemoveMaterial(material.id)}>Eliminar</button>
                            </li>
                        ))}
                    </ul>
                    <p>Subtotal: ${subtotal}</p>
                </div>
                <button className="submit-button" type="submit">Siguiente</button>
            </form>
            <FooterLogo /> {/* Incluir el componente FooterLogo */}
        </div>
    );
};

export default Quotation;