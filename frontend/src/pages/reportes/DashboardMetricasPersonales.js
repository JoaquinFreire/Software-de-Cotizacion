import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    RefreshCw,
    Users,
    Clock,
    DollarSign,
    CheckCircle,
    XCircle,
    AlertTriangle,
    BarChart3,
    Activity,
    Calendar
} from 'lucide-react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import '../../styles/DashboardMetricasPersonales.css';
import { useNavigate } from "react-router-dom";

const DashboardMetricasPersonales = () => {
    const [metricsData, setMetricsData] = useState({});
    const [loading, setLoading] = useState({
        overall: true,
        metrics: false,
        trends: false,
        products: false
    });

    const navigate = useNavigate();
            
                const handleLogout = () => {
                    localStorage.removeItem("token");
                    navigate("/");
                }
    // Estado para filtros individuales
    const [metricsPeriod, setMetricsPeriod] = useState({
        fromDate: getDefaultFromDate(),
        toDate: new Date().toISOString().split('T')[0]
    });

    const [trendsPeriod, setTrendsPeriod] = useState({
        fromDate: getOneYearAgo(),
        toDate: new Date().toISOString().split('T')[0]
    });

    const [productsPeriod, setProductsPeriod] = useState({
        fromDate: getOneYearAgo(),
        toDate: new Date().toISOString().split('T')[0]
    });

    const API_URL = process.env.REACT_APP_API_URL;

    // Helper functions para fechas por defecto
    function getDefaultFromDate() {
        const date = new Date();
        date.setMonth(date.getMonth() - 3); // Últimos 3 meses
        return date.toISOString().split('T')[0];
    }

    function getOneYearAgo() {
        const date = new Date();
        date.setFullYear(date.getFullYear() - 1);
        return date.toISOString().split('T')[0];
    }

    // Función para obtener el userId del usuario logueado
    const getCurrentUserId = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('❌ No hay token en localStorage');
                return null;
            }

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
            return userData.userId || userData.user?.id;

        } catch (error) {
            console.error('❌ Error obteniendo usuario:', error);
            return null;
        }
    };

    // Función para cargar todas las métricas inicialmente
    const fetchAllMetricsData = async () => {
        try {
            setLoading(prev => ({ ...prev, overall: true }));
            console.log('🔄 Iniciando carga completa de métricas...');

            const userId = await getCurrentUserId();
            if (!userId) {
                console.error('❌ No se pudo obtener el ID del usuario');
                setMetricsData({});
                setLoading(prev => ({ ...prev, overall: false }));
                return;
            }

            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                quoterId: userId,
                fromDate: metricsPeriod.fromDate,
                toDate: metricsPeriod.toDate,
                trendsFromDate: trendsPeriod.fromDate,
                trendsToDate: trendsPeriod.toDate,
                productsFromDate: productsPeriod.fromDate,
                productsToDate: productsPeriod.toDate
            });

            const response = await fetch(`${API_URL}/api/QuoterPersonalMetrics/metrics?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Métricas completas cargadas exitosamente');
                setMetricsData(data);
            } else {
                console.error('❌ Error en la respuesta:', response.status);
                setMetricsData({});
            }

        } catch (error) {
            console.error('❌ Error general:', error);
            setMetricsData({});
        } finally {
            setLoading(prev => ({ ...prev, overall: false }));
        }
    };

    // Función para cargar solo métricas clave
    const fetchKeyMetrics = async () => {
        try {
            setLoading(prev => ({ ...prev, metrics: true }));

            const userId = await getCurrentUserId();
            if (!userId) return;

            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                quoterId: userId,
                fromDate: metricsPeriod.fromDate,
                toDate: metricsPeriod.toDate
            });

            const response = await fetch(`${API_URL}/api/QuoterPersonalMetrics/metrics/key-metrics?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setMetricsData(prev => ({
                    ...prev,
                    KeyMetrics: data
                }));
            }
        } catch (error) {
            console.error('❌ Error cargando métricas clave:', error);
        } finally {
            setLoading(prev => ({ ...prev, metrics: false }));
        }
    };

    // Función para cargar solo tendencias mensuales
    const fetchMonthlyTrends = async () => {
        try {
            setLoading(prev => ({ ...prev, trends: true }));

            const userId = await getCurrentUserId();
            if (!userId) return;

            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                quoterId: userId,
                fromDate: trendsPeriod.fromDate,
                toDate: trendsPeriod.toDate
            });

            const response = await fetch(`${API_URL}/api/QuoterPersonalMetrics/metrics/monthly-trends?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setMetricsData(prev => ({
                    ...prev,
                    MonthlyTrends: data
                }));
            }
        } catch (error) {
            console.error('❌ Error cargando tendencias:', error);
        } finally {
            setLoading(prev => ({ ...prev, trends: false }));
        }
    };

    // Función para cargar solo eficiencia por producto
    const fetchProductEfficiency = async () => {
        try {
            setLoading(prev => ({ ...prev, products: true }));

            const userId = await getCurrentUserId();
            if (!userId) return;

            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                quoterId: userId,
                fromDate: productsPeriod.fromDate,
                toDate: productsPeriod.toDate
            });

            const response = await fetch(`${API_URL}/api/QuoterPersonalMetrics/metrics/product-efficiency?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setMetricsData(prev => ({
                    ...prev,
                    ProductEfficiency: data
                }));
            }
        } catch (error) {
            console.error('❌ Error cargando eficiencia por producto:', error);
        } finally {
            setLoading(prev => ({ ...prev, products: false }));
        }
    };

    // Efecto para carga inicial completa
    useEffect(() => {
        fetchAllMetricsData();
    }, []);

    // Efectos para actualizaciones individuales
    useEffect(() => {
        if (!loading.overall) {
            fetchKeyMetrics();
        }
    }, [metricsPeriod.fromDate, metricsPeriod.toDate]);

    useEffect(() => {
        if (!loading.overwell) {
            fetchMonthlyTrends();
        }
    }, [trendsPeriod.fromDate, trendsPeriod.toDate]);

    useEffect(() => {
        if (!loading.overall) {
            fetchProductEfficiency();
        }
    }, [productsPeriod.fromDate, productsPeriod.toDate]);

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
        fetchAllMetricsData();
    };

    // Componente Skeleton para loading
    const SkeletonCard = ({ className = "" }) => (
        <div className={`skeleton-card ${className}`}>
            <div className="skeleton-line short"></div>
            <div className="skeleton-line long"></div>
            <div className="skeleton-line medium"></div>
        </div>
    );

    const SkeletonKPI = () => (
        <div className="metrics-kpi-card skeleton">
            <div className="metrics-kpi-icon skeleton"></div>
            <div className="metrics-kpi-content">
                <div className="skeleton-line large"></div>
                <div className="skeleton-line medium"></div>
                <div className="skeleton-line short"></div>
            </div>
        </div>
    );

    const SkeletonTable = ({ rows = 5 }) => (
        <div className="skeleton-table">
            <div className="skeleton-table-header">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="skeleton-line short"></div>
                ))}
            </div>
            <div className="skeleton-table-body">
                {[...Array(rows)].map((_, i) => (
                    <div key={i} className="skeleton-table-row">
                        {[...Array(6)].map((_, j) => (
                            <div key={j} className="skeleton-line medium"></div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="metrics-dashboard-container">
            <Navigation onLogout={handleLogout} />

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
                                <button className="metrics-btn metrics-btn-primary" onClick={handleRefresh}>
                                    <RefreshCw size={18} />
                                    Actualizar Todo
                                </button>
                            </div>
                        </div>

                        {/* CONTENIDO PRINCIPAL CON NUEVO LAYOUT */}
                        <div className="metrics-main-layout">

                            {/* COLUMNA PRINCIPAL */}
                            <div className="metrics-main-content">

                                {/* RESUMEN EJECUTIVO SIMPLIFICADO */}
                                {loading.overall ? (
                                    <div className="metrics-executive-summary-panel skeleton">
                                        <div className="metrics-summary-grid">
                                            <div className="metrics-summary-item">
                                                <div className="skeleton-line short"></div>
                                                <div className="skeleton-line medium"></div>
                                            </div>
                                            <div className="metrics-summary-item">
                                                <div className="skeleton-line short"></div>
                                                <div className="skeleton-line large"></div>
                                            </div>
                                            <div className="metrics-summary-item">
                                                <div className="skeleton-line short"></div>
                                                <div className="skeleton-line medium"></div>
                                            </div>
                                        </div>
                                    </div>
                                ) : metricsData.PerformanceSummary && (
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
                                            <div className="metrics-summary-item metrics-improvements">
                                                <div className="metrics-summary-label">Áreas de Mejora</div>
                                                <div className="metrics-summary-value">{metricsData.PerformanceSummary.AreasForImprovement}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* MÉTRICAS CLAVE CON PERIODO */}
                                <div className="metrics-kpi-section">
                                    <div className="metrics-section-header">
                                        <div className="metrics-section-title">
                                            <Activity size={24} />
                                            <h2>Métricas Clave</h2>
                                            <span className="metrics-period-badge">
                                                <Calendar size={14} />
                                                {metricsPeriod.fromDate} a {metricsPeriod.toDate}
                                            </span>
                                        </div>
                                        <div className="metrics-period-selector">
                                            <div className="metrics-filter-group small">
                                                <label>Desde:</label>
                                                <input
                                                    type="date"
                                                    value={metricsPeriod.fromDate}
                                                    onChange={(e) => setMetricsPeriod({ ...metricsPeriod, fromDate: e.target.value })}
                                                    className="metrics-filter-input small"
                                                    disabled={loading.metrics}
                                                />
                                            </div>
                                            <div className="metrics-filter-group small">
                                                <label>Hasta:</label>
                                                <input
                                                    type="date"
                                                    value={metricsPeriod.toDate}
                                                    onChange={(e) => setMetricsPeriod({ ...metricsPeriod, toDate: e.target.value })}
                                                    className="metrics-filter-input small"
                                                    disabled={loading.metrics}
                                                />
                                            </div>
                                            {loading.metrics && (
                                                <div className="loading-indicator small"></div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="metrics-kpi-grid">
                                        {loading.metrics ? (
                                            <>
                                                <SkeletonKPI />
                                                <SkeletonKPI />
                                                <SkeletonKPI />
                                                <SkeletonKPI />
                                                <SkeletonKPI />
                                                <SkeletonKPI />
                                            </>
                                        ) : metricsData.KeyMetrics ? (
                                            <>
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
                                            </>
                                        ) : (
                                            <div className="metrics-no-data">
                                                No hay datos disponibles para el periodo seleccionado
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* TABLAS */}
                                <div className="metrics-tables-grid">

                                    {/* TENDENCIAS MENSUALES CON FILTROS */}
                                    <div className="metrics-panel trends-panel">
                                        <div className="metrics-panel-header">
                                            <div className="metrics-panel-title">
                                                <TrendingUp size={20} />
                                                <h3>Tendencias Mensuales</h3>
                                            </div>
                                            <div className="metrics-panel-filters">
                                                <div className="metrics-filter-group small">
                                                    <label>Desde:</label>
                                                    <input
                                                        type="date"
                                                        value={trendsPeriod.fromDate}
                                                        onChange={(e) => setTrendsPeriod({ ...trendsPeriod, fromDate: e.target.value })}
                                                        className="metrics-filter-input small"
                                                        disabled={loading.trends}
                                                    />
                                                </div>
                                                <div className="metrics-filter-group small">
                                                    <label>Hasta:</label>
                                                    <input
                                                        type="date"
                                                        value={trendsPeriod.toDate}
                                                        onChange={(e) => setTrendsPeriod({ ...trendsPeriod, toDate: e.target.value })}
                                                        className="metrics-filter-input small"
                                                        disabled={loading.trends}
                                                    />
                                                </div>
                                                {loading.trends && (
                                                    <div className="loading-indicator small"></div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="metrics-panel-content">
                                            {loading.trends ? (
                                                <SkeletonTable rows={3} />
                                            ) : metricsData.MonthlyTrends && metricsData.MonthlyTrends.$values && metricsData.MonthlyTrends.$values.length > 0 ? (
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
                                            ) : (
                                                <div className="metrics-no-data">
                                                    No hay datos de tendencias para el periodo seleccionado
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* EFICIENCIA POR PRODUCTO CON FILTROS */}
                                    <div className="metrics-panel products-panel">
                                        <div className="metrics-panel-header">
                                            <div className="metrics-panel-title">
                                                <BarChart3 size={20} />
                                                <h3>Eficiencia por Producto</h3>
                                            </div>
                                            <div className="metrics-panel-filters">
                                                <div className="metrics-filter-group small">
                                                    <label>Desde:</label>
                                                    <input
                                                        type="date"
                                                        value={productsPeriod.fromDate}
                                                        onChange={(e) => setProductsPeriod({ ...productsPeriod, fromDate: e.target.value })}
                                                        className="metrics-filter-input small"
                                                        disabled={loading.products}
                                                    />
                                                </div>
                                                <div className="metrics-filter-group small">
                                                    <label>Hasta:</label>
                                                    <input
                                                        type="date"
                                                        value={productsPeriod.toDate}
                                                        onChange={(e) => setProductsPeriod({ ...productsPeriod, toDate: e.target.value })}
                                                        className="metrics-filter-input small"
                                                        disabled={loading.products}
                                                    />
                                                </div>
                                                {loading.products && (
                                                    <div className="loading-indicator small"></div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="metrics-panel-content">
                                            {loading.products ? (
                                                <SkeletonTable rows={3} />
                                            ) : metricsData.ProductEfficiency && metricsData.ProductEfficiency.$values && metricsData.ProductEfficiency.$values.length > 0 ? (
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
                                            ) : (
                                                <div className="metrics-no-data">
                                                    No hay datos de productos para el periodo seleccionado
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SIDEBAR */}
                            <div className="metrics-sidebar">

                                {/* CLIENTES DESTACADOS */}
                                {loading.overall ? (
                                    <div className="metrics-panel clients-panel skeleton">
                                        <div className="metrics-panel-header">
                                            <div className="skeleton-line medium"></div>
                                        </div>
                                        <div className="metrics-panel-content">
                                            <div className="metrics-clients-stats">
                                                <SkeletonCard className="small" />
                                                <SkeletonCard className="small" />
                                                <SkeletonCard className="small" />
                                                <SkeletonCard className="small" />
                                            </div>
                                            <SkeletonCard />
                                        </div>
                                    </div>
                                ) : metricsData.ClientHighlights && (
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

                                {/* ACCIONES INMEDIATAS - MISMO PERIODO QUE MÉTRICAS CLAVE */}
                                {loading.overall ? (
                                    <div className="metrics-panel actions-panel skeleton">
                                        <div className="metrics-panel-header">
                                            <div className="skeleton-line medium"></div>
                                        </div>
                                        <div className="metrics-panel-content">
                                            <div className="metrics-actions-list">
                                                <SkeletonCard />
                                                <SkeletonCard />
                                            </div>
                                        </div>
                                    </div>
                                ) : metricsData.ImmediateActions && metricsData.ImmediateActions.$values && metricsData.ImmediateActions.$values.length > 0 ? (
                                    <div className="metrics-panel actions-panel">
                                        <div className="metrics-panel-header">
                                            <AlertTriangle size={20} />
                                            <h3>Acciones Inmediatas</h3>
                                            <span className="metrics-period-badge small">
                                                {metricsPeriod.fromDate} a {metricsPeriod.toDate}
                                            </span>
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
                                ) : (
                                    <div className="metrics-panel actions-panel">
                                        <div className="metrics-panel-header">
                                            <AlertTriangle size={20} />
                                            <h3>Acciones Inmediatas</h3>
                                        </div>
                                        <div className="metrics-panel-content">
                                            <div className="metrics-no-data">
                                                No hay acciones pendientes
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