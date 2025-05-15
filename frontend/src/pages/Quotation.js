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
import useEmblaCarousel from 'embla-carousel-react';

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

    const [newCustomer, setNewCustomer] = useState({
        name: '', lastname: '', tel: '', mail: '', address: '', agentId: null, dni: ''
    });
    const [isCustomerComplete, setIsCustomerComplete] = useState(false);

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

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const [userId] = useState(() => getUserIdFromToken());

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
    const handleSubmitQuotation = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError(null);

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
                console.log(userId, newCustomer.dni);
                setSubmitting(false);
                return;
            }

            // Calcular precio total (puedes ajustar esta lógica)
            const totalComplements = selectedComplements.reduce((acc, c) => acc + (c.price * c.quantity), 0);

            // Limpiar customer para no enviar campos innecesarios
            const { name, lastname, tel, mail, address, agentId, dni } = newCustomer;

            // Payload completo para el backend
            const quotationPayload = {
                customer: {
                    name,
                    lastname,
                    tel,
                    mail,
                    address,
                    agentId,
                    dni
                },
                userId: userId,
                workPlace: {
                    ...workPlace,
                    workTypeId: Number(workPlace.workTypeId)
                },
                openings: selectedOpenings,
                complements: selectedComplements,
                totalPrice: totalComplements
            };

            console.log("Payload enviado a /api/quotations:", quotationPayload);

            await axios.post('http://localhost:5187/api/quotations', quotationPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            setSubmitting(false);
            navigate('/dashboard');
        } catch (err) {
            setSubmitError(err.message || 'Error al crear la cotización');
            setSubmitting(false);
        }
    };

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            <h2 className="title">Nueva Cotización</h2>
            <form className="quotation-form" onSubmit={handleSubmitQuotation}>
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
                                newAgent={{}}
                                setNewAgent={() => {}}
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
                            <div style={{ marginTop: 24 }}>
                                <button
                                    type="submit"
                                    className="submit-button"
                                    disabled={submitting}
                                >
                                    {submitting ? "Enviando..." : "Cotizar"}
                                </button>
                                {submitError && (
                                    <div style={{ color: 'red', marginTop: 8 }}>{submitError}</div>
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