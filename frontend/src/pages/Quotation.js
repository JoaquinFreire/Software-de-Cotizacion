import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuotationContext } from "../context/QuotationContext";
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

const Quotation = () => {
    const [emblaRef, emblaApi] = useEmblaCarousel(); // Inicializar el carrusel de Embla
    const [canScrollPrev, setCanScrollPrev] = useState(false); // Estado para controlar el desplazamiento previo
    const [canScrollNext, setCanScrollNext] = useState(false); // Estado para controlar el desplazamiento siguiente
    const [currentIndex, setCurrentIndex] = useState(0); // Índice actual del carrusel
    const [carouselHeight, setCarouselHeight] = useState('auto'); // Altura dinámica del carrusel
    const carouselContainerRef = useRef(null); // Referencia al contenedor del carrusel
    const { setQuotations } = useContext(QuotationContext); // Obtener la función setQuotations del contexto

    const [userId, setUserId] = useState(''); // Estado para almacenar el ID del usuario
    const navigate = useNavigate(); // Hook para la navegación

    const [customers, setCustomers] = useState([]); // Estado para almacenar la lista de clientes
    const [customerId, setCustomerId] = useState(''); // Estado para almacenar el ID del cliente seleccionado
    const [newCustomer, setNewCustomer] = useState({
        name: '', lastname: '', tel: '', mail: '', address: '', agentId: null,
    }); // Estado para almacenar los datos del nuevo cliente
    const [newAgent, setNewAgent] = useState({ name: '', lastname: '', tel: '', mail: '' }); // Estado para el nuevo agente

    const [workPlace, setWorkPlace] = useState({ name: '', address: '', workTypeId: '' }); // Estado para el espacio de trabajo
    const [workTypes, setWorkTypes] = useState([]); // Estado para los tipos de trabajo

    const [openingForm, setOpeningForm] = useState({
        typeId: '',
        width: '',
        height: '',
        quantity: 1,
        treatmentId: '',
        glassTypeId: '',
    }); // Estado para el formulario de abertura
    const [selectedOpenings, setSelectedOpenings] = useState([]); // Estado para las aberturas seleccionadas
    const [openingTypes, setOpeningTypes] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [glassTypes, setGlassTypes] = useState([]);

    const [selectedComplements, setSelectedComplements] = useState([]); // Estado para los complementos seleccionados
    const [complementTypes, setComplementTypes] = useState([]);
    const [complements, setComplements] = useState([]);

    const handleCustomerChange = (e) => {
        const selectedCustomerId = e.target.value;
        setCustomerId(selectedCustomerId);

        if (selectedCustomerId) {
            const selectedCustomer = customers.find((customer) => customer.id === parseInt(selectedCustomerId));
            setNewCustomer({
                name: selectedCustomer.name,
                lastname: selectedCustomer.lastname,
                tel: selectedCustomer.tel,
                mail: selectedCustomer.mail,
                address: selectedCustomer.address,
                agentId: selectedCustomer.agentId,
            });
        } else {
            setNewCustomer({
                name: '', lastname: '', tel: '', mail: '', address: '', agentId: null,
            });
        }
    };

    useEffect(() => {
        const fetchCustomers = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }
            try {
                const response = await axios.get('http://localhost:5187/api/customers', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCustomers(response.data);
            } catch (error) {
                console.error('Error fetching customers:', error);
            }
        };
        fetchCustomers();
    }, [navigate]);

    useEffect(() => {
        const fetchWorkTypes = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }
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
    }, [navigate]);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }
            try {
                const [openingTypesResponse, treatmentsResponse, glassTypesResponse] = await Promise.all([
                    axios.get('http://localhost:5187/api/opening-types', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5187/api/alum-treatments', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5187/api/glass-types', { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                setOpeningTypes(openingTypesResponse.data);
                setTreatments(treatmentsResponse.data);
                console.log(treatmentsResponse.data);
                setGlassTypes(glassTypesResponse.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [navigate]);

    useEffect(() => {
        const fetchComplementsData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }
            try {
                const [typesResponse, complementsResponse] = await Promise.all([
                    axios.get('http://localhost:5187/api/complement-types', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5187/api/complements', { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                setComplementTypes(typesResponse.data);
                setComplements(complementsResponse.data);
            } catch (error) {
                console.error('Error fetching complements data:', error);
            }
        };

        fetchComplementsData();
    }, [navigate]);

    // Funciones para manejar el desplazamiento del carrusel
    const handlePrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const handleNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setCanScrollPrev(emblaApi.canScrollPrev());
        setCanScrollNext(emblaApi.canScrollNext());
        setCurrentIndex(emblaApi.selectedScrollSnap()); // Actualizar el índice actual
    }, [emblaApi]); // Callback para manejar la selección del carrusel
    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on('select', onSelect);
        onSelect();
    }, [emblaApi, onSelect]); // Efecto para inicializar el carrusel y manejar la selección

    // Ajustar la altura del carrusel dinámicamente según el contenido actual
    useEffect(() => {
        if (!carouselContainerRef.current) return;
        const activeSlide = carouselContainerRef.current.querySelector(`.embla__slide:nth-child(${currentIndex + 1})`);
        if (activeSlide) {
            setCarouselHeight(`${activeSlide.scrollHeight}px`);
        }
    }, [currentIndex]);

    // Función para manejar el cierre de sesión
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

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
                    name: newCustomer.name,
                    lastname: newCustomer.lastname,
                    tel: newCustomer.tel,
                    mail: newCustomer.mail,
                    address: newCustomer.address,
                };
    
                const customerResponse = await axios.post('http://localhost:5187/api/customers', newCustomerPayload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
    
                customerIdToUse = customerResponse.data.id;
            } catch (error) {
                console.error('Error creating customer:', error.response?.data || error.message);
                return;
            }
        }
    
        // Validar que todos los campos requeridos estén presentes
        if (!customerIdToUse || !userId || !workPlace.name || !workPlace.address || !workPlace.workTypeId) {
            console.error('Missing required fields');
            return;
        }
    
        try {
            const payload = {
                CustomerId: customerIdToUse,
                UserId: userId,
                WorkPlace: {
                    name: workPlace.name,
                    address: workPlace.address,
                    workTypeId: workPlace.workTypeId,
                    Openings: selectedOpenings.map(opening => ({
                        TypeId: opening.typeId,
                        Width: opening.width,
                        Height: opening.height,
                        Quantity: opening.quantity,
                        TreatmentId: opening.treatmentId,
                        GlassTypeId: opening.glassTypeId,
                        Price: opening.price, // Asegúrate de incluir el precio si está disponible
                    })),
                    Complements: selectedComplements.map(complement => ({
                        ComplementId: complement.id,
                        Quantity: complement.quantity,
                        Price: complement.price,
                    })),
                },
            };
    
            const response = await axios.post('http://localhost:5187/api/quotations', payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            console.log('Quotation created successfully:', response.data);
            setQuotations((prev) => [...prev, response.data]);
            navigate('/dashboard');
        } catch (error) {
            console.error('Error creating quotation:', error.response?.data || error.message);
        }
    };

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            <h2 className="title">Nueva Cotización</h2>
            <form className="quotation-form" onSubmit={handleSubmit}>
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
                        disabled={!canScrollNext}
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
                                customers={customers}
                                customerId={customerId}
                                setCustomerId={setCustomerId}
                                newCustomer={newCustomer}
                                setNewCustomer={setNewCustomer}
                                handleCustomerChange={handleCustomerChange}
                            />
                        </div>
                        <div className="embla__slide">
                            <Agent
                                customerId={customerId}
                                newAgent={newAgent}
                                setNewAgent={setNewAgent}
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
                <button
                    className="submit-button"
                    type="submit"
                    disabled={currentIndex !== 4} // Habilitar solo en la última parte del carrusel
                >
                    Cotizar
                </button>
            </form>
            <FooterLogo />
        </div>
    );
};

export default Quotation;