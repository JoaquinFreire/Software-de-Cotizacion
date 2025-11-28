import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    RefreshCw,
    Users,
    Clock,
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
        overall: false,
        metrics: false,
        trends: false
    });

    const [userRole, setUserRole] = useState(null);
    const [roleLoading, setRoleLoading] = useState(true);
    const requiredRoles = ['coordinator'];

    const [quoters, setQuoters] = useState([]);
    const [selectedQuoter, setSelectedQuoter] = useState('');
    const [quotersLoading, setQuotersLoading] = useState(false);
    const [reportGenerated, setReportGenerated] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const checkUserRole = () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/");
                return;
            }

            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const role = payload?.role?.toLowerCase() ||
                    payload?.Role?.toLowerCase() ||
                    payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']?.toLowerCase();

                if (role) {
                    setUserRole(role);
                    setRoleLoading(false);
                    return;
                }
            } catch (error) {
                console.debug('No se pudo decodificar JWT');
            }

            const fetchUserRoleFromAPI = async () => {
                try {
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const role = data?.user?.role?.toLowerCase();
                        setUserRole(role);
                    }
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

    const [metricsPeriod, setMetricsPeriod] = useState({
        fromDate: getDefaultFromDate(),
        toDate: new Date().toISOString().split('T')[0]
    });

    const [trendsPeriod, setTrendsPeriod] = useState({
        fromDate: getOneYearAgo(),
        toDate: new Date().toISOString().split('T')[0]
    });

    const API_URL = process.env.REACT_APP_API_URL;

    function getDefaultFromDate() {
        const date = new Date();
        date.setMonth(date.getMonth() - 3);
        return date.toISOString().split('T')[0];
    }

    function getOneYearAgo() {
        const date = new Date();
        date.setFullYear(date.getFullYear() - 1);
        return date.toISOString().split('T')[0];
    }

    const fetchQuoters = async () => {
        try {
            setQuotersLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const activeQuoters = data.$values.filter(user =>
                    user.status === 1 &&
                    (user.role?.role_name?.toLowerCase() === 'quotator' || user.role_id === 1)
                );
                setQuoters(activeQuoters);
            }
        } catch (error) {
            console.error('Error cargando cotizadores:', error);
        } finally {
            setQuotersLoading(false);
        }
    };

    const fetchAllMetricsData = async () => {
        if (!selectedQuoter) return;

        try {
            setLoading({ overall: true, metrics: false, trends: false });
            setReportGenerated(false);

            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                quoterId: selectedQuoter,
                fromDate: metricsPeriod.fromDate,
                toDate: metricsPeriod.toDate,
                trendsFromDate: trendsPeriod.fromDate,
                trendsToDate: trendsPeriod.toDate
            });

            const response = await fetch(`${API_URL}/api/QuoterPersonalMetrics/metrics?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setMetricsData(data);
                setReportGenerated(true);
            } else {
                console.error('Error en la respuesta:', response.status);
                setMetricsData({});
            }

        } catch (error) {
            console.error('Error general:', error);
            setMetricsData({});
        } finally {
            setLoading({ overall: false, metrics: false, trends: false });
        }
    };

    const fetchKeyMetrics = async () => {
        if (!selectedQuoter) return;

        try {
            setLoading(prev => ({ ...prev, metrics: true }));

            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                quoterId: selectedQuoter,
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
            console.error('Error cargando métricas clave:', error);
        } finally {
            setLoading(prev => ({ ...prev, metrics: false }));
        }
    };

    const fetchMonthlyTrends = async () => {
        if (!selectedQuoter) return;

        try {
            setLoading(prev => ({ ...prev, trends: true }));

            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                quoterId: selectedQuoter,
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
            console.error('Error cargando tendencias:', error);
        } finally {
            setLoading(prev => ({ ...prev, trends: false }));
        }
    };

    useEffect(() => {
        if (userRole && requiredRoles.includes(userRole)) {
            fetchQuoters();
        }
    }, [userRole]);

    useEffect(() => {
        if (selectedQuoter && reportGenerated && !loading.overall) {
            fetchKeyMetrics();
        }
    }, [metricsPeriod.fromDate, metricsPeriod.toDate, selectedQuoter]);

    useEffect(() => {
        if (selectedQuoter && reportGenerated && !loading.overall) {
            fetchMonthlyTrends();
        }
    }, [trendsPeriod.fromDate, trendsPeriod.toDate, selectedQuoter]);

    const handleQuoterChange = (quoterId) => {
        setSelectedQuoter(quoterId);
        setReportGenerated(false);
        setMetricsData({});
    };

    const handleGenerateReport = () => {
        if (selectedQuoter) {
            fetchAllMetricsData();
        }
    };

    const handleRefresh = () => {
        if (selectedQuoter) {
            fetchAllMetricsData();
        }
    };

    const formatPercentage = (value) => {
        if (value === undefined || value === null) return 'N/A';
        return `${(value * 100).toFixed(1)}%`;
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'up': return '↗';
            case 'down': return '↘';
            case 'stable': return '→';
            default: return '→';
        }
    };

    // Imprimir solo el área del reporte
    const handlePrint = () => {
        document.body.classList.add('print-metricas-personales-only');
        setTimeout(() => {
            window.print();
            setTimeout(() => {
                document.body.classList.remove('print-metricas-personales-only');
            }, 100);
        }, 50);
    };

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
                        Este reporte está disponible solo para coordinadores.
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

    const LoadingSpinner = () => (
        <div className="tendencias-loading">
            <div className="loading-spinner"></div>
            <p>Generando reporte...</p>
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
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton-line short"></div>
                ))}
            </div>
            <div className="skeleton-table-body">
                {[...Array(rows)].map((_, i) => (
                    <div key={i} className="skeleton-table-row">
                        {[...Array(4)].map((_, j) => (
                            <div key={j} className="skeleton-line medium"></div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />

            <div className="metrics-dashboard-main-wrapper">
                <div className="metrics-dashboard-content-container">

                    <div className="metrics-main-container">

                        <div className="metrics-dashboard-header">
                            <div className="metrics-header-title">
                                <TrendingUp size={32} />
                                <div>
                                    <h1>Métricas de Desempeño - Cotizadores</h1>
                                    <p>Seguimiento de performance y eficiencia del equipo</p>
                                </div>
                            </div>
                            <div className="metrics-header-actions">
                                <button
                                    className="metrics-btn metrics-btn-primary"
                                    onClick={handleGenerateReport}
                                    disabled={!selectedQuoter || loading.overall}
                                >
                                    <RefreshCw size={18} />
                                    {loading.overall ? 'Generando...' : 'Generar Reporte'}
                                </button>
                                {/* Botón Imprimir */}
                                <button
                                    className="metrics-btn metrics-btn-secondary"
                                    style={{ marginLeft: 8 }}
                                    onClick={handlePrint}
                                    disabled={loading.overall}
                                    type="button"
                                >
                                    🖨️ Imprimir
                                </button>
                            </div>
                        </div>

                        <div className="metrics-quoter-selector-section">
                            <div className="metrics-section-header">
                                <div className="metrics-section-title">
                                    <Users size={20} />
                                    <h3>Seleccionar Cotizador</h3>
                                </div>
                            </div>
                            <div className="quoter-selector-container">
                                {quotersLoading ? (
                                    <div className="loading-indicator small"></div>
                                ) : (
                                    <select
                                        value={selectedQuoter}
                                        onChange={(e) => handleQuoterChange(e.target.value)}
                                        className="quoter-select-input"
                                    >
                                        <option value="">Seleccione un cotizador</option>
                                        {quoters.map(quoter => (
                                            <option key={quoter.id} value={quoter.id}>
                                                {quoter.name} {quoter.lastName} - {quoter.legajo}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {loading.overall && <LoadingSpinner />}

                        {reportGenerated && !loading.overall && (
                            <div className="metrics-main-layout">

                                <div className="metrics-main-content">

                                    <div className="metrics-executive-summary-panel">
                                        <div className="metrics-summary-grid">
                                            <div className="metrics-summary-item">
                                                <div className="metrics-summary-label">Cotizador</div>
                                                <div className="metrics-summary-value">{metricsData.PerformanceSummary?.QuoterName || 'N/A'}</div>
                                            </div>
                                            <div className="metrics-summary-item metrics-improvements full-width">
                                                <div className="metrics-summary-label">Áreas de Mejora</div>
                                                <div className="metrics-summary-value">{metricsData.PerformanceSummary?.AreasForImprovement || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </div>

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

                                    <div className="metrics-tables-grid">
                                        <div className="metrics-panel trends-panel full-width">
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
                                    </div>
                                </div>

                                <div className="metrics-sidebar">
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
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {metricsData.ImmediateActions && metricsData.ImmediateActions.$values && metricsData.ImmediateActions.$values.length > 0 ? (
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
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default DashboardMetricasPersonales;