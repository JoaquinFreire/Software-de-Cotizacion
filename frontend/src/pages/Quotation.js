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
import { validateAgent } from "../validation/agentValidation";
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
    const [isCustomerAdded, setIsCustomerAdded] = useState(false);

    const navigate = useNavigate();
    const { addQuotation } = React.useContext(QuotationContext);

    const [newCustomer, setNewCustomer] = useState({
        name: '', lastname: '', tel: '', mail: '', address: '', agentId: null, dni: ''
    });
    // const [isCustomerComplete, setIsCustomerComplete] = useState(false); // <-- ELIMINAR ESTA LÍNEA
    const [agents, setAgents] = useState([]); // Lista de agentes asociados al customer
    const [clients, setClients] = useState([]);
    const [workPlaces, setWorkPlaces] = useState([]); // <-- Add this line to define workPlaces state
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

    // Nuevos estados para cálculos
    const [openingConfigurations, setOpeningConfigurations] = useState([]);
    const [alumPrice, setAlumPrice] = useState(0);
    const [labourPrice, setLabourPrice] = useState(0);
    const [taxRate, setTaxRate] = useState(0); // <-- nuevo estado para IVA
    const [mosquitoPrice, setMosquitoPrice] = useState(0); // <-- nuevo estado para tela mosquitera

    // Nuevo estado para mostrar el log de cálculo de abertura solo una vez
    const [lastOpeningLog, setLastOpeningLog] = useState(null);

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
    }, [newCustomer, workPlace, selectedOpenings]); // <-- newAgent removido

    const handleNext = useCallback(() => {
        // Validar que el cliente esté agregado antes de avanzar del paso 0
        if (currentIndex === 0 && !isCustomerAdded) {
            setStepErrors({
                general: "Debe agregar el cliente al resumen antes de continuar"
            });
            return;
        }

        const validation = validateStep(currentIndex);
        if (!validation.valid) {
            // Evitamos mostrar errores al navegar; solo impedir avance y avisar.
            toast.error("Complete los datos o agréguelos al resumen antes de continuar.");
            return;
        } else {
            setStepErrors({});
            if (swiperRef.current && swiperRef.current.swiper) {
                swiperRef.current.swiper.slideNext();
            }
        }
    }, [currentIndex, validateStep, isCustomerAdded]);

    const handleSlideChange = (swiper) => {
        setCurrentIndex(swiper.activeIndex);
    };

    const canNavigateToStep = useCallback((targetStep) => {
        // Si vamos al paso 0 (cliente) siempre permitido
        if (targetStep === 0) return true;

        // Si vamos a pasos posteriores, requerir que el cliente esté agregado
        if (targetStep > 0 && !isCustomerAdded) {
            return false;
        }

        return true;
    }, [isCustomerAdded]);

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

    // Cargar opening_configurations y precios al montar
    useEffect(() => {
        const fetchConfigAndPrices = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const [configsRes, pricesRes] = await Promise.all([
                    axios.get(`${API_URL}/api/opening-configurations`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/prices`, { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                setOpeningConfigurations(configsRes.data);
                const prices = toArray(pricesRes.data);
                const alum = prices.find(p => p.name?.toLowerCase().includes("aluminio"));
                setAlumPrice(alum ? Number(alum.price) : 0);
                const labour = prices.find(p =>
                    p.name?.toLowerCase().includes("manoobra") ||
                    p.name?.toLowerCase().includes("manodeobra") ||
                    p.name?.toLowerCase().includes("mano de obra")
                );
                setLabourPrice(labour ? Number(labour.price) : 0);

                // Tela mosquitera (id 7 o por nombre)
                const mosquitoEntry = prices.find(p => p.name?.toLowerCase().includes("tela mosquitera") || String(p.id) === "7");
                setMosquitoPrice(mosquitoEntry ? Number(mosquitoEntry.price) : 0);

                // extraer tasa de IVA (por nombre o por id si corresponde)
                const ivaEntry = prices.find(p => p.name?.toLowerCase().includes("iva") || String(p.id) === "4");
                setTaxRate(ivaEntry ? Number(ivaEntry.price) : 0);
            } catch (err) {
                setOpeningConfigurations([]);
                setAlumPrice(0);
                setLabourPrice(0);
                setTaxRate(0);
            }
        };
        fetchConfigAndPrices();
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

        // LIMPIAR EL AGENTE: Solo considerar si tiene datos completos
        const cleanedAgent = (newAgent.name?.trim() &&
            newAgent.lastname?.trim() &&
            newAgent.tel?.trim() &&
            newAgent.mail?.trim())
            ? newAgent
            : null;

        // Validar todo el formulario antes de enviar
        const validation = validateQuotation({
            customer: newCustomer,
            agent: cleanedAgent, // <-- Pasar el agente limpiado
            agents, // <-- Este array puede estar vacío, y eso está bien
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
                const idVal = found ? (found.id ?? found.Id) : 0;
                // preferir totalPrice calculado por frontend, si no existe fallback al precio estándar * qty
                const totalPriceForSql = c.totalPrice !== undefined && c.totalPrice !== null
                    ? Number(c.totalPrice)
                    : (found ? Number(found.price) * Number(c.quantity) : 0);
                return {
                    id: idVal,
                    quantity: Number(c.quantity),
                    price: totalPriceForSql
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

            // Añadir createMongo:false para indicar al backend que no cree el documento mongo automáticamente (si lo respeta)
            const sqlPayload = { ...quotationPayload, createMongo: false };
            const response = await axios.post(`${API_URL}/api/quotations`, sqlPayload, {
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

            // Selección del agente para Mongo: preferir agentData, luego la lista agents (primer elemento), luego newAgent.
            // Incluir dni cuando exista.
            let agentForMongo = null;
            if (agentData && (agentData.name || agentData.lastname || agentData.dni || agentData.tel || agentData.mail)) {
                agentForMongo = {
                    name: agentData.name || "",
                    lastname: agentData.lastname || "",
                    dni: agentData.dni || agentData.Dni || "",
                    tel: agentData.tel || "",
                    mail: agentData.mail || ""
                };
            } else if (Array.isArray(agents) && agents.length > 0) {
                const a = agents[0];
                agentForMongo = {
                    name: a.name || "",
                    lastname: a.lastname || "",
                    dni: a.dni || a.Dni || "",
                    tel: a.tel || "",
                    mail: a.mail || ""
                };
            } else if (newAgent && (newAgent.name || newAgent.lastname || newAgent.dni || newAgent.tel || newAgent.mail)) {
                agentForMongo = {
                    name: newAgent.name || "",
                    lastname: newAgent.lastname || "",
                    dni: newAgent.dni || "",
                    tel: newAgent.tel || "",
                    mail: newAgent.mail || ""
                };
            } else {
                agentForMongo = {}; // siempre enviar al menos un objeto (vacío) si no hay datos
            }

            customerPayloadMongo.agent = agentForMongo;

            // LOGS de depuración extensos para entender qué se está enviando
            console.log("DEBUG agentes (lista 'agents'):", agents);
            console.log("DEBUG agentData (fetched by agentId):", agentData);
            console.log("DEBUG newAgent (form):", newAgent);
            console.log("DEBUG isCustomerFound:", isCustomerFound);
            console.log("DEBUG agentsPayload (para SQL):", agentsPayload);
            console.log("Agente seleccionado para enviar a Mongo (customer.agent):", customerPayloadMongo.agent);

            // --- NUEVO: Mapear los complementos para Mongo agrupando por tipo y usando nombres correctos ---
            const complementsMongo = {
                ComplementDoor: [],
                ComplementRailing: [],
                ComplementPartition: []
            };

            selectedComplements.forEach(c => {
                if (c.type === 'door') {
                    const door = complementDoors.find(d => String(d.id) === String(c.complementId));
                    const coatingObj = coatings.find(coat => String(coat.id) === String(c.custom?.coating));
                    const unitPriceUsed = c.unitPrice !== undefined && c.unitPrice !== null
                        ? Number(c.unitPrice)
                        : (door ? Number(door.price) : 0);
                    const totalPriceUsed = c.totalPrice !== undefined && c.totalPrice !== null
                        ? Number(c.totalPrice)
                        : unitPriceUsed * Number(c.quantity || 1);
                    complementsMongo.ComplementDoor.push({
                        Name: door ? door.name : '',
                        Width: Number(c.custom?.width),
                        Height: Number(c.custom?.height),
                        Coating: coatingObj
                            ? { name: coatingObj.name, price: coatingObj.price }
                            : null,
                        Quantity: Number(c.quantity),
                        Accesory: (c.custom?.accesories || []).map(acc => ({
                            Name: acc.name,
                            Quantity: Number(acc.quantity),
                            Price: Number(acc.price)
                        })),
                        Price: Number(totalPriceUsed),
                        UnitPrice: Number(unitPriceUsed)  // <-- nuevo: precio por unidad
                    });
                }
                if (c.type === 'partition') {
                    const partition = complementPartitions.find(p => String(p.id ?? p.Id) === String(c.complementId));
                    const unitPriceUsed = c.unitPrice !== undefined && c.unitPrice !== null
                        ? Number(c.unitPrice)
                        : (partition ? Number(partition.price) * (Number(c.custom?.height || 100) / 100) : 0);
                    const totalPriceUsed = c.totalPrice !== undefined && c.totalPrice !== null
                        ? Number(c.totalPrice)
                        : (unitPriceUsed * Number(c.quantity || 1));
                    complementsMongo.ComplementPartition.push({
                        Name: partition ? partition.name : '',
                        Height: Number(c.custom?.height) || 0,
                        Quantity: Number(c.quantity) || 0,
                        Simple: !!c.custom?.simple,
                        GlassMilimeters: c.custom?.glassMilimeters ? `Mm${c.custom.glassMilimeters}` : '',
                        Price: Number(totalPriceUsed),
                        UnitPrice: Number(unitPriceUsed) // <-- nuevo
                    });
                }
                if (c.type === 'railing') {
                    const railing = complementRailings.find(r => String(r.id) === String(c.complementId));
                    const treatmentObj = treatments.find(t => String(t.id) === String(c.custom?.treatment));
                    const unitPriceUsed = c.unitPrice !== undefined && c.unitPrice !== null
                        ? Number(c.unitPrice)
                        : (railing ? Number(railing.price) : 0);
                    const totalPriceUsed = c.totalPrice !== undefined && c.totalPrice !== null
                        ? Number(c.totalPrice)
                        : (unitPriceUsed ? unitPriceUsed * Number(c.quantity) : 0);
                    complementsMongo.ComplementRailing.push({
                        Name: railing ? railing.name : '',
                        AlumTreatment: treatmentObj
                            ? { name: treatmentObj.name }
                            : null,
                        Reinforced: !!c.custom?.reinforced,
                        Quantity: Number(c.quantity),
                        Price: Number(totalPriceUsed),
                        UnitPrice: Number(unitPriceUsed) // <-- nuevo
                    });
                }
            });

            // --- NUEVO: Mapear products con nombres correctos y adjuntar UnitPrice/TotalPrice ---
            const productsPayload = selectedOpenings.map(opening => {
                // opening.width/height are in cm
                const widthCm = Number(opening.width || 0);
                const heightCm = Number(opening.height || 0);
                const widthMM = widthCm * 10;
                const heightMM = heightCm * 10;

                const totalPanels = (opening.numPanelsWidth || 1) * (opening.numPanelsHeight || 1);

                // cálculo aluminio (siguiendo la lógica del frontend)
                const perimetroPanelMM = 2 * (widthMM + heightMM);
                const totalAluminioMM = perimetroPanelMM * totalPanels * (opening.quantity || 1);
                const totalAluminioM = totalAluminioMM / 1000;
                const openingTypeObj = safeArray(openingTypes).find(t => Number(t.id) === Number(opening.typeId));
                const pesoAluminio = openingTypeObj && openingTypeObj.weight ? totalAluminioM * Number(openingTypeObj.weight) : 0;
                const costoAluminio = pesoAluminio * Number(alumPrice || 0);

                // vidrio
                const areaPanelM2 = (widthMM / 1000) * (heightMM / 1000);
                const areaTotalVidrioPerUnit = areaPanelM2 * totalPanels; // per unit
                const areaTotalVidrio = areaTotalVidrioPerUnit * (opening.quantity || 1);
                const glassObj = safeArray(glassTypes).find(g => Number(g.id) === Number(opening.glassTypeId));
                const costoVidrio = glassObj ? areaTotalVidrioPerUnit * Number(glassObj.price || 0) : 0;

                // Mosquitera por unidad (si fue marcada en el formulario)
                const mosquitoSelected = !!opening.mosquito;
                const costoMosquitera = mosquitoSelected ? areaTotalVidrioPerUnit * Number(mosquitoPrice || 0) : 0;

                // tratamiento
                const treatmentObj = safeArray(treatments).find(t => Number(t.id) === Number(opening.treatmentId));
                const tratamientoPorc = treatmentObj && treatmentObj.pricePercentage ? Number(treatmentObj.pricePercentage) : 0;
                const costoTratamiento = costoAluminio * (tratamientoPorc / 100);

                // MANO DE OBRA POR KILO - MODIFICADO
                const costoManoObra = pesoAluminio * Number(labourPrice || 0);

                // Build product payload, IMPORTANT: width & height sent in CENTIMETERS
                const subtotal = costoAluminio + costoTratamiento + costoVidrio + costoManoObra + costoMosquitera;
                const quantity = Number(opening.quantity || 1);

                return {
                    OpeningType: openingTypes.find(type => Number(type.id) === Number(opening.typeId))
                        ? { name: openingTypes.find(type => Number(type.id) === Number(opening.typeId)).name }
                        : { name: "" },
                    Quantity: quantity,
                    AlumTreatment: treatmentObj ? { name: treatmentObj.name } : { name: "" },
                    // enviar precio como "price" (minúscula) para coincidir con el schema backend/frontend
                    GlassType: glassObj ? { name: glassObj.name, price: Number(glassObj.price || 0) } : { name: "", price: 0 },
                    Mosquito: mosquitoSelected ? { selected: true, price: Number(mosquitoPrice || 0) } : { selected: false },
                    width: Number(widthCm),
                    height: Number(heightCm),
                    WidthPanelQuantity: Number(opening.numPanelsWidth),
                    HeightPanelQuantity: Number(opening.numPanelsHeight),
                    PanelWidth: Number((widthCm / opening.numPanelsWidth).toFixed(2)),
                    PanelHeight: Number((heightCm / opening.numPanelsHeight).toFixed(2)),
                    Accesory: (opening.accesories || opening.custom?.accesories || []).map(a => ({
                        Name: a.name || a.Name || '',
                        Quantity: Number(a.quantity || a.Quantity || 0),
                        Price: Number(a.price || a.Price || 0)
                    })),
                    UnitPrice: Number(subtotal.toFixed(2)),            // <-- precio unitario (sin IVA)
                    TotalPrice: Number((subtotal * quantity).toFixed(2)) // <-- precio total por cantidad (sin IVA)
                };
            });

            // --- ARREGLADO: Definir selectedWorkType antes de usarlo ---
            const selectedWorkType = workTypes.find(wt => String(wt.id) === String(workPlace.workTypeId));

            // --- NUEVO: Incluir bandera para que backend sepa no re-aplicar impuestos/crear mongo ---
            const mongoPayload = {
                Budget: {
                    budgetId: String(sqlId),
                    user: userPayload,
                    customer: customerPayloadMongo,
                    agent: customerPayloadMongo.agent, // <-- SIEMPRE presente
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
                    LabourReference: labourReference ?? 0,
                    Meta: { excludeBackendTaxes: true } // <-- bandera para evitar que backend aplique IVA en re-procesos
                }
            };

            console.log("Payload enviado a Mongo:", JSON.stringify(mongoPayload, null, 2));

            // 2. POST a Mongo (usa la ruta correcta)
            const mongoRes = await axios.post(`${API_URL}/api/Mongo/CreateBudget`, mongoPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            // Obtener Total calculado en Mongo y actualizar SQL.total_price
            try {
                // GET desde Mongo para recuperar la versión calculada (el controlador devuelve DTO con Total)
                const getBudgetRes = await axios.get(`${API_URL}/api/Mongo/GetBudgetByBudgetId/${sqlId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const mongoBudget = getBudgetRes.data;
                // propiedades esperadas: Total (decimal) — fallback por nombres alternativos por si acaso
                const totalFromMongo = mongoBudget?.Total ?? mongoBudget?.total ?? mongoBudget?.TotalPrice ?? null;
                if (totalFromMongo !== null && totalFromMongo !== undefined) {
                    // Actualizar SQL para que total_price coincida con el Total calculado por backend (Mongo)
                    try {
                        await axios.put(`${API_URL}/api/quotations/${sqlId}/total`, { totalPrice: Number(totalFromMongo) }, {
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`
                            }
                        });
                        console.log(`SQL total_price actualizado con valor desde Mongo: ${totalFromMongo}`);
                    } catch (upErr) {
                        console.warn('No se pudo actualizar total_price en SQL:', upErr);
                    }
                } else {
                    console.warn('No se obtuvo Total desde Mongo para sincronizar con SQL.');
                }
            } catch (errGet) {
                console.warn('No se pudo leer la cotización desde Mongo para obtener Total:', errGet);
            }

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

    // --- Cálculo de subtotal de abertura - MODIFICADO PARA MANO DE OBRA POR KILO ---
    const getOpeningSubtotal = (opening, logOnce = false) => {
        const configsArr = safeArray(openingConfigurations);
        // Opening.width/height stored in cm -> convertir a mm para buscar config
        const widthMM = Number(opening.width || 0) * 10;
        const heightMM = Number(opening.height || 0) * 10;
        const config = configsArr.find(cfg =>
            widthMM >= cfg.min_width_mm &&
            widthMM <= cfg.max_width_mm &&
            heightMM >= cfg.min_height_mm &&
            heightMM <= cfg.max_height_mm &&
            Number(opening.typeId) === Number(cfg.opening_type_id)
        );
        if (!config) return "Sin configuración";

        // Prefer user-selected panel counts; fall back to config
        const numPanelsWidth = opening.numPanelsWidth || config.num_panels_width;
        const numPanelsHeight = opening.numPanelsHeight || config.num_panels_height;
        const totalPanels = numPanelsWidth * numPanelsHeight;

        // panel sizes: opening.panelWidth/panelHeight stored in cm -> convertir a mm
        const anchoPanelMM = (opening.panelWidth !== undefined && opening.panelWidth !== '')
            ? Number(opening.panelWidth) * 10
            : (widthMM / numPanelsWidth);
        const altoPanelMM = (opening.panelHeight !== undefined && opening.panelHeight !== '')
            ? Number(opening.panelHeight) * 10
            : (heightMM / numPanelsHeight);

        // Perímetro de cada panel (mm)
        const perimetroPanelMM = 2 * (anchoPanelMM + altoPanelMM);
        // Total de aluminio (mm) por UNA abertura (no multiplicamos por opening.quantity aquí)
        const totalAluminioMM = perimetroPanelMM * totalPanels;
        // Convertir a metros
        const totalAluminioM = totalAluminioMM / 1000;

        // Peso total aluminio (kg)
        const openingType = safeArray(openingTypes).find(t => Number(t.id) === Number(opening.typeId));
        const pesoAluminio = openingType && openingType.weight ? totalAluminioM * Number(openingType.weight) : 0;
        const costoAluminio = pesoAluminio * Number(alumPrice);

        // Paso 3 — Calcular vidrio
        // Área de cada panel (m²): anchoPanelMM/1000 * altoPanelMM/1000
        const areaPanelM2 = (anchoPanelMM / 1000) * (altoPanelMM / 1000);
        // Área total vidrio (m²) por UNA abertura
        const areaTotalVidrio = areaPanelM2 * totalPanels;
        // Costo vidrio
        const glassType = safeArray(glassTypes).find(g => Number(g.id) === Number(opening.glassTypeId));
        const costoVidrio = glassType ? areaTotalVidrio * Number(glassType.price) : 0;

        // --- MOSQUITERA: costo por unidad (si está marcada) ---
        const mosquitoSelected = !!opening.mosquito;
        const costoMosquitera = mosquitoSelected ? areaTotalVidrio * Number(mosquitoPrice || 0) : 0;

        // Paso 4 — Aplicar tratamiento aluminio
        const treatment = safeArray(treatments).find(t => Number(t.id) === Number(opening.treatmentId));
        const tratamientoPorc = treatment && treatment.pricePercentage ? Number(treatment.pricePercentage) : 0;
        const costoTratamiento = costoAluminio * (tratamientoPorc / 100);

        // Paso 5 — Sumar mano de obra POR KILO - MODIFICADO
        const costoManoObra = pesoAluminio * Number(labourPrice || 0);

        // Build product payload, IMPORTANT: width & height sent in CENTIMETERS
        // Incluir costo de mosquitera en subtotal
        const subtotal = costoAluminio + costoTratamiento + costoVidrio + costoManoObra + costoMosquitera;
        const quantity = Number(opening.quantity || 1);
        const panelWidthCm = opening.panelWidth ? Number(opening.panelWidth) : (Number(opening.width || 0) / (opening.numPanelsWidth || 1));
        const panelHeightCm = opening.panelHeight ? Number(opening.panelHeight) : (Number(opening.height || 0) / (opening.numPanelsHeight || 1));
        // mosquitoSelected ya fue declarada arriba; no redeclarar aquí

        // Devolver JSX con desglose (se usa directamente en el render del resumen)
        return (
            <>
                <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                    <div><strong>Desglose por unidad:</strong></div>
                    <div>• Aluminio: {pesoAluminio.toFixed(2)} kg × ${alumPrice.toFixed(2)} = ${costoAluminio.toFixed(2)}</div>
                    <div>• Tratamiento ({tratamientoPorc}%): ${costoTratamiento.toFixed(2)}</div>
                    <div>• Vidrio: {areaTotalVidrio.toFixed(3)} m² × ${glassType?.price?.toFixed(2) || '0.00'} = ${costoVidrio.toFixed(2)}</div>
                    {mosquitoSelected && (
                        <div>• Tela mosquitera: {areaTotalVidrio.toFixed(3)} m² × ${Number(mosquitoPrice || 0).toFixed(2)} = ${costoMosquitera.toFixed(2)}</div>
                    )}
                    <div>• Mano obra: {pesoAluminio.toFixed(2)} kg × ${labourPrice.toFixed(2)} = ${costoManoObra.toFixed(2)}</div>
                    <div style={{ borderTop: '1px solid #ddd', marginTop: '4px', paddingTop: '4px', fontWeight: 'bold' }}>
                        Subtotal unidad: ${subtotal.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>
                        Cantidad: {quantity} → Total: ${(subtotal * quantity).toFixed(2)}
                    </div>
                </div>
            </>
        );
    };

    // --- Total de aberturas - MODIFICADO PARA MANO DE OBRA POR KILO ---
    const getTotalOpenings = () => {
        let total = 0;
        const configsArr = safeArray(openingConfigurations);
        selectedOpenings.forEach(opening => {
            const widthMM = Number(opening.width || 0) * 10;
            const heightMM = Number(opening.height || 0) * 10;
            const config = configsArr.find(cfg =>
                widthMM >= cfg.min_width_mm &&
                widthMM <= cfg.max_width_mm &&
                heightMM >= cfg.min_height_mm &&
                heightMM <= cfg.max_height_mm &&
                Number(opening.typeId) === Number(cfg.opening_type_id)
            );
            if (!config) return;
            const numPanelsWidth = opening.numPanelsWidth || config.num_panels_width;
            const numPanelsHeight = opening.numPanelsHeight || config.num_panels_height;
            const totalPanels = numPanelsWidth * numPanelsHeight;
            const anchoPanelMM = (opening.panelWidth !== undefined && opening.panelWidth !== '')
                ? Number(opening.panelWidth) * 10
                : widthMM / numPanelsWidth;
            const altoPanelMM = (opening.panelHeight !== undefined && opening.panelHeight !== '')
                ? Number(opening.panelHeight) * 10
                : heightMM / numPanelsHeight;
            const perimetroPanel = 2 * (anchoPanelMM + altoPanelMM) / 1000; // metros
            const totalAluminio = perimetroPanel * totalPanels; // metros (para una abertura)
            const openingType = openingTypes.find(t => Number(t.id) === Number(opening.typeId));
            const pesoAluminio = openingType && openingType.weight ? totalAluminio * Number(openingType.weight) : 0;
            const costoAluminio = pesoAluminio * alumPrice;
            const areaPanel = (anchoPanelMM / 1000) * (altoPanelMM / 1000);
            const areaTotalVidrio = areaPanel * totalPanels;
            const glassType = glassTypes.find(g => Number(g.id) === Number(opening.glassTypeId));
            const costoVidrio = glassType ? areaTotalVidrio * Number(glassType.price) : 0;
            // Incluir mosquitera si está marcada
            const mosquitoSelected = !!opening.mosquito;
            const costoMosquitera = mosquitoSelected ? areaTotalVidrio * Number(mosquitoPrice || 0) : 0;

            const treatment = treatments.find(t => Number(t.id) === Number(opening.treatmentId));
            const tratamientoPorc = treatment && treatment.pricePercentage ? Number(treatment.pricePercentage) : 0;
            const costoTratamiento = costoAluminio * (tratamientoPorc / 100);

            // MANO DE OBRA POR KILO - MODIFICADO
            const costoManoObra = pesoAluminio * Number(labourPrice || 0);

            const subtotal = costoAluminio + costoTratamiento + costoVidrio + costoManoObra + costoMosquitera;
            // multiplicar por la cantidad de aberturas de este tipo
            total += subtotal * Number(opening.quantity || 1);
        });
        return total;
    };

    // --- Total de complementos ---
    const getTotalComplementsValue = () => {
        let total = 0;
        selectedComplements.forEach(complement => {
            if (complement.totalPrice !== undefined && complement.totalPrice !== null) {
                total += Number(complement.totalPrice);
                return;
            }
            let arr = [];
            if (complement.type === 'door') arr = complementDoors;
            else if (complement.type === 'partition') arr = complementPartitions;
            else if (complement.type === 'railing') arr = complementRailings;
            const found = arr.find(item => String(item.id) === String(complement.complementId));
            const price = found ? Number(found.price) : 0;
            total += price * Number(complement.quantity);
        });
        return total;
    };

    // --- NUEVO: Cálculo de total general con costos adicionales ---
    const getGeneralTotal = () => {
        const totalOpenings = getTotalOpenings();
        const totalComplements = getTotalComplementsValue();
        const subtotalGeneral = totalOpenings + totalComplements;

        const costoFabricacion = subtotalGeneral * 0.10; // 10%
        const costoAdministrativo = subtotalGeneral * 0.05; // 5%

        const totalGeneral = subtotalGeneral + costoFabricacion + costoAdministrativo;

        return {
            totalOpenings,
            totalComplements,
            subtotalGeneral,
            costoFabricacion,
            costoAdministrativo,
            totalGeneral
        };
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

// Verifica si el paso ya fue enviado al resumen
const isStepInSummary = (stepIndex) => {
    switch (stepIndex) {
        case 0: // Datos Cliente
            return clients && clients.length > 0;
        
        case 1: // Datos Agentes
            // Considera agentes agregados o un agente en formulario nuevo como "en resumen"
            return (agents && agents.length > 0) || (newAgent && (newAgent.name || newAgent.mail));
        
        case 2: // Espacio de trabajo
            return workPlaces && workPlaces.length > 0;
        
        case 3: // Carga de Aberturas
            return selectedOpenings && selectedOpenings.length > 0;
        
        case 4: // Carga de Complementos
            return selectedComplements && selectedComplements.length > 0;
        
        case 5: // Comentarios
            return comment && comment.trim() !== '';
        
        default:
            return false;
    }
};

// Para pasos opcionales - verifica si hay datos cargados (pero no necesariamente en resumen)
const hasAgentData = () => {
    return (agents && agents.length > 0) || (newAgent && (newAgent.name || newAgent.mail));
};

const hasComplementosData = () => {
    return selectedComplements && selectedComplements.length > 0;
};

const hasComentariosData = () => {
    return comment && comment.trim() !== '';
};

// Comprueba si hay errores de validación para un paso: mostramos errores sólo si corresponden al paso activo
const hasValidationErrors = (stepIndex) => {
    return stepIndex === currentIndex && stepErrors && Object.keys(stepErrors).length > 0;
};

// Verifica si hay datos cargados para un paso (no necesariamente agregados al resumen)
const hasStepData = (stepIndex) => {
    switch (stepIndex) {
        case 0:
            return !!(newCustomer && (newCustomer.name || newCustomer.lastname || newCustomer.dni));
        case 1:
            return hasAgentData();
        case 2:
            return !!(workPlace && (workPlace.name || workPlace.address || workPlace.workTypeId));
        case 3:
            return selectedOpenings && selectedOpenings.length > 0;
        case 4:
            return hasComplementosData();
        case 5:
            return hasComentariosData();
        default:
            return false;
    }
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
        if (!canNavigateToStep(index)) {
            toast.error("Debe agregar el cliente al resumen antes de continuar");
            return;
        }

        if (swiperRef.current && swiperRef.current.swiper) {
            swiperRef.current.swiper.slideTo(index);
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
        // validar estrictamente para el resumen
        const validation = validateAgent(newAgent, { forSummary: true });
        if (!validation.valid) {
            setStepErrors(validation.errors || {});
            toast.error("Corrija los datos del agente antes de agregarlo");
            return;
        }
        setStepErrors({});
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
                setAgentSearched(true); // Mostrar "Buscando agente..."

                try {
                    const token = localStorage.getItem('token');

                    // Esperar 5 segundos antes de hacer la búsqueda real
                    await new Promise(resolve => setTimeout(resolve, 5000));

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
                } finally {
                    setAgentSearched(false); // Ocultar "Buscando agente..." después de 5 segundos
                }
            })();
        } else {
            setAgentSearchResult(null);
            setAgentSearched(false);
        }
    }, [agentSearchDni]);

    // Función para obtener nombre de complemento por id y tipo
    const getComplementName = (complementId, type) => {
        let arr = [];
        if (type === 'door') arr = complementDoors;
        else if (type === 'partition') arr = complementPartitions;
        else if (type === 'railing') arr = complementRailings;
        const comp = arr.find(c => String(c.id ?? c.Id) === String(complementId));
        return comp ? comp.name : '';
    };

    // Función para calcular subtotal de complemento (usar totalPrice si existe)
    const getComplementSubtotal = (complement) => {
        // Si complement.totalPrice ya fue calculado al crear, úsalo
        if (complement.totalPrice !== undefined && complement.totalPrice !== null) {
            return `Subtotal: $${(Number(complement.totalPrice)).toFixed(2)}`;
        }
        let arr = [];
        if (complement.type === 'door') arr = complementDoors;
        else if (complement.type === 'partition') arr = complementPartitions;
        else if (complement.type === 'railing') arr = complementRailings;
        const found = arr.find(item => String(item.id) === String(complement.complementId));
        const price = found ? Number(found.price) : 0;
        return `Subtotal: $${(price * Number(complement.quantity)).toFixed(2)}`;
    };

    // Mostrar el log de la última abertura agregada (solo una vez)
    useEffect(() => {
        if (lastOpeningLog && lastOpeningLog.length > 0) {
            // Mostrar en consola solo una vez
            // (ya se muestra en getOpeningSubtotal, pero si quieres mostrarlo en UI, puedes hacerlo aquí)
        }
    }, [lastOpeningLog]);

    // Nueva función para agregar cliente al resumen
    const handleAddClientToSummary = () => {
        // validar estrictamente para el resumen
        const validation = validateCustomer(newCustomer, { forSummary: true });
        if (!validation.valid) {
            setStepErrors(validation.errors || {});
            toast.error("Corrija los datos del cliente antes de agregarlo al resumen");
            return;
        }
        // limpiar errores previos y agregar
        setStepErrors({});
        if (!clients.some(c => c.dni === newCustomer.dni)) {
            setClients(prev => [...prev, { ...newCustomer }]);
            setIsCustomerAdded(true);
        }
    };

    useEffect(() => {
        // Si se modifica algún campo del cliente, resetear el estado de "agregado"
        if (isCustomerAdded) {
            const hasChanges =
                newCustomer.name !== clients[0]?.name ||
                newCustomer.lastname !== clients[0]?.lastname ||
                newCustomer.dni !== clients[0]?.dni;

            if (hasChanges) {
                setIsCustomerAdded(false);
            }
        }
    }, [newCustomer, clients, isCustomerAdded]);

    // Nueva función para agregar espacio de trabajo al resumen
    const handleAddWorkPlaceToSummary = () => {
        const validation = validateWorkPlace(workPlace, { forSummary: true });
        if (!validation.valid) {
            setStepErrors(validation.errors || {});
            toast.error("Corrija los datos del espacio de trabajo antes de agregarlo");
            return;
        }
        setStepErrors({});
        if (!workPlaces.some(wp => wp.name === workPlace.name && wp.address === workPlace.address)) {
            setWorkPlaces(prev => [...prev, { ...workPlace }]);
        }
    };

    // Calcular total general
    const generalTotal = getGeneralTotal();

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />

            <div className="materials-header">
                <h2 className="materials-title">Nueva Cotización</h2>
                <p className="materials-subtitle">Complete los datos en cada sección y valide los mismos en el resumen antes de crear la cotización.</p>
            </div>

            <ToastContainer autoClose={4000} theme="dark" transition={Slide} position="bottom-right" />

            <div className="quotation-layout">
    <aside className="quotation-indice">
        <h3>Índice</h3>
        <p 
            className={`indice-item ${
                hasValidationErrors(0) ? 'error' : 
                isStepInSummary(0) ? 'in-summary' : 
                hasStepData(0) ? 'has-data' : ''
            }`}
            onClick={() => goToSlide(0)}
        >
            <b><u>Datos Cliente</u></b>
            {hasValidationErrors(0) ? ' ❌' : 
             isStepInSummary(0) ? ' ✓' : 
             hasStepData(0) ? ' ○' : ''}
        </p>
        <p 
            className={`indice-item ${
                hasValidationErrors(1) ? 'error' : 
                isStepInSummary(1) ? 'in-summary' : 
                hasStepData(1) ? 'has-data' : ''
            } ${!canNavigateToStep(1) ? 'disabled' : ''}`}
            onClick={() => canNavigateToStep(1) && goToSlide(1)}
            title={!canNavigateToStep(1) ? "Agregue el cliente primero" : ""}
        >
            <b><u>Datos Agentes</u></b>
            {hasValidationErrors(1) ? ' ❌' : 
             isStepInSummary(1) ? ' ✓' : 
             hasStepData(1) ? ' ○' : ''}
        </p>
        <p 
            className={`indice-item ${
                hasValidationErrors(2) ? 'error' : 
                isStepInSummary(2) ? 'in-summary' : 
                hasStepData(2) ? 'has-data' : ''
            } ${!canNavigateToStep(2) ? 'disabled' : ''}`}
            onClick={() => canNavigateToStep(2) && goToSlide(2)}
            title={!canNavigateToStep(2) ? "Agregue el cliente primero" : ""}
        >
            <b><u>Espacio de trabajo</u></b>
            {hasValidationErrors(2) ? ' ❌' : 
             isStepInSummary(2) ? ' ✓' : 
             hasStepData(2) ? ' ○' : ''}
        </p>
        <p 
            className={`indice-item ${
                hasValidationErrors(3) ? 'error' : 
                isStepInSummary(3) ? 'in-summary' : 
                hasStepData(3) ? 'has-data' : ''
            } ${!canNavigateToStep(3) ? 'disabled' : ''}`}
            onClick={() => canNavigateToStep(3) && goToSlide(3)}
            title={!canNavigateToStep(3) ? "Agregue el cliente primero" : ""}
        >
            <b><u>Carga de Aberturas</u></b>
            {hasValidationErrors(3) ? ' ❌' : 
             isStepInSummary(3) ? ' ✓' : 
             hasStepData(3) ? ' ○' : ''}
        </p>
        <p 
            className={`indice-item ${
                hasValidationErrors(4) ? 'error' : 
                isStepInSummary(4) ? 'in-summary' : 
                hasStepData(4) ? 'has-data' : ''
            } ${!canNavigateToStep(4) ? 'disabled' : ''}`}
            onClick={() => canNavigateToStep(4) && goToSlide(4)}
            title={!canNavigateToStep(4) ? "Agregue el cliente primero" : ""}
        >
            <b><u>Carga de Complementos</u></b>
            {hasValidationErrors(4) ? ' ❌' : 
             isStepInSummary(4) ? ' ✓' : 
             hasStepData(4) ? ' ○' : ''}
        </p>
        <p 
            className={`indice-item ${
                hasValidationErrors(5) ? 'error' : 
                isStepInSummary(5) ? 'in-summary' : 
                hasStepData(5) ? 'has-data' : ''
            } ${!canNavigateToStep(5) ? 'disabled' : ''}`}
            onClick={() => canNavigateToStep(5) && goToSlide(5)}
            title={!canNavigateToStep(5) ? "Agregue el cliente primero" : ""}
        >
            <b><u>Comentarios</u></b>
            {hasValidationErrors(5) ? ' ❌' : 
             isStepInSummary(5) ? ' ✓' : 
             hasStepData(5) ? ' ○' : ''}
        </p>
    </aside>

                    <div className="info-section">
                        <h4>Espacios de trabajo:</h4>
                        {workPlaces.length === 0 && <div className="info-empty">No hay espacios agregados</div>}
                        {workPlaces.map((wp, idx) => (
                            <div key={idx} className="info-item">
                                <span><b>{wp.location}</b> - {wp.address}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Formulario principal (sin cambios) */}
                <main className="quotation-main">
                    <form className="quotation-form" onKeyDown={handleFormKeyDown}>
                        <div className="embla-buttons-container">
                            <button type="button" className="embla__button embla__button--prev" onClick={handlePrev} disabled={currentIndex === 0}>
                                Atrás
                            </button>
                            <span className="page-indicator">Página {currentIndex + 1} de 6</span>
                            <button type="button" className="embla__button embla__button--next" onClick={handleNext} disabled={currentIndex === 5}>
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
                                    errors={currentIndex === 0 ? stepErrors : {}}
                                    isCustomerFound={isCustomerFound}
                                    setIsCustomerFound={setIsCustomerFound}
                                    onAddClientToSummary={handleAddClientToSummary}
                                    isCustomerAdded={isCustomerAdded} // <-- Nueva prop
                                    setIsCustomerAdded={setIsCustomerAdded} // <-- Nueva prop
                                />{currentIndex === 0 && stepErrors.general && (
                                    <div className="error-message" style={{
                                        marginTop: '10px',
                                        padding: '10px',
                                        background: '#ffe6e6',
                                        border: '1px solid #ffcccc',
                                        borderRadius: '4px'
                                    }}>
                                        {stepErrors.general}
                                    </div>
                                )}
                            </SwiperSlide>
                            <SwiperSlide>
    {/* AGENTES */}
    <div className="agent-container">
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
                className="agent-details"
            />
            {agentSearchError && <span className="error-message">{agentSearchError}</span>}
        </div>
        
        {/* BUSCANDO AGENTE - Siempre muestra por 5 segundos cuando hay 8 dígitos */}
        {agentSearchDni.length === 8 && agentSearched && (
            <div className="embla__button">
                <p>Buscando agente...</p>
            </div>
        )}
        
        {/* RESULTADO - Solo se muestra después de los 5 segundos */}
        {agentSearchDni.length === 8 && !agentSearched && agentSearchResult && (
            <div className="agent-found">
                <p>Agente encontrado: <b>{agentSearchResult.name} {agentSearchResult.lastname}</b> - {agentSearchResult.dni}</p>
                <button type="button" className="botton-carusel" onClick={handleAddExistingAgent}>
                    Agregar este agente
                </button>
            </div>
        )}
        
        {/* FORMULARIO NUEVO AGENTE - Solo después de los 5 segundos si no hay resultado */}
        {agentSearchDni.length === 8 && !agentSearched && !agentSearchResult && (
            <div className="form-group">
                <h5>No se encontró el agente. Complete los datos para crear uno nuevo:</h5>
                <label style={{ marginTop: 25 }}>Nombre:</label>
                <input
                    type="text"
                    value={newAgent.name}
                    onChange={e => {
                        setNewAgent(prev => ({ ...prev, name: e.target.value, dni: agentSearchDni }));
                        // limpiar errores específicos de agente solo al modificar ese campo
                        setStepErrors(prev => {
                            if (!prev) return {};
                            const copy = { ...prev };
                            delete copy.name;
                            return copy;
                        });
                    }}
                />
                {stepErrors.name && <span className="error-message">{stepErrors.name}</span>}
                <label>Apellido:</label>
                <input
                    type="text"
                    value={newAgent.lastname}
                    onChange={e => {
                        setNewAgent(prev => ({ ...prev, lastname: e.target.value, dni: agentSearchDni }));
                        setStepErrors(prev => {
                            if (!prev) return {};
                            const copy = { ...prev };
                            delete copy.lastname;
                            return copy;
                        });
                    }}
                />
                {stepErrors.lastname && <span className="error-message">{stepErrors.lastname}</span>}
                <label>Teléfono:</label>
                <input
                    type="text"
                    value={newAgent.tel}
                    onChange={e => {
                        setNewAgent(prev => ({ ...prev, tel: e.target.value, dni: agentSearchDni }));
                        setStepErrors(prev => {
                            if (!prev) return {};
                            const copy = { ...prev };
                            delete copy.tel;
                            return copy;
                        });
                    }}
                />
                {stepErrors.tel && <span className="error-message">{stepErrors.tel}</span>}
                <label>Email:</label>
                <input
                    type="email"
                    value={newAgent.mail}
                    onChange={e => {
                        setNewAgent(prev => ({ ...prev, mail: e.target.value, dni: agentSearchDni }));
                        setStepErrors(prev => {
                            if (!prev) return {};
                            const copy = { ...prev };
                            delete copy.mail;
                            return copy;
                        });
                    }}
                />
                {stepErrors.mail && <span className="error-message">{stepErrors.mail}</span>}
                <button type="button" className="botton-carusel" onClick={handleAddNewAgent}>
                    Agregar nuevo agente
                </button>
            </div>
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
                                {/* Botón para agregar espacio de trabajo al resumen */}
                                <button
                                    type="button"
                                    className="botton-carusel"
                                    onClick={handleAddWorkPlaceToSummary}
                                >
                                    Agregar espacio de trabajo
                                </button>
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
                                    openingConfigurations={openingConfigurations}
                                    // Nueva prop para loguear solo al agregar
                                    onLogOpening={opening => getOpeningSubtotal(opening, true)}
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
                                />
                            </SwiperSlide>
                            <SwiperSlide>
                                <Extras
                                    comment={comment}
                                    setComment={setComment}
                                    setDollarReference={setDollarReference}
                                    setLabourReference={setLabourReference}
                                />
                                <div className="submit-container">
                                    <button
                                        type="button"
                                        className="submit-button"
                                        disabled={submitting}
                                        onClick={handleSubmitQuotation}
                                    >
                                        {submitting ? "Enviando..." : "Cotizar"}
                                    </button>
                                    {submitError && (
                                        <div className="submit-error">{submitError}</div>
                                    )}
                                    {Object.keys(validationErrors).length > 0 && (
                                        <div className="validation-errors">
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

                {/* Resumen de cálculos (más compacto) */}
                <aside className="quotation-summary">
                    <h3>Resumen</h3>

                    {/* Aberturas */}
                    <div>
                        <h4 className='summary-section-title'>Aberturas agregadas:</h4>
                        {selectedOpenings.length === 0 && (
                            <div className="summary-empty">No hay aberturas agregadas.</div>
                        )}
                        {selectedOpenings.map((opening, idx) => (
                            <div key={idx} className="summary-item summary-opening-card">
                                <button
                                    className="summary-remove-btn"
                                    title="Quitar abertura"
                                    onClick={() => handleRemoveOpening(idx)}
                                    type="button"
                                >×</button>
                                <div className="summary-title">{getOpeningTypeName(opening.typeId)}</div>
                                <div className="opening-measures">
                                    <div className="measure-row">Abertura: <span className="measure-value">{Number(opening.width || 0)} x {Number(opening.height || 0)} cm</span></div>
                                </div>

                                {/* Enhanced SVG preview with distinct panel rects and numbering */}
                                <div className="opening-preview-container opening-preview-box">
                                    {(() => {
                                        // Treat opening.width/height as cm; convert to mm for config match
                                        const wCm = Number(opening.width || 100);
                                        const hCm = Number(opening.height || 60);
                                        const widthMM = wCm * 10;
                                        const heightMM = hCm * 10;
                                        const cfg = safeArray(openingConfigurations).find(c =>
                                            Number(c.opening_type_id) === Number(opening.typeId) &&

                                            widthMM >= c.min_width_mm &&
                                            widthMM <= c.max_width_mm &&
                                            heightMM >= c.min_height_mm &&
                                            heightMM <= c.max_height_mm
                                        );
                                        const numW = opening.numPanelsWidth || (cfg ? cfg.num_panels_width : 1);
                                        const numH = opening.numPanelsHeight || (cfg ? cfg.num_panels_height : 1);
                                        const vw = Math.min(260, wCm * 2);
                                        const vh = Math.min(160, hCm * 2);
                                        const panelW = wCm / numW;
                                        const panelH = hCm / numH;
                                        const cells = [];
                                        for (let r = 0; r < numH; r++) {
                                            for (let c = 0; c < numW; c++) {
                                                cells.push({ x: c * panelW, y: r * panelH, w: panelW, h: panelH, idx: r * numW + c + 1 });
                                            }
                                        }
                                        return (
                                            <div className="opening-preview-row">
                                                <div className="opening-preview-svg-wrapper opening-preview-svg-dark">
                                                    <svg width={vw} height={vh} viewBox={`0 0 ${wCm} ${hCm}`} preserveAspectRatio="xMidYMid meet" className="opening-preview-svg">
                                                        <rect x="0" y="0" width={wCm} height={hCm} fill="#0e0b0b" stroke={opening.treatmentId ? '#26b7cd' : '#070505'} strokeWidth={0.4} rx={3} />
                                                        {cells.map(cell => (
                                                            <g key={`cell-${cell.idx}`}>
                                                                <rect x={cell.x} y={cell.y} width={cell.w} height={cell.h} fill="#f8fcff" stroke="#9aa9b0" strokeWidth={0.18} />
                                                                <text x={cell.x + cell.w / 2} y={cell.y + cell.h / 2} fontSize={(Math.min(cell.w, cell.h) / 3).toFixed(2)} textAnchor="middle" dominantBaseline="middle" fill="#40666f" className="opening-panel-number">{cell.idx}</text>
                                                            </g>
                                                        ))}
                                                        {/* glass overlay */}
                                                        {opening.glassTypeId && <rect x="0" y="0" width={wCm} height={hCm} fill="#bfe9ff" opacity={0.10} />}
                                                    </svg>
                                                </div>
                                                <div className="opening-preview-meta">
                                                    {opening.treatmentName && <div className="badge badge-treatment">Tratamiento: {opening.treatmentName}</div>}
                                                    {opening.glassTypeName && <div className="badge badge-glass">Vidrio: {opening.glassTypeName}</div>}
                                                    <div className="opening-preview-size">Panel: <b>{(panelW).toFixed(1)} x {(panelH).toFixed(1)} cm</b></div>
                                                    <div className="opening-preview-count">Paneles: <b>{numW} × {numH}</b></div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div className="summary-actions-row">
                                    <div className="summary-detail summary-qty-row">
                                        <button
                                            className="summary-qty-btn" type="button"
                                            onClick={() => handleChangeOpeningQty(idx, -1)}
                                        >−</button>
                                        <span className="summary-qty">{opening.quantity}</span>
                                        <button
                                            className="summary-qty-btn" type="button"
                                            onClick={() => handleChangeOpeningQty(idx, 1)}
                                        >+</button>
                                    </div>
                                    <div className="opening-subtotal">
                                        {getOpeningSubtotal(opening)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="summary-total">
                            <strong>Total aberturas: ${generalTotal.totalOpenings.toFixed(2)}</strong>
                        </div>
                    </div>

                    {/* Complementos */}
                    <div className="complements-summary">
                        <h4 className='summary-section-title'>Complementos agregados:</h4>
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
                                    {complement.name ? complement.name : getComplementName(complement.complementId || complement.id, complement.type)}
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
                            <strong>Total complementos: ${generalTotal.totalComplements.toFixed(2)}</strong>
                        </div>
                    </div>

                    {/* Total General */}
                    <div className="general-total-container">
                        <h4 className='summary-section-title'>Total General</h4>
                        <div className="total-row">
                            <span>Subtotal aberturas:</span>
                            <span>${generalTotal.totalOpenings.toFixed(2)}</span>
                        </div>
                        <div className="total-row">
                            <span>Subtotal complementos:</span>
                            <span>${generalTotal.totalComplements.toFixed(2)}</span>
                        </div>
                        <div className="total-row subtotal-general">
                            <span><strong>Subtotal general:</strong></span>
                            <span><strong>${generalTotal.subtotalGeneral.toFixed(2)}</strong></span>
                        </div>
                        <div className="total-row cost-detail">
                            <span>Costo fabricación (10%):</span>
                            <span>${generalTotal.costoFabricacion.toFixed(2)}</span>
                        </div>
                        <div className="total-row cost-detail">
                            <span>Costo administrativo (5%):</span>
                            <span>${generalTotal.costoAdministrativo.toFixed(2)}</span>
                        </div>
                        <div className="total-row final-total">
                            <span>TOTAL GENERAL:</span>
                            <span>${generalTotal.totalGeneral.toFixed(2)}</span>
                        </div>
                    </div>
                </aside>
            </div>

            <Footer />
        </div>
    );
};

export default Quotation;