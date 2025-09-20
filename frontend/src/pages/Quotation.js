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
import ReactLoading from "react-loading";
import 'swiper/css';
import { QuotationContext } from "../context/QuotationContext";
import { validateQuotation } from "../validation/quotationValidation";
import { validateCustomer } from "../validation/customerValidation";
import { validateWorkPlace } from "../validation/workPlaceValidation";
import { validateOpenings } from "../validation/openingValidation";
import { safeArray } from '../utils/safeArray';

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
    const [confirmedComplements, setConfirmedComplements] = useState([]); // <-- Nuevo estado para complementos confirmados
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

    // Nuevo estado para mostrar el log de cálculo de abertura solo una vez
    const [lastOpeningLog, setLastOpeningLog] = useState(null);

    // Estado para loading de agente
    const [agentLoading, setAgentLoading] = useState(false);

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
            console.log("Agente seleccionado para enviar a Mongo (customerPayloadMongo.agent):", customerPayloadMongo.agent);

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
            const productsPayload = selectedOpenings.map(opening => {
                // opening.width/height are in cm
                const widthCm = Number(opening.width || 0);
                const heightCm = Number(opening.height || 0);
                const widthMM = widthCm * 10;
                const heightMM = heightCm * 10;

                // buscar configuración con mm
                const cfg = safeArray(openingConfigurations).find(cfg =>
                    widthMM >= cfg.min_width_mm &&
                    widthMM <= cfg.max_width_mm &&
                    heightMM >= cfg.min_height_mm &&
                    heightMM <= cfg.max_height_mm &&
                    Number(opening.typeId) === Number(cfg.opening_type_id)
                );
                const numW = opening.numPanelsWidth || (cfg ? cfg.num_panels_width : 1);
                const numH = opening.numPanelsHeight || (cfg ? cfg.num_panels_height : 1);

                // panel sizes en cm
                const panelWidthCm = opening.panelWidth ? Number(opening.panelWidth) : (widthCm / numW);
                const panelHeightCm = opening.panelHeight ? Number(opening.panelHeight) : (heightCm / numH);

                const panelWidthMM = panelWidthCm * 10;
                const panelHeightMM = panelHeightCm * 10;

                const totalPanels = numW * numH;

                // cálculo aluminio (siguiendo la lógica del frontend)
                const perimetroPanelMM = 2 * (panelWidthMM + panelHeightMM);
                const totalAluminioMM = perimetroPanelMM * totalPanels * (opening.quantity || 1);
                const totalAluminioM = totalAluminioMM / 1000;
                const openingTypeObj = safeArray(openingTypes).find(t => Number(t.id) === Number(opening.typeId));
                const pesoAluminio = openingTypeObj && openingTypeObj.weight ? totalAluminioM * Number(openingTypeObj.weight) : 0;
                const costoAluminio = pesoAluminio * Number(alumPrice || 0);

                // vidrio
                const areaPanelM2 = (panelWidthMM / 1000) * (panelHeightMM / 1000);
                const areaTotalVidrio = areaPanelM2 * totalPanels * (opening.quantity || 1);
                const glassObj = safeArray(glassTypes).find(g => Number(g.id) === Number(opening.glassTypeId));
                const costoVidrio = glassObj ? areaTotalVidrio * Number(glassObj.price || 0) : 0;

                // tratamiento
                const treatmentObj = safeArray(treatments).find(t => Number(t.id) === Number(opening.treatmentId));
                const tratamientoPorc = treatmentObj && treatmentObj.pricePercentage ? Number(treatmentObj.pricePercentage) : 0;
                const costoTratamiento = costoAluminio * (tratamientoPorc / 100);

                const costoManoObra = Number(labourPrice || 0);

                // Build product payload, IMPORTANT: width & height sent in CENTIMETERS
                return {
                    OpeningType: openingTypes.find(type => Number(type.id) === Number(opening.typeId))
                        ? { name: openingTypes.find(type => Number(type.id) === Number(opening.typeId)).name }
                        : { name: "" },
                    Quantity: Number(opening.quantity || 1),
                    AlumTreatment: treatmentObj ? { name: treatmentObj.name } : { name: "" },
                    GlassType: glassObj ? { name: glassObj.name, Price: Number(glassObj.price || 0) } : { name: "", Price: 0 },
                    width: Number(widthCm),  // <- ENVIAR EN CENTÍMETROS
                    height: Number(heightCm), // <- ENVIAR EN CENTÍMETROS
                    WidthPanelQuantity: Number(numW),
                    HeightPanelQuantity: Number(numH),
                    PanelWidth: Number(panelWidthCm.toFixed(2)),  // cm
                    PanelHeight: Number(panelHeightCm.toFixed(2)), // cm
                    Accesory: (opening.accesories || opening.custom?.accesories || []).map(a => ({
                        Name: a.name || a.Name || '',
                        Quantity: Number(a.quantity || a.Quantity || 0),
                        Price: Number(a.price || a.Price || 0)
                    }))
                };
            });

            // --- LOG: mostrar plantilla esperada y payload real para depuración ---
            const expectedTemplate = {
                Budget: {
                    budgetId: "string",
                    user: { name: "string", lastName: "string", mail: "string" },
                    customer: { name: "string", lastname: "string", tel: "string", mail: "string", address: "string", dni: "string" },
                    agent: { name: "string", lastname: "string", dni: "string", tel: "string", mail: "string" },
                    workPlace: { name: "string", location: "string", address: "string", workType: { type: "string" } },
                    Products: [{ OpeningType: { name: "string" }, AlumTreatment: { name: "string" }, GlassType: { name: "string", Price: 0 }, width: 0, height: 0, WidthPanelQuantity: 0, HeightPanelQuantity: 0, PanelWidth: 0, PanelHeight: 0, Quantity: 0, Accesory: [], price: 0 }],
                    complement: [{ ComplementDoor: [], ComplementRailing: [], ComplementPartition: [], price: 0 }],
                    Comment: "string",
                    DollarReference: 0,
                    LabourReference: 0
                }
            };
            console.log("Plantilla esperada por Mongo (ejemplo):", JSON.stringify(expectedTemplate, null, 2));
            console.log("Agente que se enviará a Mongo (customer.agent):", customerPayloadMongo.agent);

            // --- ARREGLADO: Definir selectedWorkType antes de usarlo ---
            const selectedWorkType = workTypes.find(wt => String(wt.id) === String(workPlace.workTypeId));

            // --- NUEVO: Armar el objeto final para Mongo con mayúsculas y estructura correcta ---
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

    // --- Cálculo de subtotal de abertura ---
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

        // Costo aluminio
        const costoAluminio = pesoAluminio * alumPrice;

        // Paso 3 — Calcular vidrio
        // Área de cada panel (m²): anchoPanelMM/1000 * altoPanelMM/1000
        const areaPanelM2 = (anchoPanelMM / 1000) * (altoPanelMM / 1000);
        // Área total vidrio (m²) por UNA abertura
        const areaTotalVidrio = areaPanelM2 * totalPanels;
        // Costo vidrio
        const glassType = safeArray(glassTypes).find(g => Number(g.id) === Number(opening.glassTypeId));
        const costoVidrio = glassType ? areaTotalVidrio * Number(glassType.price) : 0;

        // Paso 4 — Aplicar tratamiento aluminio
        const treatment = safeArray(treatments).find(t => Number(t.id) === Number(opening.treatmentId));
        const tratamientoPorc = treatment && treatment.pricePercentage ? Number(treatment.pricePercentage) : 0;
        const costoTratamiento = costoAluminio * (tratamientoPorc / 100);

        // Paso 5 — Sumar mano de obra
        const costoManoObra = labourPrice;

        // Paso 6 — Subtotal (sin IVA) por UNA abertura
        const subtotal = costoAluminio + costoTratamiento + costoVidrio + costoManoObra;

        // LOG DETALLADO DEL PROCESO SOLO SI logOnce === true
        if (logOnce) {
            const logMsg = [
                "==== CÁLCULO DE ABERTURA (FRONTEND) ====",
                "Abertura:", opening,
                "Config encontrada:", config,
                "Paso 1 — Paneles: numPanelsWidth:", numPanelsWidth, "numPanelsHeight:", numPanelsHeight, "totalPanels:", totalPanels,
                "Paso 2 — Aluminio: anchoPanel(mm):", anchoPanelMM, "altoPanel(mm):", altoPanelMM,
                "Perímetro panel (mm):", perimetroPanelMM,
                "Total aluminio (mm):", totalAluminioMM, "Total aluminio (m):", totalAluminioM,
                "Peso aluminio (kg):", pesoAluminio, "weight:", openingType?.weight,
                "Precio aluminio unitario:", alumPrice,
                "Costo aluminio:", costoAluminio,
                "Paso 3 — Vidrio: área panel (m2):", areaPanelM2, "Área total vidrio (m2):", areaTotalVidrio,
                "Precio vidrio unitario:", glassType?.price, "Costo vidrio:", costoVidrio,
                "Paso 4 — Tratamiento: %:", tratamientoPorc, "Costo tratamiento:", costoTratamiento,
                "Paso 5 — Mano de obra:", costoManoObra,
                "Paso 6 — Subtotal:", subtotal
            ];
            // calcular IVA y total front-end (para comparar con backend)
            const iva = taxRate || 0;
            const ivaAmount = subtotal * (iva / 100);
            const totalWithIva = subtotal + ivaAmount;
            logMsg.push(`IVA (frontend detectado): ${iva}% -> Monto IVA: ${ivaAmount}`);
            logMsg.push(`Total (subtotal + IVA) (frontend): ${totalWithIva}`);
            setLastOpeningLog(logMsg);
            logMsg.forEach(line => console.log(line));
        }

        return (
            <>
                <div>
                    Aluminio: ${costoAluminio.toFixed(2)}, Tratamiento: ${costoTratamiento.toFixed(2)}, Vidrio: ${costoVidrio.toFixed(2)}, Mano de obra: ${costoManoObra.toFixed(2)}, Subtotal: ${subtotal.toFixed(2)}
                </div>
            </>
        );
    };



    // --- Total de aberturas ---
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
            const treatment = treatments.find(t => Number(t.id) === Number(opening.treatmentId));
            const tratamientoPorc = treatment && treatment.pricePercentage ? Number(treatment.pricePercentage) : 0;
            const costoTratamiento = costoAluminio * (tratamientoPorc / 100);
            const costoManoObra = labourPrice;
            const subtotal = costoAluminio + costoTratamiento + costoVidrio + costoManoObra;
            // multiplicar por la cantidad de aberturas de este tipo
            total += subtotal * Number(opening.quantity || 1);
        });
        return `Total aberturas: $${total.toFixed(2)}`;
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
                setAgentLoading(true); // <-- loading ON
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
                } finally {
                    setAgentLoading(false); // <-- loading OFF
                }
            })();
        } else {
            setAgentSearchResult(null);
            setAgentSearched(false);
            setAgentLoading(false);
        }
    }, [agentSearchDni]);

    // Función para obtener nombre de complemento por id y tipo
    const getComplementName = (complementId, type) => {
        let arr = [];
        if (type === 'door') arr = complementDoors;
        else if (type === 'partition') arr = complementPartitions;
        else if (type === 'railing') arr = complementRailings;
        const comp = arr.find(c => String(c.id) === String(complementId));
        return comp ? comp.name : '';
    };

    // Función para calcular subtotal de complemento (puedes ajustar la lógica)
    const getComplementSubtotal = (complement) => {
        let arr = [];
        if (complement.type === 'door') arr = complementDoors;
        else if (complement.type === 'partition') arr = complementPartitions;
        else if (complement.type === 'railing') arr = complementRailings;
        const found = arr.find(item => String(item.id) === String(complement.complementId));
        const price = found ? Number(found.price) : 0;
        return `Subtotal: $${(price * Number(complement.quantity)).toFixed(2)}`;
    };

    // Total de complementos
    const getTotalComplements = () => {
        let total = 0;
        selectedComplements.forEach(complement => {
            let arr = [];
            if (complement.type === 'door') arr = complementDoors;
            else if (complement.type === 'partition') arr = complementPartitions;
            else if (complement.type === 'railing') arr = complementRailings;
            const found = arr.find(item => String(item.id) === String(complement.complementId));
            const price = found ? Number(found.price) : 0;
            total += price * Number(complement.quantity);
        });
        return `Total complementos: $${total.toFixed(2)}`;
    };

    // Mostrar el log de la última abertura agregada (solo una vez)
    useEffect(() => {
        if (lastOpeningLog && lastOpeningLog.length > 0) {
            // Mostrar en consola solo una vez
            // (ya se muestra en getOpeningSubtotal, pero si quieres mostrarlo en UI, puedes hacerlo aquí)
        }
    }, [lastOpeningLog]);

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
                                            disabled={agentLoading}
                                        />
                                        {agentSearchError && <span className="error-message">{agentSearchError}</span>}
                                    </div>
                                    {/* Resultado de búsqueda */}
                                    {agentLoading ? (
                                        <p>Buscando agente...</p>
                                    ) : (
                                        agentSearched && agentSearchDni.length === 8 && (
                                            agentSearchResult ? (
                                                <div className="agent-found">
                                                    <p>Agente encontrado: <b>{agentSearchResult.name} {agentSearchResult.lastname}</b> - {agentSearchResult.dni}</p>
                                                    <button type="button" className="botton-carusel" onClick={handleAddExistingAgent}>Agregar este agente</button>
                                                </div>
                                            ) : (
                                                <div className="form-group">
                                                    <h4>Nuevo agente</h4>
                                                    <label>Nombre:</label>
                                                    <input
                                                        type="text"
                                                        value={newAgent.name}
                                                        onChange={e => setNewAgent(prev => ({ ...prev, name: e.target.value, dni: agentSearchDni }))}
                                                    />
                                                    <label>Apellido:</label>
                                                    <input
                                                        type="text"
                                                        value={newAgent.lastname}
                                                        onChange={e => setNewAgent(prev => ({ ...prev, lastname: e.target.value, dni: agentSearchDni }))}
                                                    />
                                                    <label>Teléfono:</label>
                                                    <input
                                                        type="text"
                                                        value={newAgent.tel}
                                                        onChange={e => setNewAgent(prev => ({ ...prev, tel: e.target.value, dni: agentSearchDni }))}
                                                    />
                                                    <label>Email:</label>
                                                    <input
                                                        type="email"
                                                        value={newAgent.mail}
                                                        onChange={e => setNewAgent(prev => ({ ...prev, mail: e.target.value, dni: agentSearchDni }))}
                                                    />
                                                    <button type="button" className="botton-carusel" onClick={handleAddNewAgent}>Agregar nuevo agente</button>
                                                </div>
                                            )
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
                                // hideSelectedList={true} // si no lo usas, puedes quitarlo
                                />
                                <button
                                    type="button"
                                    className="botton-carusel"
                                    style={{ marginTop: 16 }}
                                    onClick={() => setConfirmedComplements(selectedComplements)}
                                >
                                    Confirmar complementos
                                </button>
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
                                {submitting ? (
                                     <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                     <ReactLoading type="spin" color="#fff" height={20} width={20} alignItems="center" />
                                         Enviando...
                                    </div>
                                      ) : ( "Cotizar")}
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
                         <div className="agents-list">
                            <h4 className='h4'>Cliente seleccionados:</h4>

                            {newCustomer.name === "" ? <div className="summary-empty">No tiene Cliente.</div>: newCustomer.name} {newCustomer.lastname}  {newCustomer.dni} 
                        </div>
                        {/* Lista de agentes agregados */}

                        <div className="agents-list">
                            <h4 className='h4'>Agentes seleccionados:</h4>
                            {agents.length === 0 && <div className="summary-empty">No tiene agentes.</div>}
                            {agents.map((agent, idx) => (
                                    <span>
                                        {agent.name} {agent.lastname} - {agent.dni}

                                    </span>
                                </div>
                            ))}
                        </div>
                        <h4 className='h4'>Aberturas agregadas:</h4>
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

                                <div className="summary-actions-row" style={{ marginTop: 8 }}>
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
                                    <div style={{ marginLeft: 'auto', color: '#26b7cd', fontWeight: 600 }}>
                                        {getOpeningSubtotal(opening)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="summary-total">
                            {getTotalOpenings()}
                        </div>
                    </div>
                    <div style={{ marginTop: 24 }}>
                        <h4 className='h4'>Complementos agregados:</h4>
                        {confirmedComplements.length === 0 && (
                            <div className="summary-empty">No hay complementos agregados.</div>
                        )}
                        {confirmedComplements.map((complement, idx) => (
                            <div key={idx} className="summary-item">
                                <button
                                    className="summary-remove-btn"
                                    title="Quitar complemento"
                                    onClick={() => setConfirmedComplements(prev => prev.filter((_, i) => i !== idx))}
                                    type="button"
                                >×</button>
                                <div className="summary-title">
                                    {getComplementName(complement.complementId || complement.id, complement.type )}
                                </div>
                                <div className="summary-detail summary-qty-row">
                                    <button
                                        className="summary-qty-btn"
                                        type="button"
                                        onClick={() => setConfirmedComplements(prev => prev.map((comp, i) => i === idx ? { ...comp, quantity: Math.max(1, (comp.quantity || 1) - 1) } : comp))}
                                    >−</button>
                                    <span className="summary-qty">{complement.quantity}</span>
                                    <button className="summary-qty-btn" type="button" onClick={() => setConfirmedComplements(prev => prev.map((comp, i) => i === idx ? { ...comp, quantity: (comp.quantity || 1) + 1 } : comp))}
                                    >+</button>
                                </div>
                                <div className="summary-subtotal">
                                    {getComplementSubtotal(complement)}
                                </div>
                            </div>
                        ))}
                        <div className="summary-total">
                            {(() => {
                                let total = 0;
                                confirmedComplements.forEach(complement => {
                                    let arr = [];
                                    if (complement.type === 'door') arr = complementDoors;
                                    else if (complement.type === 'partition') arr = complementPartitions;
                                    else if (complement.type === 'railing') arr = complementRailings;
                                    const found = arr.find(item => String(item.id) === String(complement.complementId));
                                    const price = found ? Number(found.price) : 0;
                                    total += price * Number(complement.quantity);
                                });
                                return `Total complementos: $${total.toFixed(2)}`;
                            })()}
                        </div>
                    </div>
                </aside>
            </div>
            <Footer />
        </div>
    );
};

export default Quotation;