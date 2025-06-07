import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "../styles/quotation.css";
import Navigation from "../components/Navigation";
import FooterLogo from "../components/FooterLogo";
import Customer from "../components/quotationComponents/Customer";
import Agent from "../components/quotationComponents/Agent";
import WorkPlace from "../components/quotationComponents/WorkPlace";
import OpeningType from "../components/quotationComponents/Opening";
import Complements from "../components/quotationComponents/Complements";
import Extras from "../components/quotationComponents/Extras";
import useEmblaCarousel from 'embla-carousel-react';
import { QuotationContext } from "../context/QuotationContext";
import { validateQuotation } from "../validation/quotationValidation";

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
    const [emblaRef, emblaApi] = useEmblaCarousel({ draggable: false });
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [carouselHeight, setCarouselHeight] = useState('auto');
    const carouselContainerRef = useRef(null);

    const navigate = useNavigate();
    const { setQuotations } = React.useContext(QuotationContext);

    const [newCustomer, setNewCustomer] = useState({
        name: '', lastname: '', tel: '', mail: '', address: '', agentId: null, dni: ''
    });
    const [isCustomerComplete, setIsCustomerComplete] = useState(false);
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
    const [complementTypes, setComplementTypes] = useState([]);
    const [complements, setComplements] = useState([]);
    const [comment, setComment] = useState(""); // Nuevo estado para comentario

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    const [userId] = useState(() => getUserIdFromToken());

    // Agrega estado para el usuario logueado
    const [loggedUser, setLoggedUser] = useState(null);

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

    // Carousel navigation
    const handlePrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const handleNext = useCallback(() => {
        if (currentIndex === 0 && !isCustomerComplete) return;
        emblaApi && emblaApi.scrollNext();
    }, [emblaApi, currentIndex, isCustomerComplete]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setCanScrollPrev(emblaApi.canScrollPrev());
        setCanScrollNext(emblaApi.canScrollNext());
        setCurrentIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on('select', onSelect);
        onSelect();
    }, [emblaApi, onSelect]);

    useEffect(() => {
        if (!carouselContainerRef.current) return;
        const activeSlide = carouselContainerRef.current.querySelector(`.embla__slide:nth-child(${currentIndex + 1})`);
        if (activeSlide) {
            setCarouselHeight(`${activeSlide.scrollHeight}px`);
        }
    }, [currentIndex]);

    // Cargar tipos de trabajo
    useEffect(() => {
        const fetchWorkTypes = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const response = await axios.get('http://localhost:5187/api/worktypes', {
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
                    axios.get('http://localhost:5187/api/opening-types', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5187/api/alum-treatments', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5187/api/glass-types', { headers: { Authorization: `Bearer ${token}` } }),
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

    // Cargar tipos de complementos y complementos
    useEffect(() => {
        const fetchComplementsData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const [typesRes, complementsRes] = await Promise.all([
                    axios.get('http://localhost:5187/api/complement-types', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5187/api/complements', { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                setComplementTypes(typesRes.data);
                setComplements(complementsRes.data);
            } catch (error) {
                console.error('Error fetching complements data:', error);
            }
        };
        fetchComplementsData();
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

            // Validar userId y dni
            if (!userId || !newCustomer.dni) {
                setSubmitError("Debe estar autenticado y el cliente debe tener DNI.");
                setSubmitting(false);
                return;
            }

            // Calcular precio total (puedes ajustar esta lógica)
            const totalComplements = selectedComplements.reduce((acc, c) => acc + (c.price * c.quantity), 0);

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

            const customerPayload = agent
                ? { name, lastname, tel, mail, address, dni, agent }
                : { name, lastname, tel, mail, address, dni };

            const quotationPayload = {
                customer: customerPayload,
                userId: userId,
                workPlace: {
                    ...workPlace,
                    workTypeId: Number(workPlace.workTypeId)
                },
                openings: selectedOpenings,
                complements: selectedComplements,
                totalPrice: totalComplements,
                comment // <-- Usa el comentario real
            };

            // 1. POST a SQL
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

            if (
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

            const productsPayload = selectedOpenings.map(opening => ({
                OpeningType: openingTypes.find(type => type.id === Number(opening.typeId)) || null,
                Quantity: opening.quantity,
                AlumTreatment: treatments.find(t => t.id === Number(opening.treatmentId)) || null,
                GlassComplement: glassTypes.find(g => g.id === Number(opening.glassTypeId)) || null,
                width: opening.width,
                height: opening.height,
                Accesory: []
            }));

            // Payload para Mongo, agregando budgetId y comment real
            const mongoPayload = {
                budget: {
                    budgetId: String(sqlId),
                    user: userPayload,
                    customer: customerPayloadMongo,
                    workPlace: workPlacePayload,
                    products: productsPayload,
                    comment // <-- Usa el comentario real
                }
            };

            console.log("Payload enviado a Mongo:", JSON.stringify(mongoPayload, null, 2)); // <-- LOG para depuración

            // 2. POST a Mongo (usa la ruta correcta)
            await axios.post(`${API_URL}/api/Mongo/CreateBudget`, mongoPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            // Actualizar cotizaciones en el contexto si quieres
            if (response && response.data) {
                setQuotations(prev => [...prev, response.data]);
            }

            setSubmitting(false);
            navigate('/dashboard');
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

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            <h2 className="title">Nueva Cotización</h2>
            <form className="quotation-form" onKeyDown={handleFormKeyDown}>
                <div className="embla-buttons-container">
                    <button
                        type="button"
                        className="embla__button embla__button--prev"
                        onClick={handlePrev}
                        disabled={!canScrollPrev}
                    >
                        Atrás
                    </button>
                    <button
                        type="button"
                        className="embla__button embla__button--next"
                        onClick={handleNext}
                        disabled={!canScrollNext || (currentIndex === 0 && !isCustomerComplete)}
                    >
                        Adelante
                    </button>
                </div>
                <div
                    className="embla"
                    ref={emblaRef}
                    style={{ height: carouselHeight }}
                >
                    <div className="embla__container" ref={carouselContainerRef}>
                        <div className="embla__slide">
                            <Customer
                                newCustomer={newCustomer}
                                setNewCustomer={setNewCustomer}
                                setIsCustomerComplete={setIsCustomerComplete}
                            />
                        </div>
                        <div className="embla__slide">
                            <Agent
                                customerId={newCustomer.agentId}
                                newAgent={newAgent}
                                setNewAgent={setNewAgent}
                                setIsAgentComplete={() => {}}
                            />
                        </div>
                        <div className="embla__slide">
                            <WorkPlace
                                workPlace={workPlace}
                                setWorkPlace={setWorkPlace}
                                workTypes={workTypes}
                            />
                        </div>
                        <div className="embla__slide">
                            <OpeningType
                                openingForm={openingForm}
                                setOpeningForm={setOpeningForm}
                                openingTypes={openingTypes}
                                treatments={treatments}
                                glassTypes={glassTypes}
                                selectedOpenings={selectedOpenings}
                                setSelectedOpenings={setSelectedOpenings}
                            />
                        </div>
                        <div className="embla__slide">
                            <Complements
                                complementTypes={complementTypes}
                                complements={complements}
                                selectedComplements={selectedComplements}
                                setSelectedComplements={setSelectedComplements}
                            />
                        </div>
                        <div className="embla__slide">
                            <Extras comment={comment} setComment={setComment} />
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
                        </div>
                    </div>
                </div>
            </form>
            <FooterLogo />
        </div>
    );
};

export default Quotation;