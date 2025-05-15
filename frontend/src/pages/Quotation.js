import React, { useState, useEffect, useCallback, useRef } from 'react'; // Eliminado axios y useContext
import { useNavigate } from 'react-router-dom';
import "../styles/quotation.css";
import Navigation from "../components/Navigation";
import FooterLogo from "../components/FooterLogo";
import Customer from "../components/quotationComponents/Customer";
import Agent from "../components/quotationComponents/Agent";
import WorkPlace from "../components/quotationComponents/WorkPlace";
import OpeningType from "../components/quotationComponents/Opening";
import Complements from "../components/quotationComponents/Complements";
import useEmblaCarousel from 'embla-carousel-react';

const Quotation = () => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ draggable: false }); // Deshabilitar desplazamiento táctil
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [carouselHeight, setCarouselHeight] = useState('auto');
    const carouselContainerRef = useRef(null);

    const navigate = useNavigate();

    const [newCustomer, setNewCustomer] = useState({
        name: '', lastname: '', tel: '', mail: '', address: '', agentId: null,
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

    // Función para manejar el desplazamiento del carrusel
    const handlePrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const handleNext = useCallback(() => {
        if (currentIndex === 0 && !isCustomerComplete) return; // Bloquear avance solo en la sección de cliente
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

    // Ajustar la altura del carrusel dinámicamente según el contenido actual
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
                const response = await fetch('http://localhost:5187/api/worktypes', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setWorkTypes(data);
                }
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
                    fetch('http://localhost:5187/api/opening-types', { headers: { Authorization: `Bearer ${token}` } }),
                    fetch('http://localhost:5187/api/alum-treatments', { headers: { Authorization: `Bearer ${token}` } }),
                    fetch('http://localhost:5187/api/glass-types', { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                if (openingTypesRes.ok) setOpeningTypes(await openingTypesRes.json());
                if (treatmentsRes.ok) setTreatments(await treatmentsRes.json());
                if (glassTypesRes.ok) setGlassTypes(await glassTypesRes.json());
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
                    fetch('http://localhost:5187/api/complement-types', { headers: { Authorization: `Bearer ${token}` } }),
                    fetch('http://localhost:5187/api/complements', { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                if (typesRes.ok) setComplementTypes(await typesRes.json());
                if (complementsRes.ok) setComplements(await complementsRes.json());
            } catch (error) {
                console.error('Error fetching complements data:', error);
            }
        };
        fetchComplementsData();
    }, []);

    // Función para manejar el cierre de sesión
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            <h2 className="title">Nueva Cotización</h2>
            <form className="quotation-form">
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
                        disabled={!canScrollNext || (currentIndex === 0 && !isCustomerComplete)} // Bloquear solo en cliente
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
                        </div>
                    </div>
                </div>
            </form>
            <FooterLogo />
        </div>
    );
};

export default Quotation;