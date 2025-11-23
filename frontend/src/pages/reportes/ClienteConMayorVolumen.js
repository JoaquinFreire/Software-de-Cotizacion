import React, { useEffect, useState } from "react";
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { TrendingUp, Filter, ChevronDown, ChevronUp, RefreshCw, ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import '../../styles/DashboardEficienciaOperativa.css';
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || '';
const QUOTATIONS_ENDPOINT = `${API_BASE}/api/quotations/by-period`;
const CUSTOMERS_ENDPOINT = `${API_BASE}/api/customers`;
const USERS_ENDPOINT = `${API_BASE}/api/users/active`;

function formatDateInput(date) {
    const d = new Date(date);
    return d.toISOString().slice(0, 10);
}

// Función para obtener el token
const getAuthToken = () => {
    return localStorage.getItem("token");
};

// Función para hacer fetch con autenticación
const fetchWithAuth = async (url, options = {}) => {
    const token = getAuthToken();
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

// Función mejorada para obtener información del cliente
const getCustomerInfo = (quotation, customersMap) => {
    // Primero intentar obtener del objeto Customer de la cotización
    let customer = quotation.Customer;

    if (customer && customer.id) {
        // Si tenemos un customer con ID, buscar en el mapa de clientes para información completa
        const fullCustomerInfo = customersMap[customer.id];
        if (fullCustomerInfo) {
            return {
                id: customer.id,
                nombre: `${fullCustomerInfo.name || ''} ${fullCustomerInfo.lastname || ''}`.trim() || 'Cliente sin nombre',
                telefono: fullCustomerInfo.tel || 'Sin teléfono',
                mail: fullCustomerInfo.mail || 'Sin email'
            };
        }

        // Si no está en el mapa, usar la información básica de la cotización
        return {
            id: customer.id,
            nombre: `${customer.name || ''} ${customer.lastname || ''}`.trim() || 'Cliente sin nombre',
            telefono: customer.tel || 'Sin teléfono',
            mail: customer.mail || 'Sin email'
        };
    }

    // Si no hay customer en la cotización, buscar por CustomerId
    const customerId = quotation.CustomerId;
    if (customerId && customersMap[customerId]) {
        const fullCustomerInfo = customersMap[customerId];
        return {
            id: customerId,
            nombre: `${fullCustomerInfo.name || ''} ${fullCustomerInfo.lastname || ''}`.trim() || 'Cliente sin nombre',
            telefono: fullCustomerInfo.tel || 'Sin teléfono',
            mail: fullCustomerInfo.mail || 'Sin email'
        };
    }

    // Fallback: información mínima
    return {
        id: quotation.Id || 'unknown',
        nombre: 'Cliente no identificado',
        telefono: 'Sin teléfono',
        mail: 'Sin email'
    };
};

export default function ClienteConMayorVolumen() {
    const today = new Date();
    const defaultTo = formatDateInput(today);
    const defaultFrom = formatDateInput(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 90));

    const [desde, setDesde] = useState(defaultFrom);
    const [hasta, setHasta] = useState(defaultTo);
    const [quoters, setQuoters] = useState([]);
    const [selectedQuoter, setSelectedQuoter] = useState('');
    const [data, setData] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [customersMap, setCustomersMap] = useState({});
    const [loading, setLoading] = useState(false);
    const [filtersVisible, setFiltersVisible] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'totalCotizaciones', direction: 'desc' });

    const itemsPerPage = 10;

    // Estados para control de acceso
    const [userRole, setUserRole] = useState(null);
    const [roleLoading, setRoleLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const requiredRoles = ['quotator', 'coordinator'];

    const navigate = useNavigate();

    // Verificación de rol
    useEffect(() => {
        const checkUserRole = async () => {
            const token = getAuthToken();
            if (!token) {
                navigate("/");
                return;
            }

            try {
                // Decodificar el JWT directamente
                const payload = JSON.parse(atob(token.split('.')[1]));
                const role = payload?.role?.toLowerCase() ||
                    payload?.Role?.toLowerCase() ||
                    payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']?.toLowerCase();

                const userId = payload?.userId || payload?.UserId || payload?.nameid;

                if (role && userId) {
                    setUserRole(role);
                    setCurrentUserId(userId);
                    setRoleLoading(false);
                    return;
                }
            } catch (error) {
                console.debug('No se pudo decodificar JWT');
            }

            // Fallback: llamar a la API
            const fetchUserRoleFromAPI = async () => {
                try {
                    const data = await fetchWithAuth(`${process.env.REACT_APP_API_URL}/api/auth/me`);
                    const role = data?.user?.role?.toLowerCase();
                    const userId = data?.userId || data?.user?.id;
                    setUserRole(role);
                    setCurrentUserId(userId);
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

    useEffect(() => {
        fetchQuoters();
        fetchCustomers();
    }, []);

    // Crear mapa de clientes cuando se cargan
    useEffect(() => {
        if (customers.length > 0) {
            const map = {};
            customers.forEach(customer => {
                if (customer.id) {
                    map[customer.id] = customer;
                }
            });
            setCustomersMap(map);
        }
    }, [customers]);

    async function fetchQuoters() {
        try {
            const json = await fetchWithAuth(USERS_ENDPOINT);
            const arr = json && json.$values ? json.$values : (Array.isArray(json) ? json : []);
            setQuoters(arr.map(u => ({
                id: u.id ?? u.UserId ?? u.Id,
                name: `${u.name ?? u.UserName ?? u.Name ?? ''} ${u.lastName ?? u.LastName ?? ''}`.trim() || (u.mail ?? u.UserEmail ?? 'Sin nombre')
            })).filter(u => u.id != null));
        } catch (err) {
            console.error('No se pudo cargar cotizadores:', err);
            setQuoters([]);
        }
    }

    async function fetchCustomers() {
        try {
            const json = await fetchWithAuth(CUSTOMERS_ENDPOINT);
            const customersData = json && json.$values ? json.$values : (Array.isArray(json) ? json : []);
            setCustomers(customersData);
        } catch (err) {
            console.error('Error cargando clientes:', err);
            setCustomers([]);
        }
    }

    async function fetchReport() {
        if (loading) return;

        setLoading(true);
        setError(null);
        setData([]);
        setCurrentPage(1);

        try {
            // Para cotizadores, usar solo su ID
            const effectiveQuoterId = userRole === 'quotator' ? currentUserId : selectedQuoter;

            const params = new URLSearchParams();
            params.append('from', desde);
            params.append('to', hasta);

            if (effectiveQuoterId) {
                params.append('quoterId', effectiveQuoterId);
            }

            const url = `${QUOTATIONS_ENDPOINT}?${params.toString()}`;
            const json = await fetchWithAuth(url);
            const quotations = json && json.$values ? json.$values : (Array.isArray(json) ? json : []);

            console.log(`Procesando ${quotations.length} cotizaciones...`);
            console.log('Mapa de clientes cargado:', Object.keys(customersMap).length);

            // Procesar cotizaciones para contar por cliente
            const clientStats = {};

            quotations.forEach(quotation => {
                const customerInfo = getCustomerInfo(quotation, customersMap);

                if (!clientStats[customerInfo.id]) {
                    clientStats[customerInfo.id] = {
                        clienteId: customerInfo.id,
                        clienteNombre: customerInfo.nombre,
                        telefono: customerInfo.telefono,
                        mail: customerInfo.mail,
                        totalCotizaciones: 0,
                        cotizacionesAceptadas: 0,
                        cotizacionesRechazadas: 0
                    };
                }

                clientStats[customerInfo.id].totalCotizaciones += 1;

                if (quotation.Status === 'approved') {
                    clientStats[customerInfo.id].cotizacionesAceptadas += 1;
                } else if (quotation.Status === 'rejected') {
                    clientStats[customerInfo.id].cotizacionesRechazadas += 1;
                }
            });

            const normalizedData = Object.values(clientStats);

            // Aplicar ordenamiento inicial
            const sortedData = sortData(normalizedData, sortConfig);
            setData(sortedData);

        } catch (err) {
            console.error('No se pudo obtener el reporte:', err);
            setError('No se pudo obtener el reporte. Verifica la conexión o la disponibilidad del servicio.');

            // NO mostrar datos de ejemplo - solo mostrar mensaje de error
            setData([]);
        } finally {
            setLoading(false);
        }
    }

    // Función para ordenar datos
    const sortData = (dataToSort, config) => {
        return [...dataToSort].sort((a, b) => {
            if (config.key === 'clienteNombre') {
                // Orden alfabético
                const aValue = a[config.key] || '';
                const bValue = b[config.key] || '';
                return config.direction === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            } else {
                // Orden numérico
                const aValue = a[config.key] || 0;
                const bValue = b[config.key] || 0;
                return config.direction === 'asc'
                    ? aValue - bValue
                    : bValue - aValue;
            }
        });
    };

    const handleSort = (key) => {
        const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
        const newSortConfig = { key, direction };
        setSortConfig(newSortConfig);

        const sortedData = sortData(data, newSortConfig);
        setData(sortedData);
        setCurrentPage(1);
    };

    const getSortIcon = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ?
                <ChevronUpIcon size={16} style={{ opacity: 1 }} /> :
                <ChevronDownIcon size={16} style={{ opacity: 1 }} />;
        }
        // Mostrar ambas flechas siempre, pero con opacidad reducida cuando no están activas
        return (
            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '4px' }}>
                <ChevronUpIcon size={12} style={{ opacity: 0.3, marginBottom: '-2px' }} />
                <ChevronDownIcon size={12} style={{ opacity: 0.3, marginTop: '-2px' }} />
            </div>
        );
    };

    // Paginación
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = data.slice(startIndex, startIndex + itemsPerPage);

    const goToPage = (page) => {
        setCurrentPage(page);
    };

    // KPI derived - solo para coordinadores
    const totalClients = data.length;
    const totalQuotations = data.reduce((s, c) => s + (Number(c.totalCotizaciones) || 0), 0);
    const totalAccepted = data.reduce((s, c) => s + (Number(c.cotizacionesAceptadas) || 0), 0);
    const totalRejected = data.reduce((s, c) => s + (Number(c.cotizacionesRechazadas) || 0), 0);

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
                        Este reporte está disponible para cotizadores y coordinadores.
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

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            <div className="dashboard-main-wrapper">
                <div className="dashboard-content-container">
                    <div className="dashboard-header">
                        <div className="header-title">
                            <TrendingUp size={32} />
                            <div>
                                <h1 className="estado-header-title">Clientes con Mayor Volumen de Cotizaciones</h1>
                                <p>
                                    {userRole === 'quotator'
                                        ? 'Mis clientes - Análisis de cotizaciones propias'
                                        : 'Análisis de cartera por período'}
                                </p>
                            </div>
                        </div>
                        <div className="header-actions">
                            <button className="btn-primary" onClick={fetchReport} disabled={loading}>
                                <RefreshCw size={16} /> {loading ? 'Cargando...' : 'Generar'}
                            </button>
                        </div>
                    </div>

                    <div className="filters-accordion" style={{ marginBottom: 12 }}>
                        <div className="filters-header-toggle" onClick={() => setFiltersVisible(!filtersVisible)}>
                            <div className="filters-toggle-left">
                                <Filter size={18} />
                                <span>Filtros</span>
                            </div>
                            <div className="filters-toggle-right">
                                {filtersVisible ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </div>

                        {filtersVisible && (
                            <div className="filters-content-expanded" style={{ marginTop: 8 }}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <label >Desde: <input className="Desde-hasta-body" type="date" value={desde} onChange={e => setDesde(e.target.value)} /></label>
                                    <label >Hasta: <input className="Desde-hasta-body" type="date" value={hasta} onChange={e => setHasta(e.target.value)} /></label>

                                    {userRole === 'coordinator' && (
                                        <label >
                                            Cotizador:
                                            <select className="Desde-hasta-body" value={selectedQuoter} onChange={e => setSelectedQuoter(e.target.value)} style={{ marginLeft: 6 }}>
                                                <option value="">Todos</option>
                                                {quoters.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                                            </select>
                                        </label>
                                    )}

                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                        <button onClick={fetchReport} className="btn-primary" disabled={loading}>
                                            <RefreshCw size={14} /> Actualizar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* KPI CARDS - Solo para coordinadores */}
                    {userRole === 'coordinator' && data.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            <div className="kpi-grid" style={{ marginBottom: 12 }}>
                                <div className="kpi-card">
                                    <div className="kpi-icon" style={{ background: '#2196f3' }}>
                                        <TrendingUp size={20} />
                                    </div>
                                    <div className="kpi-content">
                                        <div className="kpi-value">{totalClients}</div>
                                        <div className="kpi-label">Total Clientes</div>
                                    </div>
                                </div>

                                <div className="kpi-card">
                                    <div className="kpi-icon" style={{ background: '#4caf50' }}>
                                        <TrendingUp size={20} />
                                    </div>
                                    <div className="kpi-content">
                                        <div className="kpi-value">{totalQuotations}</div>
                                        <div className="kpi-label">Total Cotizaciones</div>
                                    </div>
                                </div>

                                <div className="kpi-card">
                                    <div className="kpi-icon" style={{ background: '#ff9800' }}>
                                        <RefreshCw size={20} />
                                    </div>
                                    <div className="kpi-content">
                                        <div className="kpi-value">{totalAccepted}</div>
                                        <div className="kpi-label">Cotizaciones Aceptadas</div>
                                    </div>
                                </div>

                                <div className="kpi-card">
                                    <div className="kpi-icon" style={{ background: '#f44336' }}>
                                        <TrendingUp size={20} />
                                    </div>
                                    <div className="kpi-content">
                                        <div className="kpi-value">{totalRejected}</div>
                                        <div className="kpi-label">Cotizaciones Rechazadas</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TABLA */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ fontWeight: 700 }}>
                                {userRole === 'quotator' ? 'Mis Clientes' : 'Clientes'}
                                {data.length > 0 && ` (${data.length} clientes)`}
                            </div>
                            {data.length > 0 && totalPages > 1 && (
                                <div style={{ fontSize: '0.9em', color: '#666' }}>
                                    Página {currentPage} de {totalPages}
                                </div>
                            )}
                        </div>

                        <div style={{ border: "1px solid #e0e0e0",borderRadius: 8, overflow: "hidden", maxHeight: "600px", overflowX: "auto",overflowY: "hidden",}}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#3b3c3dff', position: 'sticky', top: 0}}>
                                    <tr>
                                        <th
                                            style={{ padding: 12, borderBottom: '1px solid #e0e0e0', cursor: 'pointer' }}
                                            onClick={() => handleSort('clienteNombre')}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                Cliente
                                                {getSortIcon('clienteNombre')}
                                            </div>
                                        </th>
                                        <th style={{ padding: 12, borderBottom: '1px solid #e0e0e0' }}>Teléfono</th>
                                        <th style={{ padding: 12, borderBottom: '1px solid #e0e0e0' }}>Contacto</th>
                                        <th
                                            style={{ padding: 12, borderBottom: '1px solid #e0e0e0', cursor: 'pointer' }}
                                            onClick={() => handleSort('totalCotizaciones')}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                Total Cotizaciones
                                                {getSortIcon('totalCotizaciones')}
                                            </div>
                                        </th>
                                        <th
                                            style={{ padding: 12, borderBottom: '1px solid #e0e0e0', cursor: 'pointer' }}
                                            onClick={() => handleSort('cotizacionesAceptadas')}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                Aceptadas
                                                {getSortIcon('cotizacionesAceptadas')}
                                            </div>
                                        </th>
                                        <th
                                            style={{ padding: 12, borderBottom: '1px solid #e0e0e0', cursor: 'pointer' }}
                                            onClick={() => handleSort('cotizacionesRechazadas')}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                Rechazadas
                                                {getSortIcon('cotizacionesRechazadas')}
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} style={{ padding: 24, textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                    <RefreshCw size={16} className="spinner" />
                                                    Cargando clientes...
                                                </div>
                                            </td>
                                        </tr>
                                    ) : data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ padding: 24, textAlign: 'center' }}>
                                                {error ? error : 'No hay datos para mostrar. Haz clic en "Generar" para cargar los clientes.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        currentData.map((c, index) => (
                                            <tr key={c.clienteId} style={{ background: index % 2 === 0 ? '#5f5f5fff' : '#707272ff' }}>
                                                <td style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>
                                                    {c.clienteNombre || 'Cliente no identificado'}
                                                </td>
                                                <td style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                                                    {c.telefono || 'Sin teléfono'}
                                                </td>
                                                <td style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                                                    {c.mail || 'Sin email'}
                                                </td>
                                                <td style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>{c.totalCotizaciones}</td>
                                                <td style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>{c.cotizacionesAceptadas}</td>
                                                <td style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>{c.cotizacionesRechazadas}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        {data.length > itemsPerPage && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="btn-outline"
                                    style={{ padding: '8px 12px' }}
                                >
                                    Anterior
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => goToPage(page)}
                                        className={currentPage === page ? "btn-primary" : "btn-outline"}
                                        style={{
                                            padding: '8px 12px',
                                            minWidth: '40px'
                                        }}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="btn-outline"
                                    style={{ padding: '8px 12px' }}
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </div>

                    {error && data.length === 0 && (
                        <div style={{
                            color: 'darkorange',
                            marginTop: 12,
                            padding: 12,
                            background: '#fff3e0',
                            border: '1px solid #ffb74d',
                            borderRadius: 4
                        }}>
                            {error}
                        </div>
                    )}

                </div>
            </div>
            <Footer />
        </div>
    );
}