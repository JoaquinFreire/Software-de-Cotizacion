import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { safeArray } from '../utils/safeArray';

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

    // Info del usuario autenticado
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    // Función para obtener datos del usuario actual
    // Ahora retorna un objeto { role, id } además de setear el estado
    const fetchCurrentUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try {
            const resp = await axios.get(`${API_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const role = resp.data?.user?.role;
            const id = resp.data?.userId || resp.data?.user?.id;
            setCurrentUserRole(role);
            setCurrentUserId(id);
            return { role, id };
        } catch (err) {
            console.error('Error fetching current user in context:', err);
            return null;
        }
    };

    // Función genérica para fetch
    // Ahora acepta un userOverride opcional para forzar rol/id (útil durante la inicialización)
    const fetchQuotations = async ({ page = 1, status = null, view }, userOverride = null) => {
        const setState = view === 'dashboard' ? setDashboardState : setHistorialState;
        setState(prev => ({ ...prev, loading: true }));
        const token = localStorage.getItem("token");
        if (!token) {
            setState(prev => ({ ...prev, loading: false }));
            return;
        }
        try {
            // Decide rol/id a usar: userOverride tiene prioridad
            const roleToUse = userOverride?.role ?? currentUserRole;
            const idToUse = userOverride?.id ?? currentUserId;
            const useAdvanced = roleToUse === 'quotator' && idToUse;

            let url = useAdvanced ? `${API_URL}/api/quotations/advanced-search` : `${API_URL}/api/quotations`;
            const params = { page, pageSize };
            if (status) params.status = status;
            if (useAdvanced) params.userId = idToUse;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setState({
                quotations: safeArray(response.data.quotations),
                page,
                total: Number(response.data.total) || 0,
                loading: false,
            });
        } catch (error) {
            setState(prev => ({ ...prev, loading: false }));
            console.error("Error fetching quotations:", error);
        }
    };

    // Agrega una nueva cotización al estado current (dashboard e historial)
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
        const init = async () => {
            // Mostrar skeletons inmediatamente mientras se resuelve la info del usuario
            setDashboardState(prev => ({ ...prev, loading: true }));
            setHistorialState(prev => ({ ...prev, loading: true }));

            const user = await fetchCurrentUser();
            // después de conocer el rol, cargar vistas respetando la regla de 'quotator'
            await fetchQuotations({ page: 1, status: "pending", view: "dashboard" }, user);
            await fetchQuotations({ page: 1, status: null, view: "historial" }, user);
        };
        init();
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
            currentUserRole,
            currentUserId,
            addQuotation
        }}>
            {children}
        </QuotationContext.Provider>
    );
};
export default QuotationProvider;
