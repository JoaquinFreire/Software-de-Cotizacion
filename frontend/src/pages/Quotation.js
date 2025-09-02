import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "../styles/quotation.css";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import Customer from "../components/quotationComponents/Customer";
import WorkPlace from "../components/quotationComponents/WorkPlace";
import OpeningType from "../components/quotationComponents/Opening";
import Complements from "../components/quotationComponents/Complements";
import Extras from "../components/quotationComponents/Extras";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { QuotationContext } from "../context/QuotationContext";
import { validateQuotation } from "../validation/quotationValidation";
import { validateCustomer } from "../validation/customerValidation";
import { validateWorkPlace } from "../validation/workPlaceValidation";
import { validateOpenings } from "../validation/openingValidation";

const API_URL = process.env.REACT_APP_API_URL;

// Utilidad para decodificar el JWT y extraer el userId
function getUserIdFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return '';
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Ajusta la clave según cómo guardes el userId en el JWT
        // Ejemplo: payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]
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

const Quotation = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const swiperRef = useRef(null);

    const navigate = useNavigate();
    const { addQuotation } = React.useContext(QuotationContext);

    const [newCustomer, setNewCustomer] = useState({
        name: '', lastname: '', tel: '', mail: '', address: '', agentId: null, dni: ''
    });
    // const [isCustomerComplete, setIsCustomerComplete] = useState(false); // <-- ELIMINAR ESTA LÍNEA
    const [agents, setAgents] = useState([]); // Lista de agentes asociados al customer
    const [agentSearchDni, setAgentSearchDni] = useState(""); // DNI para buscar agente
    const [agentSearchResult, setAgentSearchResult] = useState(null); // Resultado de búsqueda de agente
    const [agentSearchError, setAgentSearchError] = useState("");
    const [agentSearched, setAgentSearched] = useState(false); // Nuevo: para saber si ya buscó
    const [newAgent, setNewAgent] = useState({ dni: '', name: '', lastname: '', tel: '', mail: '' });
    const [customerAgentsSuggestion, setCustomerAgentsSuggestion] = useState([]); // Sugerencias de agentes para customer existente

    const [workPlace, setWorkPlace] = useState({ name: '', address: '', workTypeId: '' });
    const [workTypes, setWorkTypes] = useState([]);
    const [openingForm, setOpeningForm] = useState({
        typeId: '',
        width: '',
        height: '',
        quantity: 1,
        treatmentId: '',
        glassTypeId: '',
    });
    const [selectedOpenings, setSelectedOpenings] = useState([]);
    const [openingTypes, setOpeningTypes] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [glassTypes, setGlassTypes] = useState([]);
    const [selectedComplements, setSelectedComplements] = useState([]);
    const [complementDoors, setComplementDoors] = useState([]);
    const [complementPartitions, setComplementPartitions] = useState([]);
    const [complementRailings, setComplementRailings] = useState([]);
    const [comment, setComment] = useState(""); // Nuevo estado para comentario
    const [dollarReference, setDollarReference] = useState(null); // <-- Nuevo estado para el valor del dólar
    const [labourReference, setLabourReference] = useState(null); // <-- Nuevo estado

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [stepErrors, setStepErrors] = useState({});

    const [userId] = useState(() => getUserIdFromToken());

    // Agrega estado para el usuario logueado
    const [loggedUser, setLoggedUser] = useState(null);
    const [agentData, setAgentData] = useState(null); // <-- Nuevo estado para datos del agente
    const [isCustomerFound, setIsCustomerFound] = useState(false); // <--- Agrega este estado

    // Obtiene los datos del usuario logueado al montar el componente
    useEffect(() => {
        const fetchLoggedUser = async () => {
            const token = localStorage.getItem('token');
            if (!token || !userId) return;
            try {
                const response = await axios.get(`${API_URL}/api/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLoggedUser(response.data);
            } catch (error) {
                setLoggedUser(null);
            }
        };
        fetchLoggedUser();
    }, [userId]);

    // Obtener datos del agente si hay agentId
    useEffect(() => {
        const fetchAgentData = async () => {
            if (!newCustomer.agentId) {
                setAgentData(null);
                return;
            }
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/api/customer-agents/${newCustomer.agentId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAgentData(response.data);
            } catch {
                setAgentData(null);
            }
        };
        fetchAgentData();
    }, [newCustomer.agentId]);

    // Buscar agentes asociados si el customer ya existe
    useEffect(() => {
        const fetchCustomerAgents = async () => {
            if (!newCustomer.dni || newCustomer.dni.length !== 8 || !/^\d+$/.test(newCustomer.dni)) {
                setCustomerAgentsSuggestion([]);
                return;
            }
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/api/customers/dni/${newCustomer.dni}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data && res.data.agents) {
                    setCustomerAgentsSuggestion(res.data.agents);
                } else {
                    setCustomerAgentsSuggestion([]);
                }
            } catch {
                setCustomerAgentsSuggestion([]);
            }
        };
        fetchCustomerAgents();
    }, [newCustomer.dni]);

    // Carousel navigation
    const handlePrev = useCallback(() => {
        if (swiperRef.current && swiperRef.current.swiper) {
            swiperRef.current.swiper.slidePrev();
        }
    }, []);

    // Validación por paso
    const validateStep = useCallback((step) => {
        switch (step) {
            case 0:
                return validateCustomer(newCustomer);
            case 1:
                // Permitir avanzar siempre en el paso de agentes
                return { valid: true, errors: {} };
            case 2:
                return validateWorkPlace(workPlace);
            case 3:
                return validateOpenings(selectedOpenings);
            // Puedes agregar validaciones para complementos y extras si lo deseas
            default:
                return { valid: true, errors: {} };
        }
    }, [newCustomer, newAgent, workPlace, selectedOpenings]);

    useEffect(() => {
    }, [currentIndex, validateStep]);

    const handleNext = useCallback(() => {
        const validation = validateStep(currentIndex);
        if (!validation.valid) {
            setStepErrors(validation.errors);
            return;
        } else {
            setStepErrors({});
            if (swiperRef.current && swiperRef.current.swiper) {
                swiperRef.current.swiper.slideNext();
            }
        }
    }, [currentIndex, validateStep]);

    const handleSlideChange = (swiper) => {
        setCurrentIndex(swiper.activeIndex);
    };

    // Cargar tipos de trabajo
    useEffect(() => {
        const fetchWorkTypes = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const response = await axios.get(`${API_URL}/api/worktypes`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setWorkTypes(toArray(response.data));
            } catch (error) {
                setWorkTypes([]);
                console.error('Error fetching work types:', error);
            }
        };
        fetchWorkTypes();
    }, []);

    // Cargar tipos de abertura, tratamientos y tipos de vidrio
    useEffect(() => {
        const fetchOpeningData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const [openingTypesRes, treatmentsRes, glassTypesRes] = await Promise.all([
                    axios.get(`${API_URL}/api/opening-types`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/alum-treatments`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/glass-types`, { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                setOpeningTypes(toArray(openingTypesRes.data));
                setTreatments(toArray(treatmentsRes.data));
                setGlassTypes(toArray(glassTypesRes.data));
            } catch (error) {
                setOpeningTypes([]);
                setTreatments([]);
                setGlassTypes([]);
                console.error('Error fetching opening data:', error);
            }
        };
        fetchOpeningData();
    }, []);

    // Cargar complementos de cada tipo desde la API
    useEffect(() => {
        const fetchComplements = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const [doorsRes, partitionsRes, railingsRes] = await Promise.all([
                    axios.get(`${API_URL}/api/door`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/partition`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/railing`, { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                setComplementDoors(toArray(doorsRes.data));
                setComplementPartitions(toArray(partitionsRes.data));
                setComplementRailings(toArray(railingsRes.data));
            } catch (error) {
                setComplementDoors([]);
                setComplementPartitions([]);
                setComplementRailings([]);
                console.error('Error fetching complements:', error);
            }
        };
        fetchComplements();
    }, []);

    // Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    // Enviar cotización (solo un POST a quotations)
    const handleSubmitQuotation = async () => {
        setSubmitting(true);
        setSubmitError(null);

        // Validar todo el formulario antes de enviar
        const validation = validateQuotation({
            customer: newCustomer,
            agent: newAgent,
            agents, // <-- pasa el array de agentes aquí
            workPlace,
            openings: selectedOpenings,
            complements: selectedComplements,
            comment
        });
        if (!validation.valid) {
            setValidationErrors(validation.errors);
            setSubmitError("Hay errores en el formulario. Corríjalos antes de continuar.");
            setSubmitting(false);
            return;
        } else {
            setValidationErrors({});
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setSubmitError("No autenticado");
                setSubmitting(false);
                return;
            }

            // --- NUEVO: Traer coatings desde la API antes de armar el payload ---
            let coatings = [];
            try {
                const res = await axios.get(`${API_URL}/api/coating`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                coatings = toArray(res.data); // <-- Normaliza aquí
            } catch {
                coatings = [];
            }

            // Validar userId y dni
            if (!userId || !newCustomer.dni) {
                setSubmitError("Debe estar autenticado y el cliente debe tener DNI.");
                setSubmitting(false);
                return;
            }

            // Calcular precio total (puedes ajustar esta lógica)
            // Calcular precio total de complementos correctamente
            const totalComplements = selectedComplements.reduce((acc, c) => {
                let arr = [];
                if (c.type === 'door') arr = complementDoors;
                else if (c.type === 'partition') arr = complementPartitions;
                else if (c.type === 'railing') arr = complementRailings;
                const found = arr.find(item => String(item.id) === String(c.complementId));
                const price = found ? Number(found.price) : 0;
                return acc + price * Number(c.quantity);
            }, 0);

            // Limpiar customer para no enviar campos innecesarios
            const { name, lastname, tel, mail, address, dni } = newCustomer;

            // Construir el array de agentes para el payload si hay agentes seleccionados
            let agentsPayload = [];
            if (agents && agents.length > 0) {
                agentsPayload = agents.map(a => ({
                    name: a.name,
                    lastname: a.lastname,
                    dni: a.dni,
                    tel: a.tel,
                    mail: a.mail
                }));
            }

            // Solo incluir agent si el cliente es nuevo y los datos están completos
            let agent = undefined;
            const isNewCustomer = !isCustomerFound; // Usa el flag de cliente encontrado
            if (
                isNewCustomer &&
                newAgent.name.trim() &&
                newAgent.lastname.trim() &&
                newAgent.tel.trim() &&
                newAgent.mail.trim()
            ) {
                agent = { ...newAgent };
            }

            // --- Construir customerPayload correctamente ---
            let customerPayload = { name, lastname, tel, mail, address, dni };
            if (agent) {
                customerPayload.agent = agent;
            }
            if (agentsPayload.length > 0) {
                customerPayload.Agents = agentsPayload;
            }

            // Mapear los complementos para el POST a SQL
            const complementsForSql = selectedComplements.map(c => {
                let arr = [];
                if (c.type === 'door') arr = complementDoors;
                else if (c.type === 'partition') arr = complementPartitions;
                else if (c.type === 'railing') arr = complementRailings;
                const found = arr.find(item => String(item.id ?? item.Id) === String(c.complementId));
                return {
                    id: found ? (found.id ?? found.Id) : 0,
                    quantity: Number(c.quantity),
                    price: found ? Number(found.price) * Number(c.quantity) : 0
                };
            });

            const quotationPayload = {
                customer: customerPayload,
                userId: userId,
                workPlace: {
                    ...workPlace,
                    workTypeId: Number(workPlace.workTypeId),
                    location: workPlace.location || "" // Usa el campo location (ciudad - barrio)
                },
                openings: selectedOpenings,
                complements: complementsForSql,
                totalPrice: totalComplements,
                comment
            };

            console.log("Payload enviado a /api/quotations:", quotationPayload);

            const response = await axios.post(`${API_URL}/api/quotations`, quotationPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            // Obtener el id de SQL (puede venir como response.data.Id o similar)
            const sqlId = response.data?.Id || response.data?.id;
            console.log("ID recibido de SQL:", sqlId); // <-- LOG para depuración
            if (!sqlId) {
                setSubmitError("No se pudo obtener el ID de la cotización SQL.");
                setSubmitting(false);
                return;
            }

            // 2. POST a Mongo usando el id de SQL como budgetId
            // Esperar a que loggedUser esté disponible
            let userPayload = loggedUser
                ? {
                    name: loggedUser.name || "",
                    lastName: loggedUser.lastName || "",
                    mail: loggedUser.mail || ""
                }
                : {
                    name: "",
                    lastName: "",
                    mail: ""
                };

            // Construir el objeto customer para Mongo
            let customerPayloadMongo = {
                name: newCustomer.name,
                lastname: newCustomer.lastname,
                tel: newCustomer.tel,
                mail: newCustomer.mail,
                address: newCustomer.address,
                dni: newCustomer.dni,
            };

            // --- CAMBIO: solo agrega agent si hay datos válidos, no agregues agent: null ni agent: {} ---
            if (
                agentData &&
                agentData.name && agentData.lastname && agentData.tel && agentData.mail
            ) {
                customerPayloadMongo.agent = {
                    name: agentData.name,
                    lastname: agentData.lastname,
                    tel: agentData.tel,
                    mail: agentData.mail
                };
            } else if (
                newAgent &&
                newAgent.name && newAgent.lastname && newAgent.tel && newAgent.mail
                && newAgent.name.trim() && newAgent.lastname.trim() && newAgent.tel.trim() && newAgent.mail.trim()
            ) {
                customerPayloadMongo.agent = { ...newAgent };
            }
            // No else, no agregues agent si no hay datos válidos

            const selectedWorkType = workTypes.find(wt => String(wt.id) === String(workPlace.workTypeId));
            const workPlacePayload = {
                name: workPlace.name,
                address: workPlace.address,
                workType: selectedWorkType
                    ? { type: selectedWorkType.name || selectedWorkType.type || "" }
                    : { type: "" }
            };

            // --- NUEVO: Mapear los complementos para Mongo agrupando por tipo y usando nombres correctos ---
            const complementsMongo = {
                ComplementDoor: [],
                ComplementRailing: [],
                ComplementPartition: []
            };

            selectedComplements.forEach(c => {
                if (c.type === 'door') {
                    const door = complementDoors.find(d => String(d.id) === String(c.complementId));
                    const coatingObj = coatings.find(coat => String(coat.id) === String(c.custom.coating));
                    complementsMongo.ComplementDoor.push({
                        Name: door ? door.name : '',
                        Width: Number(c.custom.width),
                        Height: Number(c.custom.height),
                        Coating: coatingObj
                            ? { name: coatingObj.name, price: coatingObj.price }
                            : null,
                        Quantity: Number(c.quantity),
                        Accesory: (c.custom.accesories || []).map(acc => ({
                            Name: acc.name,
                            Quantity: Number(acc.quantity),
                            Price: Number(acc.price)
                        })),
                        Price: door ? Number(door.price) * Number(c.quantity) : 0
                    });
                }
                if (c.type === 'partition') {
                    const partition = complementPartitions.find(p => String(p.id ?? p.Id) === String(c.complementId));
                    complementsMongo.ComplementPartition.push({
                        Name: partition ? partition.name : '',
                        Height: Number(c.custom.height) || 0,
                        Quantity: Number(c.quantity) || 0,
                        Simple: !!c.custom.simple,
                        GlassMilimeters: c.custom.glassMilimeters ? `Mm${c.custom.glassMilimeters}` : '',
                        Price: partition ? Number(partition.price) * Number(c.quantity) : 0
                    });
                }
                if (c.type === 'railing') {
                    const railing = complementRailings.find(r => String(r.id) === String(c.complementId));
                    const treatmentObj = treatments.find(t => String(t.id) === String(c.custom.treatment));
                    complementsMongo.ComplementRailing.push({
                        Name: railing ? railing.name : '',
                        AlumTreatment: treatmentObj
                            ? { name: treatmentObj.name }
                            : null,
                        Reinforced: !!c.custom.reinforced,
                        Quantity: Number(c.quantity),
                        Price: railing ? Number(railing.price) * Number(c.quantity) : 0
                    });
                }
            });

            // --- NUEVO: Mapear products con nombres correctos ---
            const productsPayload = selectedOpenings.map(opening => ({
                OpeningType: openingTypes.find(type => type.id === Number(opening.typeId))
                    ? { name: openingTypes.find(type => type.id === Number(opening.typeId)).name }
                    : { name: "" },
                Quantity: opening.quantity,
                AlumTreatment: treatments.find(t => t.id === Number(opening.treatmentId))
                    ? { name: treatments.find(t => t.id === Number(opening.treatmentId)).name }
                    : { name: "" },
                GlassType: glassTypes.find(g => g.id === Number(opening.glassTypeId))
                    ? { name: glassTypes.find(g => g.id === Number(opening.glassTypeId)).name, Price: glassTypes.find(g => g.id === Number(opening.glassTypeId)).price }
                    : { name: "", Price: 0 },
                width: opening.width,
                height: opening.height,
                Accesory: [], // Si tienes accesorios, mapea aquí
                price: 0 // Ajusta si tienes el precio
            }));

            // --- NUEVO: Armar el objeto final para Mongo con mayúsculas y estructura correcta ---
            const mongoPayload = {
                Budget: {
                    budgetId: String(sqlId),
                    user: userPayload,
                    customer: customerPayloadMongo,
                    agent: customerPayloadMongo.agent || {}, // Asegura que siempre haya un objeto agent
                    workPlace: {
                        name: workPlace.name,
                        location: workPlace.location,
                        address: workPlace.address,
                        workType: selectedWorkType
                            ? { type: selectedWorkType.name || selectedWorkType.type || "" }
                            : { type: "" }
                    },
                    Products: productsPayload,
                    complement: [
                        {
                            ComplementDoor: complementsMongo.ComplementDoor,
                            ComplementPartition: complementsMongo.ComplementPartition,
                            ComplementRailing: complementsMongo.ComplementRailing,
                            price: totalComplements
                        }
                    ],
                    Comment: comment,
                    DollarReference: dollarReference ?? 0,
                    LabourReference: labourReference ?? 0
                }
            };

            console.log("Payload enviado a Mongo:", JSON.stringify(mongoPayload, null, 2));

            // 2. POST a Mongo (usa la ruta correcta)
            await axios.post(`${API_URL}/api/Mongo/CreateBudget`, mongoPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            // Actualizar cotizaciones en el contexto si quieres
            if (response && response.data) {
                addQuotation(response.data); // <-- usa addQuotation en vez de setQuotations
            }

            setSubmitting(false);
            navigate(`/quotation/${sqlId}`);
        } catch (err) {
            setSubmitError(err.message || 'Error al crear la cotización');
            setSubmitting(false);
        }
    };

    // Evitar submit con Enter salvo en el último paso
    const handleFormKeyDown = (e) => {
        if (e.key === 'Enter' && currentIndex !== 4) {
            e.preventDefault();
        }
    };

    // Función para obtener nombre de abertura por id
    const getOpeningTypeName = (typeId) => {
        const type = openingTypes.find(t => String(t.id) === String(typeId));
        return type ? (type.name || type.type) : '';
    };

    // Función para calcular subtotal de abertura (placeholder)
    const getOpeningSubtotal = (opening) => {
        // Aquí irá el cálculo real cuando esté disponible
        return 'Subtotal $';
    };

    // Función para obtener nombre de complemento por id y tipo
    const getComplementName = (complementId, type) => {
        let arr = [];
        if (type === 'door') arr = complementDoors;
        else if (type === 'partition') arr = complementPartitions;
        else if (type === 'railing') arr = complementRailings;
        const comp = arr.find(c => String(c.id) === String(complementId));
        return comp ? comp.name : '';
    };

    // Función para calcular subtotal de complemento (placeholder)
    const getComplementSubtotal = (complement) => {
        // Aquí irá el cálculo real cuando esté disponible
        return 'Subtotal $';
    };

    // Placeholder para total de aberturas y complementos
    const getTotalOpenings = () => {
        // Aquí irá el cálculo real cuando esté disponible
        return 'Total aberturas $';
    };
    const getTotalComplements = () => {
        // Aquí irá el cálculo real cuando esté disponible
        return 'Total complementos $';
    };

    // Handlers para resumen (quitar y modificar cantidad)
    const handleRemoveOpening = (idx) => {
        setSelectedOpenings(prev => prev.filter((_, i) => i !== idx));
    };
    const handleChangeOpeningQty = (idx, delta) => {
        setSelectedOpenings(prev =>
            prev.map((op, i) =>
                i === idx
                    ? { ...op, quantity: Math.max(1, (op.quantity || 1) + delta) }
                    : op
            )
        );
    };
    const handleRemoveComplement = (idx) => {
        setSelectedComplements(prev => prev.filter((_, i) => i !== idx));
    };
    const handleChangeComplementQty = (idx, delta) => {
        setSelectedComplements(prev =>
            prev.map((comp, i) =>
                i === idx
                    ? { ...comp, quantity: Math.max(1, (comp.quantity || 1) + delta) }
                    : comp
            )
        );
    };
     const goToSlide = (index) => {
         if (swiperRef.current && swiperRef.current.swiper) {
        swiperRef.current.swiper.slideTo(index);
         }
    };

    // Buscar agente por DNI
    const handleAgentSearch = async () => {
        setAgentSearchError("");
        setAgentSearchResult(null);
        if (!agentSearchDni.trim() || agentSearchDni.length !== 8 || !/^\d+$/.test(agentSearchDni)) {
            setAgentSearchError("Debe ingresar un DNI de 8 dígitos.");
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/customer-agents/dni/${agentSearchDni}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) {
                setAgentSearchResult(res.data);
            } else {
                setAgentSearchResult(null);
            }
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setAgentSearchResult(null); // No encontrado, permite alta
            } else {
                setAgentSearchError("Error buscando agente.");
            }
        }
    };

    // Agregar agente existente al array de agentes
    const handleAddExistingAgent = () => {
        if (agentSearchResult && !agents.some(a => a.dni === agentSearchResult.dni)) {
            setAgents(prev => [...prev, agentSearchResult]);
            setAgentSearchResult(null);
            setAgentSearchDni("");
        }
    };

    // Agregar nuevo agente al array de agentes
    const handleAddNewAgent = () => {
        if (
            newAgent.dni && newAgent.name && newAgent.lastname &&
            newAgent.tel && newAgent.mail &&
            !agents.some(a => a.dni === newAgent.dni)
        ) {
            setAgents(prev => [...prev, { ...newAgent }]);
            setNewAgent({ dni: '', name: '', lastname: '', tel: '', mail: '' });
        }
    };

    // Eliminar agente de la lista
    const handleRemoveAgent = (dni) => {
        setAgents(prev => prev.filter(a => a.dni !== dni));
    };

    // Agregar agente sugerido (de customer existente)
    const handleAddSuggestedAgent = (agent) => {
        if (!agents.some(a => a.dni === agent.dni)) {
            setAgents(prev => [...prev, agent]);
        }
    };

    // Buscar automáticamente agente al ingresar 8 dígitos
    useEffect(() => {
        if (agentSearchDni.length === 8 && /^\d+$/.test(agentSearchDni)) {
            (async () => {
                setAgentSearchError("");
                setAgentSearchResult(null);
                setAgentSearched(true);
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`${API_URL}/api/customer-agents/dni/${agentSearchDni}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data) {
                        setAgentSearchResult(res.data);
                    } else {
                        setAgentSearchResult(null);
                    }
                } catch (err) {
                    if (err.response && err.response.status === 404) {
                        setAgentSearchResult(null); // No encontrado, permite alta
                    } else {
                        setAgentSearchError("Error buscando agente.");
                    }
                }
            })();
        } else {
            setAgentSearchResult(null);
            setAgentSearched(false);
        }
    }, [agentSearchDni]);

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            <h2 className="title">Nueva Cotización</h2>
            <div className="quotation-layout">
                <aside className="quotation-indice" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3>Índice</h3>
                        <p onClick={() => goToSlide(0)} style={{ cursor: 'pointer' }}><b><u>Datos Cliente</u></b></p>
                        <p onClick={() => goToSlide(1)} style={{ cursor: 'pointer' }}><b><u>Datos Agentes</u></b></p>
                        <p onClick={() => goToSlide(2)} style={{ cursor: 'pointer' }}><b><u>Espacio de trabajo</u></b></p>
                        <p onClick={() => goToSlide(3)} style={{ cursor: 'pointer' }}><b><u>Carga de Aberturas</u></b></p>
                        <p onClick={() => goToSlide(4)} style={{ cursor: 'pointer' }}><b><u>Carga de Complementos</u></b></p>
                        <p onClick={() => goToSlide(5)} style={{ cursor: 'pointer' }}><b><u>Comentarios</u></b></p>
                    </aside>

                <main className="quotation-main">
                    <form className="quotation-form" onKeyDown={handleFormKeyDown}>
                        <div className="embla-buttons-container">
                            <button
                                type="button"
                                className="embla__button embla__button--prev"
                                onClick={handlePrev}
                                disabled={currentIndex === 0}
                            >
                                Atrás
                            </button>
                            <span style={{ alignSelf: "center", fontWeight: 500, fontSize: 16, color: "#26b7cd" }}>
                                Página {currentIndex + 1} de 6
                            </span>
                            <button
                                type="button"
                                className="embla__button embba__button--next"
                                onClick={handleNext}
                                disabled={currentIndex === 5}
                            >
                                Adelante
                            </button>
                        </div>
                        <Swiper
                            ref={swiperRef}
                            allowTouchMove={false}
                            slidesPerView={1}
                            onSlideChange={handleSlideChange}
                            initialSlide={0}
                            style={{ minHeight: 400 }}
                        >
                            <SwiperSlide>
                                <Customer
                                    newCustomer={newCustomer}
                                    setNewCustomer={setNewCustomer}
                                    errors={currentIndex === 0 ? stepErrors : {}}
                                    isCustomerFound={isCustomerFound}
                                    setIsCustomerFound={setIsCustomerFound}
                                />
                            </SwiperSlide>
                            <SwiperSlide>
                                {/* AGENTES */}
                                <div className="agent-step-container">
                                    <h3>Agentes del Cliente</h3>
                                    {/* Sugerencias de agentes asociados al cliente */}
                                    {customerAgentsSuggestion.length > 0 && (
                                        <div className="suggested-agents">
                                            <h4>Agentes ya asociados a este cliente:</h4>
                                            {customerAgentsSuggestion.map((agent, idx) => (
                                                <div key={idx} className="agent-suggestion-row">
                                                    <span>
                                                        {agent.name} {agent.lastname} - {agent.dni}
                                                    </span>
                                                    <button type="button" className="add-agent-btn" onClick={() => handleAddSuggestedAgent(agent)}>
                                                        +
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* Buscar agente por DNI */}
                                    <div className="agent-search">
                                        <label>DNI del agente:</label>
                                        <input
                                            type="text"
                                            value={agentSearchDni}
                                            onChange={e => setAgentSearchDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                            placeholder="Ingrese DNI del agente"
                                            maxLength={8}
                                            className="dni-agent-input"
                                        />
                                        {agentSearchError && <span className="error-message">{agentSearchError}</span>}
                                    </div>
                                    {/* Resultado de búsqueda */}
                                    {agentSearched && agentSearchDni.length === 8 && (
                                        agentSearchResult ? (
                                            <div className="agent-found">
                                                <p>Agente encontrado: <b>{agentSearchResult.name} {agentSearchResult.lastname}</b> - {agentSearchResult.dni}</p>
                                                <button type="button" className="add-agent-btn" onClick={handleAddExistingAgent}>Agregar este agente</button>
                                            </div>
                                        ) : (
                                            <div className="new-agent-form">
                                                <h4>Nuevo agente</h4>
                                                <label>Nombre:</label>
                                                <input
                                                    type="text"
                                                    value={newAgent.name}
                                                    onChange={e => setNewAgent(prev => ({ ...prev, name: e.target.value, dni: agentSearchDni }))
                                                    }
                                                />
                                                <label>Apellido:</label>
                                                <input
                                                    type="text"
                                                    value={newAgent.lastname}
                                                    onChange={e => setNewAgent(prev => ({ ...prev, lastname: e.target.value, dni: agentSearchDni }))
                                                    }
                                                />
                                                <label>Teléfono:</label>
                                                <input
                                                    type="text"
                                                    value={newAgent.tel}
                                                    onChange={e => setNewAgent(prev => ({ ...prev, tel: e.target.value, dni: agentSearchDni }))
                                                    }
                                                />
                                                <label>Email:</label>
                                                <input
                                                    type="email"
                                                    value={newAgent.mail}
                                                    onChange={e => setNewAgent(prev => ({ ...prev, mail: e.target.value, dni: agentSearchDni }))
                                                    }
                                                />
                                                <button type="button" className="add-agent-btn" onClick={handleAddNewAgent}>Agregar nuevo agente</button>
                                            </div>
                                        )
                                    )}
                                    {/* Lista de agentes agregados */}
                                    <div className="agents-list">
                                        <h4>Agentes seleccionados:</h4>
                                        {agents.length === 0 && <div>No hay agentes agregados.</div>}
                                        {agents.map((agent, idx) => (
                                            <div key={idx} className="agent-selected-row">
                                                <span>
                                                    {agent.name} {agent.lastname} - {agent.dni}
                                                </span>
                                                <button type="button" className="remove-agent-btn" onClick={() => handleRemoveAgent(agent.dni)}>
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </SwiperSlide>
                            <SwiperSlide>
                                <WorkPlace
                                    workPlace={workPlace}
                                    setWorkPlace={setWorkPlace}
                                    workTypes={workTypes}
                                    errors={currentIndex === 2 ? stepErrors : {}}
                                />
                            </SwiperSlide>
                            <SwiperSlide>
                                <OpeningType
                                    openingForm={openingForm}
                                    setOpeningForm={setOpeningForm}
                                    openingTypes={openingTypes}
                                    treatments={treatments}
                                    glassTypes={glassTypes}
                                    selectedOpenings={selectedOpenings}
                                    setSelectedOpenings={setSelectedOpenings}
                                    errors={currentIndex === 3 ? stepErrors : {}}
                                    // Quita la lista de aberturas seleccionadas del paso
                                    hideSelectedList={true}
                                />
                            </SwiperSlide>
                            <SwiperSlide>
                                <Complements
                                    complementDoors={complementDoors}
                                    complementPartitions={complementPartitions}
                                    complementRailings={complementRailings}
                                    selectedComplements={selectedComplements}
                                    setSelectedComplements={setSelectedComplements}
                                    // hideSelectedList={true} // si no lo usas, puedes quitarlo
                                />
                            </SwiperSlide>
                            <SwiperSlide>
                                <Extras
                                    comment={comment}
                                    setComment={setComment}
                                    setDollarReference={setDollarReference}
                                    setLabourReference={setLabourReference}
                                />
                                <div style={{ marginTop: 24 }}>
                                    <button
                                        type="button"
                                        className="submit-button"
                                        disabled={submitting}
                                        onClick={handleSubmitQuotation}
                                    >
                                        {submitting ? "Enviando..." : "Cotizar"}
                                    </button>
                                    {submitError && (
                                        <div style={{ color: 'red', marginTop: 8 }}>{submitError}</div>
                                    )}
                                    {Object.keys(validationErrors).length > 0 && (
                                        <div style={{ color: 'red', marginTop: 8 }}>
                                            {Object.entries(validationErrors).map(([field, msg]) => (
                                                <div key={field}>{msg}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </SwiperSlide>
                        </Swiper>
                    </form>
                </main>
                <aside className="quotation-summary">
                    <h3>Resumen</h3>
                    <div>
                        <strong>Aberturas agregadas:</strong>
                        {selectedOpenings.length === 0 && (
                            <div className="summary-empty">No hay aberturas agregadas.</div>
                        )}
                        {selectedOpenings.map((opening, idx) => (
                            <div key={idx} className="summary-item">
                                <button
                                    className="summary-remove-btn"
                                    title="Quitar abertura"
                                    onClick={() => handleRemoveOpening(idx)}
                                    type="button"
                                >×</button>
                                <div className="summary-title">{getOpeningTypeName(opening.typeId)}</div>
                                <div className="summary-detail">
                                    Medidas: {opening.width} x {opening.height} cm
                                </div>
                                <div className="summary-detail summary-qty-row">
                                    <button
                                        className="summary-qty-btn"
                                        type="button"
                                        onClick={() => handleChangeOpeningQty(idx, -1)}
                                    >−</button>
                                    <span className="summary-qty">{opening.quantity}</span>
                                    <button
                                        className="summary-qty-btn"
                                        type="button"
                                        onClick={() => handleChangeOpeningQty(idx, 1)}
                                    >+</button>
                                </div>
                                <div className="summary-subtotal">
                                    {getOpeningSubtotal(opening)}
                                </div>
                            </div>
                        ))}
                        <div className="summary-total">
                            {getTotalOpenings()}
                        </div>
                    </div>
                    <div style={{ marginTop: 24 }}>
                        <strong>Complementos agregados:</strong>
                        {selectedComplements.length === 0 && (
                            <div className="summary-empty">No hay complementos agregados.</div>
                        )}
                        {selectedComplements.map((complement, idx) => (
                            <div key={idx} className="summary-item">
                                <button
                                    className="summary-remove-btn"
                                    title="Quitar complemento"
                                    onClick={() => handleRemoveComplement(idx)}
                                    type="button"
                                >×</button>
                                <div className="summary-title">
                                    {getComplementName(complement.complementId || complement.id, complement.type)}
                                </div>
                                <div className="summary-detail summary-qty-row">
                                    <button
                                        className="summary-qty-btn"
                                        type="button"
                                        onClick={() => handleChangeComplementQty(idx, -1)}
                                    >−</button>
                                    <span className="summary-qty">{complement.quantity}</span>
                                    <button className="summary-qty-btn" type="button" onClick={() => handleChangeComplementQty(idx, 1)}
                                    >+</button>
                                </div>
                                <div className="summary-subtotal">
                                    {getComplementSubtotal(complement)}
                                </div>
                            </div>
                        ))}
                        <div className="summary-total">
                            {getTotalComplements()}
                        </div>
                    </div>
                </aside>
            </div>
            <Footer />
        </div>
    );
};

export default Quotation;