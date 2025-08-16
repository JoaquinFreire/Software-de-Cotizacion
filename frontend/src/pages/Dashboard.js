import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";
import "../styles/pagination.css";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import logo_busqueda from "../images/logo_busqueda.png";
import QuotationList from "../components/QuotationList";
import { QuotationContext } from "../context/QuotationContext";
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';
import { ToastContainer, toast, Slide } from 'react-toastify';
import { Calendar } from 'primereact/calendar';
import { addLocale } from 'primereact/api';

// solo uno
const API_URL = process.env.REACT_APP_API_URL;

// Configurar el calendario en español (si no está ya en otro archivo global)
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

    // Al entrar al Dashboard, siempre carga la página 1 de pendientes
    useEffect(() => {
    switchToDashboard();
    // eslint-disable-next-line
}, []);


    // Ya no necesitas filtrar pendientes aquí, quotations ya viene filtrado
    useEffect(() => {
        setFilteredQuotations(Array.isArray(quotations) ? quotations : []);
    }, [quotations]);

    // Scroll arriba al cambiar de página
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
            // Recarga la página actual después de borrar
            goToDashboardPage(page);
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
            await axios.put(
                `${API_URL}/api/quotations/${id}/status`,
                { status: newStatus },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            // Recarga la página actual después de cambiar estado
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
        // Remove empty values except status
        Object.keys(params).forEach(k => {
            if (!params[k] && k !== "status") delete params[k];
        });
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
        setIsFiltering(false);
        setFilterResults([]);
        setFilterTotal(0);
        setFilterPage(1);
        goToDashboardPage(1);
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

    // Log en el render para ver el valor en cada render
    console.log("Dashboard render - quotations:", quotations, "filteredQuotations:", filteredQuotations);

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            <h2 className="title">Cotizaciones Pendientes</h2>
            <ToastContainer autoClose={4000} theme="dark" transition={Slide} position="bottom-right" />
            {/* Filtros avanzados */}
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
                        <div className="date-filter">

                            <Calendar
                                value={date}
                                onChange={handleCalendarChange}
                                showIcon
                                dateFormat="dd/mm/yy"
                                placeholder="Desde"
                                locale="es"
                            />
                        </div>
                        <div className="date-filter">
                            <Calendar
                                value={toDate}
                                onChange={handleToCalendarChange}
                                showIcon
                                dateFormat="dd/mm/yy"
                                placeholder="Hasta"
                                locale="es"
                            />
                        </div>
                        <div className="advanced-filter-form">
                        <Calendar
                            value={lastEditFromDate}
                            onChange={handleLastEditFromCalendarChange}
                            showIcon
                            dateFormat="dd/mm/yy"
                            placeholder="Última edición desde"
                            locale="es"
                        />
                    </div>
                    </div>
                    <div className="filter-Advanced">
                        <input
                            type="number"
                            name="approxTotalPrice"
                            value={filters.approxTotalPrice}
                            onChange={handleFilterChange}
                            placeholder="Precio total"
                            className="filter-Advanced"
                        />
                        <input
                            type="number"
                            name="userId"
                            value={filters.userId}
                            onChange={handleFilterChange}
                            placeholder="ID Usuario"
                            className="filter-Advanced"
                        />
                        <input
                            type="text"
                            name="customerDni"
                            value={filters.customerDni}
                            onChange={handleFilterChange}
                            placeholder="DNI Cliente"
                            className="filter-Advanced"
                        />
                    </div>
                    <div className="fadvanced-filter-form">
                        <button type="submit" className="search-button">Buscar
                            <img src={logo_busqueda} alt="Buscar" /></button>
                        <button type="button" className="clear-button" onClick={handleClearFilters}>Borrar filtro</button>
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
                                <Skeleton
                                    width="100px" height="30px" baseColor="#1a2a1d"
                                    highlightColor="#f2f8f8" duration={1.2}
                                />
                                <Skeleton
                                    width="100px" height="30px" baseColor="#16203a"
                                    highlightColor="#f2f8f8" duration={1.2}
                                />
                                <Skeleton
                                    width="100px" height="30px" baseColor="#611616"
                                    highlightColor="#f2f8f8" duration={1.2}
                                />
                                <Skeleton
                                    width="100px" height="30px" baseColor="#a0910e96"
                                    highlightColor="#f2f8f8" duration={1.2}
                                />
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
                        onDeleteSuccess={handleDeleteSuccess}
                    />
                    <div className="pagination-nav">
                        <button
                            onClick={() => {
                                if (isFiltering) fetchFilteredQuotations(filterPage - 1);
                                else goToDashboardPage(page - 1);
                            }}
                            disabled={isFiltering ? filterPage <= 1 : page <= 1}
                        >Anterior</button>
                        <span>
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
                        >Siguiente</button>
                    </div>
                </>
            )}

            <Footer />
        </div>
    );
};

export default Dashboard;