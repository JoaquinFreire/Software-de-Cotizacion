import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";
import "../styles/pagination.css";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import logo_busqueda from "../images/logo_busqueda.webp";
import QuotationList from "../components/QuotationList";
import { QuotationContext } from "../context/QuotationContext";
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';
import { ToastContainer, toast, Slide } from 'react-toastify';
import { Calendar } from 'primereact/calendar';
import { addLocale } from 'primereact/api';
import { safeArray } from '../utils/safeArray';
import { Filter, X, Search, RotateCcw } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

addLocale('es', {
    firstDayOfWeek: 1,
    dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
    dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
    monthNames: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    today: 'Hoy',
    clear: 'Limpiar'
});

function resolveRefs(array) {
    const byId = {};
    array.forEach(obj => {
        if (obj && obj.$id) byId[obj.$id] = obj;
        if (obj.Customer && obj.Customer.$id) byId[obj.Customer.$id] = obj.Customer;
        if (obj.WorkPlace && obj.WorkPlace.$id) byId[obj.WorkPlace.$id] = obj.WorkPlace;
    });
    function resolve(obj) {
        if (!obj || typeof obj !== "object") return obj;
        if (obj.$ref) return byId[obj.$ref] || {};
        const out = Array.isArray(obj) ? [] : {};
        for (const k in obj) out[k] = resolve(obj[k]);
        return out;
    }
    return array.map(resolve);
}

