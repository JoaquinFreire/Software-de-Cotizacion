import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import QuotationList from "../components/QuotationList";
import logo_busqueda from "../images/logo_busqueda.webp";
import { QuotationContext } from "../context/QuotationContext";
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';
import { ToastContainer, toast, Slide } from 'react-toastify';
import '../styles/pagination.css';
import '../styles/historial.css'; // Importar los estilos de historial
import { Calendar } from 'primereact/calendar';
import { addLocale } from 'primereact/api';
import 'primereact/resources/themes/saga-blue/theme.css'; // PrimeReact theme
import 'primereact/resources/primereact.min.css';         // PrimeReact core css
import 'primeicons/primeicons.css';                       // PrimeIcons
import { safeArray } from '../utils/safeArray'; // agrega este import

const API_URL = process.env.REACT_APP_API_URL;

// Configurar el calendario en español
addLocale('es', {
    firstDayOfWeek: 1,
    dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
    dayNamesMin: ['D','L','M','X','J','V','S'],
    monthNames: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    today: 'Hoy',
    clear: 'Limpiar'
});


const Historial = () => {
    const {
        historialState, pageSize, goToHistorialPage, switchToHistorial
    } = useContext(QuotationContext);
    const { quotations, page, total, loading } = historialState;
    const navigate = useNavigate();
    const [filteredQuotations, setFilteredQuotations] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [quotationToDelete, setQuotationToDelete] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [filters, setFilters] = useState({
        from: "",
        to: "",
        status: "",
        approxTotalPrice: "",
        lastEditFrom: "",
        userId: "",
        customerDni: ""
    });
    const [isFiltering, setIsFiltering] = useState(false);
    const [filterPage, setFilterPage] = useState(1);
    const [filterTotal, setFilterTotal] = useState(0);
    const [filterResults, setFilterResults] = useState([]);
    const [date, setDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [lastEditFromDate, setLastEditFromDate] = useState(null); // Nuevo estado para "Última Edición Desde"
    const [showFilters, setShowFilters] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    // null indica que todavía no cargó el rol (evita flash en la UI)
    const [currentRole, setCurrentRole] = useState(null);
    const [quotators, setQuotators] = useState([]);

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
                    // Iterative extractor para evitar recursión profunda
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
                    // Construir mapa byId para resolver referencias $ref dentro de la respuesta
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
    
                    const resolveRef = (obj) => {
                        if (obj && typeof obj === "object" && obj.$ref) {
                          return byId[obj.$ref] || obj;
                        }
                        return obj;
                    };
    
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
                    console.log("Quotators loaded:", qlist);
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
        // Historial ya carga datos desde el contexto, no llamamos switchToHistorial aquí
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        setFilteredQuotations(Array.isArray(quotations) ? quotations : safeArray(quotations));
    }, [quotations]);

    // Scroll arriba al cambiar de página
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [historialState.page]);

    const handleDelete = async () => {
        const token = localStorage.getItem("token");
        try {
            await axios.delete(`${API_URL}/api/quotations/${quotationToDelete}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setShowModal(false);
            setSuccessMessage("Cotización eliminada con éxito.");
            // Recarga la página actual después de borrar
            goToHistorialPage(page);
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error) {
            console.error("Error deleting quotation:", error);
        }
    };

    const handleDeleteSuccess = () => {
        // Ya no necesitas modificar el estado localmente
    };

    const handleStatusChange = async (id, newStatus) => {
        const token = localStorage.getItem("token");
        try {
            await axios.put(`${API_URL}/api/quotations/${id}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Recarga la página actual después de cambiar estado
            goToHistorialPage(page);
            toast.success("Estado de la cotización actualizado con éxito.");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error) {
            console.error("Error updating quotation status:", error);
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
        let params = { ...filters, page, pageSize };
        // Remove empty values
        Object.keys(params).forEach(k => {
            if (!params[k]) delete params[k];
        });
        // Si el usuario actual es quotator, no enviar userId (el backend filtrará)
        if (currentRole === "quotator") delete params.userId;
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
            status: "",
            approxTotalPrice: "",
            lastEditFrom: "",
            userId: "",
            customerDni: ""
        });
        setIsFiltering(false);
        setFilterResults([]);
        setFilterTotal(0);
        setFilterPage(1);
        goToHistorialPage(1);
    };

    // Handler para "Desde"
    const handleCalendarChange = (e) => {
        setDate(e.value);
        setFilters({ ...filters, from: e.value ? e.value.toISOString().slice(0, 10) : "" });
    };

    // Handler para "Hasta"
    const handleToCalendarChange = (e) => {
        setToDate(e.value);
        setFilters({ ...filters, to: e.value ? e.value.toISOString().slice(0, 10) : "" });
    };

    // Handler para "Última Edición Desde"
    const handleLastEditFromCalendarChange = (e) => {
        setLastEditFromDate(e.value);
        setFilters({ ...filters, lastEditFrom: e.value ? e.value.toISOString().slice(0, 10) : "" });
    };  

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            <h2 className="title">Todas las Cotizaciones</h2>
            <ToastContainer autoClose={4000} theme="dark" transition={Slide} position="bottom-right" />

            <div className="advanced-filters-menu">
                <button
                    type="button"
                    className="advanced-filters-toggle"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    Filtros avanzados {showFilters ? "▲" : "▼"}
                </button>
                {showFilters && (
                    <form onSubmit={handleFilterSubmit}>
                        <div className="advanced-filter-form">
                            <Calendar
                                value={date}
                                onChange={handleCalendarChange}
                                showIcon
                                dateFormat="dd/mm/yy"
                                placeholder="Desde"
                                locale="es"
                            />
                            <Calendar
                                value={toDate}
                                onChange={handleToCalendarChange}
                                showIcon
                                dateFormat="dd/mm/yy"
                                placeholder="Hasta"
                                locale="es"
                            />
                            <div className="advanced-filter-form">
                            <Calendar
                                value={lastEditFromDate}
                                onChange={handleLastEditFromCalendarChange}
                                showIcon
                                dateFormat="dd/mm/yy"
                                placeholder="Ultima modificacion Desde"
                                locale="es"
                            />
                        </div>
                        </div>
                        <div className="filter-Advanced">
                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className="filter-Advanced"
                            >
                                <option className="titulo" value="">Estado </option>
                                <option className="filter-status-select" value="pending">Pendientes</option>
                                <option className="filter-status-select" value="approved">Aprobados</option>
                                <option className="filter-status-select" value="rejected">Rechazado</option>
                                <option className="filter-status-select" value="finished">Finalizado</option>
                            </select>
                            <input type="number" name="approxTotalPrice" value={filters.approxTotalPrice} onChange={handleFilterChange} placeholder="Precio total" className="filter-Advanced"/>
                           
                            {currentRole !== null && currentRole !== "quotator" && (
                                <select name="userId" value={filters.userId} onChange={handleFilterChange} className="filter-Advanced">
                                    <option value="">Todos los cotizadores</option>
                                    {quotators.map(u => (
                                        <option key={u.id} value={u.id}>{`${u.name || ""} ${u.lastname || ""}`.trim()}</option>
                                    ))}
                                </select>
                            )}
                            <input type="text" name="customerDni" value={filters.customerDni} onChange={handleFilterChange} placeholder="DNI Cliente" className="filter-Advanced"/>
                        </div>

                        <div className="advanced-filter-form">
                            <button type="submit" className="search-button">Buscar
                                <img src={logo_busqueda} alt="Buscar" />
                            </button>
                            <button type="button" className="clear-button" onClick={handleClearFilters}>Borrar filtro </button>
                        </div>
                    </form>
                )}
            </div>
            
            {loading && !isFiltering ? (
                <div className="quote-container">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="quote-card">
                            <div className="quote-details">
                                <p>
                                    <Skeleton width="70%" height={20} baseColor="#e0e0e0" highlightColor="#a9acac" duration={1.2} />
                                </p>
                                <p>
                                    <Skeleton width="70%" height={20} baseColor="#e0e0e0" highlightColor="#a9acac" duration={1.2} />
                                </p>
                                <p>
                                    <Skeleton width="70%" height={20} baseColor="#e0e0e0" highlightColor="#a9acac" duration={1.2} />
                                </p>
                                <p>
                                    <Skeleton width="70%" height={20} baseColor="#e0e0e0" highlightColor="#a9acac" duration={1.2} />
                                </p>
                            </div>
                            <div className="quote-actions" style={{ display: 'flex', gap: 10 }}>
                                <Skeleton width="100px" height="30px" baseColor="#5baaaaff" highlightColor="#f2f8f8" duration={1.2} />
                                <Skeleton width="100px" height="30px" baseColor="#1ab7ccff" highlightColor="#f2f8f8" duration={1.2} />
                                <Skeleton width="100px" height="30px" baseColor="#ac6863ff" highlightColor="#f2f8f8" duration={1.2} />
                                <Skeleton width="100px" height="30px" baseColor="#a89d3cff" highlightColor="#f2f8f8" duration={1.2} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <QuotationList
                        quotations={isFiltering ? filterResults : filteredQuotations}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                        showModal={showModal}
                        setShowModal={setShowModal}
                        setQuotationToDelete={setQuotationToDelete}
                        successMessage={successMessage}
                        onDeleteSuccess={handleDeleteSuccess}
                    />
                    <div className="pagination-nav">
                        <button
                            onClick={() => {
                                if (isFiltering) fetchFilteredQuotations(filterPage - 1);
                                else goToHistorialPage(page - 1);
                            }}
                            disabled={isFiltering ? filterPage <= 1 : page <= 1}
                        >Anterior</button>
                        <span>
                            Página {isFiltering ? filterPage : page} de {Math.ceil((isFiltering ? filterTotal : total) / pageSize)}
                        </span>
                        <button
                            onClick={() => {
                                if (isFiltering) fetchFilteredQuotations(filterPage + 1);
                                else goToHistorialPage(page + 1);
                            }}
                            disabled={
                                isFiltering
                                    ? filterPage >= Math.ceil(filterTotal / pageSize)
                                    : page >= Math.ceil(total / pageSize)
                            }
                        >Siguiente</button>
                    </div>
                </>
            )}
            <Footer />
        </div>
    );
};

export default Historial;
