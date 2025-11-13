import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import logoAnodal from '../../images/logo_secundario.webp';
import { safeArray } from '../../utils/safeArray';
import '../../styles/BeneficioCotizaciones.css';
import html2pdf from 'html2pdf.js';
import { useNavigate } from "react-router-dom";
import { Calculator, X, Plus, Download, Settings, TrendingUp, Package, Paintbrush, Square, Ruler, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

const formatMoney = (v) => `$${Number(v || 0).toFixed(2)}`;

const BeneficioEnCotizacionesPorTipoDeLinea = () => {
    const [openingTypes, setOpeningTypes] = useState([]);
    const [openingConfigurations, setOpeningConfigurations] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [glassTypes, setGlassTypes] = useState([]);
    const [prices, setPrices] = useState([]);
    const [alumPrice, setAlumPrice] = useState(0);
    const [labourPrice, setLabourPrice] = useState(0);
    const [userRole, setUserRole] = useState('');
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [customPrices, setCustomPrices] = useState({});
    const [originalPrices, setOriginalPrices] = useState({});
    const [usingCustomPrices, setUsingCustomPrices] = useState(true);
    const [loading, setLoading] = useState(true);

    // Estado para pestañas
    const [tabs, setTabs] = useState([]);
    const [activeTab, setActiveTab] = useState(1);
    const [nextTabId, setNextTabId] = useState(2);
    const [formErrors, setFormErrors] = useState({});

    // Estados para control de acceso
    const [roleLoading, setRoleLoading] = useState(true);
    const requiredRoles = ['manager']; // Todos los roles pueden ver este reporte

    const navigate = useNavigate();

    // Verificación de rol
    useEffect(() => {
        const checkUserRole = () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/");
                return;
            }

            try {
                // Decodificar el JWT directamente - INSTANTÁNEO
                const payload = JSON.parse(atob(token.split('.')[1]));
                const role = payload?.role?.toLowerCase() ||
                    payload?.Role?.toLowerCase() ||
                    payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']?.toLowerCase();

                if (role) {
                    setUserRole(role);
                    setRoleLoading(false);
                    return; // ¡No hace falta llamar a la API!
                }
            } catch (error) {
                console.debug('No se pudo decodificar JWT');
            }

            // Fallback: llamar a la API solo si falla el JWT
            const fetchUserRoleFromAPI = async () => {
                try {
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const role = data?.user?.role?.toLowerCase();
                        setUserRole(role);
                    }
                } catch (error) {
                    console.error('Error verificando rol:', error);
                }
                setRoleLoading(false);
            };

            fetchUserRoleFromAPI();
        };

        checkUserRole();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    }

    // Obtener información del usuario
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        (async () => {
            try {
                const userRes = await axios.get(`${API_URL}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserRole(userRes.data.user?.role || 'user');
            } catch (err) {
                console.error("Error cargando datos de usuario:", err);
            }
        })();
    }, []);

    // Cargar datos iniciales
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        (async () => {
            try {
                setLoading(true);
                const [typesRes, configsRes, treatmentsRes, glassRes, pricesRes] = await Promise.all([
                    axios.get(`${API_URL}/api/opening-types`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/opening-configurations`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/alum-treatments`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/glass-types`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/prices`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                setOpeningTypes(safeArray(typesRes.data));
                setOpeningConfigurations(safeArray(configsRes.data));
                setTreatments(safeArray(treatmentsRes.data));
                setGlassTypes(safeArray(glassRes.data));
                setPrices(safeArray(pricesRes.data));

                const pricesData = safeArray(pricesRes.data);
                const alum = pricesData.find(p => p.name?.toLowerCase().includes("aluminio"));
                const labour = pricesData.find(p =>
                    p.name?.toLowerCase().includes("manoobra") ||
                    p.name?.toLowerCase().includes("manodeobra") ||
                    p.name?.toLowerCase().includes("mano de obra")
                );

                // Precios originales
                const originalPricesData = {
                    alumPrice: alum ? Number(alum.price) : 0,
                    labourPrice: labour ? Number(labour.price) : 0,
                    fabricationCost: 10,
                    administrativeCost: 5,
                    wasteCost: 10
                };

                // Cargar precios de vidrios
                const glassPrices = {};
                safeArray(glassRes.data).forEach(glass => {
                    glassPrices[`glass_${glass.id}`] = Number(glass.price) || 0;
                });

                // Cargar precios de tratamientos
                const treatmentPercentages = {};
                safeArray(treatmentsRes.data).forEach(treatment => {
                    treatmentPercentages[`treatment_${treatment.id}`] =
                        Number(treatment.pricePercentage || treatment.price_percentage) || 0;
                });

                setOriginalPrices({
                    ...originalPricesData,
                    ...glassPrices,
                    ...treatmentPercentages
                });

                setAlumPrice(alum ? Number(alum.price) : 0);
                setLabourPrice(labour ? Number(labour.price) : 0);
                setCustomPrices({
                    ...originalPricesData,
                    ...glassPrices,
                    ...treatmentPercentages
                });

                // Crear primera pestaña
                const initialTab = {
                    id: 1,
                    name: 'Abertura 1',
                    form: {
                        typeId: '',
                        treatmentId: '',
                        glassTypeId: '',
                        widthCm: '',
                        heightCm: '',
                        numPanelsWidth: undefined,
                        numPanelsHeight: undefined,
                        quantity: 1
                    },
                    result: null,
                    loading: false
                };
                setTabs([initialTab]);

            } catch (err) {
                console.error("Error cargando datos para reporte:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Helper para configuración sugerida
    const getSuggestedConfig = (typeId, widthCm, heightCm) => {
        const widthMM = widthCm ? Number(widthCm) * 10 : null;
        const heightMM = heightCm ? Number(heightCm) * 10 : null;
        if (!typeId || !widthMM || !heightMM) return null;
        return safeArray(openingConfigurations).find(cfg =>
            Number(cfg.opening_type_id) === Number(typeId) &&
            widthMM >= cfg.min_width_mm &&
            widthMM <= cfg.max_width_mm &&
            heightMM >= cfg.min_height_mm &&
            heightMM <= cfg.max_height_mm
        );
    };

    // Validar formulario
    const validateForm = (form) => {
        const errors = {};

        if (!form.typeId) errors.typeId = 'Seleccione un tipo de línea';
        if (!form.widthCm || form.widthCm < 10 || form.widthCm > 2000) errors.widthCm = 'Ancho debe ser entre 10 y 2000 cm';
        if (!form.heightCm || form.heightCm < 10 || form.heightCm > 2000) errors.heightCm = 'Alto debe ser entre 10 y 2000 cm';
        if (!form.treatmentId) errors.treatmentId = 'Seleccione un tratamiento';
        if (!form.glassTypeId) errors.glassTypeId = 'Seleccione un tipo de vidrio';
        if (!form.quantity || form.quantity < 1) errors.quantity = 'Cantidad debe ser al menos 1';

        return errors;
    };

    // Manejar cambios en formularios
    const handleFormChange = (tabId, field, value) => {
        setTabs(prev => prev.map(tab =>
            tab.id === tabId
                ? { ...tab, form: { ...tab.form, [field]: value } }
                : tab
        ));

        // Limpiar errores del campo modificado
        if (formErrors[tabId]?.[field]) {
            setFormErrors(prev => ({
                ...prev,
                [tabId]: {
                    ...prev[tabId],
                    [field]: null
                }
            }));
        }
    };

    // Calcular para una pestaña específica
    const handleCalculate = (tabId) => {
        const tab = tabs.find(t => t.id === tabId);
        if (!tab) return;

        const errors = validateForm(tab.form);
        if (Object.keys(errors).length > 0) {
            setFormErrors(prev => ({
                ...prev,
                [tabId]: errors
            }));
            return;
        }

        // Limpiar errores
        setFormErrors(prev => ({
            ...prev,
            [tabId]: {}
        }));

        setTabs(prev => prev.map(tab => {
            if (tab.id !== tabId) return tab;

            const { typeId, treatmentId, glassTypeId, widthCm, heightCm, numPanelsWidth, numPanelsHeight, quantity } = tab.form;

            // Usar precios personalizados si están activos
            const currentPrices = usingCustomPrices ? customPrices : originalPrices;
            const currentAlumPrice = currentPrices.alumPrice || alumPrice;
            const currentLabourPrice = currentPrices.labourPrice || labourPrice;
            const fabricationPercentage = currentPrices.fabricationCost || 10;
            const administrativePercentage = currentPrices.administrativeCost || 5;
            const wastePercentage = currentPrices.wasteCost || 10;

            try {
                const widthCMn = Number(widthCm);
                const heightCMn = Number(heightCm);
                const widthMM = widthCMn * 10;
                const heightMM = heightCMn * 10;
                const cfg = getSuggestedConfig(typeId, widthCMn, heightCMn);

                const numW = numPanelsWidth && Number(numPanelsWidth) > 0 ? Number(numPanelsWidth) : (cfg ? cfg.num_panels_width : 1);
                const numH = numPanelsHeight && Number(numPanelsHeight) > 0 ? Number(numPanelsHeight) : (cfg ? cfg.num_panels_height : 1);
                const totalPanels = numW * numH;

                const anchoPanelMM = widthMM / numW;
                const altoPanelMM = heightMM / numH;

                // Perimeter per panel (mm)
                const perimetroPanelMM = 2 * (anchoPanelMM + altoPanelMM);
                const totalAluminioMM = perimetroPanelMM * totalPanels * (Number(quantity) || 1);
                const totalAluminioM = totalAluminioMM / 1000;
                const openingTypeObj = safeArray(openingTypes).find(t => Number(t.id) === Number(typeId));
                const pesoAluminio = openingTypeObj && openingTypeObj.weight ? totalAluminioM * Number(openingTypeObj.weight) : 0;

                // Aplicar desperdicio
                const pesoAluminioConDesperdicio = pesoAluminio * (1 + wastePercentage / 100);
                const costoAluminio = pesoAluminioConDesperdicio * currentAlumPrice;

                // Vidrio
                const areaPanelM2 = (anchoPanelMM / 1000) * (altoPanelMM / 1000);
                const areaTotalVidrio = areaPanelM2 * totalPanels * (Number(quantity) || 1);
                const glassObj = safeArray(glassTypes).find(g => Number(g.id) === Number(glassTypeId));
                const glassPriceKey = `glass_${glassTypeId}`;
                const glassPrice = currentPrices[glassPriceKey] || (glassObj ? Number(glassObj.price || 0) : 0);
                const costoVidrio = areaTotalVidrio * glassPrice;

                // Tratamiento
                const treatmentObj = safeArray(treatments).find(t => Number(t.id) === Number(treatmentId));
                const treatmentPriceKey = `treatment_${treatmentId}`;
                const tratamientoPorc = currentPrices[treatmentPriceKey] ||
                    (treatmentObj && (treatmentObj.pricePercentage || treatmentObj.price_percentage)
                        ? Number(treatmentObj.pricePercentage || treatmentObj.price_percentage)
                        : 0);
                const costoTratamiento = costoAluminio * (tratamientoPorc / 100);

                // Mano de obra
                const costoManoObra = currentLabourPrice * (Number(quantity) || 1);

                // Subtotal y costos adicionales
                const subtotal = costoAluminio + costoTratamiento + costoVidrio + costoManoObra;
                const costoFabricacion = subtotal * (fabricationPercentage / 100);
                const costoAdministrativo = subtotal * (administrativePercentage / 100);

                // Beneficio
                const beneficio = costoManoObra + costoFabricacion + costoAdministrativo;
                const beneficioPorcSobreSubtotal = subtotal > 0 ? (beneficio / subtotal) * 100 : 0;
                const total = subtotal + costoFabricacion + costoAdministrativo;

                const result = {
                    cfg,
                    numW,
                    numH,
                    totalPanels,
                    anchoPanelMM,
                    altoPanelMM,
                    totalAluminioM,
                    areaTotalVidrio,
                    pesoAluminio: pesoAluminioConDesperdicio,
                    costoAluminio,
                    costoTratamiento,
                    costoVidrio,
                    costoManoObra,
                    subtotal,
                    costoFabricacion,
                    costoAdministrativo,
                    total,
                    beneficio,
                    beneficioPorcSobreSubtotal,
                    quantity: Number(quantity),
                    tratamientoPorc,
                    fabricationPercentage,
                    administrativePercentage,
                    wastePercentage,
                    usingCustomPrices
                };

                return { ...tab, result, loading: false };
            } catch (err) {
                console.error("Error calculando:", err);
                return { ...tab, loading: false };
            }
        }));
    };

    // Manejar pestañas
    const addNewTab = () => {
        if (tabs.length >= 5) {
            alert('Máximo 5 pestañas permitidas');
            return;
        }

        const newTab = {
            id: nextTabId,
            name: `Abertura ${nextTabId}`,
            form: {
                typeId: '',
                treatmentId: '',
                glassTypeId: '',
                widthCm: '',
                heightCm: '',
                numPanelsWidth: undefined,
                numPanelsHeight: undefined,
                quantity: 1
            },
            result: null,
            loading: false
        };

        setTabs(prev => [...prev, newTab]);
        setActiveTab(newTab.id);
        setNextTabId(prev => prev + 1);
    };

    const closeTab = (tabId, e) => {
        e.stopPropagation();
        if (tabs.length === 1) {
            alert('Debe haber al menos una pestaña');
            return;
        }

        const newTabs = tabs.filter(tab => tab.id !== tabId);
        setTabs(newTabs);

        if (activeTab === tabId) {
            setActiveTab(newTabs[0].id);
        }
    };

    const getActiveTab = () => tabs.find(tab => tab.id === activeTab);

    // Exportar PDF
    //const handleExportPDF = (tabId = null) => {
    //    const tabToExport = tabId ? tabs.find(tab => tab.id === tabId) : getActiveTab();
    //    if (!tabToExport?.result) {
    //        alert('No hay resultados para exportar');
    //        return;
    //    }

    //    const element = document.getElementById(`pdf-content-${tabToExport.id}`);
    //    if (!element) return;

    //    const opt = {
    //        margin: [0.5, 0.5],
    //        filename: `beneficio_abertura_${tabToExport.id}_${Date.now()}.pdf`,
    //        image: { type: 'jpeg', quality: 0.98 },
    //        html2canvas: { scale: 2 },
    //        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    //    };

    //    html2pdf().set(opt).from(element).save();
    //};

    // Manejar precios personalizados
    const handlePriceChange = (field, value) => {
        setCustomPrices(prev => ({
            ...prev,
            [field]: Number(value) || 0
        }));
    };

    const saveCustomPrices = () => {
        setShowPriceModal(false);
        setUsingCustomPrices(true);
        // Recalcular automáticamente todas las pestañas con resultados existentes
        const updatedTabs = tabs.map(tab => {
            if (tab.result) {
                // Simular el cálculo sin necesidad de hacer click
                const { typeId, treatmentId, glassTypeId, widthCm, heightCm, numPanelsWidth, numPanelsHeight, quantity } = tab.form;

                if (!typeId || !widthCm || !heightCm || !treatmentId || !glassTypeId) {
                    return tab;
                }

                try {
                    const widthCMn = Number(widthCm);
                    const heightCMn = Number(heightCm);
                    const widthMM = widthCMn * 10;
                    const heightMM = heightCMn * 10;
                    const cfg = getSuggestedConfig(typeId, widthCMn, heightCMn);

                    const numW = numPanelsWidth && Number(numPanelsWidth) > 0 ? Number(numPanelsWidth) : (cfg ? cfg.num_panels_width : 1);
                    const numH = numPanelsHeight && Number(numPanelsHeight) > 0 ? Number(numPanelsHeight) : (cfg ? cfg.num_panels_height : 1);
                    const totalPanels = numW * numH;

                    const anchoPanelMM = widthMM / numW;
                    const altoPanelMM = heightMM / numH;

                    // Perimeter per panel (mm)
                    const perimetroPanelMM = 2 * (anchoPanelMM + altoPanelMM);
                    const totalAluminioMM = perimetroPanelMM * totalPanels * (Number(quantity) || 1);
                    const totalAluminioM = totalAluminioMM / 1000;
                    const openingTypeObj = safeArray(openingTypes).find(t => Number(t.id) === Number(typeId));
                    const pesoAluminio = openingTypeObj && openingTypeObj.weight ? totalAluminioM * Number(openingTypeObj.weight) : 0;

                    // Aplicar desperdicio
                    const pesoAluminioConDesperdicio = pesoAluminio * (1 + customPrices.wasteCost / 100);
                    const costoAluminio = pesoAluminioConDesperdicio * customPrices.alumPrice;

                    // Vidrio
                    const areaPanelM2 = (anchoPanelMM / 1000) * (altoPanelMM / 1000);
                    const areaTotalVidrio = areaPanelM2 * totalPanels * (Number(quantity) || 1);
                    const glassPriceKey = `glass_${glassTypeId}`;
                    const glassPrice = customPrices[glassPriceKey] || 0;
                    const costoVidrio = areaTotalVidrio * glassPrice;

                    // Tratamiento
                    const treatmentPriceKey = `treatment_${treatmentId}`;
                    const tratamientoPorc = customPrices[treatmentPriceKey] || 0;
                    const costoTratamiento = costoAluminio * (tratamientoPorc / 100);

                    // Mano de obra
                    const costoManoObra = customPrices.labourPrice * (Number(quantity) || 1);

                    // Subtotal y costos adicionales
                    const subtotal = costoAluminio + costoTratamiento + costoVidrio + costoManoObra;
                    const costoFabricacion = subtotal * (customPrices.fabricationCost / 100);
                    const costoAdministrativo = subtotal * (customPrices.administrativeCost / 100);

                    // Beneficio
                    const beneficio = costoManoObra + costoFabricacion + costoAdministrativo;
                    const beneficioPorcSobreSubtotal = subtotal > 0 ? (beneficio / subtotal) * 100 : 0;
                    const total = subtotal + costoFabricacion + costoAdministrativo;

                    const result = {
                        cfg,
                        numW,
                        numH,
                        totalPanels,
                        anchoPanelMM,
                        altoPanelMM,
                        totalAluminioM,
                        areaTotalVidrio,
                        pesoAluminio: pesoAluminioConDesperdicio,
                        costoAluminio,
                        costoTratamiento,
                        costoVidrio,
                        costoManoObra,
                        subtotal,
                        costoFabricacion,
                        costoAdministrativo,
                        total,
                        beneficio,
                        beneficioPorcSobreSubtotal,
                        quantity: Number(quantity),
                        tratamientoPorc,
                        fabricationPercentage: customPrices.fabricationCost,
                        administrativePercentage: customPrices.administrativeCost,
                        wastePercentage: customPrices.wasteCost,
                        usingCustomPrices: true
                    };

                    return { ...tab, result };
                } catch (err) {
                    console.error("Error recalculando con precios simulados:", err);
                    return tab;
                }
            }
            return tab;
        });

        setTabs(updatedTabs);
    };

    const resetToOriginalPrices = () => {
        setUsingCustomPrices(false);
        // Recalcular automáticamente todas las pestañas con resultados existentes
        const updatedTabs = tabs.map(tab => {
            if (tab.result) {
                // Simular el cálculo sin necesidad de hacer click
                const { typeId, treatmentId, glassTypeId, widthCm, heightCm, numPanelsWidth, numPanelsHeight, quantity } = tab.form;

                if (!typeId || !widthCm || !heightCm || !treatmentId || !glassTypeId) {
                    return tab;
                }

                try {
                    const widthCMn = Number(widthCm);
                    const heightCMn = Number(heightCm);
                    const widthMM = widthCMn * 10;
                    const heightMM = heightCMn * 10;
                    const cfg = getSuggestedConfig(typeId, widthCMn, heightCMn);

                    const numW = numPanelsWidth && Number(numPanelsWidth) > 0 ? Number(numPanelsWidth) : (cfg ? cfg.num_panels_width : 1);
                    const numH = numPanelsHeight && Number(numPanelsHeight) > 0 ? Number(numPanelsHeight) : (cfg ? cfg.num_panels_height : 1);
                    const totalPanels = numW * numH;

                    const anchoPanelMM = widthMM / numW;
                    const altoPanelMM = heightMM / numH;

                    // Perimeter per panel (mm)
                    const perimetroPanelMM = 2 * (anchoPanelMM + altoPanelMM);
                    const totalAluminioMM = perimetroPanelMM * totalPanels * (Number(quantity) || 1);
                    const totalAluminioM = totalAluminioMM / 1000;
                    const openingTypeObj = safeArray(openingTypes).find(t => Number(t.id) === Number(typeId));
                    const pesoAluminio = openingTypeObj && openingTypeObj.weight ? totalAluminioM * Number(openingTypeObj.weight) : 0;

                    // Aplicar desperdicio
                    const pesoAluminioConDesperdicio = pesoAluminio * (1 + originalPrices.wasteCost / 100);
                    const costoAluminio = pesoAluminioConDesperdicio * originalPrices.alumPrice;

                    // Vidrio
                    const areaPanelM2 = (anchoPanelMM / 1000) * (altoPanelMM / 1000);
                    const areaTotalVidrio = areaPanelM2 * totalPanels * (Number(quantity) || 1);
                    const glassObj = safeArray(glassTypes).find(g => Number(g.id) === Number(glassTypeId));
                    const glassPrice = glassObj ? Number(glassObj.price || 0) : 0;
                    const costoVidrio = areaTotalVidrio * glassPrice;

                    // Tratamiento
                    const treatmentObj = safeArray(treatments).find(t => Number(t.id) === Number(treatmentId));
                    const tratamientoPorc = treatmentObj && (treatmentObj.pricePercentage || treatmentObj.price_percentage)
                        ? Number(treatmentObj.pricePercentage || treatmentObj.price_percentage)
                        : 0;
                    const costoTratamiento = costoAluminio * (tratamientoPorc / 100);

                    // Mano de obra
                    const costoManoObra = originalPrices.labourPrice * (Number(quantity) || 1);

                    // Subtotal y costos adicionales
                    const subtotal = costoAluminio + costoTratamiento + costoVidrio + costoManoObra;
                    const costoFabricacion = subtotal * (originalPrices.fabricationCost / 100);
                    const costoAdministrativo = subtotal * (originalPrices.administrativeCost / 100);

                    // Beneficio
                    const beneficio = costoManoObra + costoFabricacion + costoAdministrativo;
                    const beneficioPorcSobreSubtotal = subtotal > 0 ? (beneficio / subtotal) * 100 : 0;
                    const total = subtotal + costoFabricacion + costoAdministrativo;

                    const result = {
                        cfg,
                        numW,
                        numH,
                        totalPanels,
                        anchoPanelMM,
                        altoPanelMM,
                        totalAluminioM,
                        areaTotalVidrio,
                        pesoAluminio: pesoAluminioConDesperdicio,
                        costoAluminio,
                        costoTratamiento,
                        costoVidrio,
                        costoManoObra,
                        subtotal,
                        costoFabricacion,
                        costoAdministrativo,
                        total,
                        beneficio,
                        beneficioPorcSobreSubtotal,
                        quantity: Number(quantity),
                        tratamientoPorc,
                        fabricationPercentage: originalPrices.fabricationCost,
                        administrativePercentage: originalPrices.administrativeCost,
                        wastePercentage: originalPrices.wasteCost,
                        usingCustomPrices: false
                    };

                    return { ...tab, result };
                } catch (err) {
                    console.error("Error recalculando con precios originales:", err);
                    return tab;
                }
            }
            return tab;
        });

        setTabs(updatedTabs);
    };

    const activateCustomPrices = () => {
        setUsingCustomPrices(true);
        // Recalcular automáticamente todas las pestañas con resultados existentes
        const updatedTabs = tabs.map(tab => {
            if (tab.result) {
                // Simular el cálculo sin necesidad de hacer click
                const { typeId, treatmentId, glassTypeId, widthCm, heightCm, numPanelsWidth, numPanelsHeight, quantity } = tab.form;

                if (!typeId || !widthCm || !heightCm || !treatmentId || !glassTypeId) {
                    return tab;
                }

                try {
                    const widthCMn = Number(widthCm);
                    const heightCMn = Number(heightCm);
                    const widthMM = widthCMn * 10;
                    const heightMM = heightCMn * 10;
                    const cfg = getSuggestedConfig(typeId, widthCMn, heightCMn);

                    const numW = numPanelsWidth && Number(numPanelsWidth) > 0 ? Number(numPanelsWidth) : (cfg ? cfg.num_panels_width : 1);
                    const numH = numPanelsHeight && Number(numPanelsHeight) > 0 ? Number(numPanelsHeight) : (cfg ? cfg.num_panels_height : 1);
                    const totalPanels = numW * numH;

                    const anchoPanelMM = widthMM / numW;
                    const altoPanelMM = heightMM / numH;

                    // Perimeter per panel (mm)
                    const perimetroPanelMM = 2 * (anchoPanelMM + altoPanelMM);
                    const totalAluminioMM = perimetroPanelMM * totalPanels * (Number(quantity) || 1);
                    const totalAluminioM = totalAluminioMM / 1000;
                    const openingTypeObj = safeArray(openingTypes).find(t => Number(t.id) === Number(typeId));
                    const pesoAluminio = openingTypeObj && openingTypeObj.weight ? totalAluminioM * Number(openingTypeObj.weight) : 0;

                    // Aplicar desperdicio
                    const pesoAluminioConDesperdicio = pesoAluminio * (1 + customPrices.wasteCost / 100);
                    const costoAluminio = pesoAluminioConDesperdicio * customPrices.alumPrice;

                    // Vidrio
                    const areaPanelM2 = (anchoPanelMM / 1000) * (altoPanelMM / 1000);
                    const areaTotalVidrio = areaPanelM2 * totalPanels * (Number(quantity) || 1);
                    const glassPriceKey = `glass_${glassTypeId}`;
                    const glassPrice = customPrices[glassPriceKey] || 0;
                    const costoVidrio = areaTotalVidrio * glassPrice;

                    // Tratamiento
                    const treatmentPriceKey = `treatment_${treatmentId}`;
                    const tratamientoPorc = customPrices[treatmentPriceKey] || 0;
                    const costoTratamiento = costoAluminio * (tratamientoPorc / 100);

                    // Mano de obra
                    const costoManoObra = customPrices.labourPrice * (Number(quantity) || 1);

                    // Subtotal y costos adicionales
                    const subtotal = costoAluminio + costoTratamiento + costoVidrio + costoManoObra;
                    const costoFabricacion = subtotal * (customPrices.fabricationCost / 100);
                    const costoAdministrativo = subtotal * (customPrices.administrativeCost / 100);

                    // Beneficio
                    const beneficio = costoManoObra + costoFabricacion + costoAdministrativo;
                    const beneficioPorcSobreSubtotal = subtotal > 0 ? (beneficio / subtotal) * 100 : 0;
                    const total = subtotal + costoFabricacion + costoAdministrativo;

                    const result = {
                        cfg,
                        numW,
                        numH,
                        totalPanels,
                        anchoPanelMM,
                        altoPanelMM,
                        totalAluminioM,
                        areaTotalVidrio,
                        pesoAluminio: pesoAluminioConDesperdicio,
                        costoAluminio,
                        costoTratamiento,
                        costoVidrio,
                        costoManoObra,
                        subtotal,
                        costoFabricacion,
                        costoAdministrativo,
                        total,
                        beneficio,
                        beneficioPorcSobreSubtotal,
                        quantity: Number(quantity),
                        tratamientoPorc,
                        fabricationPercentage: customPrices.fabricationCost,
                        administrativePercentage: customPrices.administrativeCost,
                        wastePercentage: customPrices.wasteCost,
                        usingCustomPrices: true
                    };

                    return { ...tab, result };
                } catch (err) {
                    console.error("Error recalculando con precios simulados:", err);
                    return tab;
                }
            }
            return tab;
        });

        setTabs(updatedTabs);
    };

    // Obtener errores para la pestaña activa
    const getActiveTabErrors = () => {
        return formErrors[activeTab] || {};
    };

    // Loading mientras verifica rol
    if (roleLoading) {
        return (
            <div className="dashboard-container">
                <Navigation onLogout={handleLogout} />
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '50vh',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p>Verificando acceso...</p>
                </div>
                <Footer />
            </div>
        );
    }

    // Usuario no autorizado
    if (userRole && !requiredRoles.includes(userRole)) {
        return (
            <div className="dashboard-container">
                <Navigation onLogout={handleLogout} />
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '60vh',
                    flexDirection: 'column',
                    textAlign: 'center',
                    padding: '2rem'
                }}>
                    <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Acceso Denegado</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        No tiene permisos para ver este recurso.
                    </p>
                    <p style={{ marginBottom: '2rem', color: '#6b7280' }}>
                        Este reporte está disponible para cotizadores, coordinadores y gerentes.
                    </p>
                    <button
                        onClick={() => navigate('/reportes')}
                        style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Volver a Reportes
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="beneficio-dashboard-container">
                <Navigation onLogout={handleLogout} />
                <div className="loading-fullscreen">
                    <div className="loading-spinner-large">
                        <loading-spinner />
                    </div>
                    <h3>Cargando reporte...</h3>
                    <p>Estamos preparando todo para usted</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />

            <div className="beneficio-main-wrapper">
                <div className="beneficio-content-container">

                    {/* HEADER */}
                    <div className="beneficio-header">
                        <div className="header-title">
                            <TrendingUp size={32} />
                            <div>
                                <h1>Beneficio en Cotizaciones por Tipo de Línea</h1>
                                <p>Análisis de márgenes y costos por configuración</p>
                            </div>
                        </div>
                        <div className="header-actions">
                            {userRole === 'manager' && (
                                <>
                                    <button
                                        className={`btn ${usingCustomPrices ? 'btn-warning' : 'btn-success'}`}
                                        onClick={usingCustomPrices ? resetToOriginalPrices : activateCustomPrices}
                                        title={usingCustomPrices ? "Volver a precios originales" : "Usar precios simulados"}
                                    >
                                        <RotateCcw size={18} />
                                        {usingCustomPrices ? 'Originales' : 'Simulados'}
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setShowPriceModal(true)}
                                    >
                                        <Settings size={18} />
                                        Simular Precios
                                    </button>
                                </>
                            )}
                            {/*<button*/}
                            {/*    className="btn btn-primary"*/}
                            {/*    onClick={() => handleExportPDF()}*/}
                            {/*    disabled={!getActiveTab()?.result}*/}
                            {/*>*/}
                            {/*    <Download size={18} />*/}
                            {/*    Exportar PDF*/}
                            {/*</button>*/}
                        </div>
                    </div>

                    {/* PESTAÑAS */}
                    <div className="tabs-container">
                        <div className="tabs-header">
                            {tabs.map(tab => (
                                <div
                                    key={tab.id}
                                    className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <span>{tab.name}</span>
                                    {tabs.length > 1 && (
                                        <button
                                            className="tab-close"
                                            onClick={(e) => closeTab(tab.id, e)}
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {tabs.length < 5 && (
                                <button className="tab-add" onClick={addNewTab}>
                                    <Plus size={18} />
                                </button>
                            )}
                        </div>

                        {/* CONTENIDO DE PESTAÑA ACTIVA */}
                        {tabs.map(tab => (
                            <div
                                key={tab.id}
                                className={`tab-content ${activeTab === tab.id ? 'active' : ''}`}
                            >
                                <div className="content-grid-three">

                                    {/* COLUMNA 1 - PARÁMETROS */}
                                    <div className="parameters-panel">
                                        <div className="panel-header">
                                            <Calculator size={20} />
                                            <h3>Parámetros de Configuración</h3>
                                        </div>
                                        <div className="panel-content">
                                            <div className="form-grid-compact">
                                                <div className={`form-group ${getActiveTabErrors().typeId ? 'error' : ''}`}>
                                                    <label>
                                                        <Package size={16} />
                                                        Tipo de línea:
                                                    </label>
                                                    <select
                                                        value={tab.form.typeId}
                                                        onChange={e => handleFormChange(tab.id, 'typeId', e.target.value)}
                                                        className={getActiveTabErrors().typeId ? 'error' : ''}
                                                    >
                                                        <option value="">Seleccione tipo</option>
                                                        {safeArray(openingTypes).map(t => (
                                                            <option key={t.id} value={t.id}>{t.name || t.type}</option>
                                                        ))}
                                                    </select>
                                                    {getActiveTabErrors().typeId && (
                                                        <div className="error-message">
                                                            <AlertCircle size={14} />
                                                            {getActiveTabErrors().typeId}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={`form-group ${getActiveTabErrors().widthCm || getActiveTabErrors().heightCm ? 'error' : ''}`}>
                                                    <label>Medidas (cm):</label>
                                                    <div className="dimension-inputs">
                                                        <input
                                                            type="number"
                                                            min={10}
                                                            max={2000}
                                                            placeholder="Ancho"
                                                            value={tab.form.widthCm}
                                                            onChange={e => handleFormChange(tab.id, 'widthCm', e.target.value)}
                                                            className={getActiveTabErrors().widthCm ? 'error' : ''}
                                                        />
                                                        <span className="dimension-separator">×</span>
                                                        <input
                                                            type="number"
                                                            min={10}
                                                            max={2000}
                                                            placeholder="Alto"
                                                            value={tab.form.heightCm}
                                                            onChange={e => handleFormChange(tab.id, 'heightCm', e.target.value)}
                                                            className={getActiveTabErrors().heightCm ? 'error' : ''}
                                                        />
                                                    </div>
                                                    {(getActiveTabErrors().widthCm || getActiveTabErrors().heightCm) && (
                                                        <div className="error-message">
                                                            <AlertCircle size={14} />
                                                            {getActiveTabErrors().widthCm || getActiveTabErrors().heightCm}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={`form-group ${getActiveTabErrors().treatmentId ? 'error' : ''}`}>
                                                    <label>
                                                        <Paintbrush size={16} />
                                                        Tratamiento:
                                                    </label>
                                                    <select
                                                        value={tab.form.treatmentId}
                                                        onChange={e => handleFormChange(tab.id, 'treatmentId', e.target.value)}
                                                        className={getActiveTabErrors().treatmentId ? 'error' : ''}
                                                    >
                                                        <option value="">Seleccione tratamiento</option>
                                                        {safeArray(treatments).map(t => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ))}
                                                    </select>
                                                    {getActiveTabErrors().treatmentId && (
                                                        <div className="error-message">
                                                            <AlertCircle size={14} />
                                                            {getActiveTabErrors().treatmentId}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={`form-group ${getActiveTabErrors().glassTypeId ? 'error' : ''}`}>
                                                    <label>
                                                        <Square size={16} />
                                                        Vidrio:
                                                    </label>
                                                    <select
                                                        value={tab.form.glassTypeId}
                                                        onChange={e => handleFormChange(tab.id, 'glassTypeId', e.target.value)}
                                                        className={getActiveTabErrors().glassTypeId ? 'error' : ''}
                                                    >
                                                        <option value="">Seleccione vidrio</option>
                                                        {safeArray(glassTypes).map(g => (
                                                            <option key={g.id} value={g.id}>{g.name}</option>
                                                        ))}
                                                    </select>
                                                    {getActiveTabErrors().glassTypeId && (
                                                        <div className="error-message">
                                                            <AlertCircle size={14} />
                                                            {getActiveTabErrors().glassTypeId}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="form-group">
                                                    <label>Paneles:</label>
                                                    <div className="dimension-inputs">
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            placeholder="Ancho"
                                                            value={tab.form.numPanelsWidth ?? (getSuggestedConfig(tab.form.typeId, tab.form.widthCm, tab.form.heightCm)?.num_panels_width || 1)}
                                                            onChange={e => handleFormChange(tab.id, 'numPanelsWidth', e.target.value)}
                                                        />
                                                        <span className="dimension-separator">×</span>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            placeholder="Alto"
                                                            value={tab.form.numPanelsHeight ?? (getSuggestedConfig(tab.form.typeId, tab.form.widthCm, tab.form.heightCm)?.num_panels_height || 1)}
                                                            onChange={e => handleFormChange(tab.id, 'numPanelsHeight', e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className={`form-group ${getActiveTabErrors().quantity ? 'error' : ''}`}>
                                                    <label>Cantidad aberturas:</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={tab.form.quantity}
                                                        onChange={e => handleFormChange(tab.id, 'quantity', e.target.value)}
                                                        className={getActiveTabErrors().quantity ? 'error' : ''}
                                                    />
                                                    {getActiveTabErrors().quantity && (
                                                        <div className="error-message">
                                                            <AlertCircle size={14} />
                                                            {getActiveTabErrors().quantity}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Mensaje de error general */}
                                                {Object.keys(getActiveTabErrors()).length > 0 && (
                                                    <div className="general-error-message">
                                                        <AlertCircle size={16} />
                                                        Complete todos los campos requeridos correctamente
                                                    </div>
                                                )}

                                                <button
                                                    className="btn btn-calculate"
                                                    onClick={() => handleCalculate(tab.id)}
                                                    disabled={tab.loading}
                                                >
                                                    <Calculator size={18} />
                                                    {tab.loading ? 'Calculando...' : 'Calcular Cotización'}
                                                </button>

                                                {usingCustomPrices && tab.result && (
                                                    <div className="custom-prices-indicator">
                                                        <div className="indicator-dot"></div>
                                                        <span>Usando precios {usingCustomPrices ? 'simulados' : 'originales'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* COLUMNA 2 - DESGLOSE */}
                                    <div className="breakdown-panel">
                                        <div className="panel-header">
                                            <TrendingUp size={20} />
                                            <h3>Desglose Detallado de Costos</h3>
                                        </div>
                                        <div className="panel-content">
                                            {!tab.result ? (
                                                <div className="no-result">
                                                    Complete los parámetros y presione "Calcular Cotización" para ver los resultados.
                                                </div>
                                            ) : (
                                                <div className="breakdown-list-detailed">
                                                    <div className="breakdown-item">
                                                        <div className="breakdown-icon-wrapper">
                                                            <Package className="breakdown-icon-svg" />
                                                        </div>
                                                        <div className="breakdown-details">
                                                            <div className="breakdown-label">
                                                                <span className="breakdown-title">Aluminio</span>
                                                                <span className="breakdown-subtitle">{tab.result.totalAluminioM.toFixed(1)}m, {tab.result.pesoAluminio.toFixed(1)}kg (incl. {tab.result.wastePercentage}% desperdicio)</span>
                                                            </div>
                                                            <div className="breakdown-amount-large">{formatMoney(tab.result.costoAluminio)}</div>
                                                        </div>
                                                    </div>

                                                    <div className="breakdown-item">
                                                        <div className="breakdown-icon-wrapper">
                                                            <Paintbrush className="breakdown-icon-svg" />
                                                        </div>
                                                        <div className="breakdown-details">
                                                            <div className="breakdown-label">
                                                                <span className="breakdown-title">Tratamiento</span>
                                                                <span className="breakdown-subtitle">{tab.result.tratamientoPorc}% sobre costo de aluminio</span>
                                                            </div>
                                                            <div className="breakdown-amount-large">{formatMoney(tab.result.costoTratamiento)}</div>
                                                        </div>
                                                    </div>

                                                    <div className="breakdown-item">
                                                        <div className="breakdown-icon-wrapper">
                                                            <Square className="breakdown-icon-svg" />
                                                        </div>
                                                        <div className="breakdown-details">
                                                            <div className="breakdown-label">
                                                                <span className="breakdown-title">Vidrio</span>
                                                                <span className="breakdown-subtitle">{tab.result.areaTotalVidrio.toFixed(2)}m²</span>
                                                            </div>
                                                            <div className="breakdown-amount-large">{formatMoney(tab.result.costoVidrio)}</div>
                                                        </div>
                                                    </div>

                                                    <div className="breakdown-item">
                                                        <div className="breakdown-icon-wrapper">
                                                            <Ruler className="breakdown-icon-svg" />
                                                        </div>
                                                        <div className="breakdown-details">
                                                            <div className="breakdown-label">
                                                                <span className="breakdown-title">Mano de obra</span>
                                                                <span className="breakdown-subtitle">{tab.result.quantity} unidad(es)</span>
                                                            </div>
                                                            <div className="breakdown-amount-large">{formatMoney(tab.result.costoManoObra)}</div>
                                                        </div>
                                                    </div>

                                                    <div className="breakdown-divider">
                                                        <div className="breakdown-label-large">
                                                            <span className="breakdown-title">SUBTOTAL</span>
                                                        </div>
                                                        <div className="breakdown-amount-large">{formatMoney(tab.result.subtotal)}</div>
                                                    </div>

                                                    <div className="breakdown-item">
                                                        <div className="breakdown-icon-wrapper">
                                                            <Settings className="breakdown-icon-svg" />
                                                        </div>
                                                        <div className="breakdown-details">
                                                            <div className="breakdown-label">
                                                                <span className="breakdown-title">Costo fabricación</span>
                                                                <span className="breakdown-subtitle">{tab.result.fabricationPercentage}% sobre subtotal</span>
                                                            </div>
                                                            <div className="breakdown-amount-large">{formatMoney(tab.result.costoFabricacion)}</div>
                                                        </div>
                                                    </div>

                                                    <div className="breakdown-item">
                                                        <div className="breakdown-icon-wrapper">
                                                            <TrendingUp className="breakdown-icon-svg" />
                                                        </div>
                                                        <div className="breakdown-details">
                                                            <div className="breakdown-label">
                                                                <span className="breakdown-title">Costo administrativo</span>
                                                                <span className="breakdown-subtitle">{tab.result.administrativePercentage}% sobre subtotal</span>
                                                            </div>
                                                            <div className="breakdown-amount-large">{formatMoney(tab.result.costoAdministrativo)}</div>
                                                        </div>
                                                    </div>

                                                    {(userRole === 'manager' || userRole === 'coordinator') ? (
                                                        <>
                                                            <div className="breakdown-total">
                                                                <div className="breakdown-label-large">
                                                                    <span className="breakdown-title">BENEFICIO</span>
                                                                </div>
                                                                <div className="breakdown-amount-large highlight">{formatMoney(tab.result.beneficio)}</div>
                                                            </div>

                                                            <div className="breakdown-final">
                                                                <div className="breakdown-label-large">
                                                                    <span className="breakdown-title">TOTAL</span>
                                                                </div>
                                                                <div className="breakdown-amount-large final">{formatMoney(tab.result.total)}</div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="breakdown-final">
                                                            <div className="breakdown-label-large">
                                                                <span className="breakdown-title">TOTAL</span>
                                                            </div>
                                                            <div className="breakdown-amount-large final">{formatMoney(tab.result.total)}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* COLUMNA 3 - VISUALIZACIÓN Y KPIs */}
                                    <div className="visualization-panel">
                                        <div className="panel-header">
                                            <Square size={20} />
                                            <h3>Visualización & Métricas</h3>
                                        </div>
                                        <div className="panel-content">
                                            {!tab.result ? (
                                                <div className="no-result">
                                                    Los resultados aparecerán aquí después del cálculo.
                                                </div>
                                            ) : (
                                                <>
                                                    {/* VISUALIZACIÓN DE ABERTURA */}
                                                    <div className="preview-section">
                                                        <h4>Vista Previa</h4>
                                                        <div className="preview-container-enhanced">
                                                            <div className="opening-preview-enhanced">
                                                                <svg
                                                                    width="100%"
                                                                    height="160"
                                                                    viewBox={`0 0 ${Number(tab.form.widthCm || 120)} ${Number(tab.form.heightCm || 80)}`}
                                                                    preserveAspectRatio="xMidYMid meet"
                                                                >
                                                                    {/* Fondo blanco */}
                                                                    <rect
                                                                        x="0" y="0"
                                                                        width={Number(tab.form.widthCm || 120)}
                                                                        height={Number(tab.form.heightCm || 80)}
                                                                        fill="#ffffff"
                                                                        stroke="#000000"
                                                                        strokeWidth={1}
                                                                        rx={2}
                                                                    />
                                                                    {/* Líneas de panel verticales */}
                                                                    {Array.from({ length: Math.max(0, tab.result.numW - 1) }).map((_, i) => (
                                                                        <line
                                                                            key={`v-${i}`}
                                                                            x1={((i + 1) * Number(tab.form.widthCm || 120) / tab.result.numW)}
                                                                            y1={0}
                                                                            x2={((i + 1) * Number(tab.form.widthCm || 120) / tab.result.numW)}
                                                                            y2={Number(tab.form.heightCm || 80)}
                                                                            stroke="#000000"
                                                                            strokeWidth={1.5}
                                                                        />
                                                                    ))}
                                                                    {/* Líneas de panel horizontales */}
                                                                    {Array.from({ length: Math.max(0, tab.result.numH - 1) }).map((_, i) => (
                                                                        <line
                                                                            key={`h-${i}`}
                                                                            x1={0}
                                                                            y1={((i + 1) * Number(tab.form.heightCm || 80) / tab.result.numH)}
                                                                            x2={Number(tab.form.widthCm || 120)}
                                                                            y2={((i + 1) * Number(tab.form.heightCm || 80) / tab.result.numH)}
                                                                            stroke="#000000"
                                                                            strokeWidth={1.5}
                                                                        />
                                                                    ))}
                                                                </svg>
                                                            </div>
                                                            <div className="preview-info-enhanced">
                                                                <div>
                                                                    <strong>Tipo:</strong>
                                                                    <span>{openingTypes.find(t => String(t.id) === String(tab.form.typeId))?.name || '-'}</span>
                                                                </div>
                                                                <div>
                                                                    <strong>Medidas:</strong>
                                                                    <span>{tab.form.widthCm} × {tab.form.heightCm} cm</span>
                                                                </div>
                                                                <div>
                                                                    <strong>Paneles:</strong>
                                                                    <span>{tab.result.numW} × {tab.result.numH} = {tab.result.totalPanels}</span>
                                                                </div>
                                                                <div>
                                                                    <strong>Tamaño panel:</strong>
                                                                    <span>{(tab.result.anchoPanelMM / 10).toFixed(1)} × {(tab.result.altoPanelMM / 10).toFixed(1)} cm</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* KPIs PRINCIPALES */}
                                                    <div className="kpis-section">
                                                        <h4>Métricas Principales</h4>
                                                        <div className="kpis-grid">
                                                            <div className="kpi-card-compact">
                                                                <div className="kpi-icon-compact">💰</div>
                                                                <div className="kpi-content-compact">
                                                                    <div className="kpi-value-compact">{formatMoney(tab.result.total)}</div>
                                                                    <div className="kpi-label-compact">
                                                                        {userRole === 'user' ? 'COSTO TOTAL' : 'PRECIO VENTA'}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {(userRole === 'manager' || userRole === 'coordinator') && (
                                                                <>
                                                                    <div className="kpi-card-compact">
                                                                        <div className="kpi-icon-compact">📈</div>
                                                                        <div className="kpi-content-compact">
                                                                            <div className="kpi-value-compact">{tab.result.beneficioPorcSobreSubtotal.toFixed(1)}%</div>
                                                                            <div className="kpi-label-compact">MARGEN</div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="kpi-card-compact">
                                                                        <div className="kpi-icon-compact">🎯</div>
                                                                        <div className="kpi-content-compact">
                                                                            <div className="kpi-value-compact">{formatMoney(tab.result.beneficio)}</div>
                                                                            <div className="kpi-label-compact">BENEFICIO</div>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* CONTENIDO PARA PDF (OCULTO) */}
                                {tab.result && (
                                    <div id={`pdf-content-${tab.id}`} className="pdf-content" style={{ display: 'none' }}>
                                        <div className="pdf-header">
                                            <img src={logoAnodal} alt="logo" className="pdf-logo" />
                                            <h1>Beneficio por Tipo de Línea - {tab.name}</h1>
                                            {usingCustomPrices && <div className="pdf-custom-prices-note">* Usando precios simulados</div>}
                                        </div>
                                        <div className="pdf-body">
                                            <div><strong>Configuración:</strong> {openingTypes.find(t => String(t.id) === String(tab.form.typeId))?.name || '-'} | {tab.form.widthCm}×{tab.form.heightCm}cm | {tab.result.numW}×{tab.result.numH} paneles</div>
                                            <div><strong>Cantidad:</strong> {tab.result.quantity}</div>
                                            <table className="pdf-table">
                                                <tbody>
                                                    <tr><td>Aluminio</td><td>{formatMoney(tab.result.costoAluminio)}</td></tr>
                                                    <tr><td>Tratamiento</td><td>{formatMoney(tab.result.costoTratamiento)}</td></tr>
                                                    <tr><td>Vidrio</td><td>{formatMoney(tab.result.costoVidrio)}</td></tr>
                                                    <tr><td>Mano de obra</td><td>{formatMoney(tab.result.costoManoObra)}</td></tr>
                                                    <tr><td><strong>Subtotal</strong></td><td><strong>{formatMoney(tab.result.subtotal)}</strong></td></tr>
                                                    <tr><td>Costo fabricación ({tab.result.fabricationPercentage}%)</td><td>{formatMoney(tab.result.costoFabricacion)}</td></tr>
                                                    <tr><td>Costo administrativo ({tab.result.administrativePercentage}%)</td><td>{formatMoney(tab.result.costoAdministrativo)}</td></tr>
                                                    {(userRole === 'manager' || userRole === 'coordinator') && (
                                                        <>
                                                            <tr><td><strong>Beneficio</strong></td><td><strong>{formatMoney(tab.result.beneficio)}</strong></td></tr>
                                                            <tr><td><strong>TOTAL FINAL</strong></td><td><strong>{formatMoney(tab.result.total)}</strong></td></tr>
                                                        </>
                                                    )}
                                                    {userRole === 'user' && (
                                                        <tr><td><strong>COSTO TOTAL</strong></td><td><strong>{formatMoney(tab.result.total)}</strong></td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODAL DE PRECIOS (SOLO GERENTE) */}
            {showPriceModal && userRole === 'manager' && (
                <div className="modal-overlay">
                    <div className="modal-content large">
                        <div className="modal-header">
                            <h3>Simulador de Precios y Costos</h3>
                            <button className="modal-close" onClick={() => setShowPriceModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="price-simulator-container">
                                <div className="price-section-group">
                                    <div className="price-section-card">
                                        <h4>📦 Materiales Base</h4>
                                        <div className="form-group">
                                            <label>Precio Aluminio (kg):</label>
                                            <div className="price-input-with-original">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={customPrices.alumPrice}
                                                    onChange={e => handlePriceChange('alumPrice', e.target.value)}
                                                />
                                                <div className="original-price">
                                                    Original: ${originalPrices.alumPrice}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Precio Mano de Obra (unidad):</label>
                                            <div className="price-input-with-original">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={customPrices.labourPrice}
                                                    onChange={e => handlePriceChange('labourPrice', e.target.value)}
                                                />
                                                <div className="original-price">
                                                    Original: ${originalPrices.labourPrice}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="price-section-card">
                                        <h4>📊 Porcentajes de Costos</h4>
                                        <div className="form-group">
                                            <label>Desperdicio Aluminio (%):</label>
                                            <div className="price-input-with-original">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="100"
                                                    value={customPrices.wasteCost}
                                                    onChange={e => handlePriceChange('wasteCost', e.target.value)}
                                                />
                                                <div className="original-price">
                                                    Original: {originalPrices.wasteCost}%
                                                </div>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Costo Fabricación (%):</label>
                                            <div className="price-input-with-original">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="100"
                                                    value={customPrices.fabricationCost}
                                                    onChange={e => handlePriceChange('fabricationCost', e.target.value)}
                                                />
                                                <div className="original-price">
                                                    Original: {originalPrices.fabricationCost}%
                                                </div>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Costo Administrativo (%):</label>
                                            <div className="price-input-with-original">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="100"
                                                    value={customPrices.administrativeCost}
                                                    onChange={e => handlePriceChange('administrativeCost', e.target.value)}
                                                />
                                                <div className="original-price">
                                                    Original: {originalPrices.administrativeCost}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="price-section-group">
                                    <div className="price-section-card">
                                        <h4>🎨 Tratamientos de Aluminio (%)</h4>
                                        {safeArray(treatments).map(treatment => (
                                            <div className="form-group" key={treatment.id}>
                                                <label>{treatment.name}:</label>
                                                <div className="price-input-with-original">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        max="100"
                                                        value={customPrices[`treatment_${treatment.id}`] || treatment.pricePercentage || 0}
                                                        onChange={e => handlePriceChange(`treatment_${treatment.id}`, e.target.value)}
                                                    />
                                                    <div className="original-price">
                                                        Original: {treatment.pricePercentage || treatment.price_percentage || 0}%
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="price-section-card">
                                        <h4>🪟 Tipos de Vidrio (m²)</h4>
                                        {safeArray(glassTypes).map(glass => (
                                            <div className="form-group" key={glass.id}>
                                                <label>{glass.name}:</label>
                                                <div className="price-input-with-original">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={customPrices[`glass_${glass.id}`] || glass.price || 0}
                                                        onChange={e => handlePriceChange(`glass_${glass.id}`, e.target.value)}
                                                    />
                                                    <div className="original-price">
                                                        Original: ${glass.price || 0}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="price-info">
                                <AlertCircle size={16} />
                                <small>Los cambios se aplicarán como precios simulados. Use el botón "Simulados/Originales" para alternar entre ambos modos.</small>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-cancel" onClick={() => setShowPriceModal(false)}>
                                Cancelar
                            </button>
                            <button className="btn btn-primary" onClick={saveCustomPrices}>
                                <CheckCircle2 size={18} />
                                Aplicar Precios Simulados
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default BeneficioEnCotizacionesPorTipoDeLinea;