const Dashboard = () => {
    const {
        dashboardState, pageSize, goToDashboardPage, switchToDashboard
    } = useContext(QuotationContext);
    const { quotations, page, total, loading } = dashboardState;
    const [filteredQuotations, setFilteredQuotations] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [quotationToDelete, setQuotationToDelete] = useState(null);
    const [filters, setFilters] = useState({
        from: "",
        to: "",
        approxTotalPrice: "",
        lastEditFrom: "",
        userId: "",
        customerDni: ""
    });
    const [isFiltering, setIsFiltering] = useState(false);
    const [filterPage, setFilterPage] = useState(1);
    const [filterTotal, setFilterTotal] = useState(0);
    const [filterResults, setFilterResults] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [date, setDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [lastEditFromDate, setLastEditFromDate] = useState(null);
    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useState(null);
    const [currentRole, setCurrentRole] = useState(null);
    const [quotators, setQuotators] = useState([]);

    // Estados para ordenamiento
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc'
    });

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;
        const fetchMeAndUsers = async () => {
            try {
                const meRes = await axios.get(`${API_URL}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const user = meRes.data?.user;
                setCurrentUser(user);
                const roleName = (user?.role?.role_name || user?.role || "").toString().toLowerCase();
                setCurrentRole(roleName);

                if (roleName !== "quotator") {
                    const usersRes = await axios.get(`${API_URL}/api/users`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    const extractUsersFromResponse = (data) => {
                        const queue = Array.isArray(data) ? [...data] : [data];
                        const found = [];
                        const seenIds = new Set();
                        while (queue.length) {
                            const node = queue.shift();
                            if (!node || typeof node !== 'object') continue;
                            const id = node?.id ?? node?.Id ?? node?.userId ?? node?.user_id ?? node?.id_user ?? null;
                            const name = node?.name ?? node?.firstName ?? node?.first_name ?? node?.nombre ?? null;
                            if (id && name) {
                                if (!seenIds.has(id)) {
                                    seenIds.add(id);
                                    found.push(node);
                                }
                                continue;
                            }
                            for (const k in node) {
                                const v = node[k];
                                if (v && typeof v === 'object') {
                                    if (Array.isArray(v)) queue.push(...v);
                                    else queue.push(v);
                                }
                            }
                        }
                        return found;
                    };

                    const usersArray = extractUsersFromResponse(usersRes.data);
                    const collectAllObjects = (data) => {
                        const queue = Array.isArray(data) ? [...data] : [data];
                        const collected = [];
                        while (queue.length) {
                            const node = queue.shift();
                            if (!node || typeof node !== "object") continue;
                            collected.push(node);
                            for (const k in node) {
                                const v = node[k];
                                if (v && typeof v === "object") {
                                    if (Array.isArray(v)) queue.push(...v);
                                    else queue.push(v);
                                }
                            }
                        }
                        return collected;
                    };
                    const allNodes = collectAllObjects(usersRes.data);
                    const byId = {};
                    allNodes.forEach(n => { if (n && n.$id) byId[n.$id] = n; });
                    const resolveRef = (obj) => (obj && typeof obj === "object" && obj.$ref) ? (byId[obj.$ref] || obj) : obj;

                    const extractRoleName = (u) => {
                        let rawRole = u?.role ?? u?.role_name ?? u?.roleName ?? u?.userRole ?? null;
                        if (rawRole && typeof rawRole === "object") rawRole = resolveRef(rawRole);
                        if (!rawRole) {
                            const candidate = resolveRef(u)?.role_name ?? resolveRef(u)?.roleName ?? resolveRef(u)?.role;
                            if (typeof candidate === "string") return candidate.toLowerCase();
                            return "";
                        }
                        if (typeof rawRole === "string") return rawRole.toLowerCase();
                        if (typeof rawRole === "object") {
                            const val = rawRole.role_name ?? rawRole.name ?? rawRole.roleName ?? rawRole.type ?? rawRole.title;
                            return val ? String(val).toLowerCase() : "";
                        }
                        return "";
                    };

                    const normalized = usersArray.map(u => {
                        const resolved = resolveRef(u);
                        return {
                            id: resolved?.id ?? resolved?.Id ?? resolved?.userId ?? resolved?.user_id ?? resolved?.id_user ?? null,
                            name: (resolved?.name ?? resolved?.firstName ?? resolved?.first_name ?? resolved?.nombre ?? "").toString().trim(),
                            lastname: (resolved?.lastname ?? resolved?.lastName ?? resolved?.last_name ?? resolved?.apellido ?? "").toString().trim(),
                            roleName: extractRoleName(resolved)
                        };
                    });
                    const qlist = normalized
                        .filter(n => n.id != null && n.roleName === "quotator")
                        .map(n => ({ id: n.id, name: n.name, lastname: n.lastname }));
                    setQuotators(qlist);
                }
            } catch (err) {
                if (err && err.code === "ECONNABORTED") {
                    console.warn("Request aborted (ignored).");
                } else {
                    console.error("Error fetching current user or users:", err);
                }
            }
        };
        fetchMeAndUsers();
    }, []);

    useEffect(() => {
        let arr = Array.isArray(quotations) ? quotations : safeArray(quotations);
        arr = resolveRefs(arr);
        setFilteredQuotations(arr);
    }, [quotations]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [dashboardState.page]);

    const handleDelete = async () => {
        const token = localStorage.getItem("token");
        try {
            await axios.delete(
                `${API_URL}/api/quotations/${quotationToDelete}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setShowModal(false);
            goToDashboardPage(page);
        } catch (error) {
            console.error("Error deleting quotation:", error);
        }
    };

    const handleDeleteSuccess = () => {};

    const handleStatusChange = async (id, newStatus) => {
        const token = localStorage.getItem("token");
        try {
            await axios.put(
                `${API_URL}/api/quotations/${id}/status`,
                { status: newStatus },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            goToDashboardPage(page);
            toast.success("Estado de la cotización actualizado con éxito.");
        } catch (error) {
            console.error("Error updating quotation status:", error);
            toast.error("Error al actualizar el estado de la cotización.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const fetchFilteredQuotations = async (page = 1) => {
        setIsFiltering(true);
        const token = localStorage.getItem("token");
        let params = { ...filters, page, pageSize, status: "pending" };
        Object.keys(params).forEach(k => {
            if (!params[k] && k !== "status") delete params[k];
        });
        if (currentRole === "quotator") {
            delete params.userId;
        }
        // Agrega los parámetros de ordenamiento
        if (sortConfig.key) {
            params.sortKey = sortConfig.key;
            params.sortDirection = sortConfig.direction;
        }
        try {
            const res = await axios.get(`${API_URL}/api/quotations/advanced-search`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setFilterResults(res.data.quotations || []);
            setFilterTotal(res.data.total || 0);
            setFilterPage(page);
        } catch (err) {
            setFilterResults([]);
            setFilterTotal(0);
        }
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchFilteredQuotations(1);
    };

    const handleClearFilters = () => {
        setFilters({
            from: "",
            to: "",
            approxTotalPrice: "",
            lastEditFrom: "",
            userId: "",
            customerDni: ""
        });
        setDate(null);
        setToDate(null);
        setLastEditFromDate(null);
        setIsFiltering(false);
        setFilterResults([]);
        setFilterTotal(0);
        setFilterPage(1);
        goToDashboardPage(1);
    };

    const handleCalendarChange = (e) => {
        setDate(e.value);
        setFilters({ ...filters, from: e.value ? e.value.toISOString().slice(0, 10) : "" });
    };

    const handleToCalendarChange = (e) => {
        setToDate(e.value);
        setFilters({ ...filters, to: e.value ? e.value.toISOString().slice(0, 10) : "" });
    };

    const handleLastEditFromCalendarChange = (e) => {
        setLastEditFromDate(e.value);
        setFilters({ ...filters, lastEditFrom: e.value ? e.value.toISOString().slice(0, 10) : "" });
    };

    // Modifica handleSort para que actualice los filtros si están activos
    const handleSort = (key) => {
        setSortConfig(prevConfig => {
            const newConfig = prevConfig.key === key
                ? { key, direction: prevConfig.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' };
            // Si hay filtros activos, vuelve a pedir los datos ordenados
            if (isFiltering) {
                fetchFilteredQuotations(filterPage);
            }
            return newConfig;
        });
    };

    // Elimina el ordenamiento local cuando hay filtros activos
    // const quotationsToShow = isFiltering ? filterResults : filteredQuotations;
    const quotationsToShow = isFiltering
        ? filterResults
        : filteredQuotations;

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            
            <div className="materials-header">
                <h2 className="materials-title">Cotizaciones Pendientes</h2>
                <p className="materials-subtitle"> Explore las cotizaciones pendientes que tiene como cotizador, gestionando cada una de las mismas </p>
            </div>

            <ToastContainer autoClose={4000} theme="dark" transition={Slide} position="bottom-right" />
            
            {/* Filtros avanzados mejorados */}
            <div className="advanced-filters-container">
                <div className="filters-header">
                    <button
                        type="button"
                        className="filters-toggle-btn"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={18} />
                        <span>Filtros Avanzados</span>
                        <div className={`toggle-arrow ${showFilters ? 'open' : ''}`}>▼</div>
                        
                    </button>
                    <span className="stat-badge">
            {isFiltering ? filterTotal : total} cotizaciones pendientes
        </span>
                    {isFiltering && (
                        <div className="active-filters-indicator">
                            <span>Filtros activos</span>
                            <button 
                                onClick={handleClearFilters}
                                className="clear-filters-btn"
                            >
                                <X size={14} />
                                Limpiar
                            </button>
                        </div>
                    )}
                </div>

                {showFilters && (
                    <form onSubmit={handleFilterSubmit} className="filters-form">
                        <div className="filters-grid">
                            <div className="filter-group">
                                <label>Rango de Fechas</label>
                                <div className="date-filters">
                                    <div className="date-input">
                                        <Calendar
                                            value={date}
                                            onChange={handleCalendarChange}
                                            showIcon
                                            dateFormat="dd/mm/yy"
                                            placeholder="Desde"
                                            locale="es"
                                            className="calendar-input"
                                        />
                                    </div>
                                    <div className="date-input">
                                        <Calendar
                                            value={toDate}
                                            onChange={handleToCalendarChange}
                                            showIcon
                                            dateFormat="dd/mm/yy"
                                            placeholder="Hasta"
                                            locale="es"
                                            className="calendar-input"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="filter-group">
                                <label>Última Edición</label>
                                <div className="date-input">
                                    <Calendar
                                        value={lastEditFromDate}
                                        onChange={handleLastEditFromCalendarChange}
                                        showIcon
                                        dateFormat="dd/mm/yy"
                                        placeholder="Desde"
                                        locale="es"
                                        className="calendar-input"
                                    />
                                </div>
                            </div>

                            <div className="filter-group">
                                <label>Precio Total</label>
                                <input
                                    type="number"
                                    name="approxTotalPrice"
                                    value={filters.approxTotalPrice}
                                    onChange={handleFilterChange}
                                    placeholder="Monto aproximado"
                                    className="filter-input"
                                />
                            </div>

                            {currentRole !== null && currentRole !== "quotator" && (
                                <div className="filter-group">
                                    <label>Cotizador</label>
                                    <select
                                        name="userId"
                                        value={filters.userId}
                                        onChange={handleFilterChange}
                                        className="filter-select"
                                    >
                                        <option value="">Todos los cotizadores</option>
                                        {quotators.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {`${u.name || ""} ${u.lastname || ""}`.trim()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="filter-group">
                                <label>DNI Cliente</label>
                                <input
                                    type="text"
                                    name="customerDni"
                                    value={filters.customerDni}
                                    onChange={handleFilterChange}
                                    placeholder="Número de DNI"
                                    className="filter-input"
                                />
                            </div>
                        </div>

                        <div className="filters-actions">
                            <button type="submit" className="btn-primary">
                                <Search size={16} />
                                Aplicar Filtros
                            </button>
                            <button 
                                type="button" 
                                onClick={handleClearFilters}
                                className="btn-secondary"
                            >
                                <RotateCcw size={16} />
                                Limpiar
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Contenido principal */}
            <div className="dashboard-content">
                {loading && !isFiltering ? (
                    <div className="skeleton-container">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="quote-card-skeleton">
                                <div className="skeleton-content">
                                    <Skeleton width="70%" height={20} baseColor="#e0e0e0" highlightColor="#a9acac" duration={1.2} />
                                    <Skeleton width="50%" height={20} baseColor="#e0e0e0" highlightColor="#a9acac" duration={1.2} />
                                    <Skeleton width="60%" height={20} baseColor="#e0e0e0" highlightColor="#a9acac" duration={1.2} />
                                    <Skeleton width="40%" height={20} baseColor="#e0e0e0" highlightColor="#a9acac" duration={1.2} />
                                </div>
                                <div className="skeleton-actions">
                                    <Skeleton width="100px" height="30px" baseColor="#1a2a1d" highlightColor="#f2f8f8" duration={1.2} />
                                    <Skeleton width="100px" height="30px" baseColor="#16203a" highlightColor="#f2f8f8" duration={1.2} />
                                    <Skeleton width="100px" height="30px" baseColor="#611616" highlightColor="#f2f8f8" duration={1.2} />
                                    <Skeleton width="100px" height="30px" baseColor="#a0910e96" highlightColor="#f2f8f8" duration={1.2} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <QuotationList
                            quotations={quotationsToShow}
                            onDelete={handleDelete}
                            onStatusChange={handleStatusChange}
                            showModal={showModal}
                            setShowModal={setShowModal}
                            setQuotationToDelete={setQuotationToDelete}
                            onDeleteSuccess={handleDeleteSuccess}
                        />
                        
                        <div className="pagination-container">
                            
                            <div className="pagination-nav">
                                <button
                                    onClick={() => {
                                        if (isFiltering) fetchFilteredQuotations(filterPage - 1);
                                        else goToDashboardPage(page - 1);
                                    }}
                                    disabled={isFiltering ? filterPage <= 1 : page <= 1}
                                    className="pagination-btn"
                                >
                                    Anterior
                                </button>
                                
                                <span className="pagination-page">
                                    Página {isFiltering ? filterPage : page} de {Math.ceil((isFiltering ? filterTotal : total) / pageSize)}
                                </span>
                                
                                <button
                                    onClick={() => {
                                        if (isFiltering) fetchFilteredQuotations(filterPage + 1);
                                        else goToDashboardPage(page + 1);
                                    }}
                                    disabled={
                                        isFiltering
                                            ? filterPage >= Math.ceil(filterTotal / pageSize)
                                            : page >= Math.ceil(total / pageSize)
                                    }
                                    className="pagination-btn"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default Dashboard;