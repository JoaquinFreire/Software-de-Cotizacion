import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, Clock, TrendingUp, Filter, Download, RefreshCw, ChevronDown, ChevronUp, User, Save, X, Omega } from 'lucide-react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import '../../styles/DashboardEficienciaOperativa.css';
import { useNavigate } from "react-router-dom";

const DashboardEficienciaOperativa = () => {
    const [workloadData, setWorkloadData] = useState([]);
    const [alertsData, setAlertsData] = useState([]);
    const [kpiData, setKpiData] = useState({});
    const [problematicQuotations, setProblematicQuotations] = useState([]);
    const [activeUsers, setActiveUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        timeRange: '30d',
        alertLevel: 'all'
    });
    const [filtersVisible, setFiltersVisible] = useState(false);

    // Estados para el modal de cambio de usuario
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [changingUser, setChangingUser] = useState(false);

    const navigate = useNavigate();
            
                const handleLogout = () => {
                    localStorage.removeItem("token");
                    navigate("/");
                }

    const API_URL = process.env.REACT_APP_API_URL;

    // Función para cargar usuarios activos
    const fetchActiveUsers = async () => {
        try {
            setLoadingUsers(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/users/active`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📋 Respuesta de /users/active:', data);

                // Extraer el array de usuarios de $values
                if (data.$values && Array.isArray(data.$values)) {
                    setActiveUsers(data.$values);
                } else if (Array.isArray(data)) {
                    setActiveUsers(data);
                } else {
                    console.error('Formato inesperado de usuarios:', data);
                    setActiveUsers([]);
                }
            } else {
                console.error('Error al cargar usuarios activos:', response.status);
                setActiveUsers([]);
            }
        } catch (error) {
            console.error('Error:', error);
            setActiveUsers([]);
        } finally {
            setLoadingUsers(false);
        }
    };

    // Función para cambiar usuario de cotización
    const changeQuotationUser = async (quotationId, newUserId) => {
        try {
            setChangingUser(true);
            const token = localStorage.getItem('token');

            // Usar el mismo formato que en Postman: NewUserId con N mayúscula
            const response = await fetch(`${API_URL}/api/quotations/update/user/?QuotationId=${quotationId}&NewUserId=${newUserId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Recargar los datos del dashboard
                await fetchDashboardData();
                setShowUserModal(false);
                alert('Usuario cambiado exitosamente');
            } else {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                alert('Error al cambiar el usuario');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al cambiar el usuario');
        } finally {
            setChangingUser(false);
        }
    };

    // Función para abrir el modal de cambio de usuario
    const openChangeUserModal = (quotation) => {
        setSelectedQuotation(quotation);
        setSelectedUserId(quotation.AssigneeId || '');
        setShowUserModal(true);
    };

    // Función para manejar el cambio de usuario
    const handleUserChange = async () => {
        if (!selectedQuotation || !selectedUserId) {
            alert('Por favor selecciona un usuario');
            return;
        }

        await changeQuotationUser(selectedQuotation.QuotationId, parseInt(selectedUserId));
    };

    // Función para formatear fechas
    const formatTime = (dateString) => {
        if (!dateString) return 'Fecha no disponible';
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            if (diffDays > 0) return `Hace ${diffDays}d`;
            if (diffHours > 0) return `Hace ${diffHours}h`;
            return 'Ahora';
        } catch (error) {
            return 'Fecha inválida';
        }
    };

    // Función para formatear precio
    const formatPrice = (price) => {
        if (price === undefined || price === null) return 'N/A';
        if (typeof price !== 'number') {
            const parsed = parseFloat(price);
            if (isNaN(parsed)) return 'N/A';
            return `$${parsed.toLocaleString('es-AR')}`;
        }
        return `$${price.toLocaleString('es-AR')}`;
    };

    // Función para obtener datos del endpoint unificado de OperativeEfficiencyDashboardController
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            console.log('🔄 Cargando dashboard unificado...');

            const timeRangeParam = filters.timeRange;
            const response = await fetch(`${API_URL}/api/OED/dashboard-unified?timeRange=${timeRangeParam}`);

            console.log('📡 Estado de respuesta:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error del servidor:', errorText);
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('📊 Respuesta completa del backend:', data);

            const extractArray = (obj) => {
                if (!obj) return [];
                if (obj.$values && Array.isArray(obj.$values)) return obj.$values;
                if (Array.isArray(obj)) return obj;
                return [];
            };

            const extractObject = (obj) => {
                if (!obj) return {};
                if (typeof obj === 'object' && !Array.isArray(obj)) return obj;
                return {};
            };

            setKpiData(extractObject(data.Kpis));
            setWorkloadData(extractArray(data.Workload));
            setAlertsData(extractArray(data.Alerts));
            setProblematicQuotations(extractArray(data.ProblematicQuotations));

            console.log('✅ Datos procesados:', {
                kpis: extractObject(data.Kpis),
                workload: extractArray(data.Workload).length,
                alerts: extractArray(data.Alerts).length,
                problematic: extractArray(data.ProblematicQuotations).length
            });

        } catch (error) {
            console.error('❌ Error cargando dashboard:', error);
            setKpiData({});
            setWorkloadData([]);
            setAlertsData([]);
            setProblematicQuotations([]);
        } finally {
            setLoading(false);
        }
    };

    // Efecto para cargar datos iniciales
    useEffect(() => {
        fetchDashboardData();
        fetchActiveUsers();
    }, []);

    // Efecto para recargar cuando cambian los filtros
    useEffect(() => {
        if (!loading) {
            fetchDashboardData();
        }
    }, [filters.timeRange, filters.alertLevel]);

    const getAlertColor = (level) => {
        switch (level) {
            case 'red': return '#f44336';
            case 'yellow': return '#ff9800';
            case 'green': return '#4caf50';
            case 'gray': return '#9e9e9e';
            default: return '#9e9e9e';
        }
    };

    const getEfficiencyColor = (efficiency) => {
        if (efficiency === undefined || efficiency === null || efficiency === -1) return '#9e9e9e';
        if (efficiency >= 85) return '#4caf50';
        if (efficiency >= 70) return '#ff9800';
        return '#f44336';
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'up': return '↑';
            case 'down': return '↓';
            case 'stable': return '→';
            default: return '→';
        }
    };

    const getTrendClass = (trend) => {
        switch (trend) {
            case 'up': return 'positive';
            case 'down': return 'negative';
            case 'stable': return 'neutral';
            default: return 'neutral';
        }
    };

    const handleRefresh = () => {
        fetchDashboardData();
    };

    // DEBUG: Verificar estado actual
    console.log('🎯 ESTADO ACTUAL:', {
        loading,
        kpiData,
        workloadData: (workloadData || []).length,
        alertsData: (alertsData || []).length,
        problematicQuotations: (problematicQuotations || []).length
    });

    if (loading) {
        console.log('⏳ Mostrando loading...');
        return (
            <div className="dashboard-container">
                <Navigation />
                <div className="dashboard-loading">
                    <div className="loading-spinner"></div>
                    <p>Cargando dashboard...</p>
                </div>
                <Footer />
            </div>
        );
    }

    console.log('🚀 Renderizando dashboard con datos...');

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />

            <div className="dashboard-main-wrapper">
                <div className="dashboard-content-container">

                    {/* HEADER */}
                    <div className="dashboard-header">
                        <div className="header-title">
                            <TrendingUp size={32} />
                            <div>
                                <h1>Carga de trabajo del equipo de cotización</h1>
                                <p>Monitoreo del rendimiento del equipo</p>
                            </div>
                        </div>
                        <div className="header-actions">
                            <button className="btn-primary" onClick={handleRefresh}>
                                <RefreshCw size={18} />
                                Actualizar
                            </button>
                        </div>
                    </div>

                    {/* FILTROS */}
                    <div className="filters-accordion">
                        <div className="filters-header-toggle" onClick={() => setFiltersVisible(!filtersVisible)}>
                            <div className="filters-toggle-left">
                                <Filter size={20} />
                                <span>Filtros del Reporte</span>
                            </div>
                            <div className="filters-toggle-right">
                                {filtersVisible ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </div>

                        {filtersVisible && (
                            <div className="filters-content-expanded">
                                <div className="filters-grid">
                                    <div className="filter-group">
                                        <label>Período:</label>
                                        <select
                                            value={filters.timeRange}
                                            onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
                                            className="filter-select"
                                        >
                                            <option value="7d">Últimos 7 días</option>
                                            <option value="30d">Últimos 30 días</option>
                                            <option value="90d">Últimos 90 días</option>
                                        </select>
                                    </div>
                                    <div className="filter-group">
                                        <label>Nivel de alerta:</label>
                                        <select
                                            value={filters.alertLevel}
                                            onChange={(e) => setFilters({ ...filters, alertLevel: e.target.value })}
                                            className="filter-select"
                                        >
                                            <option value="all">Todas las alertas</option>
                                            <option value="red">Solo críticas</option>
                                            <option value="yellow">Solo advertencias</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* KPI CARDS */}
                    <div className="kpi-section">
                        <div className="kpi-grid">
                            <div className="kpi-card">
                                <div className="kpi-icon" style={{ background: '#2196f3' }}>
                                    <Users size={24} />
                                </div>
                                <div className="kpi-content">
                                    <div className="kpi-value">{kpiData.ActiveQuotations || 0}</div>
                                    <div className="kpi-label">Cotizaciones Activas</div>
                                    <div className={`kpi-trend ${getTrendClass(kpiData.Trends?.ActiveQuotations)}`}>
                                        {getTrendIcon(kpiData.Trends?.ActiveQuotations)}
                                        {kpiData.Trends?.ActiveQuotations === 'up' ? ' Aumentando' :
                                            kpiData.Trends?.ActiveQuotations === 'down' ? ' Disminuyendo' : ' Estable'}
                                    </div>
                                </div>
                            </div>

                            <div className="kpi-card">
                                <div className="kpi-icon" style={{ background: '#ff9800' }}>
                                    <Clock size={24} />
                                </div>
                                <div className="kpi-content">
                                    <div className="kpi-value">{kpiData.DelayedQuotations || 0}</div>
                                    <div className="kpi-label">En Demora</div>
                                    <div className={`kpi-trend ${getTrendClass(kpiData.Trends?.DelayedQuotations)}`}>
                                        {getTrendIcon(kpiData.Trends?.DelayedQuotations)}
                                        {kpiData.Trends?.DelayedQuotations === 'up' ? ' Aumentando' :
                                            kpiData.Trends?.DelayedQuotations === 'down' ? ' Disminuyendo' : ' Estable'}
                                    </div>
                                </div>
                            </div>

                            <div className="kpi-card">
                                <div className="kpi-icon" style={{ background: '#4caf50' }}>
                                    <TrendingUp size={24} />
                                </div>
                                <div className="kpi-content">
                                    <div className="kpi-value">{kpiData.TeamEfficiency || 0}%</div>
                                    <div className="kpi-label">Eficiencia</div>
                                    <div className={`kpi-trend ${getTrendClass(kpiData.Trends?.TeamEfficiency)}`}>
                                        {getTrendIcon(kpiData.Trends?.TeamEfficiency)}
                                        {kpiData.Trends?.TeamEfficiency === 'up' ? ' Mejorando' :
                                            kpiData.Trends?.TeamEfficiency === 'down' ? ' Empeorando' : ' Estable'}
                                    </div>
                                </div>
                            </div>

                            <div className="kpi-card">
                                <div className="kpi-icon" style={{ background: '#f44336' }}>
                                    <AlertTriangle size={24} />
                                </div>
                                <div className="kpi-content">
                                    <div className="kpi-value">{kpiData.ActiveAlerts || 0}</div>
                                    <div className="kpi-label">Alertas Activas</div>
                                    <div className="kpi-trend neutral">Tiempo real</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CONTENIDO PRINCIPAL */}
                    <div className="main-content-grid">
                        {/* COLUMNA IZQUIERDA */}
                        <div className="content-column">
                            {/* MATRIZ DE CARGA */}
                            <div className="panel workload-panel">
                                <div className="panel-header">
                                    <Users size={20} />
                                    <h3>Carga de Trabajo</h3>
                                    <span className="panel-badge">{(workloadData && workloadData.length) || 0} cotizadores</span>
                                </div>
                                <div className="panel-content">
                                    <div className="workload-table-container">
                                        <table className="workload-table">
                                            <thead>
                                                <tr>
                                                    <th>Cotizador</th>
                                                    <th>Activas</th>
                                                    <th>Pendientes</th>
                                                    <th>Demoras</th>
                                                    <th>Eficiencia</th>
                                                    <th>Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {workloadData && workloadData.length > 0 ? (
                                                    workloadData.map((user, index) => (
                                                        <tr key={user.UserId || index}>
                                                            <td className="user-cell">
                                                                <div className="user-avatar">
                                                                    {user.userName?.charAt(0) || 'U'}
                                                                </div>
                                                                <div className="user-info">
                                                                    <div className="user-name">{user.UserName || 'N/A'}</div>
                                                                    <div className="user-email">{user.UserEmail || 'N/A'}</div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className={`count-badge ${user.Alerts?.Active || 'gray'}`}>
                                                                    {user.ActiveQuotations || 0}
                                                                </span>
                                                            </td>
                                                            <td>{user.PendingQuotations || 0}</td>
                                                            <td>
                                                                <span className={`count-badge ${user.Alerts?.Delayed || 'gray'}`}>
                                                                    {user.DelayedQuotations || 0}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div className="efficiency-cell">
                                                                    <div
                                                                        className="efficiency-bar"
                                                                        style={{
                                                                            width: `${user.Efficiency === -1 || !user.Efficiency ? 0 : Math.min(user.Efficiency, 100)}%`,
                                                                            backgroundColor: getEfficiencyColor(user.Efficiency)
                                                                        }}
                                                                    ></div>
                                                                    <span>
                                                                        {user.Efficiency === -1 || user.Efficiency === undefined ? 'Sin datos' : `${user.Efficiency}%`}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div
                                                                    className="status-dot"
                                                                    style={{ backgroundColor: getAlertColor(user.Alerts?.Overall || 'gray') }}
                                                                ></div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                                            No hay datos de carga de trabajo
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* COTIZACIONES PROBLEMÁTICAS */}
                            <div className="panel quotations-panel">
                                <div className="panel-header">
                                    <AlertTriangle size={20} />
                                    <h3>Cotizaciones Problemáticas</h3>
                                    <span className="panel-badge">{(problematicQuotations && problematicQuotations.length) || 0} cotizaciones</span>
                                </div>
                                <div className="panel-content">
                                    <div className="quotations-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        {problematicQuotations && problematicQuotations.length > 0 ? (
                                            problematicQuotations.map((quotation, index) => (
                                                <div key={index} className="quotation-alert">
                                                    <div className="quotation-id">#{quotation.QuotationId || 'N/A'}</div>
                                                    <div className="quotation-info">
                                                        <div className="quotation-assignee">{quotation.Assignee || 'N/A'}</div>
                                                        <div className="quotation-details">
                                                            {quotation.DaysWithoutEdit || 0} días sin actualizar •
                                                            v{quotation.VersionCount || 0} •
                                                            {formatPrice(quotation.TotalPrice)}
                                                        </div>
                                                        <div className="quotation-customer">
                                                            {quotation.CustomerName || 'N/A'} - {quotation.WorkPlace || 'N/A'}
                                                        </div>
                                                    </div>
                                                    <div className="quotation-actions">
                                                        <button
                                                            className="btn-ver-pdf"
                                                            onClick={() => window.open(`/quotation/${quotation.QuotationId}`, '_blank')}
                                                            title="Ver PDF detallado de esta cotización"
                                                        >
                                                            📄 Ver PDF
                                                        </button>
                                                        <button
                                                            className="btn-change-user"
                                                            onClick={() => openChangeUserModal(quotation)}
                                                            title="Cambiar usuario asignado"
                                                        >
                                                            <User size={14} />
                                                            Cambiar Usuario
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                                No hay cotizaciones problemáticas
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA - ALERTAS */}
                        <div className="content-column">
                            <div className="panel alerts-panel">
                                <div className="panel-header">
                                    <AlertTriangle size={20} />
                                    <h3>Alertas</h3>
                                    <span className="alerts-badge">{(alertsData && alertsData.length) || 0}</span>
                                </div>
                                <div className="panel-content">
                                    <div className="alerts-list" style={{ maxHeight: '1100px', overflowY: 'auto' }}>
                                        {alertsData && alertsData.length > 0 ? (
                                            alertsData.map((alert, index) => (
                                                <div key={index} className="alert-item">
                                                    <div
                                                        className="alert-indicator"
                                                        style={{ backgroundColor: getAlertColor(alert.level) }}
                                                    ></div>
                                                    <div className="alert-content">
                                                        <div className="alert-title">{alert.Title || 'N/A'}</div>
                                                        <div className="alert-description">{alert.Description || 'N/A'}</div>
                                                        <div className="alert-meta">
                                                            {alert.Assignee && `• ${alert.Assignee}`}
                                                            {alert.DaysWithoutEdit && ` • ${alert.DaysWithoutEdit}d`}
                                                        </div>
                                                    </div>
                                                    <div className="alert-time">
                                                        {formatTime(alert.Time)}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                                No hay alertas activas
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL PARA CAMBIAR USUARIO */}
            {showUserModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Cambiar Usuario de Cotización</h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowUserModal(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="current-user-info">
                                <strong>Cotización:</strong> #{selectedQuotation?.QuotationId}<br />
                                <strong>Usuario actual:</strong> {selectedQuotation?.Assignee}
                            </div>

                            <div className="form-group">
                                <label>Seleccionar nuevo usuario:</label>
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="user-select"
                                    disabled={loadingUsers}
                                >
                                    <option value="">Selecciona un usuario...</option>
                                    {loadingUsers ? (
                                        <option value="" disabled>Cargando usuarios...</option>
                                    ) : activeUsers && activeUsers.length > 0 ? (
                                        activeUsers.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} {user.lastName} - {user.mail}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>No hay usuarios disponibles</option>
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowUserModal(false)}
                                disabled={changingUser}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-save"
                                onClick={handleUserChange}
                                disabled={changingUser || !selectedUserId}
                            >
                                {changingUser ? (
                                    <>
                                        <RefreshCw size={16} className="spinner" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        Guardar Cambios
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default DashboardEficienciaOperativa;