import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import "../styles/quotation.css";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import Customer from "../components/quotationComponents/Customer";
import WorkPlace from "../components/quotationComponents/WorkPlace";
import OpeningType from "../components/quotationComponents/Opening";
import Complements from "../components/quotationComponents/Complements";
import Extras from "../components/quotationComponents/Extras";
import Agent from "../components/quotationComponents/Agent";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { QuotationContext } from "../context/QuotationContext";
import { safeArray } from '../utils/safeArray';
import { toast } from 'react-toastify';
import { ToastContainer, Slide } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL;

// Utilidad para decodificar el JWT y extraer el userId
function getUserIdFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return '';
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || '';
    } catch {
        return '';
    }
}

// Utilidad para normalizar arrays serializados con $values
function toArray(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.$values)) return data.$values;
    return [];
}

const QuotationVersion = () => {
    const { budgetId } = useParams();
    const [currentIndex, setCurrentIndex] = useState(0);
    const swiperRef = useRef(null);
    const [isCustomerAdded, setIsCustomerAdded] = useState(true);

    const navigate = useNavigate();
    const { addQuotation } = React.useContext(QuotationContext);

    // Estados para datos de la cotización original
    const [originalQuotation, setOriginalQuotation] = useState(null);
    const [loading, setLoading] = useState(true);

    // Estados del formulario
    const [newCustomer, setNewCustomer] = useState({
        name: '', lastname: '', tel: '', mail: '', address: '', agentId: null, dni: ''
    });
    const [agents, setAgents] = useState([]);
    const [newAgent, setNewAgent] = useState({ name: '', lastname: '', tel: '', mail: '' });
    const [isAgentComplete, setIsAgentComplete] = useState(false);
    const [workPlace, setWorkPlace] = useState({ name: '', location: '', address: '', workTypeId: '' });
    const [selectedOpenings, setSelectedOpenings] = useState([]);
    const [selectedComplements, setSelectedComplements] = useState([]);
    const [comment, setComment] = useState("");
    const [dollarReference, setDollarReference] = useState(null);
    const [labourReference, setLabourReference] = useState(null);

    // Estados para datos de referencia
    const [workTypes, setWorkTypes] = useState([]);
    const [openingTypes, setOpeningTypes] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [glassTypes, setGlassTypes] = useState([]);
    const [complementDoors, setComplementDoors] = useState([]);
    const [complementPartitions, setComplementPartitions] = useState([]);
    const [complementRailings, setComplementRailings] = useState([]);
    const [openingConfigurations, setOpeningConfigurations] = useState([]);

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const [userId] = useState(() => getUserIdFromToken());
    const [loggedUser, setLoggedUser] = useState(null);

    // Cargar datos del usuario logueado
    useEffect(() => {
        const fetchLoggedUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token || !userId) return;

                const response = await axios.get(`${API_URL}/api/User/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLoggedUser(response.data);
            } catch (error) {
                console.error('Error cargando datos del usuario:', error);
            }
        };

        fetchLoggedUser();
    }, [userId]);

    // Cargar la cotización original al montar el componente
    useEffect(() => {
        const fetchOriginalQuotation = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/api/Mongo/GetBudgetByBudgetId/${budgetId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setOriginalQuotation(response.data);
                populateFormData(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error cargando cotización original:', error);
                toast.error('Error al cargar la cotización original');
                setLoading(false);
            }
        };

        fetchOriginalQuotation();
    }, [budgetId]);

    // Cargar datos de referencia
    useEffect(() => {
        const fetchReferenceData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const [
                    workTypesRes,
                    openingTypesRes,
                    treatmentsRes,
                    glassTypesRes,
                    doorsRes,
                    partitionsRes,
                    railingsRes,
                    openingConfigsRes
                ] = await Promise.all([
                    axios.get(`${API_URL}/api/worktypes`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/opening-types`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/alum-treatments`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/glass-types`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/door`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/partition`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/railing`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/opening-configurations`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                setWorkTypes(toArray(workTypesRes.data));
                setOpeningTypes(toArray(openingTypesRes.data));
                setTreatments(toArray(treatmentsRes.data));
                setGlassTypes(toArray(glassTypesRes.data));
                setComplementDoors(toArray(doorsRes.data));
                setComplementPartitions(toArray(partitionsRes.data));
                setComplementRailings(toArray(railingsRes.data));
                setOpeningConfigurations(toArray(openingConfigsRes.data));
            } catch (error) {
                console.error('Error cargando datos de referencia:', error);
            }
        };

        fetchReferenceData();
    }, []);

    // Función para poblar el formulario con datos de la cotización original
    const populateFormData = (quotationData) => {
        // Customer data
        if (quotationData.customer) {
            setNewCustomer({
                name: quotationData.customer.name || '',
                lastname: quotationData.customer.lastname || '',
                tel: quotationData.customer.telephoneNumber || quotationData.customer.tel || '',
                mail: quotationData.customer.mail || '',
                address: quotationData.customer.address || '',
                dni: quotationData.customer.dni || '',
                agentId: null
            });
        }

        // Agent data
        if (quotationData.agent && quotationData.agent.name) {
            setNewAgent({
                name: quotationData.agent.name || '',
                lastname: quotationData.agent.lastName || quotationData.agent.lastname || '',
                tel: quotationData.agent.telephoneNumber || quotationData.agent.tel || '',
                mail: quotationData.agent.mail || ''
            });
            setIsAgentComplete(true);
        }

        // WorkPlace data
        if (quotationData.workPlace) {
            const workType = workTypes.find(wt => wt.type === quotationData.workPlace.workType?.type);
            setWorkPlace({
                name: quotationData.workPlace.name || '',
                location: quotationData.workPlace.location || '',
                address: quotationData.workPlace.address || '',
                workTypeId: workType ? workType.id : ''
            });
        }

        // Products data
        if (quotationData.products && Array.isArray(quotationData.products)) {
            const openings = quotationData.products.map(product => ({
                id: Date.now() + Math.random(),
                typeId: findOpeningTypeId(product.OpeningType?.name),
                width: product.width || 0,
                height: product.height || 0,
                quantity: product.quantity || 1,
                treatmentId: findTreatmentId(product.AluminiumTreatment?.name),
                glassTypeId: findGlassTypeId(product.GlassType?.name),
                numPanelsWidth: product.widthPanelQuantity || 1,
                numPanelsHeight: product.heightPanelQuantity || 1,
                panelWidth: product.panelWidth || 0,
                panelHeight: product.panelHeight || 0,
                mosquito: product.mosquito || false,
                accesories: product.Accesories ? product.Accesories.map(acc => ({
                    name: acc.name || '',
                    quantity: acc.quantity || 1,
                    price: acc.price || 0
                })) : []
            }));
            setSelectedOpenings(openings);
        }

        // Complements data
        if (quotationData.complements && Array.isArray(quotationData.complements)) {
            const complements = [];
            quotationData.complements.forEach(complement => {
                // ComplementDoors
                if (complement.ComplementDoor && Array.isArray(complement.ComplementDoor)) {
                    complement.ComplementDoor.forEach(door => {
                        complements.push({
                            id: Date.now() + Math.random(),
                            type: 'door',
                            complementId: findComplementDoorId(door.name),
                            quantity: door.quantity || 1,
                            custom: {
                                width: door.width || 0,
                                height: door.height || 0,
                                coating: findCoatingId(door.Coating?.name),
                                accesories: door.Accesory ? door.Accesory.map(acc => ({
                                    name: acc.name || '',
                                    quantity: acc.quantity || 1,
                                    price: acc.price || 0
                                })) : []
                            },
                            unitPrice: door.price || 0,
                            totalPrice: (door.price || 0) * (door.quantity || 1),
                            name: door.name || ''
                        });
                    });
                }

                // ComplementRailings
                if (complement.ComplementRailing && Array.isArray(complement.ComplementRailing)) {
                    complement.ComplementRailing.forEach(railing => {
                        complements.push({
                            id: Date.now() + Math.random(),
                            type: 'railing',
                            complementId: findComplementRailingId(railing.name),
                            quantity: railing.quantity || 1,
                            custom: {
                                treatment: findTreatmentId(railing.AluminiumTreatment?.name),
                                reinforced: railing.reinforced || false
                            },
                            unitPrice: railing.price || 0,
                            totalPrice: (railing.price || 0) * (railing.quantity || 1),
                            name: railing.name || ''
                        });
                    });
                }

                // ComplementPartitions
                if (complement.ComplementPartition && Array.isArray(complement.ComplementPartition)) {
                    complement.ComplementPartition.forEach(partition => {
                        complements.push({
                            id: Date.now() + Math.random(),
                            type: 'partition',
                            complementId: findComplementPartitionId(partition.name),
                            quantity: partition.quantity || 1,
                            custom: {
                                height: partition.height || 0,
                                simple: partition.simple || false,
                                glassMilimeters: partition.glassMilimeters || '6'
                            },
                            unitPrice: partition.price || 0,
                            totalPrice: (partition.price || 0) * (partition.quantity || 1),
                            name: partition.name || ''
                        });
                    });
                }
            });
            setSelectedComplements(complements);
        }

        // Otros datos
        setComment(quotationData.Comment || '');
        setDollarReference(quotationData.dollarReference || null);
        setLabourReference(quotationData.labourReference || null);
    };

    // Funciones auxiliares para encontrar IDs por nombre
    const findOpeningTypeId = (name) => {
        const type = openingTypes.find(t => t.name === name);
        return type ? type.id : '';
    };

    const findTreatmentId = (name) => {
        const treatment = treatments.find(t => t.name === name);
        return treatment ? treatment.id : '';
    };

    const findGlassTypeId = (name) => {
        const glassType = glassTypes.find(g => g.name === name);
        return glassType ? glassType.id : '';
    };

    const findComplementDoorId = (name) => {
        const door = complementDoors.find(d => d.name === name);
        return door ? door.id : '';
    };

    const findComplementRailingId = (name) => {
        const railing = complementRailings.find(r => r.name === name);
        return railing ? railing.id : '';
    };

    const findComplementPartitionId = (name) => {
        const partition = complementPartitions.find(p => p.name === name);
        return partition ? partition.id : '';
    };

    const findCoatingId = (name) => {
        // Implementar si es necesario
        return '';
    };

    // Handler para crear nueva versión
    const handleCreateVersion = async () => {
        setSubmitting(true);
        setSubmitError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setSubmitError("No autenticado");
                setSubmitting(false);
                return;
            }

            // Construir el payload para la nueva versión
            const versionPayload = {
                OriginalBudgetId: budgetId,
                Budget: {
                    budgetId: budgetId,
                    user: loggedUser ? {
                        name: loggedUser.name || "",
                        lastName: loggedUser.lastName || "",
                        mail: loggedUser.mail || ""
                    } : { name: "", lastName: "", mail: "" },
                    customer: {
                        name: newCustomer.name,
                        lastname: newCustomer.lastname,
                        tel: newCustomer.tel,
                        mail: newCustomer.mail,
                        address: newCustomer.address,
                        dni: newCustomer.dni,
                    },
                    agent: isAgentComplete ? {
                        name: newAgent.name,
                        lastName: newAgent.lastname,
                        telephoneNumber: newAgent.tel,
                        mail: newAgent.mail
                    } : {},
                    workPlace: {
                        name: workPlace.name,
                        location: workPlace.location,
                        address: workPlace.address,
                        workType: workTypes.find(wt => String(wt.id) === String(workPlace.workTypeId))
                            ? { type: workTypes.find(wt => String(wt.id) === String(workPlace.workTypeId)).type }
                            : { type: "" }
                    },
                    Products: selectedOpenings.map(opening => ({
                        OpeningType: { name: openingTypes.find(t => String(t.id) === String(opening.typeId))?.name || "" },
                        AluminiumTreatment: { name: treatments.find(t => String(t.id) === String(opening.treatmentId))?.name || "" },
                        GlassType: {
                            name: glassTypes.find(g => String(g.id) === String(opening.glassTypeId))?.name || "",
                            precio: glassTypes.find(g => String(g.id) === String(opening.glassTypeId))?.price || 0
                        },
                        width: Number(opening.width),
                        height: Number(opening.height),
                        widthPanelQuantity: Number(opening.numPanelsWidth),
                        heightPanelQuantity: Number(opening.numPanelsHeight),
                        panelWidth: Number(opening.panelWidth),
                        panelHeight: Number(opening.panelHeight),
                        quantity: Number(opening.quantity),
                        mosquito: opening.mosquito || false,
                        Accesories: opening.accesories ? opening.accesories.map(acc => ({
                            name: acc.name,
                            quantity: Number(acc.quantity),
                            price: Number(acc.price)
                        })) : [],
                        price: 0
                    })),
                    complements: [
                        {
                            ComplementDoors: selectedComplements.filter(c => c.type === 'door').map(door => ({
                                name: complementDoors.find(d => String(d.id) === String(door.complementId))?.name || "",
                                width: Number(door.custom.width),
                                height: Number(door.custom.height),
                                coating: {
                                    name: "", // Implementar si es necesario
                                    price: 0
                                },
                                quantity: Number(door.quantity),
                                Accesories: door.custom.accesories ? door.custom.accesories.map(acc => ({
                                    name: acc.name,
                                    quantity: Number(acc.quantity),
                                    price: Number(acc.price)
                                })) : [],
                                price: door.unitPrice || 0
                            })),
                            ComplementRailings: selectedComplements.filter(c => c.type === 'railing').map(railing => ({
                                name: complementRailings.find(r => String(r.id) === String(railing.complementId))?.name || "",
                                AluminiumTreatment: {
                                    name: treatments.find(t => String(t.id) === String(railing.custom.treatment))?.name || ""
                                },
                                reinforced: Boolean(railing.custom.reinforced),
                                quantity: Number(railing.quantity),
                                price: railing.unitPrice || 0
                            })),
                            ComplementPartitions: selectedComplements.filter(c => c.type === 'partition').map(partition => ({
                                name: complementPartitions.find(p => String(p.id) === String(partition.complementId))?.name || "",
                                height: Number(partition.custom.height),
                                quantity: Number(partition.quantity),
                                simple: Boolean(partition.custom.simple),
                                glassMilimeters: partition.custom.glassMilimeters,
                                price: partition.unitPrice || 0
                            })),
                            price: 0
                        }
                    ],
                    Comment: comment,
                    dollarReference: dollarReference || 0,
                    labourReference: labourReference || 0
                }
            };

            console.log("Payload para nueva versión:", versionPayload);

            // Llamar al endpoint de creación de versión
            const response = await axios.post(`${API_URL}/api/Mongo/CreateBudgetVersion`, versionPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            const newVersionId = response.data.newBudgetId;

            setSubmitting(false);
            toast.success('Nueva versión creada exitosamente');
            navigate(`/quotation/${newVersionId}`);

        } catch (err) {
            console.error('Error al crear versión:', err);
            setSubmitError(err.response?.data?.message || err.message || 'Error al crear la versión');
            setSubmitting(false);
            toast.error('Error al crear la versión');
        }
    };

    // Funciones para manejar agentes
    const handleAddAgent = () => {
        if (newAgent.name && newAgent.lastname && newAgent.tel && newAgent.mail) {
            setAgents([...agents, newAgent]);
            setNewAgent({ name: '', lastname: '', tel: '', mail: '' });
            setIsAgentComplete(true);
        }
    };

    const handleRemoveAgent = (index) => {
        setAgents(agents.filter((_, i) => i !== index));
        if (agents.length === 1) {
            setIsAgentComplete(false);
        }
    };

    // Lógica del carousel
    const handlePrev = useCallback(() => {
        if (swiperRef.current && swiperRef.current.swiper) {
            swiperRef.current.swiper.slidePrev();
        }
    }, []);

    const handleNext = useCallback(() => {
        if (swiperRef.current && swiperRef.current.swiper) {
            swiperRef.current.swiper.slideNext();
        }
    }, []);

    const handleSlideChange = (swiper) => {
        setCurrentIndex(swiper.activeIndex);
    };

    const goToSlide = (index) => {
        if (swiperRef.current && swiperRef.current.swiper) {
            swiperRef.current.swiper.slideTo(index);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <Navigation />
                <div className="loading-container">
                    <h2>Cargando cotización...</h2>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <Navigation />

            <div className="materials-header">
                <h2 className="materials-title">Crear Nueva Versión</h2>
                <p className="materials-subtitle">
                    Modifique los campos necesarios para crear una nueva versión de la cotización #{budgetId}
                </p>
            </div>

            <ToastContainer autoClose={4000} theme="dark" transition={Slide} position="bottom-right" />

            <div className="quotation-layout">
                <aside className="quotation-indice">
                    <h3>Índice</h3>
                    <p onClick={() => goToSlide(0)} style={{ cursor: 'pointer' }}>
                        <b><u>Datos Cliente</u></b>
                    </p>
                    <p onClick={() => goToSlide(1)} style={{ cursor: 'pointer' }}>
                        <b><u>Datos Agentes</u></b>
                    </p>
                    <p onClick={() => goToSlide(2)} style={{ cursor: 'pointer' }}>
                        <b><u>Espacio de trabajo</u></b>
                    </p>
                    <p onClick={() => goToSlide(3)} style={{ cursor: 'pointer' }}>
                        <b><u>Carga de Aberturas</u></b>
                    </p>
                    <p onClick={() => goToSlide(4)} style={{ cursor: 'pointer' }}>
                        <b><u>Carga de Complementos</u></b>
                    </p>
                    <p onClick={() => goToSlide(5)} style={{ cursor: 'pointer' }}>
                        <b><u>Comentarios</u></b>
                    </p>
                </aside>

                <main className="quotation-main">
                    <form className="quotation-form">
                        <div className="embla-buttons-container">
                            <button type="button" className="embla__button embla__button--prev" onClick={handlePrev}>
                                Atrás
                            </button>
                            <span className="page-indicator">Página {currentIndex + 1} de 6</span>
                            <button type="button" className="embla__button embla__button--next" onClick={handleNext}>
                                Adelante
                            </button>
                        </div>

                        <Swiper
                            ref={swiperRef}
                            allowTouchMove={false}
                            slidesPerView={1}
                            onSlideChange={handleSlideChange}
                            initialSlide={0}
                            className="quotation-swiper"
                        >
                            <SwiperSlide>
                                <Customer
                                    newCustomer={newCustomer}
                                    setNewCustomer={setNewCustomer}
                                    errors={{}}
                                    isCustomerFound={true}
                                    setIsCustomerFound={() => { }}
                                    readOnlyFields={['name', 'lastname', 'dni', 'tel', 'mail', 'address']}
                                    onAddClientToSummary={() => setIsCustomerAdded(true)}
                                    isCustomerAdded={isCustomerAdded}
                                    setIsCustomerAdded={setIsCustomerAdded}
                                />
                            </SwiperSlide>

                            <SwiperSlide>
                                <div className="agent-container">
                                    <h3>Agentes del Cliente</h3>
                                    <Agent
                                        customerId={null}
                                        newAgent={newAgent}
                                        setNewAgent={setNewAgent}
                                        setIsAgentComplete={setIsAgentComplete}
                                        errors={{}}
                                    />
                                    {isAgentComplete && (
                                        <div className="agent-summary">
                                            <h4>Agente Asignado</h4>
                                            <p><strong>Nombre:</strong> {newAgent.name} {newAgent.lastname}</p>
                                            <p><strong>Teléfono:</strong> {newAgent.tel}</p>
                                            <p><strong>Email:</strong> {newAgent.mail}</p>
                                        </div>
                                    )}
                                </div>
                            </SwiperSlide>

                            <SwiperSlide>
                                <WorkPlace
                                    workPlace={workPlace}
                                    setWorkPlace={setWorkPlace}
                                    workTypes={workTypes}
                                    errors={{}}
                                    readOnlyFields={['name', 'location', 'address', 'workTypeId']}
                                />
                            </SwiperSlide>

                            <SwiperSlide>
                                <OpeningType
                                    openingForm={{}}
                                    setOpeningForm={() => { }}
                                    openingTypes={openingTypes}
                                    treatments={treatments}
                                    glassTypes={glassTypes}
                                    selectedOpenings={selectedOpenings}
                                    setSelectedOpenings={setSelectedOpenings}
                                    errors={{}}
                                    openingConfigurations={openingConfigurations}
                                    isVersion={true}
                                />
                            </SwiperSlide>

                            <SwiperSlide>
                                <Complements
                                    complementDoors={complementDoors}
                                    complementPartitions={complementPartitions}
                                    complementRailings={complementRailings}
                                    selectedComplements={selectedComplements}
                                    setSelectedComplements={setSelectedComplements}
                                    isVersion={true}
                                />
                            </SwiperSlide>

                            <SwiperSlide>
                                <Extras
                                    comment={comment}
                                    setComment={setComment}
                                    setDollarReference={setDollarReference}
                                    setLabourReference={setLabourReference}
                                    dollarReference={dollarReference}
                                    labourReference={labourReference}
                                />
                                <div className="submit-container">
                                    <button
                                        type="button"
                                        className="submit-button"
                                        disabled={submitting}
                                        onClick={handleCreateVersion}
                                    >
                                        {submitting ? "Creando versión..." : "Crear Nueva Versión"}
                                    </button>
                                    {submitError && (
                                        <div className="submit-error">{submitError}</div>
                                    )}
                                </div>
                            </SwiperSlide>
                        </Swiper>
                    </form>
                </main>

                <aside className="quotation-summary">
                    <h3>Resumen - Versión Nueva</h3>
                    <div className="summary-section">
                        <h4>Cliente</h4>
                        {isCustomerAdded && (
                            <div className="summary-item">
                                <p><strong>Nombre:</strong> {newCustomer.name} {newCustomer.lastname}</p>
                                <p><strong>DNI:</strong> {newCustomer.dni}</p>
                                <p><strong>Teléfono:</strong> {newCustomer.tel}</p>
                                <p><strong>Email:</strong> {newCustomer.mail}</p>
                                <p><strong>Dirección:</strong> {newCustomer.address}</p>
                            </div>
                        )}
                    </div>

                    <div className="summary-section">
                        <h4>Agente</h4>
                        {isAgentComplete && (
                            <div className="summary-item">
                                <p><strong>Nombre:</strong> {newAgent.name} {newAgent.lastname}</p>
                                <p><strong>Teléfono:</strong> {newAgent.tel}</p>
                                <p><strong>Email:</strong> {newAgent.mail}</p>
                            </div>
                        )}
                    </div>

                    <div className="summary-section">
                        <h4>Espacio de Trabajo</h4>
                        <div className="summary-item">
                            <p><strong>Nombre:</strong> {workPlace.name}</p>
                            <p><strong>Ubicación:</strong> {workPlace.location}</p>
                            <p><strong>Dirección:</strong> {workPlace.address}</p>
                            <p><strong>Tipo de trabajo:</strong> {workTypes.find(wt => String(wt.id) === String(workPlace.workTypeId))?.type || 'No especificado'}</p>
                        </div>
                    </div>

                    <div className="summary-section">
                        <h4>Aberturas ({selectedOpenings.length})</h4>
                        {selectedOpenings.map((opening, index) => (
                            <div key={opening.id || index} className="summary-item">
                                <p><strong>{openingTypes.find(t => String(t.id) === String(opening.typeId))?.name}</strong></p>
                                <p>Medidas: {opening.width} x {opening.height} cm</p>
                                <p>Cantidad: {opening.quantity}</p>
                                <p>Paneles: {opening.numPanelsWidth} x {opening.numPanelsHeight}</p>
                            </div>
                        ))}
                    </div>

                    <div className="summary-section">
                        <h4>Complementos ({selectedComplements.length})</h4>
                        {selectedComplements.map((complement, index) => (
                            <div key={complement.id || index} className="summary-item">
                                <p><strong>{complement.name}</strong> ({complement.type})</p>
                                <p>Cantidad: {complement.quantity}</p>
                                {complement.unitPrice > 0 && (
                                    <p>Precio unitario: ${complement.unitPrice.toFixed(2)}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
            <Footer />
        </div>
    );
};

export default QuotationVersion;