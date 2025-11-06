import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import "../styles/quotation.css";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import OpeningType from "../components/quotationComponents/Opening";
import Complements from "../components/quotationComponents/Complements";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { validateOpenings } from "../validation/openingValidation";
import { validateAgent } from "../validation/agentValidation";
import { safeArray } from '../utils/safeArray';
import { toast } from 'react-toastify';
import { ToastContainer, Slide } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL;

// Utilidad para normalizar arrays serializados con $values
function toArray(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.$values)) return data.$values;
    if (data && typeof data === 'object' && !data.type) { // Excluir objetos de error
        return [data];
    }
    return [];
}

const CreateBudgetVersion = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const swiperRef = useRef(null);
    const navigate = useNavigate();
    const { id: budgetId } = useParams();

    // Estados para datos de la cotización original
    const [originalBudget, setOriginalBudget] = useState(null);
    const [budgetVersions, setBudgetVersions] = useState([]);
    const [selectedVersion, setSelectedVersion] = useState(null);

    // Estados para formulario
    const [agents, setAgents] = useState([]);
    const [agentSearchDni, setAgentSearchDni] = useState("");
    const [agentSearchResult, setAgentSearchResult] = useState(null);
    const [agentSearchError, setAgentSearchError] = useState("");
    const [agentSearched, setAgentSearched] = useState(false);
    const [newAgent, setNewAgent] = useState({ dni: '', name: '', lastname: '', tel: '', mail: '' });

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
    const [comment, setComment] = useState("");

    // Estados para referencias (solo lectura)
    const [dollarReference, setDollarReference] = useState(null);
    const [labourReference, setLabourReference] = useState(null);
    const [dolarVenta, setDolarVenta] = useState(null);
    const [dolarCompra, setDolarCompra] = useState(null);
    const [loadingPrices, setLoadingPrices] = useState(true);

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [stepErrors, setStepErrors] = useState({});

    // Estados para cálculos
    const [openingConfigurations, setOpeningConfigurations] = useState([]);
    const [alumPrice, setAlumPrice] = useState(0);
    const [labourPrice, setLabourPrice] = useState(0);
    const [taxRate, setTaxRate] = useState(0);
    const [mosquitoPrice, setMosquitoPrice] = useState(0);

    // Estados mejorados para carga
    const [loading, setLoading] = useState(true);
    const [masterDataLoaded, setMasterDataLoaded] = useState(false);

    // Cargar datos de la cotización original - VERSIÓN CORREGIDA
    useEffect(() => {
        const fetchBudgetData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.error('No hay token de autenticación');
                    setLoading(false);
                    return;
                }

                console.log('Buscando versiones para budgetId:', budgetId);

                // Obtener todas las versiones para este budgetId
                const versionsResponse = await axios.get(`${API_URL}/api/Mongo/GetBudgetVersions/${budgetId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                console.log('Respuesta completa de versiones:', versionsResponse);

                // VERIFICACIÓN MÁS ROBUSTA Y SEGURA
                let versionsArray = [];

                // Manejar diferentes estructuras de respuesta
                const responseData = versionsResponse.data;

                if (responseData && responseData.$values && Array.isArray(responseData.$values)) {
                    versionsArray = responseData.$values;
                } else if (Array.isArray(responseData)) {
                    versionsArray = responseData;
                } else if (responseData && typeof responseData === 'object') {
                    // Si es un objeto individual, convertirlo a array
                    versionsArray = [responseData];
                }

                console.log('Versiones procesadas:', versionsArray);

                if (!versionsArray || versionsArray.length === 0) {
                    console.error('No se encontraron versiones para esta cotización');
                    toast.error('No se encontraron versiones para esta cotización');
                    setLoading(false);
                    return;
                }

                // VERIFICAR SI ES UN OBJETO DE ERROR
                if (versionsArray[0] && versionsArray[0].type && versionsArray[0].status) {
                    console.error('Respuesta de error recibida:', versionsArray[0]);
                    toast.error(`Error del servidor: ${versionsArray[0].title || 'Error desconocido'}`);
                    setLoading(false);
                    return;
                }

                setBudgetVersions(versionsArray);

                // Seleccionar la última versión por defecto
                const latestVersion = versionsArray[0];
                console.log('Última versión a establecer:', latestVersion);

                setSelectedVersion(latestVersion);
                setOriginalBudget(latestVersion);

            } catch (error) {
                console.error('Error fetching budget data:', error);
                console.error('Error details:', error.response?.data || error.message);

                // Manejar error específico de la API
                if (error.response && error.response.data) {
                    const errorData = error.response.data;
                    if (errorData.type && errorData.title) {
                        toast.error(`Error: ${errorData.title}`);
                    } else {
                        toast.error(`Error al cargar los datos: ${error.response.status} ${error.response.statusText}`);
                    }
                } else {
                    toast.error(`Error de conexión: ${error.message}`);
                }
            } finally {
                setLoading(false);
            }
        };

        if (budgetId) {
            fetchBudgetData();
        } else {
            setLoading(false);
            toast.error('No se proporcionó ID de cotización');
        }
    }, [budgetId]);

    // Cargar datos maestros (tipos de abertura, tratamientos, etc.)
    useEffect(() => {
        const fetchMasterData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const [
                    openingTypesRes,
                    treatmentsRes,
                    glassTypesRes,
                    doorsRes,
                    partitionsRes,
                    railingsRes,
                    configsRes,
                    pricesRes
                ] = await Promise.all([
                    axios.get(`${API_URL}/api/opening-types`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/alum-treatments`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/glass-types`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/door`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/partition`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/railing`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/opening-configurations`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/prices`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                setOpeningTypes(toArray(openingTypesRes.data));
                setTreatments(toArray(treatmentsRes.data));
                setGlassTypes(toArray(glassTypesRes.data));
                setComplementDoors(toArray(doorsRes.data));
                setComplementPartitions(toArray(partitionsRes.data));
                setComplementRailings(toArray(railingsRes.data));
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

                const mosquitoEntry = prices.find(p => p.name?.toLowerCase().includes("tela mosquitera") || String(p.id) === "7");
                setMosquitoPrice(mosquitoEntry ? Number(mosquitoEntry.price) : 0);

                const ivaEntry = prices.find(p => p.name?.toLowerCase().includes("iva") || String(p.id) === "4");
                setTaxRate(ivaEntry ? Number(ivaEntry.price) : 0);

            } catch (error) {
                console.error('Error fetching master data:', error);
            }
        };

        fetchMasterData();
    }, []);

    // Cargar referencias de dólar y mano de obra (solo lectura)
    useEffect(() => {
        const fetchReferences = async () => {
            setLoadingPrices(true);
            try {
                // Obtener dólar
                const dolarRes = await fetch('https://dolarapi.com/v1/dolares/oficial');
                const dolarData = await dolarRes.json();
                setDolarVenta(dolarData.venta);
                setDolarCompra(dolarData.compra);
                setDollarReference(dolarData.venta);

                // Obtener mano de obra desde la API interna
                const token = localStorage.getItem('token');
                const pricesRes = await axios.get(`${API_URL}/api/prices`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const prices = toArray(pricesRes.data);
                const labourObj = prices.find(p =>
                    p.name?.toLowerCase().includes("manoobra") ||
                    p.name?.toLowerCase().includes("manodeobra") ||
                    p.name?.toLowerCase().includes("mano de obra")
                );
                if (labourObj) {
                    setLabourReference(labourObj.price);
                }
            } catch (error) {
                console.error('Error fetching references:', error);
            } finally {
                setLoadingPrices(false);
            }
        };

        fetchReferences();
    }, []);

    // Marcar cuando los datos maestros estén cargados
    useEffect(() => {
        if (openingTypes.length > 0 && treatments.length > 0 && glassTypes.length > 0 &&
            complementDoors.length > 0 && complementPartitions.length > 0 && complementRailings.length > 0) {
            setMasterDataLoaded(true);
            console.log('Todos los datos maestros cargados');
        }
    }, [openingTypes, treatments, glassTypes, complementDoors, complementPartitions, complementRailings]);

    // Funciones auxiliares para obtener IDs por nombre
    const getOpeningTypeName = (typeId) => {
        const type = openingTypes.find(t => String(t.id) === String(typeId));
        return type ? (type.name || type.type) : '';
    };

    const getTreatmentName = (treatmentId) => {
        const treatment = treatments.find(t => String(t.id) === String(treatmentId));
        return treatment ? treatment.name : '';
    };

    const getGlassTypeName = (glassTypeId) => {
        const glassType = glassTypes.find(g => String(g.id) === String(glassTypeId));
        return glassType ? glassType.name : '';
    };

    const getDoorIdByName = (name) => {
        if (!name) return '';
        const door = complementDoors.find(d => d.name === name);
        console.log(`Buscando door: "${name}" ->`, door ? door.id : 'no encontrado');
        return door ? door.id : '';
    };

    const getRailingIdByName = (name) => {
        if (!name) return '';
        const railing = complementRailings.find(r => r.name === name);
        console.log(`Buscando railing: "${name}" ->`, railing ? railing.id : 'no encontrado');
        return railing ? railing.id : '';
    };

    const getPartitionIdByName = (name) => {
        if (!name) return '';
        const partition = complementPartitions.find(p => p.name === name);
        console.log(`Buscando partition: "${name}" ->`, partition ? partition.id : 'no encontrado');
        return partition ? partition.id : '';
    };

    const getCoatingIdByName = (name) => {
        // Por ahora retornamos vacío, puedes implementar esto si tienes coatings
        return '';
    };

    // Cargar datos del formulario desde la cotización seleccionada - VERSIÓN CORREGIDA
    const loadFormDataFromBudget = useCallback((budget) => {
        if (!budget) {
            console.log('No hay datos de budget para cargar');
            return;
        }

        // VERIFICAR SI ES UN OBJETO DE ERROR
        if (budget.type && budget.status) {
            console.error('Intento de cargar un objeto de error como budget:', budget);
            return;
        }

        console.log('Cargando datos desde budget:', budget);

        // Cargar aberturas
        if (budget.Products && budget.Products.$values) {
            const productsArray = budget.Products.$values;
            console.log('Products encontrados:', productsArray);

            const openings = productsArray.map(product => ({
                typeId: openingTypes.find(t => t.name === product.OpeningType?.name)?.id || '',
                width: product.width,
                height: product.height,
                quantity: product.Quantity || 1,
                treatmentId: treatments.find(t => t.name === product.AlumTreatment?.name)?.id || '',
                glassTypeId: glassTypes.find(g => g.name === product.GlassType?.name)?.id || '',
                numPanelsWidth: product.WidthPanelQuantity,
                numPanelsHeight: product.HeightPanelQuantity,
                panelWidth: product.PanelWidth,
                panelHeight: product.PanelHeight,
                accesories: product.Accesory?.$values || []
            }));
            console.log('Aberturas mapeadas:', openings);
            setSelectedOpenings(openings);
        } else {
            console.log('No hay productos en el budget');
            setSelectedOpenings([]);
        }

        // Cargar complementos
        if (budget.Complement && budget.Complement.$values) {
            const complements = [];
            const complementData = budget.Complement.$values;
            console.log('Complement data:', complementData);

            complementData.forEach(complementGroup => {
                // Puertas
                if (complementGroup.ComplementDoor && complementGroup.ComplementDoor.$values) {
                    complementGroup.ComplementDoor.$values.forEach(door => {
                        complements.push({
                            type: 'door',
                            complementId: complementDoors.find(d => d.name === door.Name)?.id || '',
                            quantity: door.Quantity || 1,
                            custom: {
                                width: door.Width,
                                height: door.Height,
                                coating: getCoatingIdByName(door.Coating?.name),
                                accesories: door.Accesory?.$values || []
                            },
                            totalPrice: door.Price || 0
                        });
                    });
                }

                // Barandas
                if (complementGroup.ComplementRailing && complementGroup.ComplementRailing.$values) {
                    complementGroup.ComplementRailing.$values.forEach(railing => {
                        complements.push({
                            type: 'railing',
                            complementId: complementRailings.find(r => r.name === railing.Name)?.id || '',
                            quantity: railing.Quantity || 1,
                            custom: {
                                treatment: treatments.find(t => t.name === railing.AlumTreatment?.name)?.id || '',
                                reinforced: railing.Reinforced || false
                            },
                            totalPrice: railing.Price || 0
                        });
                    });
                }

                // Tabiques
                if (complementGroup.ComplementPartition && complementGroup.ComplementPartition.$values) {
                    complementGroup.ComplementPartition.$values.forEach(partition => {
                        complements.push({
                            type: 'partition',
                            complementId: complementPartitions.find(p => p.name === partition.Name)?.id || '',
                            quantity: partition.Quantity || 1,
                            custom: {
                                height: partition.Height,
                                simple: partition.Simple || false,
                                glassMilimeters: partition.GlassMilimeters?.replace('Mm', '') || ''
                            },
                            totalPrice: partition.Price || 0
                        });
                    });
                }
            });

            console.log('Complementos mapeados:', complements);
            setSelectedComplements(complements);
        } else {
            console.log('No hay complementos en el budget');
            setSelectedComplements([]);
        }

        // Cargar agente
        if (budget.agent && Object.keys(budget.agent).length > 1) { // Más de 1 propiedad (no solo $id)
            console.log('Agente encontrado:', budget.agent);
            setAgents([budget.agent]);
        } else {
            console.log('No hay agente o agente vacío');
            setAgents([]);
        }

        // Cargar comentario
        if (budget.Comment) {
            // Extraer solo el comentario actual, eliminando el historial de versiones anteriores
            const commentLines = budget.Comment.split('\n');
            const currentComment = commentLines.find(line => !line.startsWith('---') && !line.startsWith('V'));
            const commentToSet = currentComment || budget.Comment;
            console.log('Comentario cargado:', commentToSet);
            setComment(commentToSet);
        } else {
            setComment("");
        }

        // Cargar referencias (si existen en el budget)
        if (budget.DollarReference !== undefined && budget.DollarReference !== null) {
            setDollarReference(budget.DollarReference);
            console.log('DollarReference:', budget.DollarReference);
        }

        if (budget.LabourReference !== undefined && budget.LabourReference !== null) {
            setLabourReference(budget.LabourReference);
            console.log('LabourReference:', budget.LabourReference);
        }

    }, [openingTypes, treatments, glassTypes, complementDoors, complementPartitions, complementRailings]);

    // Recargar datos cuando los datos maestros estén disponibles
    useEffect(() => {
        if (originalBudget && masterDataLoaded) {
            console.log('Datos maestros cargados y originalBudget disponible, recargando datos del budget');
            loadFormDataFromBudget(originalBudget);
        }
    }, [originalBudget, masterDataLoaded, loadFormDataFromBudget]);

    // Navegación del carousel
    const handlePrev = useCallback(() => {
        if (swiperRef.current && swiperRef.current.swiper) {
            swiperRef.current.swiper.slidePrev();
        }
    }, []);

    const handleNext = useCallback(() => {
        const validation = validateStep(currentIndex);
        if (!validation.valid) {
            toast.error("Complete los datos requeridos antes de continuar");
            return;
        } else {
            setStepErrors({});
            if (swiperRef.current && swiperRef.current.swiper) {
                swiperRef.current.swiper.slideNext();
            }
        }
    }, [currentIndex]);

    const handleSlideChange = (swiper) => {
        setCurrentIndex(swiper.activeIndex);
    };

    const validateStep = useCallback((step) => {
        switch (step) {
            case 0: // Selección de versión
                return { valid: true, errors: {} };
            case 1: // Agentes
                return { valid: true, errors: {} }; // Agentes son opcionales
            case 2: // Aberturas
                return validateOpenings(selectedOpenings);
            case 3: // Complementos
                return { valid: true, errors: {} }; // Complementos son opcionales
            case 4: // Comentarios
                return { valid: true, errors: {} }; // Comentarios son opcionales
            default:
                return { valid: true, errors: {} };
        }
    }, [selectedOpenings]);

    const goToSlide = (index) => {
        if (swiperRef.current && swiperRef.current.swiper) {
            swiperRef.current.swiper.slideTo(index);
        }
    };

    // Funciones para manejar agentes
    const handleAddExistingAgent = () => {
        if (agentSearchResult && !agents.some(a => a.dni === agentSearchResult.dni)) {
            setAgents(prev => [...prev, agentSearchResult]);
            setAgentSearchResult(null);
            setAgentSearchDni("");
        }
    };

    const handleAddNewAgent = () => {
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

    const handleRemoveAgent = (dni) => {
        setAgents(prev => prev.filter(a => a.dni !== dni));
    };

    // Buscar agente automáticamente al ingresar 8 dígitos
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
                        setAgentSearchResult(null);
                    } else {
                        setAgentSearchError("Error buscando agente.");
                    }
                } finally {
                    setAgentSearched(false);
                }
            })();
        } else {
            setAgentSearchResult(null);
            setAgentSearched(false);
        }
    }, [agentSearchDni]);

    // Funciones para cálculos en el resumen
    const getComplementName = (complementId, type) => {
        let arr = [];
        if (type === 'door') arr = complementDoors;
        else if (type === 'partition') arr = complementPartitions;
        else if (type === 'railing') arr = complementRailings;
        const comp = arr.find(c => String(c.id ?? c.Id) === String(complementId));
        return comp ? comp.name : '';
    };

    const getComplementSubtotal = (complement) => {
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

    // Cálculo de total general con costos adicionales
    const getGeneralTotal = () => {
        const totalOpenings = selectedOpenings.reduce((sum, opening) => {
            // Cálculo simplificado - puedes ajustar según tu lógica de negocio
            const basePrice = 1000; // Precio base por abertura
            return sum + (basePrice * (opening.quantity || 1));
        }, 0);

        const totalComplements = selectedComplements.reduce((sum, complement) => {
            let price = 0;
            if (complement.totalPrice !== undefined && complement.totalPrice !== null) {
                price = Number(complement.totalPrice);
            } else {
                let arr = [];
                if (complement.type === 'door') arr = complementDoors;
                else if (complement.type === 'partition') arr = complementPartitions;
                else if (complement.type === 'railing') arr = complementRailings;
                const found = arr.find(item => String(item.id) === String(complement.complementId));
                price = found ? Number(found.price) : 0;
            }
            return sum + (price * Number(complement.quantity || 1));
        }, 0);

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

    // Función para renderizar la vista previa SVG de paneles
    const renderPanelPreview = (opening) => {
        const w = Number(opening.width);
        const h = Number(opening.height);
        const numPanelsWidth = opening.numPanelsWidth || 1;
        const numPanelsHeight = opening.numPanelsHeight || 1;

        if (!w || !h || w <= 0 || h <= 0) return null;

        const vw = Math.min(120, w * 0.8);
        const vh = Math.min(80, h * 0.8);
        const viewW = w;
        const viewH = h;

        return (
            <div className="panel-preview-small">
                <svg width={vw} height={vh} viewBox={`0 0 ${viewW} ${viewH}`} preserveAspectRatio="xMidYMid meet">
                    <rect x="0" y="0" width={viewW} height={viewH} fill="#dff0f8" stroke="#26b7cd" strokeWidth={0.3} />
                    {Array.from({ length: Math.max(0, numPanelsWidth - 1) }).map((_, i) => (
                        <line
                            key={`v-${i}`}
                            x1={((i + 1) * viewW / numPanelsWidth)}
                            y1={0}
                            x2={((i + 1) * viewW / numPanelsWidth)}
                            y2={viewH}
                            stroke="#2c2727"
                            strokeWidth={1.15}
                        />
                    ))}
                    {Array.from({ length: Math.max(0, numPanelsHeight - 1) }).map((_, i) => (
                        <line
                            key={`h-${i}`}
                            x1={0}
                            y1={((i + 1) * viewH / numPanelsHeight)}
                            x2={viewW}
                            y2={((i + 1) * viewH / numPanelsHeight)}
                            stroke="#1f1c1c"
                            strokeWidth={1.15}
                        />
                    ))}
                </svg>
            </div>
        );
    };

    // Enviar nueva versión - VERSIÓN CORREGIDA CON LA ESTRUCTURA EXACTA
    const handleSubmitVersion = async () => {
        setSubmitting(true);
        setSubmitError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setSubmitError("No autenticado");
                setSubmitting(false);
                return;
            }

            // VERIFICACIÓN DE DATOS ANTES DE ENVIAR
            console.log('=== VERIFICACIÓN DE DATOS ANTES DE ENVIAR ===');
            console.log('selectedOpenings:', selectedOpenings);
            console.log('selectedComplements:', selectedComplements);
            console.log('agents:', agents);
            console.log('comment:', comment);

            // Validar que haya al menos una abertura
            if (selectedOpenings.length === 0) {
                setSubmitError("Debe agregar al menos una abertura");
                setSubmitting(false);
                return;
            }

            // FUNCIÓN PARA LIMPIAR OBJETOS DE PROPIEDADES $id
            const cleanObject = (obj) => {
                if (!obj || typeof obj !== 'object') return obj;

                const cleaned = { ...obj };

                // Remover propiedades $id
                if ('$id' in cleaned) {
                    delete cleaned.$id;
                }

                // Limpiar propiedades anidadas
                Object.keys(cleaned).forEach(key => {
                    if (cleaned[key] && typeof cleaned[key] === 'object') {
                        if (Array.isArray(cleaned[key])) {
                            cleaned[key] = cleaned[key].map(item => cleanObject(item));
                        } else {
                            cleaned[key] = cleanObject(cleaned[key]);
                        }
                    }
                });

                return cleaned;
            };

            // Preparar datos para la nueva versión - ESTRUCTURA EXACTA
            const finalPayload = {
                OriginalBudgetId: budgetId,
                Budget: {
                    // Usar datos limpios sin $id
                    budgetId: budgetId,
                    user: cleanObject({
                        name: originalBudget.user?.name || "",
                        lastName: originalBudget.user?.lastName || "",
                        mail: originalBudget.user?.mail || ""
                    }),
                    customer: cleanObject({
                        name: originalBudget.customer?.name || "",
                        lastname: originalBudget.customer?.lastname || "",
                        tel: originalBudget.customer?.tel || "",
                        mail: originalBudget.customer?.mail || "",
                        address: originalBudget.customer?.address || "",
                        dni: originalBudget.customer?.dni || ""
                    }),
                    agent: agents.length > 0 ? cleanObject({
                        name: agents[0].name || "",
                        lastname: agents[0].lastname || "",
                        dni: agents[0].dni || "",
                        tel: agents[0].tel || "",
                        mail: agents[0].mail || ""
                    }) : {},
                    workPlace: cleanObject({
                        name: originalBudget.workPlace?.name || "",
                        location: originalBudget.workPlace?.location || "",
                        address: originalBudget.workPlace?.address || "",
                        workType: {
                            type: originalBudget.workPlace?.WorkType?.type || ""
                        }
                    }),
                    Products: selectedOpenings.map(opening => cleanObject({
                        OpeningType: {
                            name: openingTypes.find(type => Number(type.id) === Number(opening.typeId))?.name || ""
                        },
                        AlumTreatment: {
                            name: treatments.find(t => Number(t.id) === Number(opening.treatmentId))?.name || ""
                        },
                        GlassType: {
                            name: glassTypes.find(g => Number(g.id) === Number(opening.glassTypeId))?.name || "",
                            Price: glassTypes.find(g => Number(g.id) === Number(opening.glassTypeId))?.price || 0
                        },
                        width: Number(opening.width),
                        height: Number(opening.height),
                        WidthPanelQuantity: Number(opening.numPanelsWidth),
                        HeightPanelQuantity: Number(opening.numPanelsHeight),
                        PanelWidth: Number(opening.panelWidth),
                        PanelHeight: Number(opening.panelHeight),
                        Quantity: Number(opening.quantity),
                        Accesory: (opening.accesories || []).map(a => cleanObject({
                            Name: a.name || a.Name || '',
                            Quantity: Number(a.quantity || a.Quantity || 0),
                            Price: Number(a.price || a.Price || 0)
                        })),
                        price: 0 // Se calculará en el backend
                    })),
                    complement: selectedComplements.length > 0 ? [
                        cleanObject({
                            ComplementDoor: selectedComplements
                                .filter(c => c.type === 'door')
                                .map(door => {
                                    const doorData = complementDoors.find(d => String(d.id) === String(door.complementId));
                                    return cleanObject({
                                        Name: doorData?.name || '',
                                        Width: Number(door.custom?.width),
                                        Height: Number(door.custom?.height),
                                        Coating: door.custom?.coating ? {
                                            name: "", // Necesitarías cargar los coatings
                                            price: 0
                                        } : {
                                            name: "",
                                            price: 0
                                        },
                                        Quantity: Number(door.quantity),
                                        Accesory: (door.custom?.accesories || []).map(acc => cleanObject({
                                            Name: acc.name || '',
                                            Quantity: Number(acc.quantity || 0),
                                            Price: Number(acc.price || 0)
                                        })).filter(acc => acc.Name && acc.Quantity > 0),
                                        Price: Number(door.totalPrice || 0)
                                    });
                                }),
                            ComplementRailing: selectedComplements
                                .filter(c => c.type === 'railing')
                                .map(railing => {
                                    const railingData = complementRailings.find(r => String(r.id) === String(railing.complementId));
                                    return cleanObject({
                                        Name: railingData?.name || '',
                                        AlumTreatment: {
                                            name: treatments.find(t => String(t.id) === String(railing.custom?.treatment))?.name || ""
                                        },
                                        Reinforced: Boolean(railing.custom?.reinforced),
                                        Quantity: Number(railing.quantity),
                                        Price: Number(railing.totalPrice || 0)
                                    });
                                }),
                            ComplementPartition: selectedComplements
                                .filter(c => c.type === 'partition')
                                .map(partition => {
                                    const partitionData = complementPartitions.find(p => String(p.id) === String(partition.complementId));
                                    return cleanObject({
                                        Name: partitionData?.name || '',
                                        Height: Number(partition.custom?.height),
                                        Quantity: Number(partition.quantity),
                                        Simple: Boolean(partition.custom?.simple),
                                        GlassMilimeters: partition.custom?.glassMilimeters ? `Mm${partition.custom.glassMilimeters}` : '',
                                        Price: Number(partition.totalPrice || 0)
                                    });
                                }),
                            price: 0 // Se calculará en el backend
                        })
                    ] : [
                        {
                            ComplementDoor: [],
                            ComplementRailing: [],
                            ComplementPartition: [],
                            price: 0
                        }
                    ],
                    Comment: comment,
                    DollarReference: dollarReference || 0,
                    LabourReference: labourReference || 0
                }
            };

            console.log("Payload completo enviado:", JSON.stringify(finalPayload, null, 2));

            const response = await axios.post(`${API_URL}/api/Mongo/CreateBudgetVersion`, finalPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            console.log("Respuesta exitosa:", response.data);
            setSubmitting(false);
            toast.success("Nueva versión creada exitosamente");

            // Redirigir a la página de detalles de la cotización
            setTimeout(() => {
                navigate(`/quotation/${budgetId}`);
            }, 2000);

        } catch (err) {
            console.error('Error creating version:', err);
            console.error('Error response:', err.response);

            // MANEJO SIMPLE Y ROBUSTO DEL ERROR
            let errorMessage = 'Error al crear la nueva versión';

            if (err.response && err.response.data) {
                const errorData = err.response.data;

                // Intentar extraer el mensaje de error de diferentes formas
                if (errorData.title && errorData.status) {
                    errorMessage = `Error ${errorData.status}: ${errorData.title}`;
                }
                else if (typeof errorData === 'string') {
                    errorMessage = errorData;
                }
                else if (errorData.message) {
                    errorMessage = errorData.message;
                }
                else {
                    // Si no podemos parsear el error, mostrar el objeto completo como string
                    errorMessage = JSON.stringify(errorData);
                }
            } else if (err.message) {
                errorMessage = err.message;
            }

            // Asegurarse de que errorMessage sea siempre un string
            setSubmitError(String(errorMessage));
            setSubmitting(false);
        }
    };

    // Evitar submit con Enter
    const handleFormKeyDown = (e) => {
        if (e.key === 'Enter' && currentIndex !== 4) {
            e.preventDefault();
        }
    };

    // Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    // Debug para identificar el problema
    console.log('DEBUG - Estado actual:', {
        loading,
        originalBudget,
        budgetVersions,
        selectedVersion,
        masterDataLoaded
    });

    // Verificar si hay un objeto de error en los datos
    if (originalBudget && originalBudget.type && originalBudget.status) {
        console.error('OBJETO DE ERROR DETECTADO EN RENDER:', originalBudget);
        return (
            <div className="dashboard-container">
                <Navigation onLogout={handleLogout} />
                <div className="materials-header">
                    <h2 className="materials-title">Error al cargar la cotización</h2>
                    <p>{originalBudget.title || 'Error desconocido del servidor'}</p>
                    <button onClick={() => navigate('/cotizaciones')} className="botton-carusel">
                        Volver a cotizaciones
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    // Render condicional mejorado
    if (loading) {
        return (
            <div className="dashboard-container">
                <Navigation onLogout={handleLogout} />
                <div className="materials-header">
                    <h2 className="materials-title">Cargando cotización...</h2>
                    <p>Por favor espere mientras se cargan los datos.</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (!originalBudget) {
        console.log('Render: originalBudget es null/false');
        return (
            <div className="dashboard-container">
                <Navigation onLogout={handleLogout} />
                <div className="materials-header">
                    <h2 className="materials-title">No se pudo cargar la cotización</h2>
                    <p>La cotización solicitada no existe o no se pudo cargar.</p>
                    <p>ID: {budgetId}</p>
                    <button onClick={() => navigate('/cotizaciones')} className="botton-carusel">
                        Volver a cotizaciones
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    // Mostrar mensaje si los datos maestros no están cargados
    if (!masterDataLoaded) {
        return (
            <div className="dashboard-container">
                <Navigation onLogout={handleLogout} />
                <div className="materials-header">
                    <h2 className="materials-title">Cargando datos maestros...</h2>
                    <p>Preparando el formulario, por favor espere.</p>
                </div>
                <Footer />
            </div>
        );
    }

    const generalTotal = getGeneralTotal();

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />

            <div className="materials-header">
                <h2 className="materials-title">Nueva Versión de Cotización</h2>
                <p className="materials-subtitle">
                    Creando nueva versión para la cotización #{budgetId}. Modifique los campos necesarios y guarde la nueva versión.
                </p>
            </div>

            <ToastContainer autoClose={4000} theme="dark" transition={Slide} position="bottom-right" />

            <div className="quotation-layout">
                {/* Información de la cotización original */}
                <div className="quotation-info-container">
                    <div className="quotation-indice">
                        <h3>Navegación</h3>
                        <p
                            className={`indice-item ${currentIndex === 0 ? 'active' : ''}`}
                            onClick={() => goToSlide(0)}
                        >
                            <b><u>Versión Base</u></b>
                        </p>
                        <p
                            className={`indice-item ${currentIndex === 1 ? 'active' : ''}`}
                            onClick={() => goToSlide(1)}
                        >
                            <b><u>Datos Agente</u></b>
                        </p>
                        <p
                            className={`indice-item ${currentIndex === 2 ? 'active' : ''}`}
                            onClick={() => goToSlide(2)}
                        >
                            <b><u>Carga de Aberturas</u></b>
                        </p>
                        <p
                            className={`indice-item ${currentIndex === 3 ? 'active' : ''}`}
                            onClick={() => goToSlide(3)}
                        >
                            <b><u>Carga de Complementos</u></b>
                        </p>
                        <p
                            className={`indice-item ${currentIndex === 4 ? 'active' : ''}`}
                            onClick={() => goToSlide(4)}
                        >
                            <b><u>Comentarios</u></b>
                        </p>
                    </div>

                    {/* Versiones disponibles - MOVIDO ARRIBA */}
                    <div className="info-section">
                        <h4>Versiones Disponibles:</h4>
                        <select
                            value={selectedVersion?.version || ''}
                            onChange={(e) => {
                                const version = budgetVersions.find(v => v.version === parseInt(e.target.value));
                                setSelectedVersion(version);
                                loadFormDataFromBudget(version);
                            }}
                            className="form-group select"
                        >
                            {budgetVersions.map(version => (
                                <option key={version.version} value={version.version}>
                                    Versión {version.version} - {new Date(version.creationDate).toLocaleDateString()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <h3>Información de la Cotización</h3>

                    <div className="info-section">
                        <h4>Cliente:</h4>
                        <div className="info-item">
                            <span>{originalBudget.customer?.name} {originalBudget.customer?.lastname}</span>
                        </div>
                        <div className="info-item">
                            <span>DNI: {originalBudget.customer?.dni}</span>
                        </div>
                        <div className="info-item">
                            <span>Tel: {originalBudget.customer?.tel}</span>
                        </div>
                    </div>

                    <div className="info-section">
                        <h4>Lugar de Trabajo:</h4>
                        <div className="info-item">
                            <span><b>{originalBudget.workPlace?.location}</b></span>
                        </div>
                        <div className="info-item">
                            <span>{originalBudget.workPlace?.address}</span>
                        </div>
                        <div className="info-item">
                            <span>Tipo: {originalBudget.workPlace?.WorkType?.type}</span>
                        </div>
                    </div>

                    {/* Agente - NUEVA SECCIÓN CORREGIDA */}
                    <div className="info-section">
                        <h4>Agente:</h4>
                        {agents.length > 0 ? (
                            agents.map((agent, idx) => (
                                <div key={idx}>
                                    <div className="info-item">
                                        <span>{agent.name} {agent.lastname}</span>
                                    </div>
                                    <div className="info-item">
                                        <span>DNI: {agent.dni}</span>
                                    </div>
                                    <div className="info-item">
                                        <span>Tel: {agent.tel}</span>
                                    </div>
                                    <div className="info-item">
                                        <span>Email: {agent.mail}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="info-item">
                                <span>No hay agente asignado</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Formulario principal */}
                <main className="quotation-main">
                    <form className="quotation-form" onKeyDown={handleFormKeyDown}>
                        <div className="embla-buttons-container">
                            <button type="button" className="embla__button embla__button--prev" onClick={handlePrev} disabled={currentIndex === 0}>
                                Atrás
                            </button>
                            <span className="page-indicator">Paso {currentIndex + 1} de 5</span>
                            <button type="button" className="embla__button embla__button--next" onClick={handleNext} disabled={currentIndex === 4}>
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
                            {/* Paso 0: Información de versión base */}
                            <SwiperSlide>
                                <div className="version-info">
                                    <h3>Versión Base</h3>
                                    <p>Está creando una nueva versión basada en la <strong>Versión {selectedVersion?.version}</strong> de la cotización.</p>

                                    <div className="version-details">
                                        <h4>Detalles de la versión base:</h4>
                                        <div className="detail-row">
                                            <span>Fecha de creación:</span>
                                            <span>{new Date(selectedVersion?.creationDate).toLocaleString()}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span>Estado:</span>
                                            <span>{selectedVersion?.status}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span>Total:</span>
                                            <span>${selectedVersion?.Total?.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="version-notice">
                                        <p>
                                            <strong>Nota:</strong> En los siguientes pasos podrá modificar las aberturas,
                                            complementos, agente y comentario. Los demás datos se mantendrán igual.
                                        </p>
                                    </div>
                                </div>
                            </SwiperSlide>

                            {/* Paso 1: Agente */}
                            <SwiperSlide>
                                <div className="agent-container">
                                    <h3>Agente del Cliente</h3>
                                    <p>Puede quitar y/o seleccionar un agente para esta cotización.</p>

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

                                    {agentSearchDni.length === 8 && agentSearched && (
                                        <div className="searching-agent">
                                            <p>Buscando agente...</p>
                                        </div>
                                    )}

                                    {agentSearchDni.length === 8 && !agentSearched && agentSearchResult && (
                                        <div className="agent-found">
                                            <p>Agente encontrado: <b>{agentSearchResult.name} {agentSearchResult.lastname}</b> - {agentSearchResult.dni}</p>
                                            <button type="button" className="botton-carusel" onClick={handleAddExistingAgent}>
                                                Agregar este agente
                                            </button>
                                        </div>
                                    )}

                                    {agentSearchDni.length === 8 && !agentSearched && !agentSearchResult && (
                                        <div className="form-group">
                                            <h5>No se encontró el agente. Complete los datos para crear uno nuevo:</h5>
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
                                            <button type="button" className="botton-carusel" onClick={handleAddNewAgent}>
                                                Agregar nuevo agente
                                            </button>
                                        </div>
                                    )}

                                    {/* Lista de agentes agregados */}
                                    <div className="agents-list">
                                        <h4>Agente seleccionado:</h4>
                                        {agents.length === 0 && (
                                            <div className="info-empty">
                                                {originalBudget.agent && Object.keys(originalBudget.agent).length > 1
                                                    ? "Manteniendo agente original"
                                                    : "No hay agente asignado"}
                                            </div>
                                        )}
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

                            {/* Paso 2: Aberturas */}
                            <SwiperSlide>
                                <OpeningType
                                    openingForm={openingForm}
                                    setOpeningForm={setOpeningForm}
                                    openingTypes={openingTypes}
                                    treatments={treatments}
                                    glassTypes={glassTypes}
                                    selectedOpenings={selectedOpenings}
                                    setSelectedOpenings={setSelectedOpenings}
                                    errors={currentIndex === 2 ? stepErrors : {}}
                                    openingConfigurations={openingConfigurations}
                                    hideSelectedList={true}
                                />
                            </SwiperSlide>

                            {/* Paso 3: Complementos */}
                            <SwiperSlide>
                                <Complements
                                    complementDoors={complementDoors}
                                    complementPartitions={complementPartitions}
                                    complementRailings={complementRailings}
                                    selectedComplements={selectedComplements}
                                    setSelectedComplements={setSelectedComplements}
                                />
                            </SwiperSlide>

                            {/* Paso 4: Comentarios y envío */}
                            <SwiperSlide>
                                <div className="comments-container">
                                    <h3>Comentarios para la Nueva Versión</h3>
                                    <div className="form-group">
                                        <label>Comentario:</label>
                                        <textarea
                                            value={comment}
                                            onChange={e => setComment(e.target.value)}
                                            placeholder="Agregue un comentario para esta nueva versión..."
                                            rows="6"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Referencias Actuales:</label>
                                        <div className="reference-display">
                                            <div className="reference-item">
                                                <span>Dólar compra oficial:</span>
                                                <span>{loadingPrices ? "Cargando..." : dolarCompra ? `$${dolarCompra}` : "No disponible"}</span>
                                            </div>
                                            <div className="reference-item">
                                                <span>Dólar venta oficial:</span>
                                                <span>{loadingPrices ? "Cargando..." : dolarVenta ? `$${dolarVenta}` : "No disponible"}</span>
                                            </div>
                                            <div className="reference-item">
                                                <span>Mano de obra:</span>
                                                <span>{labourReference !== null ? `$${labourReference}` : "No disponible"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="submit-container">
                                        <button
                                            type="button"
                                            className="submit-button"
                                            disabled={submitting}
                                            onClick={handleSubmitVersion}
                                        >
                                            {submitting ? "Creando versión..." : "Crear Nueva Versión"}
                                        </button>
                                        {submitError && (
                                            <div className="submit-error">{submitError}</div>
                                        )}
                                    </div>
                                </div>
                            </SwiperSlide>
                        </Swiper>
                    </form>
                </main>

                {/* Resumen */}
                <aside className="quotation-summary">
                    <h3 style={{ textAlign: "center" }}>Resumen de Cambios</h3>

                    {/* Aberturas */}
                    <div>
                        <h4 className='summary-section-title'>Aberturas:</h4>
                        {selectedOpenings.length === 0 && (
                            <div className="summary-empty">No hay aberturas modificadas.</div>
                        )}
                        {selectedOpenings.map((opening, idx) => (
                            <div key={idx} className="summary-item summary-opening-card">
                                <button
                                    className="summary-remove-btn"
                                    title="Quitar abertura"
                                    onClick={() => handleRemoveOpening(idx)}
                                    type="button"
                                >×</button>
                                <div className="summary-opening-content">
                                    <div className="summary-title">{getOpeningTypeName(opening.typeId)}</div>
                                    <div className="opening-measures">
                                        <div className="measure-row">Medidas: <span className="measure-value">{opening.width} x {opening.height} cm</span></div>
                                        <div className="measure-row">Paneles: <span className="measure-value">{opening.numPanelsWidth} × {opening.numPanelsHeight}</span></div>
                                        {opening.treatmentId && (
                                            <div className="measure-row">Tratamiento: <span className="measure-value">{getTreatmentName(opening.treatmentId)}</span></div>
                                        )}
                                        {opening.glassTypeId && (
                                            <div className="measure-row">Vidrio: <span className="measure-value">{getGlassTypeName(opening.glassTypeId)}</span></div>
                                        )}
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
                                    </div>
                                </div>
                                <div className="panel-preview-container">
                                    {renderPanelPreview(opening)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Complementos */}
                    <div className="complements-summary">
                        <h4 className='summary-section-title'>Complementos:</h4>
                        {selectedComplements.length === 0 && (
                            <div className="summary-empty">No hay complementos modificados.</div>
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
                                    {getComplementName(complement.complementId, complement.type)}
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
                    </div>

                    {/* Total General */}
                    <div className="general-total-section">
                        <h4 className='summary-section-title'>Total General</h4>
                        <div className="total-breakdown">
                            <div className="total-row">
                                <span>Subtotal aberturas:</span>
                                <span>${generalTotal.totalOpenings.toFixed(2)}</span>
                            </div>
                            <div className="total-row">
                                <span>Subtotal complementos:</span>
                                <span>${generalTotal.totalComplements.toFixed(2)}</span>
                            </div>
                            <div className="total-row subtotal">
                                <span>Subtotal general:</span>
                                <span>${generalTotal.subtotalGeneral.toFixed(2)}</span>
                            </div>
                            <div className="total-row cost">
                                <span>Costo fabricación (10%):</span>
                                <span>${generalTotal.costoFabricacion.toFixed(2)}</span>
                            </div>
                            <div className="total-row cost">
                                <span>Costo administrativo (5%):</span>
                                <span>${generalTotal.costoAdministrativo.toFixed(2)}</span>
                            </div>
                            <div className="total-row final-total">
                                <span>TOTAL GENERAL:</span>
                                <span>${generalTotal.totalGeneral.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            <Footer />
        </div>
    );
};

export default CreateBudgetVersion;