import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, Clock, TrendingUp, Filter, Download, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import '../../styles/DashboardEficienciaOperativa.css';

const DashboardEficienciaOperativa = () => {
    const [workloadData, setWorkloadData] = useState([]);
    const [alertsData, setAlertsData] = useState([]);
    const [kpiData, setKpiData] = useState({});
    const [problematicQuotations, setProblematicQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        timeRange: '30d',
        alertLevel: 'all'
    });
    const [filtersVisible, setFiltersVisible] = useState(false);

    const API_BASE_URL = 'http://localhost:5187/api/OED';

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

    // Función para obtener datos de la API
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            console.log('🔄 Cargando datos del dashboard...');

            const timeRangeParam = filters.timeRange;

            // Hacer todas las llamadas simultáneamente
            const [kpisResponse, workloadResponse, alertsResponse, problematicResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/kpis?timeRange=${timeRangeParam}`),
                fetch(`${API_BASE_URL}/workload?timeRange=${timeRangeParam}`),
                fetch(`${API_BASE_URL}/alerts?timeRange=${timeRangeParam}${filters.alertLevel !== 'all' ? `&level=${filters.alertLevel}` : ''}`),
                fetch(`${API_BASE_URL}/problematic-quotations?timeRange=${timeRangeParam}`)
            ]);

            // Procesar respuestas
            const kpisData = await kpisResponse.json();
            const workloadData = await workloadResponse.json();
            const alertsData = await alertsResponse.json();
            const problematicData = await problematicResponse.json();

            console.log('📊 Datos procesados:', {
                kpis: kpisData,
                workload: workloadData,
                alerts: alertsData,
                problematic: problematicData
            });

            // Actualizar estados
            setKpiData(kpisData);
            setWorkloadData(workloadData.$values || workloadData);
            setAlertsData(alertsData.$values || alertsData);
            setProblematicQuotations(problematicData.$values || problematicData);

        } catch (error) {
            console.error('❌ Error cargando datos:', error);
        } finally {
            setLoading(false);
        }
    };

    // Efecto para cargar datos iniciales
    useEffect(() => {
        fetchDashboardData();
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
        workloadData: workloadData.length,
        alertsData: alertsData.length,
        problematicQuotations: problematicQuotations.length
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
            <Navigation />

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
                                    <h3>Matriz de Carga de Trabajo</h3>
                                    <span className="panel-badge">{workloadData.length} cotizadores</span>
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
                                    <span className="panel-badge">{problematicQuotations.length} cotizaciones</span>
                                </div>
                                <div className="panel-content">
                                    <div className="quotations-list">
                                        {problematicQuotations && problematicQuotations.length > 0 ? (
                                            problematicQuotations.slice(0, 10).map((quotation, index) => (
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
                                    <h3>Semáforo de Alertas</h3>
                                    <span className="alerts-badge">{alertsData.length}</span>
                                </div>
                                <div className="panel-content">
                                    <div className="alerts-list">
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
            <Footer />
        </div>
    );
};

export default DashboardEficienciaOperativa;