import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "../styles/quotation.css";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import Customer from "../components/quotationComponents/Customer";
import Agent from "../components/quotationComponents/Agent";
import WorkPlace from "../components/quotationComponents/WorkPlace";
import OpeningType from "../components/quotationComponents/Opening";
import Complements from "../components/quotationComponents/Complements";
import Extras from "../components/quotationComponents/Extras";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { QuotationContext } from "../context/QuotationContext";
import { validateQuotation } from "../validation/quotationValidation";
import { validateCustomer } from "../validation/customerValidation";
import { validateAgent } from "../validation/agentValidation";
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

const Quotation = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const swiperRef = useRef(null);

    const navigate = useNavigate();
    const { addQuotation } = React.useContext(QuotationContext);

    const [newCustomer, setNewCustomer] = useState({
        name: '', lastname: '', tel: '', mail: '', address: '', agentId: null, dni: ''
    });
    // const [isCustomerComplete, setIsCustomerComplete] = useState(false); // <-- ELIMINAR ESTA LÍNEA
    const [newAgent, setNewAgent] = useState({ name: '', lastname: '', tel: '', mail: '' });

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
                return newCustomer.agentId ? { valid: true, errors: {} } : validateAgent(newAgent);
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
        /*   const validation = validateStep(currentIndex); */
        // Elimina setStepHasError porque no existe ni es necesario
        // setStepHasError && setStepHasError(!validation.valid);
        // No hace falta nada aquí, la validación por paso ya se maneja en handleNext
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
                setWorkTypes(response.data);
            } catch (error) {
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
                setOpeningTypes(openingTypesRes.data);
                setTreatments(treatmentsRes.data);
                setGlassTypes(glassTypesRes.data);
            } catch (error) {
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
                setComplementDoors(doorsRes.data);
                setComplementPartitions(partitionsRes.data);
                setComplementRailings(railingsRes.data);
            } catch (error) {
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
                coatings = res.data;
            } catch {
                coatings = [];
            }

            // --- NUEVO: Define RAILING_TREATMENTS aquí ---
            const RAILING_TREATMENTS = [
                { id: 0, name: "Pintura Negra" },
                { id: 1, name: "Anodizado Mate" }
            ];

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
            const { name, lastname, tel, mail, address, dni, agentId } = newCustomer;

            // Solo incluir agent si el cliente es nuevo y los datos están completos
            let agent = undefined;
            const isNewCustomer = !agentId; // Si no tiene agentId, es nuevo
            if (
                isNewCustomer &&
                newAgent.name.trim() &&
                newAgent.lastname.trim() &&
                newAgent.tel.trim() &&
                newAgent.mail.trim()
            ) {
                agent = { ...newAgent };
            }

            // --- CAMBIO: incluir agentId si existe, y solo incluir agent si es nuevo ---
            const customerPayload = agent
                ? { name, lastname, tel, mail, address, dni, agent }
                : agentId
                    ? { name, lastname, tel, mail, address, dni, agentId }
                    : { name, lastname, tel, mail, address, dni };

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
                    workTypeId: Number(workPlace.workTypeId)
                },
                openings: selectedOpenings,
                complements: complementsForSql, // <-- usa el array mapeado aquí
                totalPrice: totalComplements,
                comment // <-- Usa el comentario real
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

            // --- CAMBIO: incluir datos del agente si existen ---
            if (
                agentData && agentData.name && agentData.lastname && agentData.tel && agentData.mail
            ) {
                customerPayloadMongo.agent = {
                    name: agentData.name,
                    lastname: agentData.lastname,
                    tel: agentData.tel,
                    mail: agentData.mail
                };
            } else if (
                newAgent &&
                newAgent.name &&
                newAgent.lastname &&
                newAgent.tel &&
                newAgent.mail
            ) {
                customerPayloadMongo.agent = { ...newAgent };
            }

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
                        name: door ? door.name : '',
                        width: Number(c.custom.width),
                        height: Number(c.custom.height),
                        coating: coatingObj
                            ? { name: coatingObj.name, price: coatingObj.price }
                            : null,
                        quantity: Number(c.quantity),
                        accesories: (c.custom.accesories || []).map(acc => ({
                            name: acc.name,
                            quantity: Number(acc.quantity),
                            price: Number(acc.price)
                        })),
                        price: door ? Number(door.price) * Number(c.quantity) : 0
                    });
                }
                if (c.type === 'partition') {
                    const partition = complementPartitions.find(p => String(p.id ?? p.Id) === String(c.complementId));
                    complementsMongo.ComplementPartition.push({
                        name: partition ? partition.name : '', // asegúrate que nunca sea undefined
                        height: Number(c.custom.height) || 0,
                        quantity: Number(c.quantity) || 0,
                        simple: !!c.custom.simple,
                        GlassMilimeters: c.custom.glassMilimeters ? `Mm${c.custom.glassMilimeters}` : '',
                        price: partition ? Number(partition.price) * Number(c.quantity) : 0
                    });
                }
                if (c.type === 'railing') {
                    const railing = complementRailings.find(r => String(r.id) === String(c.complementId));
                    const treatmentObj = RAILING_TREATMENTS.find(t => String(t.id) === String(c.custom.treatment));
                    complementsMongo.ComplementRailing.push({
                        name: railing ? railing.name : '',
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
                OpeningType: openingTypes.find(type => type.id === Number(opening.typeId)) || null,
                Quantity: opening.quantity,
                AlumTreatment: treatments.find(t => t.id === Number(opening.treatmentId)) || null,
                GlassType: glassTypes.find(g => g.id === Number(opening.glassTypeId)) || null,
                width: opening.width,
                height: opening.height,
                Accesory: [],
                price: 0 // Ajusta si tienes el precio
            }));

            // --- NUEVO: Armar el objeto final para Mongo con mayúsculas y estructura correcta ---
            const mongoPayload = {
                Budget: {
                    budgetId: String(sqlId),
                    user: userPayload,
                    customer: customerPayloadMongo,
                    workPlace: workPlacePayload,
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
                                />
                            </SwiperSlide>
                            <SwiperSlide>
                                <Agent
                                    customerId={newCustomer.agentId}
                                    newAgent={newAgent}
                                    setNewAgent={setNewAgent}
                                    setIsAgentComplete={() => { }}
                                    errors={currentIndex === 1 ? stepErrors : {}}
                                />
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
                                    <button
                                        className="summary-qty-btn"
                                        type="button"
                                        onClick={() => handleChangeComplementQty(idx, 1)}
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