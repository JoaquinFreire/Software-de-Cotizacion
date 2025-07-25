import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;
export const QuotationContext = createContext();
export const QuotationProvider = ({ children }) => {
    // Estado separado para cada vista
    const [dashboardState, setDashboardState] = useState({
        quotations: [],
        page: 1,
        total: 0,
        loading: false,
    });
    const [historialState, setHistorialState] = useState({
        quotations: [],
        page: 1,
        total: 0,
        loading: false,
    });

    // Control de vista actual
    const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' o 'historial'
    const pageSize = 5;

    // Función genérica para fetch
    const fetchQuotations = async ({ page = 1, status = null, view }) => {
        const setState = view === 'dashboard' ? setDashboardState : setHistorialState;
        setState(prev => ({ ...prev, loading: true }));
        const token = localStorage.getItem("token");
        if (!token) {
            setState(prev => ({ ...prev, loading: false }));
            return;
        }
        try {
            let url = `${API_URL}/api/quotations?page=${page}&pageSize=${pageSize}`;
            if (status) url += `&status=${status}`;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log(`Fetched ${view} quotations:`, response.data.quotations);
            const arr = Array.isArray(response.data.quotations) ? response.data.quotations : [];
            setState({
                quotations: arr,
                page,
                total: response.data.total,
                loading: false,
            });
        } catch (error) {
            setState(prev => ({ ...prev, loading: false }));
            console.error("Error fetching quotations:", error);
        }
    };

    // Agrega una nueva cotización al estado actual (dashboard e historial)
    const addQuotation = (quotation) => {
        setHistorialState(prev => ({
            ...prev,
            quotations: prev.page === 1 ? [quotation, ...prev.quotations.slice(0, pageSize - 1)] : prev.quotations,
            total: prev.total + 1
        }));
        if (quotation.Status === "pending") {
            setDashboardState(prev => ({
                ...prev,
                quotations: prev.page === 1 ? [quotation, ...prev.quotations.slice(0, pageSize - 1)] : prev.quotations,
                total: prev.total + 1
            }));
        }
    };

    // Funciones para cambiar de página y vista
    const goToDashboardPage = (newPage) => {
        fetchQuotations({ page: newPage, status: "pending", view: "dashboard" });
    };
    const goToHistorialPage = (newPage) => {
        fetchQuotations({ page: newPage, status: null, view: "historial" });
    };
    const switchToDashboard = () => {
        setCurrentView('dashboard');
        if (dashboardState.quotations.length === 0 && !dashboardState.loading) {
            fetchQuotations({ page: dashboardState.page, status: "pending", view: "dashboard" });
        }
    };
    const switchToHistorial = () => {
        setCurrentView('historial');
        if (historialState.quotations.length === 0 && !historialState.loading) {
            fetchQuotations({ page: historialState.page, status: null, view: "historial" });
        }
    };

    // Carga inicial solo una vez por vista
    useEffect(() => {
        fetchQuotations({ page: 1, status: "pending", view: "dashboard" });
        fetchQuotations({ page: 1, status: null, view: "historial" });
    }, []);

    return (
        <QuotationContext.Provider value={{
            dashboardState,
            historialState,
            pageSize,
            goToDashboardPage,
            goToHistorialPage,
            switchToDashboard,
            switchToHistorial,
            currentView,
            addQuotation
        }}>
            {children}
        </QuotationContext.Provider>
    );
};
export default QuotationProvider;
