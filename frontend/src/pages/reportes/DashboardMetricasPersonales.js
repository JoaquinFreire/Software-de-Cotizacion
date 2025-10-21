import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    Filter,
    Download,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Users,
    Clock,
    DollarSign,
    CheckCircle,
    XCircle,
    AlertTriangle,
    BarChart3,
    Target,
    Activity
} from 'lucide-react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import '../../styles/DashboardMetricasPersonales.css';

const DashboardMetricasPersonales = () => {
    const [metricsData, setMetricsData] = useState({});
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        metricType: 'general'
    });
    const [filtersVisible, setFiltersVisible] = useState(false);

    const API_URL = process.env.REACT_APP_API_URL;

    // Función para obtener el userId del usuario logueado
    const getCurrentUserId = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('❌ No hay token en localStorage');
                return null;
            }

            console.log('🔑 Token encontrado, llamando a /api/auth/me...');

            const response = await fetch(`${API_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error('❌ Error en /api/auth/me:', response.status);
                return null;
            }

            const userData = await response.json();
            console.log('✅ Datos de usuario obtenidos:', userData);

            // El endpoint devuelve { user: {...}, userId: X }
            return userData.userId || userData.user?.id;

        } catch (error) {
            console.error('❌ Error obteniendo usuario:', error);
            return null;
        }
    };

    // Función para cargar las métricas
    const fetchMetricsData = async () => {
        try {
            setLoading(true);
            console.log('🔄 Iniciando carga de métricas...');

            const userId = await getCurrentUserId();
            console.log('👤 UserId obtenido:', userId);

            if (!userId) {
                console.error('❌ No se pudo obtener el ID del usuario');
                setMetricsData({});
                return;
            }

            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                quoterId: userId,
                ...(filters.fromDate && { fromDate: filters.fromDate }),
                ...(filters.toDate && { toDate: filters.toDate }),
                ...(filters.metricType && { metricType: filters.metricType })
            });

            console.log('🌐 URL de la request:', `/api/QuoterPersonalMetrics/metrics?${queryParams}`);

            const response = await fetch(`${API_URL}/api/QuoterPersonalMetrics/metrics?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Status de respuesta:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Métricas cargadas exitosamente:', data);
                setMetricsData(data);
            } else {
                const errorText = await response.text();
                console.error('❌ Error en la respuesta:', response.status, errorText);
                setMetricsData({});
            }

        } catch (error) {
            console.error('❌ Error general:', error);
            setMetricsData({});
        } finally {
            setLoading(false);
        }
    };

    // Efecto para cargar datos iniciales
    useEffect(() => {
        fetchMetricsData();
    }, []);

    // Efecto para recargar cuando cambian los filtros
    useEffect(() => {
        if (!loading) {
            fetchMetricsData();
        }
    }, [filters.fromDate, filters.toDate, filters.metricType]);

    // Función para formatear precio
    const formatPrice = (price) => {
        if (price === undefined || price === null) return 'N/A';
        const parsed = parseFloat(price);
        if (isNaN(parsed)) return 'N/A';
        return `$${parsed.toLocaleString('es-AR')}`;
    };

    // Función para formatear porcentaje
    const formatPercentage = (value) => {
        if (value === undefined || value === null) return 'N/A';
        return `${(value * 100).toFixed(1)}%`;
    };

    // Función para obtener color según el nivel de performance
    const getPerformanceColor = (tier) => {
        switch (tier?.toLowerCase()) {
            case 'alto': return '#4caf50';
            case 'medio': return '#ff9800';
            case 'bajo': return '#f44336';
            default: return '#9e9e9e';
        }
    };

    // Función para obtener icono de tendencia
    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'up': return '↗';
            case 'down': return '↘';
            case 'stable': return '→';
            default: return '→';
        }
    };

    const handleRefresh = () => {
        fetchMetricsData();
    };

    const handleExport = () => {
        // Implementar exportación a PDF/Excel
        console.log('Exportando métricas...');
    };

    if (loading) {
        return (
            <div className="metrics-dashboard-container">
                <Navigation />
                <div className="metrics-dashboard-loading">
                    <div className="metrics-loading-spinner"></div>
                    <p>Cargando métricas personales...</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="metrics-dashboard-container">
            <Navigation />

            <div className="metrics-dashboard-main-wrapper">
                <div className="metrics-dashboard-content-container">

                    {/* CONTENEDOR PRINCIPAL CON BORDE */}
                    <div className="metrics-main-container">

                        {/* HEADER */}
                        <div className="metrics-dashboard-header">
                            <div className="metrics-header-title">
                                <TrendingUp size={32} />
                                <div>
                                    <h1>Mis Métricas de Desempeño</h1>
                                    <p>Seguimiento de tu performance y eficiencia</p>
                                </div>
                            </div>
                            <div className="metrics-header-actions">
                                <button className="metrics-btn metrics-btn-secondary" onClick={handleExport}>
                                    <Download size={18} />
                                    Exportar
                                </button>
                                <button className="metrics-btn metrics-btn-primary" onClick={handleRefresh}>
                                    <RefreshCw size={18} />
                                    Actualizar
                                </button>
                            </div>
                        </div>

                        {/* FILTROS */}
                        <div className="metrics-filters-accordion">
                            <div className="metrics-filters-header-toggle" onClick={() => setFiltersVisible(!filtersVisible)}>
                                <div className="metrics-filters-toggle-left">
                                    <Filter size={20} />
                                    <span>Filtros del Reporte</span>
                                </div>
                                <div className="metrics-filters-toggle-right">
                                    {filtersVisible ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>

                            {filtersVisible && (
                                <div className="metrics-filters-content-expanded">
                                    <div className="metrics-filters-grid">
                                        <div className="metrics-filter-group">
                                            <label>Fecha desde:</label>
                                            <input
                                                type="date"
                                                value={filters.fromDate}
                                                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                                                className="metrics-filter-input"
                                            />
                                        </div>
                                        <div className="metrics-filter-group">
                                            <label>Fecha hasta:</label>
                                            <input
                                                type="date"
                                                value={filters.toDate}
                                                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                                                className="metrics-filter-input"
                                            />
                                        </div>
                                        <div className="metrics-filter-group">
                                            <label>Tipo de métrica:</label>
                                            <select
                                                value={filters.metricType}
                                                onChange={(e) => setFilters({ ...filters, metricType: e.target.value })}
                                                className="metrics-filter-select"
                                            >
                                                <option value="general">General</option>
                                                <option value="mensual">Mensual</option>
                                                <option value="por-producto">Por Producto</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CONTENIDO PRINCIPAL CON NUEVO LAYOUT */}
                        <div className="metrics-main-layout">

                            {/* COLUMNA PRINCIPAL */}
                            <div className="metrics-main-content">

                                {/* RESUMEN EJECUTIVO */}
                                {metricsData.PerformanceSummary && (
                                    <div className="metrics-executive-summary-panel">
                                        <div className="metrics-summary-grid">
                                            <div className="metrics-summary-item">
                                                <div className="metrics-summary-label">Cotizador</div>
                                                <div className="metrics-summary-value">{metricsData.PerformanceSummary.QuoterName}</div>
                                            </div>
                                            <div className="metrics-summary-item">
                                                <div className="metrics-summary-label">Score General</div>
                                                <div className="metrics-summary-value score">{Math.round(metricsData.PerformanceSummary.OverallScore)}/100</div>
                                            </div>
                                            <div className="metrics-summary-item">
                                                <div className="metrics-summary-label">Ranking</div>
                                                <div className="metrics-summary-value ranking">#{metricsData.PerformanceSummary.CurrentRank} de {metricsData.PerformanceSummary.TotalQuoters}</div>
                                            </div>
                                            <div className="metrics-summary-item metrics-strengths">
                                                <div className="metrics-summary-label">Fortalezas</div>
                                                <div className="metrics-summary-value">{metricsData.PerformanceSummary.Strengths}</div>
                                            </div>
                                            <div className="metrics-summary-item metrics-improvements">
                                                <div className="metrics-summary-label">Áreas de Mejora</div>
                                                <div className="metrics-summary-value">{metricsData.PerformanceSummary.AreasForImprovement}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* MÉTRICAS CLAVE */}
                                {metricsData.KeyMetrics && (
                                    <div className="metrics-kpi-section">
                                        <div className="metrics-section-header">
                                            <Activity size={24} />
                                            <h2>Métricas Clave</h2>
                                        </div>
                                        <div className="metrics-kpi-grid">
                                            <div className="metrics-kpi-card">
                                                <div className="metrics-kpi-icon" style={{ background: '#2196f3' }}>
                                                    <BarChart3 size={24} />
                                                </div>
                                                <div className="metrics-kpi-content">
                                                    <div className="metrics-kpi-value">{metricsData.KeyMetrics.TotalQuotations || 0}</div>
                                                    <div className="metrics-kpi-label">Total Cotizaciones</div>
                                                </div>
                                            </div>

                                            <div className="metrics-kpi-card">
                                                <div className="metrics-kpi-icon" style={{ background: '#4caf50' }}>
                                                    <CheckCircle size={24} />
                                                </div>
                                                <div className="metrics-kpi-content">
                                                    <div className="metrics-kpi-value">{metricsData.KeyMetrics.AcceptedQuotations || 0}</div>
                                                    <div className="metrics-kpi-label">Aceptadas</div>
                                                    <div className="metrics-kpi-subtext">
                                                        {formatPercentage(metricsData.KeyMetrics.ConversionRate)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="metrics-kpi-card">
                                                <div className="metrics-kpi-icon" style={{ background: '#ff9800' }}>
                                                    <Clock size={24} />
                                                </div>
                                                <div className="metrics-kpi-content">
                                                    <div className="metrics-kpi-value">{metricsData.KeyMetrics.PendingQuotations || 0}</div>
                                                    <div className="metrics-kpi-label">Pendientes</div>
                                                </div>
                                            </div>

                                            <div className="metrics-kpi-card">
                                                <div className="metrics-kpi-icon" style={{ background: '#f44336' }}>
                                                    <XCircle size={24} />
                                                </div>
                                                <div className="metrics-kpi-content">
                                                    <div className="metrics-kpi-value">{metricsData.KeyMetrics.RejectedQuotations || 0}</div>
                                                    <div className="metrics-kpi-label">Rechazadas</div>
                                                </div>
                                            </div>

                                            <div className="metrics-kpi-card">
                                                <div className="metrics-kpi-icon" style={{ background: '#9c27b0' }}>
                                                    <DollarSign size={24} />
                                                </div>
                                                <div className="metrics-kpi-content">
                                                    <div className="metrics-kpi-value">{formatPrice(metricsData.KeyMetrics.TotalRevenue)}</div>
                                                    <div className="metrics-kpi-label">Ingreso Total</div>
                                                    <div className="metrics-kpi-subtext">
                                                        Promedio: {formatPrice(metricsData.KeyMetrics.AverageQuotationValue)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="metrics-kpi-card">
                                                <div className="metrics-kpi-icon" style={{ background: '#607d8b' }}>
                                                    <Users size={24} />
                                                </div>
                                                <div className="metrics-kpi-content">
                                                    <div className="metrics-kpi-value">{metricsData.KeyMetrics.ActiveClients || 0}</div>
                                                    <div className="metrics-kpi-label">Clientes Activos</div>
                                                    <div className="metrics-kpi-subtext">
                                                        Tiempo respuesta: {Math.round(metricsData.KeyMetrics.AverageResponseTimeHours)}h
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TABLAS */}
                                <div className="metrics-tables-grid">

                                    {/* Tendencias Mensuales */}
                                    {metricsData.MonthlyTrends && metricsData.MonthlyTrends.$values && metricsData.MonthlyTrends.$values.length > 0 && (
                                        <div className="metrics-panel trends-panel">
                                            <div className="metrics-panel-header">
                                                <TrendingUp size={20} />
                                                <h3>Tendencias Mensuales</h3>
                                            </div>
                                            <div className="metrics-panel-content">
                                                <div className="metrics-trends-table-container">
                                                    <table className="metrics-trends-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Mes</th>
                                                                <th>Cotizaciones</th>
                                                                <th>Aceptadas</th>
                                                                <th>Conversión</th>
                                                                <th>Ingresos</th>
                                                                <th>Tendencia</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {metricsData.MonthlyTrends.$values.map((month, index) => (
                                                                <tr key={index}>
                                                                    <td className="month-cell">{month.Month}</td>
                                                                    <td>{month.Quotations}</td>
                                                                    <td>{month.Accepted}</td>
                                                                    <td className="conversion-cell">
                                                                        {formatPercentage(month.ConversionRate)}
                                                                    </td>
                                                                    <td className="revenue-cell">
                                                                        {formatPrice(month.Revenue)}
                                                                    </td>
                                                                    <td className={`trend-cell ${month.Trend}`}>
                                                                        {getTrendIcon(month.Trend)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Eficiencia por Producto */}
                                    {metricsData.ProductEfficiency && metricsData.ProductEfficiency.$values && metricsData.ProductEfficiency.$values.length > 0 && (
                                        <div className="metrics-panel products-panel">
                                            <div className="metrics-panel-header">
                                                <BarChart3 size={20} />
                                                <h3>Eficiencia por Producto</h3>
                                            </div>
                                            <div className="metrics-panel-content">
                                                <div className="metrics-products-table-container">
                                                    <table className="metrics-products-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Tipo de Abertura</th>
                                                                <th>Total</th>
                                                                <th>Aceptadas</th>
                                                                <th>Conversión</th>
                                                                <th>Valor Promedio</th>
                                                                <th>Desempeño</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {metricsData.ProductEfficiency.$values.map((product, index) => (
                                                                <tr key={index}>
                                                                    <td className="metrics-product-name">{product.OpeningType}</td>
                                                                    <td>{product.TotalQuotations}</td>
                                                                    <td>{product.Accepted}</td>
                                                                    <td className="metrics-conversion-cell">
                                                                        {formatPercentage(product.ConversionRate)}
                                                                    </td>
                                                                    <td className="metrics-value-cell">
                                                                        {formatPrice(product.AverageValue)}
                                                                    </td>
                                                                    <td className={`performance-cell ${product.Performance.toLowerCase()}`}>
                                                                        {product.Performance}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SIDEBAR */}
                            <div className="metrics-sidebar">

                                {/* Clientes Destacados */}
                                {metricsData.ClientHighlights && (
                                    <div className="metrics-panel clients-panel">
                                        <div className="metrics-panel-header">
                                            <Users size={20} />
                                            <h3>Clientes Destacados</h3>
                                        </div>
                                        <div className="metrics-panel-content">
                                            <div className="metrics-clients-stats">
                                                <div className="metrics-client-stat">
                                                    <div className="metrics-stat-label">Total Clientes</div>
                                                    <div className="metrics-stat-value">{metricsData.ClientHighlights.TotalClients}</div>
                                                </div>
                                                <div className="metrics-client-stat">
                                                    <div className="metrics-stat-label">Clientes Recurrentes</div>
                                                    <div className="metrics-stat-value">{metricsData.ClientHighlights.RepeatClients}</div>
                                                </div>
                                                <div className="metrics-client-stat">
                                                    <div className="metrics-stat-label">Tasa de Retención</div>
                                                    <div className="metrics-stat-value">{metricsData.ClientHighlights.RetentionRate}%</div>
                                                </div>
                                                <div className="metrics-client-stat">
                                                    <div className="metrics-stat-label">Nuevos Clientes</div>
                                                    <div className="metrics-stat-value">{metricsData.ClientHighlights.NewClientsThisPeriod}</div>
                                                </div>
                                            </div>
                                            <div className="metrics-top-client">
                                                <div className="metrics-top-client-label">Cliente Top</div>
                                                <div className="metrics-top-client-name">{metricsData.ClientHighlights.TopClient}</div>
                                                <div className="metrics-top-client-revenue">
                                                    {formatPrice(metricsData.ClientHighlights.TopClientRevenue)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Acciones Inmediatas */}
                                {metricsData.ImmediateActions && metricsData.ImmediateActions.$values && metricsData.ImmediateActions.$values.length > 0 && (
                                    <div className="metrics-panel actions-panel">
                                        <div className="metrics-panel-header">
                                            <AlertTriangle size={20} />
                                            <h3>Acciones Inmediatas</h3>
                                            <span className="metrics-actions-badge">{metricsData.ImmediateActions.$values.length}</span>
                                        </div>
                                        <div className="metrics-panel-content">
                                            <div className="metrics-actions-list">
                                                {metricsData.ImmediateActions.$values.map((action, index) => (
                                                    <div key={index} className="action-item">
                                                        <div className={`action-priority ${action.Priority.toLowerCase()}`}>
                                                            {action.Priority}
                                                        </div>
                                                        <div className="metrics-action-content">
                                                            <div className="metrics-action-text">{action.Action}</div>
                                                            <div className="metrics-action-meta">
                                                                <span className="metrics-action-due">{action.DueDate}</span>
                                                                <span className="metrics-action-impact">Impacto: {action.Impact}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default DashboardMetricasPersonales;