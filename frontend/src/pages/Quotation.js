import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { QuotationContext } from "../context/QuotationContext";
import "../styles/quotation.css"; 
import Navigation from "../components/Navigation";
import FooterLogo from "../components/FooterLogo"; 
import ClientAgent from "../components/ClientAgent";
import WorkPlace from "../components/WorkPlace";
import OpeningType from "../components/OpeningType";
import Complements from "../components/Complements";
import useEmblaCarousel from 'embla-carousel-react'

const Quotation = () => {
    const [emblaRef, emblaApi] = useEmblaCarousel(); // Inicializar el carrusel de Embla
    const [canScrollPrev, setCanScrollPrev] = useState(false); // Estado para controlar el desplazamiento previo
    const [canScrollNext, setCanScrollNext] = useState(false); // Estado para controlar el desplazamiento siguiente
    
    const {setQuotations} = useContext(QuotationContext); // Obtener la función setQuotations del contexto

    const [customers, setCustomers] = useState([]); // Estado para almacenar la lista de clientes
    const [customerId, setCustomerId] = useState(); // Estado para almacenar el ID del cliente seleccionado
    const [newCustomer, setNewCustomer] = useState({name: '', lastname: '', tel: '', mail: '', address: '', agentId: null}); // Estado para almacenar los datos del nuevo cliente

    const [newAgent, setNewAgent] = useState({ name: '', lastname: '', tel: '', mail: '' }); // Estado para almacenar los datos del nuevo agente
    const [workPlace, setWorkPlace] = useState({ name: '', address: '', workTypeId: '' }); // Estado para almacenar los datos del lugar de trabajo
    const [workTypes, setWorkTypes] = useState([]); // Estado para almacenar los tipos de trabajo

    const [userId, setUserId] = useState(''); // Estado para almacenar el ID del usuario

    const [selectedComplement, setSelectedComplement] = useState(''); // Estado para almacenar el complemento seleccionado
    const [complementTypes, setComplementTypes] = useState([]); // Estado para almacenar los tipos de complemento
    const [complementQuantity, setComplementQuantity] = useState(1); // Estado para almacenar la cantidad del complemento seleccionado
    const [selectedComplements, setSelectedComplements] = useState([]); // Estado para almacenar los complementos seleccionados
    const [complements, setComplements] = useState([]); // Estado para almacenar la lista de complementos

    const [openingTypes, setOpeningTypes] = useState([]); // Estado para los tipos de abertura
    const [selectedOpenings, setSelectedOpenings] = useState([]); // Estado para las aberturas seleccionadas
    const [openingForm, setOpeningForm] = useState({typeId: '', width: '', height: '', quantity: 1, treatmentId: '', glassTypeId: ''}); // Estado para el formulario de abertura

    const [treatments, setTreatments] = useState([]); // Estado para almacenar los tratamientos
    const [glassTypes, setGlassTypes] = useState([]); // Estado para almacenar los tipos de vidrio
    
    const navigate = useNavigate(); // Hook para la navegación

    // Funciones para manejar el desplazamiento del carrusel
    const handlePrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]); 
    const handleNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setCanScrollPrev(emblaApi.canScrollPrev());
        setCanScrollNext(emblaApi.canScrollNext());
    }, [emblaApi]); // Callback para manejar la selección del carrusel
    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on('select', onSelect);
        onSelect();
    }, [emblaApi, onSelect]); // Efecto para inicializar el carrusel y manejar la selección


    // Efecto para obtener los datos del usuario, clientes, tipos de trabajo, complementos y tratamientos al cargar el componente
    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            // Verificar si el token existe y redirigir si no es válido
            if (!token) {
                navigate('/');
                return;
            }
            try {
                const response = await axios.get('http://localhost:5187/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 20000 // Configurar tiempo de espera
                });
                setUserId(response.data.userId);
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
                setWorkTypes(response.data);
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

        const fetchTreatments = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }
            try {
                const response = await axios.get('http://localhost:5187/api/alum-treatments', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTreatments(response.data);
            } catch (error) {
                console.error('Error fetching treatments:', error);
            }
        };

        const fetchGlassTypes = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }
            try {
                const response = await axios.get('http://localhost:5187/api/glass-types', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setGlassTypes(response.data);
            } catch (error) {
                console.error('Error fetching glass types:', error);
            }
        };

        fetchUser();
        fetchCustomers();
        fetchWorkTypes();
        fetchComplementsData();
        fetchOpeningTypes();
        fetchTreatments();
        fetchGlassTypes();
    }, [navigate]);

    // Función para manejar el cambio de cliente seleccionado
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
            // Si el cliente tiene un agente asignado, buscar los datos del agente
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
                setNewAgent({ name: '', lastname: '', tel: '', mail: ''});
            }
        } else {
            setNewCustomer({ name: '', lastname: '', tel: '', mail: '', address: '', agentId: null});
            setNewAgent({ name: '', lastname: '', tel: '', mail: ''
            });
        }
    };

    // Función para manejar el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        let customerIdToUse = customerId;

        // Crear un nuevo cliente si no se seleccionó uno existente
        if (!customerId) {
            try {
                const newCustomerPayload = {
                    name: newCustomer.name || "Default Name",
                    lastname: newCustomer.lastname || "Default LastName",
                    tel: newCustomer.tel || "0000000000",
                    mail: newCustomer.mail || "default@example.com",
                    address: newCustomer.address || "Default Address",
                };

                console.log('Creating new customer with payload:', newCustomerPayload);

                const customerResponse = await axios.post('http://localhost:5187/api/customers', newCustomerPayload, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                console.log('Customer response:', customerResponse);

                customerIdToUse = customerResponse.data.id;
                console.log('New customer created with ID:', customerIdToUse);
            } catch (error) {
                console.error('Error creating customer:', error.response?.data || error.message);
                return;
            }
        }

        // Validar que todos los campos requeridos estén presentes
        if (!customerIdToUse || !userId || !workPlace.name || !workPlace.address || !workPlace.workTypeId) {
            console.error('Missing required fields');
            console.log('customerIdToUse:', customerIdToUse);
            console.log('userId:', userId);
            console.log('workPlace:', workPlace);
            return;
        }

        try {
            const payload = {
                CustomerId: customerIdToUse,
                UserId: userId,
                WorkPlace: workPlace,
                TotalPrice: 1000, // Valor predeterminado para TotalPrice
            };

            console.log('Payload being sent:', payload);

            const response = await axios.post('http://localhost:5187/api/quotations', payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log('Response status:', response.status);
            console.log('Quotation created successfully:', response.data);

            setQuotations((prevQuotations) => [...prevQuotations, response.data]);
            navigate('/dashboard');
        } catch (error) {
            console.error('Error creating quotation:', error.response?.data || error.message);
        }
    };

    // Función para manejar el cierre de sesión
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    // Función para agregar una abertura
    const handleAddOpening = () => {
        const { typeId, width, height, quantity, treatmentId, glassTypeId } = openingForm;

        // Validar que todos los campos estén completos
        if (!typeId || !width || !height || quantity <= 0 || !treatmentId || !glassTypeId) {
            console.error('Todos los campos son obligatorios');
            return;
        }

        // Validar que los valores de ancho y alto sean números positivos
        const openingType = openingTypes.find(type => type.id === parseInt(typeId));
        // Validar que el tipo de abertura exista
        const treatment = treatments.find(t => t.id === parseInt(treatmentId));
        // Validar que el tratamiento exista
        const glassType = glassTypes.find(g => g.id === parseInt(glassTypeId));

        // Validar que el tipo de vidrio exista
        if (!openingType || !treatment || !glassType) {
            return;
        }

        // Verificar si ya existe una abertura con los mismos valores
        const existingOpening = selectedOpenings.find(opening =>
            opening.typeId === typeId &&
            opening.width === parseFloat(width) &&
            opening.height === parseFloat(height) &&
            opening.treatmentId === treatmentId &&
            opening.glassTypeId === glassTypeId
        );

        if (existingOpening) {
            // Si ya existe, actualizar la cantidad
            setSelectedOpenings(prev =>
                prev.map(opening =>
                    opening.id === existingOpening.id
                        ? { ...opening, quantity: opening.quantity + parseInt(quantity) }
                        : opening
                )
            );
        } else {
            // Si no existe, agregar una nueva abertura
            setSelectedOpenings(prev => [
                ...prev,
                {
                    id: Date.now(),
                    typeId,
                    typeName: openingType.name,
                    width: parseFloat(width),
                    height: parseFloat(height),
                    quantity: parseInt(quantity),
                    treatmentId,
                    treatmentName: treatment.name,
                    glassTypeId,
                    glassTypeName: glassType.name
                }
            ]);
        }

        // Reiniciar el formulario
        setOpeningForm({ typeId: '', width: '', height: '', quantity: 1, treatmentId: '', glassTypeId: '' });
    };

    // Función para eliminar una abertura
    const handleRemoveOpening = (id) => {
        setSelectedOpenings(prev => prev.filter(opening => opening.id !== id));
    };


    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            <h2 className="title">Nueva Cotización</h2>
            <form className="quotation-form" onSubmit={handleSubmit}>
                <div className="embla" ref={emblaRef}>
                    <div className="embla__container">
                        <div className="embla__slide"><ClientAgent
                            customerId={customerId}
                            customers={customers}
                            newCustomer={newCustomer}
                            setNewCustomer={setNewCustomer}
                            newAgent={newAgent}
                            setNewAgent={setNewAgent}
                            handleCustomerChange={handleCustomerChange}
                        /></div>
                        <div className="embla__slide"><WorkPlace
                            workPlace={workPlace}
                            setWorkPlace={setWorkPlace}
                            workTypes={workTypes}
                        /></div>
                        <div className="embla__slide"><OpeningType
                            openingForm={openingForm}
                            setOpeningForm={setOpeningForm}
                            openingTypes={openingTypes}
                            treatments={treatments}
                            glassTypes={glassTypes}
                            selectedOpenings={selectedOpenings}
                            handleAddOpening={handleAddOpening}
                            handleRemoveOpening={handleRemoveOpening}
                        /></div>
                        <div className="embla__slide">
                            <Complements
                                complementTypes={complementTypes}
                                complements={complements}
                                selectedComplements={selectedComplements}
                                setSelectedComplements={setSelectedComplements}
                            />
                        </div>
                    </div>
                </div>
                <div className="embla__buttons">
                    <button
                        type="button"
                        className="embla__button embla__button--prev"
                        onClick={handlePrev}
                        disabled={!canScrollPrev}
                    >
                        Prev
                    </button>
                    <button
                        type="button"
                        className="embla__button embla__button--next"
                        onClick={handleNext}
                        disabled={!canScrollNext}
                    >
                        Next
                    </button>
                </div>
                <button className="submit-button" type="submit">Cotizar</button>
            </form>
            <FooterLogo /> {/* Incluir el componente FooterLogo */}
        </div>
    );
};
export default Quotation;