import React, { useState, useEffect, useRef } from 'react';
import {
    TrendingUp,
    RefreshCw,
    Users,
    DollarSign,
    BarChart3,
    Activity,
    Calendar,
    AlertTriangle,
    Target,
    Heart,
    Shield,
    Lightbulb,
    ChevronDown,
    Zap,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import '../../styles/DashboardSostenibilidad.css';
import { useNavigate } from "react-router-dom";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement
);

const DashboardSostenibilidad = () => {
    const [metricsData, setMetricsData] = useState({});
    const [loading, setLoading] = useState({
        overall: true,
        metrics: false
    });

    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: ''
    });

    const [expandedSections, setExpandedSections] = useState({
        forecast: false,
        healthDetails: false
    });

    const [userRole, setUserRole] = useState(null);
    const [roleLoading, setRoleLoading] = useState(true);

    const navigate = useNavigate();
    const chartRef = useRef(null);
    const API_URL = process.env.REACT_APP_API_URL;

    const requiredRoles = ['manager'];

    // Función para obtener fechas por defecto (mes actual y 3 meses atrás)
    const getDefaultDates = () => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-12

        // Fecha hasta: mes actual
        const toDate = new Date(currentYear, currentMonth - 1, 1);

        // Fecha desde: 3 meses antes
        const fromDate = new Date(currentYear, currentMonth - 4, 1);

        return {
            fromDate: fromDate.toISOString().split('T')[0],
            toDate: toDate.toISOString().split('T')[0]
        };
    };

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

    // Inicializar fechas cuando el componente se monta
    useEffect(() => {
        const defaultDates = getDefaultDates();
        setFilters({
            fromDate: defaultDates.fromDate,
            toDate: defaultDates.toDate
        });
    }, []);

    const formatDateForBackend = (dateString, isEndDate = false) => {
        const date = new Date(dateString);
        if (isEndDate) {
            const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            return lastDay.toISOString().split('T')[0];
        } else {
            date.setDate(1);
            return date.toISOString().split('T')[0];
        }
    };

    const getSeasonalityText = (seasonality) => {
        switch (seasonality?.toUpperCase()) {
            case 'HIGH': return 'ALTA';
            case 'MEDIUM': return 'MEDIA';
            case 'LOW': return 'BAJA';
            default: return seasonality || 'BAJA';
        }
    };

    const getForecastDateRange = () => {
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 30);

        return {
            fromDate: fromDate.toISOString().split('T')[0],
            toDate: toDate.toISOString().split('T')[0]
        };
    };

    const fetchSustainabilityMetrics = async () => {
        if (!filters.fromDate || !filters.toDate) return;

        try {
            setLoading(prev => ({ ...prev, overall: true, metrics: true }));

            const token = localStorage.getItem('token');

            const queryParams = new URLSearchParams({
                fromDate: formatDateForBackend(filters.fromDate, false),
                toDate: formatDateForBackend(filters.toDate, true)
            });

            const response = await fetch(`${API_URL}/api/SustainabilityReport/metrics?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const forecastData = await fetchRevenueForecast();

                setMetricsData({
                    ...data,
                    RevenueForecast: forecastData.RevenueForecast || {
                        HighProbability: { $values: [] },
                        MediumProbability: { $values: [] },
                        TotalHighProbabilityRevenue: 0,
                        TotalMediumProbabilityRevenue: 0,
                        TotalPendingRevenue: 0
                    }
                });
            } else {
                setMetricsData({});
            }

        } catch (error) {
            console.error('Error general:', error);
            setMetricsData({});
        } finally {
            setLoading(prev => ({ ...prev, overall: false, metrics: false }));
        }
    };

    const fetchRevenueForecast = async () => {
        try {
            const token = localStorage.getItem('token');
            const forecastRange = getForecastDateRange();

            const queryParams = new URLSearchParams({
                fromDate: forecastRange.fromDate,
                toDate: forecastRange.toDate,
                forecastOnly: 'true'
            });

            const response = await fetch(`${API_URL}/api/SustainabilityReport/metrics?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                return { RevenueForecast: null };
            }
        } catch (error) {
            return { RevenueForecast: null };
        }
    };

    // Cargar datos cuando el usuario esté autorizado y las fechas estén listas
    useEffect(() => {
        if (userRole && requiredRoles.includes(userRole) && filters.fromDate && filters.toDate) {
            fetchSustainabilityMetrics();
        }
    }, [userRole, filters.fromDate, filters.toDate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    }

    const calculateGrowthRate = () => {
        if (!metricsData.MonthlyTrends?.$values) return 0;

        const monthlyData = metricsData.MonthlyTrends.$values;
        if (monthlyData.length < 2) return 0;

        const currentPeriod = monthlyData[monthlyData.length - 1];
        const previousPeriod = monthlyData[monthlyData.length - 2];
        if (previousPeriod.Revenue === 0) return 0;

        return ((currentPeriod.Revenue - previousPeriod.Revenue) / previousPeriod.Revenue) * 100;
    };

    const formatPrice = (price) => {
        if (price === undefined || price === null) return 'N/A';
        const parsed = parseFloat(price);
        if (isNaN(parsed)) return 'N/A';
        return `$${parsed.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const formatPercentage = (value) => {
        if (value === undefined || value === null) return 'N/A';
        return `${parseFloat(value).toFixed(1)}%`;
    };

    const getRiskColor = (riskLevel) => {
        switch (riskLevel?.toUpperCase()) {
            case 'HIGH': return '#ef4444';
            case 'MEDIUM': return '#f59e0b';
            case 'LOW': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getProbabilityColor = (probability) => {
        if (probability >= 70) return '#10b981';
        if (probability >= 40) return '#f59e0b';
        return '#ef4444';
    };

    const handleRefresh = () => {
        fetchSustainabilityMetrics();
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const generateChartData = () => {
        if (!metricsData.MonthlyTrends?.$values) {
            return {
                labels: [],
                datasets: [
                    {
                        label: 'Ingresos Mensuales',
                        data: [],
                        backgroundColor: 'rgba(38, 183, 205, 0.8)',
                        borderColor: 'rgba(38, 183, 205, 1)',
                        borderWidth: 2,
                        borderRadius: 4,
                        borderSkipped: false,
                        yAxisID: 'y',
                    },
                    {
                        label: 'Crecimiento Mensual',
                        data: [],
                        type: 'line',
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: '#10b981',
                        yAxisID: 'y1',
                    }
                ]
            };
        }

        const monthlyData = metricsData.MonthlyTrends.$values;
        const months = [];
        const revenues = [];
        const growthRates = [];

        monthlyData.forEach((month, index) => {
            const monthParts = month.Month.split('/');
            const monthNumber = parseInt(monthParts[0]);
            const year = parseInt(monthParts[1]);

            const date = new Date(year, monthNumber - 1, 1);
            const monthLabel = date.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });

            months.push(monthLabel);
            revenues.push(month.Revenue || 0);
        });

        for (let i = 1; i < revenues.length; i++) {
            if (revenues[i - 1] > 0) {
                const growth = ((revenues[i] - revenues[i - 1]) / revenues[i - 1]) * 100;
                growthRates.push(growth);
            } else {
                growthRates.push(0);
            }
        }
        if (growthRates.length < revenues.length) {
            growthRates.unshift(0);
        }

        return {
            labels: months,
            datasets: [
                {
                    label: 'Ingresos Mensuales',
                    data: revenues,
                    backgroundColor: 'rgba(38, 183, 205, 0.8)',
                    borderColor: 'rgba(38, 183, 205, 1)',
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                    yAxisID: 'y',
                },
                {
                    label: 'Crecimiento Mensual',
                    data: growthRates,
                    type: 'line',
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: '#10b981',
                    yAxisID: 'y1',
                }
            ]
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: '#ffffff',
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(30, 30, 30, 0.95)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: 'rgba(38, 183, 205, 0.5)',
                borderWidth: 1,
                cornerRadius: 8,
                callbacks: {
                    label: function (context) {
                        if (context.datasetIndex === 0) {
                            return `Ingresos: ${formatPrice(context.parsed.y)}`;
                        } else {
                            return `Crecimiento: ${formatPercentage(context.parsed.y)}`;
                        }
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                    drawBorder: true,
                    borderColor: 'rgba(255, 255, 255, 0.3)'
                },
                ticks: {
                    color: '#ffffff',
                    font: {
                        size: 12
                    }
                }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                beginAtZero: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: {
                    color: '#ffffff',
                    font: {
                        size: 12
                    },
                    callback: function (value) {
                        if (value >= 1000000) {
                            return `$${(value / 1000000).toFixed(1)}M`;
                        } else if (value >= 1000) {
                            return `$${(value / 1000).toFixed(0)}K`;
                        }
                        return `$${value}`;
                    }
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                beginAtZero: true,
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    color: '#10b981',
                    font: {
                        size: 12
                    },
                    callback: function (value) {
                        return `${value.toFixed(1)}%`;
                    }
                }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        }
    };

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
                        Este reporte está disponible únicamente para el rol de Gerente.
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

    // Loading principal mientras carga los datos
    if (loading.overall) {
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
                    <p>Cargando reporte de sostenibilidad...</p>
                </div>
                <Footer />
            </div>
        );
    }

    const growthRate = calculateGrowthRate();
    const chartData = generateChartData();

    // Imprimir solo el área del reporte
    const handlePrint = () => {
        document.body.classList.add('print-sostenibilidad-only');
        setTimeout(() => {
            window.print();
            setTimeout(() => {
                document.body.classList.remove('print-sostenibilidad-only');
            }, 100);
        }, 50);
    };

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />

            <div className="sustainability-dashboard-main-wrapper">
                <div className="sustainability-dashboard-content-container">
                    <div className="sustainability-main-container expanded">
                        <div className="sustainability-dashboard-header">
                            <div className="sustainability-header-title">
                                <TrendingUp size={32} color="#26b7cd" />
                                <div>
                                    <h1>Sostenibilidad de Ingresos</h1>
                                    <p>Análisis integral de salud y crecimiento del negocio</p>
                                </div>
                            </div>
                            <div className="sustainability-header-controls">
                                <div className="sustainability-date-filters">
                                    <div className="date-filter-group">
                                        <label>Desde:</label>
                                        <input
                                            type="month"
                                            value={filters.fromDate.substring(0, 7)}
                                            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value + '-01' })}
                                            className="date-filter-input"
                                            disabled={loading.metrics}
                                        />
                                    </div>
                                    <div className="date-filter-group">
                                        <label>Hasta:</label>
                                        <input
                                            type="month"
                                            value={filters.toDate.substring(0, 7)}
                                            onChange={(e) => {
                                                const lastDay = new Date(parseInt(e.target.value.split('-')[0]), parseInt(e.target.value.split('-')[1]), 0);
                                                setFilters({ ...filters, toDate: lastDay.toISOString().split('T')[0] });
                                            }}
                                            className="date-filter-input"
                                            disabled={loading.metrics}
                                        />
                                    </div>
                                </div>
                                <button className="sustainability-btn sustainability-btn-primary" onClick={handleRefresh} disabled={loading.metrics}>
                                    <RefreshCw size={18} />
                                    {loading.metrics ? 'Cargando...' : 'Actualizar'}
                                </button>
                                {/* Botón Imprimir */}
                                <button
                                    className="sustainability-btn sustainability-btn-secondary"
                                    style={{ marginLeft: 8 }}
                                    onClick={handlePrint}
                                    disabled={loading.metrics}
                                    type="button"
                                >
                                    🖨️ Imprimir
                                </button>
                            </div>
                        </div>

                        {loading.metrics ? (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '200px',
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
                                <p>Actualizando datos...</p>
                            </div>
                        ) : (
                            <div className="sustainability-main-layout">
                                <div className="sustainability-main-content">
                                    <div className="sustainability-main-kpis">
                                        <div className="sustainability-kpi-card">
                                            <div className="sustainability-kpi-icon">
                                                <DollarSign size={24} color="#26b7cd" />
                                            </div>
                                            <div className="sustainability-kpi-content">
                                                <div className="sustainability-kpi-value">
                                                    {formatPrice(metricsData.TotalRevenue)}
                                                </div>
                                                <div className="sustainability-kpi-label">Ingresos Totales</div>
                                                <div className="sustainability-kpi-subtext">
                                                    Período seleccionado
                                                </div>
                                            </div>
                                        </div>

                                        <div className="sustainability-kpi-card">
                                            <div className="sustainability-kpi-icon">
                                                <TrendingUp size={24} color="#26b7cd" />
                                            </div>
                                            <div className="sustainability-kpi-content">
                                                <div className="sustainability-kpi-value" style={{
                                                    color: growthRate >= 0 ? '#10b981' : '#ef4444'
                                                }}>
                                                    {formatPercentage(growthRate)}
                                                    {growthRate >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                                                </div>
                                                <div className="sustainability-kpi-label">
                                                    Crecimiento del período
                                                </div>
                                                <div className="sustainability-kpi-subtext">
                                                    Vs. período anterior
                                                </div>
                                            </div>
                                        </div>

                                        <div className="sustainability-kpi-card">
                                            <div className="sustainability-kpi-icon">
                                                <Target size={24} color="#26b7cd" />
                                            </div>
                                            <div className="sustainability-kpi-content">
                                                <div className="sustainability-kpi-value">
                                                    {formatPrice(metricsData.RevenueForecast?.TotalPendingRevenue || 0)}
                                                </div>
                                                <div className="sustainability-kpi-label">Ingresos Probables</div>
                                                <div className="sustainability-kpi-subtext">
                                                    Últimos 30 días
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="sustainability-section">
                                        <div className="sustainability-section-header">
                                            <Calendar size={20} color="#26b7cd" />
                                            <h2>Evolución de Ingresos Mensuales</h2>
                                        </div>
                                        <div className="sustainability-section-content">
                                            <div className="sustainability-chart-container">
                                                <Bar
                                                    ref={chartRef}
                                                    data={chartData}
                                                    options={chartOptions}
                                                    height={400}
                                                />
                                            </div>
                                            <div className="chart-info-note">
                                                <small>Mostrando datos desde {filters.fromDate.substring(0, 7)} hasta {filters.toDate.substring(0, 7)}</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="sustainability-section">
                                        <div className="sustainability-section-header">
                                            <Target size={20} color="#26b7cd" />
                                            <h2>Ingresos Probables de Cotizaciones Pendientes</h2>
                                            <button
                                                className="sustainability-expand-btn"
                                                onClick={() => toggleSection('forecast')}
                                            >
                                                {expandedSections.forecast ? 'Contraer' : 'Expandir'}
                                                <ChevronDown size={16} />
                                            </button>
                                        </div>
                                        <div className="forecast-info-note">
                                            <small>Mostrando cotizaciones de los últimos 30 días</small>
                                        </div>
                                        <div className="sustainability-forecast-cards">
                                            <div className="sustainability-forecast-card high-probability">
                                                <div className="forecast-card-header">
                                                    <div className="probability-badge high">ALTA PROBABILIDAD</div>
                                                </div>
                                                <div className="forecast-card-value">
                                                    {formatPrice(metricsData.RevenueForecast?.TotalHighProbabilityRevenue || 0)}
                                                </div>
                                                <div className="forecast-card-details">
                                                    <span>{metricsData.RevenueForecast?.HighProbability?.$values?.length || 0} clientes</span>
                                                    <span>70%+ conversión</span>
                                                </div>
                                            </div>

                                            <div className="sustainability-forecast-card medium-probability">
                                                <div className="forecast-card-header">
                                                    <div className="probability-badge medium">MEDIA PROBABILIDAD</div>
                                                </div>
                                                <div className="forecast-card-value">
                                                    {formatPrice(metricsData.RevenueForecast?.TotalMediumProbabilityRevenue || 0)}
                                                </div>
                                                <div className="forecast-card-details">
                                                    <span>{metricsData.RevenueForecast?.MediumProbability?.$values?.length || 0} clientes</span>
                                                    <span>40-69% conversión</span>
                                                </div>
                                            </div>

                                            <div className="sustainability-forecast-card total">
                                                <div className="forecast-card-header">
                                                    <div className="probability-badge total">TOTAL PENDIENTE</div>
                                                </div>
                                                <div className="forecast-card-value">
                                                    {formatPrice(metricsData.RevenueForecast?.TotalPendingRevenue || 0)}
                                                </div>
                                                <div className="forecast-card-details">
                                                    <span>{(metricsData.RevenueForecast?.HighProbability?.$values?.length || 0) + (metricsData.RevenueForecast?.MediumProbability?.$values?.length || 0)} clientes</span>
                                                    <span>Total pendiente</span>
                                                </div>
                                            </div>
                                        </div>

                                        {expandedSections.forecast && (
                                            <div className="sustainability-forecast-table">
                                                <div className="table-header">
                                                    <h4>Detalle de Cotizaciones Pendientes</h4>
                                                </div>
                                                <div className="table-container-wrapper">
                                                    <div className="table-container">
                                                        <table className="sustainability-detail-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Cliente</th>
                                                                    <th>Obra/Lugar Trabajo</th>
                                                                    <th>Agente</th>
                                                                    <th>Cotizador</th>
                                                                    <th>Fecha Inicio</th>
                                                                    <th>Probab.</th>
                                                                    <th>Monto</th>
                                                                    <th>Prioridad</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {metricsData.RevenueForecast?.HighProbability?.$values?.map((item, index) => (
                                                                    <tr key={`high-${index}`}>
                                                                        <td className="client-cell">
                                                                            <div className="client-status alta"></div>
                                                                            {item.ClientName}
                                                                        </td>
                                                                        <td className="project-cell">{item.WorkPlaceName} - {item.WorkPlaceLocation}</td>
                                                                        <td className="agent-cell">{item.AgentName}</td>
                                                                        <td className="quoter-cell">{item.QuotatorName}</td>
                                                                        <td className="date-cell">
                                                                            <div className="date-indicator recent"></div>
                                                                            {new Date(item.CreationDate).toLocaleDateString('es-AR')}
                                                                        </td>
                                                                        <td className="probability-cell">
                                                                            <div
                                                                                className="probability-bar"
                                                                                style={{
                                                                                    width: `${item.ConversionRate * 100}%`,
                                                                                    backgroundColor: getProbabilityColor(item.ConversionRate * 100)
                                                                                }}
                                                                            >
                                                                                <span>{Math.round(item.ConversionRate * 100)}%</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="amount-cell">{formatPrice(item.TotalAmount)}</td>
                                                                        <td className="priority-cell">
                                                                            <span className="priority-badge alta">
                                                                                🔴 ALTA
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                {metricsData.RevenueForecast?.MediumProbability?.$values?.map((item, index) => (
                                                                    <tr key={`medium-${index}`}>
                                                                        <td className="client-cell">
                                                                            <div className="client-status media"></div>
                                                                            {item.ClientName}
                                                                        </td>
                                                                        <td className="project-cell">{item.WorkPlaceName} - {item.WorkPlaceLocation}</td>
                                                                        <td className="agent-cell">{item.AgentName}</td>
                                                                        <td className="quoter-cell">{item.QuotatorName}</td>
                                                                        <td className="date-cell">
                                                                            <div className="date-indicator recent"></div>
                                                                            {new Date(item.CreationDate).toLocaleDateString('es-AR')}
                                                                        </td>
                                                                        <td className="probability-cell">
                                                                            <div
                                                                                className="probability-bar"
                                                                                style={{
                                                                                    width: `${item.ConversionRate * 100}%`,
                                                                                    backgroundColor: getProbabilityColor(item.ConversionRate * 100)
                                                                                }}
                                                                            >
                                                                                <span>{Math.round(item.ConversionRate * 100)}%</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="amount-cell">{formatPrice(item.TotalAmount)}</td>
                                                                        <td className="priority-cell">
                                                                            <span className="priority-badge media">
                                                                                🟡 MEDIA
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                {(!metricsData.RevenueForecast?.HighProbability?.$values?.length && !metricsData.RevenueForecast?.MediumProbability?.$values?.length) && (
                                                                    <tr>
                                                                        <td colSpan="8" className="no-data-cell">
                                                                            No hay cotizaciones pendientes en los últimos 30 días
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="sustainability-section">
                                        <div className="sustainability-section-header">
                                            <BarChart3 size={20} color="#26b7cd" />
                                            <h2>Composición de Ingresos por Producto</h2>
                                        </div>
                                        <div className="sustainability-section-content">
                                            {metricsData.ProductMix?.$values && metricsData.ProductMix.$values.length > 0 ? (
                                                <div className="sustainability-composition">
                                                    {metricsData.ProductMix.$values.map((product, index) => (
                                                        <div key={index} className="composition-item">
                                                            <div className="composition-label">
                                                                <span>{product.ProductName}</span>
                                                                <span>{formatPercentage(product.Percentage)}</span>
                                                            </div>
                                                            <div className="composition-bar-container">
                                                                <div
                                                                    className="composition-bar"
                                                                    style={{ width: `${product.Percentage}%` }}
                                                                ></div>
                                                            </div>
                                                            <div className="composition-value">
                                                                {formatPrice(product.Revenue)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="sustainability-no-data">
                                                    No hay datos de composición de productos disponibles
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="sustainability-section">
                                        <div className="sustainability-section-header">
                                            <Users size={20} color="#26b7cd" />
                                            <h2>Concentración de Ingresos por Cliente</h2>
                                        </div>
                                        <div className="sustainability-section-content">
                                            {metricsData.ClientConcentration?.$values && metricsData.ClientConcentration.$values.length > 0 ? (
                                                <div className="sustainability-concentration">
                                                    {metricsData.ClientConcentration.$values.map((client, index) => (
                                                        <div key={index} className="concentration-item">
                                                            <div className="concentration-label">
                                                                <span>{client.ClientName}</span>
                                                                <span>{formatPercentage(client.Percentage)}</span>
                                                            </div>
                                                            <div className="concentration-bar-container">
                                                                <div
                                                                    className="concentration-bar"
                                                                    style={{
                                                                        width: `${client.Percentage}%`,
                                                                        backgroundColor: getRiskColor(client.RiskLevel)
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <div className="concentration-value">
                                                                {formatPrice(client.Revenue)}
                                                                {client.RiskLevel === 'HIGH' && (
                                                                    <AlertTriangle
                                                                        size={16}
                                                                        color="#ef4444"
                                                                        className="risk-icon"
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="sustainability-no-data">
                                                    No hay datos de concentración de clientes disponibles
                                                </div>
                                            )}

                                            {metricsData.ClientConcentration?.$values && metricsData.ClientConcentration.$values[0]?.RiskLevel === 'HIGH' && (
                                                <div className="sustainability-alert warning">
                                                    <AlertTriangle size={20} />
                                                    <div className="alert-content">
                                                        <div className="alert-title">ALTA DEPENDENCIA DE CLIENTE</div>
                                                        <div className="alert-description">
                                                            Cliente "{metricsData.ClientConcentration.$values[0].ClientName}" representa {formatPercentage(metricsData.ClientConcentration.$values[0].Percentage)} de los ingresos totales
                                                        </div>
                                                        <div className="alert-action">
                                                            📋 <strong>Acción recomendada:</strong> Desarrollar estrategias de captación de nuevos clientes medianos
                                                            para reducir la dependencia de un solo cliente principal
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="sustainability-sidebar">
                                    <div className="sustainability-section">
                                        <div className="sustainability-section-header">
                                            <Heart size={20} color="#26b7cd" />
                                            <h3>Métricas de Salud del Negocio</h3>
                                            <button
                                                className="sustainability-expand-btn"
                                                onClick={() => toggleSection('healthDetails')}
                                            >
                                                {expandedSections.healthDetails ? 'Menos' : 'Más'}
                                                <ChevronDown size={16} />
                                            </button>
                                        </div>
                                        <div className="sustainability-health-metrics">
                                            <div className="health-metric-card">
                                                <div className="health-metric-icon">
                                                    <Target size={24} color="#26b7cd" />
                                                </div>
                                                <div className="health-metric-content">
                                                    <div className="health-metric-value">
                                                        {Math.round(metricsData.BusinessHealth?.DiversificationScore || 0)}/100
                                                    </div>
                                                    <div className="health-metric-label">Diversificación</div>
                                                    <div className="health-metric-subtext">
                                                        Distribución de ingresos
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="health-metric-card">
                                                <div className="health-metric-icon">
                                                    <RefreshCw size={24} color="#26b7cd" />
                                                </div>
                                                <div className="health-metric-content">
                                                    <div className="health-metric-value">
                                                        {formatPercentage(metricsData.BusinessHealth?.RecurrenceRate || 0)}
                                                    </div>
                                                    <div className="health-metric-label">Recurrencia</div>
                                                    <div className="health-metric-subtext">
                                                        Clientes que repiten
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="health-metric-card">
                                                <div className="health-metric-icon">
                                                    <Activity size={24} color="#26b7cd" />
                                                </div>
                                                <div className="health-metric-content">
                                                    <div className="health-metric-value">
                                                        {getSeasonalityText(metricsData.BusinessHealth?.SeasonalityLevel)}
                                                    </div>
                                                    <div className="health-metric-label">Estacionalidad</div>
                                                    <div className="health-metric-subtext">
                                                        Variación mensual
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {expandedSections.healthDetails && (
                                            <div className="health-details-expanded">
                                                <div className="health-detail-item">
                                                    <h4>¿Qué significan estas métricas?</h4>
                                                    <p>Estas métricas evalúan la salud financiera y operativa de su empresa desde diferentes perspectivas:</p>

                                                    <div className="health-explanation">
                                                        <strong>Diversificación (0-100):</strong> Mide el riesgo de concentración. Puntaje alto = menor dependencia de pocos clientes/productos.
                                                    </div>
                                                    <div className="health-explanation">
                                                        <strong>Recurrencia (0-100%):</strong> Indica la fidelidad de sus clientes. Mayor porcentaje = base de clientes más estable.
                                                    </div>
                                                    <div className="health-explanation">
                                                        <strong>Estacionalidad (Baja/Media/Alta):</strong> Refleja la variación de ingresos mensuales. Baja = ingresos más predecibles.
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="sustainability-health-summary">
                                            <div className="health-summary-item positive">
                                                <Shield size={16} />
                                                <span><strong>FORTALEZAS:</strong> {metricsData.BusinessHealth?.Strengths?.$values?.[0] || 'Crecimiento consistente'}</span>
                                            </div>
                                            <div className="health-summary-item warning">
                                                <AlertTriangle size={16} />
                                                <span><strong>ATENCIÓN:</strong> {metricsData.BusinessHealth?.Alerts?.$values?.[0] || 'Revisar concentración de clientes'}</span>
                                            </div>
                                            <div className="health-summary-item opportunity">
                                                <Lightbulb size={16} />
                                                <span><strong>OPORTUNIDAD:</strong> {metricsData.BusinessHealth?.Recommendations?.$values?.[0] || 'Diversificar cartera de productos'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="sustainability-section">
                                        <div className="sustainability-section-header">
                                            <Zap size={20} color="#26b7cd" />
                                            <h3>Alertas y Acciones Recomendadas</h3>
                                        </div>
                                        <div className="sustainability-alerts">
                                            <div className="sustainability-alert high">
                                                <AlertTriangle size={20} />
                                                <div className="alert-content">
                                                    <div className="alert-title">ALTA DEPENDENCIA</div>
                                                    <div className="alert-description">
                                                        {metricsData.ClientConcentration?.$values?.[0]?.ClientName || 'Cliente principal'} representa {formatPercentage(metricsData.ClientConcentration?.$values?.[0]?.Percentage || 0)} de ingresos
                                                    </div>
                                                    <div className="alert-action">
                                                        📋 <strong>Acción:</strong> Desarrollar estrategias de captación de clientes medianos para reducir riesgo
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="sustainability-alert medium">
                                                <Target size={20} />
                                                <div className="alert-content">
                                                    <div className="alert-title">OPORTUNIDAD INMEDIATA</div>
                                                    <div className="alert-description">
                                                        {formatPrice(metricsData.RevenueForecast?.TotalHighProbabilityRevenue || 0)} en cotizaciones con alta probabilidad
                                                    </div>
                                                    <div className="alert-action">
                                                        📋 <strong>Acción:</strong> Seguimiento prioritario a clientes con alta probabilidad de conversión
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="sustainability-alert medium">
                                                <BarChart3 size={20} />
                                                <div className="alert-content">
                                                    <div className="alert-title">DIVERSIFICACIÓN DE PRODUCTOS</div>
                                                    <div className="alert-description">
                                                        {metricsData.ProductMix?.$values?.[0]?.ProductName || 'Producto principal'} representa {formatPercentage(metricsData.ProductMix?.$values?.[0]?.Percentage || 0)} de ingresos
                                                    </div>
                                                    <div className="alert-action">
                                                        📋 <strong>Acción:</strong> Desarrollar complementos y nuevas líneas de producto
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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

export default DashboardSostenibilidad;