import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    RefreshCw,
    Package,
    Shield,
    Eye,
    Filter,
    ChevronDown,
    ChevronUp,
    Calendar,
    BarChart3,
    AlertTriangle,
    Download,
    Users
} from 'lucide-react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import '../../styles/DashboardEficienciaOperativa.css';
import { useNavigate } from "react-router-dom";

const getDefaultDates = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    return {
        desde: `${currentYear}-01-01`,
        hasta: `${currentYear}-12-31`
    };
};

const ReporteMaterialesUsados = () => {
    const defaultDates = getDefaultDates();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [fechaDesde, setFechaDesde] = useState(defaultDates.desde);
    const [fechaHasta, setFechaHasta] = useState(defaultDates.hasta);
    const [dateFiltersApplied, setDateFiltersApplied] = useState(false);
    const [filters, setFilters] = useState({
        timeRange: '90d',
        materialType: 'all'
    });
    const [filtersVisible, setFiltersVisible] = useState(false);

    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL || window.location.origin;

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    }

    const fetchData = async (desde, hasta) => {
    setError(null);
    try {
        setLoading(true);
        const base = API_URL || window.location.origin;
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // Construir URL con parámetros de fecha
        const params = new URLSearchParams();
        if (desde) params.append('desde', desde);
        if (hasta) params.append('hasta', hasta);

        const candidateUrls = [
            `${base}/api/Mongo/GetMaterialsUsage?${params}`,
            `${window.location.origin}/api/Mongo/GetMaterialsUsage?${params}`,
            `/api/Mongo/GetMaterialsUsage?${params}`
        ];

        if (base.startsWith('http:')) candidateUrls.push(base.replace('http:', 'https:') + `/api/Mongo/GetMaterialsUsage?${params}`);
        if (base.startsWith('https:')) candidateUrls.push(base.replace('https:', 'http:') + `/api/Mongo/GetMaterialsUsage?${params}`);

        // El resto del código se mantiene igual...
        let finalJson = null;
        const tried = [];

        for (const url of candidateUrls) {
            try {
                console.log('Probing URL:', url);
                const res = await fetch(url, { headers });
                const text = await res.text();
                let json = null;
                try { json = text ? JSON.parse(text) : null; } catch (e) { /* not json */ }
                tried.push({ url, status: res.status, snippet: (text || '').slice(0, 200) });
                if (res.ok) { finalJson = json; break; }
                if (res.status === 404) continue;
                throw new Error((json && json.message) || text || `HTTP ${res.status}`);
            } catch (innerErr) {
                console.warn('Probe failed for', url, innerErr);
                tried.push({ url, status: 'error', message: innerErr.message });
            }
        }

        console.log('Tried endpoints:', tried);
        if (!finalJson) {
            const summary = tried.map(t => `${t.url} -> ${t.status}`).join(' | ');
            throw new Error(`No response from backend. URLs probadas: ${summary}`);
        }

        // ... el resto del código de normalización se mantiene igual
        const norm = (resp) => {
            if (!resp) return {
                Openings: {},
                Glass: {},
                Accessories: {},
                Treatments: {},
                Coatings: {},
                CountBudgets: 0
            };
            const get = (k) => resp[k] ?? resp[k.toLowerCase()] ?? resp[k.toUpperCase()] ?? {};
            return {
                Openings: get('Openings') || get('openings'),
                Glass: get('Glass') || get('glass'),
                Accessories: get('Accessories') || get('accessories'),
                Treatments: get('Treatments') || get('treatments'),
                Coatings: get('Coatings') || get('coatings'),
                CountBudgets: resp.CountBudgets ?? resp.countBudgets ?? resp.countbudgets ?? (Array.isArray(resp) ? resp.length : (resp?.Count ?? 0))
            };
        };

        const normalizedData = norm(finalJson);

        const removeInvalidKeys = (obj) => {
            if (!obj || typeof obj !== 'object') return {};
            return Object.fromEntries(
                Object.entries(obj)
                    .filter(([k, v]) => {
                        if (!k) return false;
                        const kl = String(k).trim().toLowerCase();
                        if (kl === '$id' || kl === 'id' || kl === '') return false;
                        if (typeof v === 'string' && v.trim().toLowerCase() === '$id') return false;
                        return true;
                    })
            );
        };

        normalizedData.Glass = removeInvalidKeys(normalizedData.Glass);
        normalizedData.Treatments = removeInvalidKeys(normalizedData.Treatments);
        normalizedData.Coatings = removeInvalidKeys(normalizedData.Coatings);

        const enrichedData = {
            ...normalizedData,
            SummaryStats: calculateSummaryStats(normalizedData),
            TopMaterials: getTopMaterials(normalizedData),
            MaterialTrends: generateMaterialTrends(normalizedData),
            filterDates: { desde, hasta }
        };

        setData(enrichedData);
        setDateFiltersApplied(true);
    } catch (err) {
        console.error("Error cargando materiales:", err);
        setData(null);
        setError(err.message || 'Error desconocido');
    } finally {
        setLoading(false);
    }
};

    // Función para calcular estadísticas resumen
    const calculateSummaryStats = (data) => {
        if (!data) return {};

        const totalMaterials =
            Object.keys(data.Glass || {}).length +
            Object.keys(data.Treatments || {}).length +
            Object.keys(data.Coatings || {}).length;

        const totalUsage =
            Object.values(data.Glass || {}).reduce((sum, val) => sum + (Number(val) || 0), 0) +
            Object.values(data.Treatments || {}).reduce((sum, val) => sum + (Number(val) || 0), 0) +
            Object.values(data.Coatings || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);

        return {
            totalMaterials,
            totalUsage,
            budgetsAnalyzed: data.CountBudgets || 0
        };
    };

    // Función para obtener los materiales más usados
    const getTopMaterials = (data) => {
        if (!data) return {};

        const allMaterials = [
            ...Object.entries(data.Glass || {}).map(([name, value]) => ({
                category: 'Vidrio',
                name,
                value: Number(value) || 0,
                unit: 'm²',
                type: 'vidrio'
            })),
            ...Object.entries(data.Treatments || {}).map(([name, value]) => ({
                category: 'Aluminio',
                name,
                value: Number(value) || 0,
                unit: 'aplicaciones',
                type: 'aluminio'
            })),
            ...Object.entries(data.Coatings || {}).map(([name, value]) => ({
                category: 'Revestimiento',
                name,
                value: Number(value) || 0,
                unit: 'aplicaciones',
                type: 'revestimiento'
            }))
        ];

        // Filtrar entradas inválidas (nombre vacío o "$id")
        const validMaterials = allMaterials.filter(m => {
            if (!m || !m.name) return false;
            const n = String(m.name).trim().toLowerCase();
            if (n === '' || n === '$id' || n === 'id') return false;
            return true;
        });

        return validMaterials
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    };

    // Función para generar tendencias (simuladas)
    const generateMaterialTrends = (data) => {
        return {
            trend: 'up',
            percentage: 15.5,
            message: 'Aumento en uso de materiales premium'
        };
    };

    useEffect(() => {
    fetchData(fechaDesde, fechaHasta);
}, []);

    // Función para renderizar listas con mejor formato
    const renderMaterialList = (items, unit = "", maxItems = 8) => {
        if (!items || Object.keys(items).length === 0) {
            return <div className="no-data-message">No hay datos disponibles</div>;
        }

        const entries = Object.entries(items)
            .sort(([, a], [, b]) => (b || 0) - (a || 0))
            .slice(0, maxItems);

        return (
            <div className="material-list">
                {entries.map(([name, value], index) => (
                    <div key={name} className="material-item">
                        <div className="material-rank">#{index + 1}</div>
                        <div className="material-info">
                            <div className="material-name">{name}</div>
                            <div className="material-usage">
                                {value} {unit}
                            </div>
                        </div>
                        <div className="material-bar">
                            <div
                                className="material-bar-fill"
                                style={{
                                    width: `${Math.min(100, (value / entries[0][1]) * 100)}%`
                                }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const handleRefresh = () => {
    fetchData(fechaDesde, fechaHasta);
};

    // Helper: devuelve entries ordenadas y recortadas (útil para gráficos)
    const getTopEntries = (obj, maxItems = 10) => {
        if (!obj || typeof obj !== 'object') return [];
        const entries = Object.entries(obj)
            .map(([k, v]) => [String(k).trim(), Number(v) || 0])
            .sort(([, a], [, b]) => b - a)
            .slice(0, maxItems);
        return entries;
    };


    if (loading) {
        return (
            <div className="dashboard-container">
                <Navigation onLogout={handleLogout} />
                <div className="dashboard-loading">
                    <div className="loading-spinner"></div>
                    <p>Cargando reporte de materiales...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <Navigation onLogout={handleLogout} />
                <div className="dashboard-main-wrapper">
                    <div className="dashboard-content-container" style={{ padding: 24 }}>
                        <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                            <h2>Error cargando reporte</h2>
                            <p style={{ color: '#b00020' }}>{error}</p>
                            <div style={{ marginTop: 12 }}>
                                <button className="btn-primary" onClick={fetchData}>
                                    <RefreshCw size={16} /> Reintentar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const applyFilters = () => {
    if (fechaDesde && fechaHasta) {
        if (fechaDesde > fechaHasta) {
            setError('La fecha "Desde" no puede ser mayor que la fecha "Hasta"');
            return;
        }
        fetchData(fechaDesde, fechaHasta);
    } else {
        setError('Ambas fechas son requeridas');
    }
};
    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />

            <div className="dashboard-main-wrapper">
                <div className="dashboard-content-container">

                    {/* HEADER */}
                    <div className="dashboard-header">
                        <div className="header-title">
                            <Package size={32} />
                            <div>
                                <h1>Reporte de Materiales Más Usados</h1>
                                <p>Análisis de tendencias y consumo de materiales en proyectos</p>
                            </div>
                        </div>
                        <div className="header-actions">
                            <button className="btn-primary" onClick={handleRefresh} disabled={!dateFiltersApplied}>
                                <RefreshCw size={18} />
                                Actualizar
                            </button>
                        </div>
                    </div>

                    {/* FILTROS POR FECHA */}
                    <div style={{ 
                        background: 'var(--beneficio-bg-lighter)',
                        padding: '16px', 
                        borderRadius: '8px', 
                        marginBottom: '20px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                    }}>
                        <div 
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                userSelect: 'none'
                            }}
                            onClick={() => setFiltersVisible(!filtersVisible)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Filter size={18} />
                                <span style={{ fontWeight: '600' }}>Filtros del Reporte</span>
                            </div>
                            {filtersVisible ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>

                        {filtersVisible && (
                            <div style={{ 
                                marginTop: '16px', 
                                paddingTop: '16px', 
                                borderTop: '1px solid #e0e0e0',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '16px',
                                alignItems: 'end'
                            }}>
                                <div>
                                    <label style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px',
                                        marginBottom: '8px',
                                        fontWeight: '500',
                                        fontSize: '14px'
                                    }}>
                                        <Calendar size={16} />
                                        Desde:
                                    </label>
                                    <input
                                        type="date"
                                        value={fechaDesde}
                                        onChange={e => setFechaDesde(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #d0d0d0',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px',
                                        marginBottom: '8px',
                                        fontWeight: '500',
                                        fontSize: '14px'
                                    }}>
                                        <Calendar size={16} />
                                        Hasta:
                                    </label>
                                    <input
                                        type="date"
                                        value={fechaHasta}
                                        onChange={e => setFechaHasta(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #d0d0d0',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                                <button
                                    className="btn-primary"
                                    onClick={applyFilters}
                                    disabled={loading || !fechaDesde || !fechaHasta}
                                    style={{
                                        marginBottom: '10'
                                    }}
                                >
                                    <Filter size={16} />
                                    Aplicar Filtro
                                </button>
                            </div>
                        )}
                    </div>

                    {/* KPI CARDS */}
                    <div className="kpi-section">
                        <div className="kpi-grid">
                            <div className="kpi-card">
                                <div className="kpi-icon" style={{ background: '#2196f3' }}>
                                    <Package size={24} />
                                </div>
                                <div className="kpi-content">
                                    <div className="kpi-value">{data?.SummaryStats?.budgetsAnalyzed || 3}</div>
                                    <div className="kpi-label">Categorías Generales</div>
                                    <div className="kpi-trend neutral">

                                    </div>
                                </div>
                            </div>

                            <div className="kpi-card">
                                <div className="kpi-icon" style={{ background: '#4caf50' }}>
                                    <BarChart3 size={24} />
                                </div>
                                <div className="kpi-content">
                                    <div className="kpi-value">{data?.SummaryStats?.totalMaterials || 0}</div>
                                    <div className="kpi-label">Cantidad de tipos de Materiales</div>
                                </div>
                            </div>

                            <div className="kpi-card">
                                <div className="kpi-icon" style={{ background: '#ff9800' }}>
                                    <TrendingUp size={24} />
                                </div>
                                <div className="kpi-content">
                                    <div className="kpi-value">
                                        {Object.values(data?.Treatments || {}).reduce((sum, val) => sum + (Number(val) || 0), 0) +
                                            Object.values(data?.Coatings || {}).reduce((sum, val) => sum + (Number(val) || 0), 0)}
                                    </div>
                                    <div className="kpi-label">Tratamientos y Revestimientos</div>
                                    <div className="kpi-subtext">
                                        Unidades aplicadas 
                                    </div>
                                </div>
                            </div>

                            <div className="kpi-card">
    <div className="kpi-icon" style={{ background: '#9c27b0' }}>
        <Users size={24} />
    </div>
    <div className="kpi-content">
        <div className="kpi-value">
            {Number(Object.values(data?.Glass || {}).reduce((sum, val) => sum + (Number(val) || 0), 0)).toFixed(2)}
            <span>m²</span>
        </div>
        <div className="kpi-label">Vidrio Utilizado</div>
        <div className="kpi-subtext">
            Metros cuadrados totales
        </div>
    </div>
</div>
                        </div>
                    </div>

                    <div className="main-content-grid">
                        <div className="content-column">
                            <div className="panel workload-panel">
                                <div className="panel-header">
                                    <Shield size={20} />
                                    <h3>Tratamientos</h3>
                                    <span className="panel-badge">
                                        {Object.keys(data?.Treatments || {}).length || 0} tipos
                                    </span>
                                </div>
                                <div className="panel-content">
                                    <div className="workload-table-container">
                                        {/* Gráfico para Tratamientos */}
                                        <div style={{ marginTop: '20px' }}>
                                            <div className="chart-title">Distribución de Tratamientos</div>
                                            <div className="bar-chart">
                                                {Object.entries(data?.Treatments || {})
                                                    .sort(([, a], [, b]) => b - a)
                                                    .slice(0, 6)
                                                    .map(([name, value], index) => (
                                                        <div key={name} className="bar-chart-item">
                                                            <div className="bar-label">{name}</div>
                                                            <div className="bar-track">
                                                                <div
                                                                    className="bar-fill"
                                                                    style={{
                                                                        width: `${Math.min(100, (value / Object.values(data?.Treatments || {})[0]) * 100)}%`,
                                                                        backgroundColor: '#ff9800'
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <div className="bar-value">{value} aplic.</div>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>



                            <div className="panel workload-panel">
                                <div className="panel-header">
                                    <Eye size={20} />
                                    <h3>Tipos de Vidrio</h3>
                                    <span className="panel-badge">
                                        {Object.keys(data?.Glass || {}).length || 0} tipos
                                    </span>
                                </div>
                                <div className="panel-content">
                                    <div className="workload-table-container">

                                        {/* Gráfico para Vidrios */}
                                        <div  style={{ marginTop: '20px' }}>
                                            <div className="chart-title">Distribución de Vidrios</div>
                                            <div className="bar-chart">
                                                {
                                                    (() => {
                                                        const entries = getTopEntries(data?.Glass, 10); // mostrar hasta 10 para cubrir "Curvo"
                                                        const maxVal = entries.length ? entries[0][1] : 1;
                                                        return entries.map(([name, value], index) => (
                                                            <div key={name} className="bar-chart-item">
                                                                <div className="bar-label">{name}</div>
                                                                <div className="bar-track">
                                                                    <div
                                                                        className="bar-fill"
                                                                        style={{
                                                                            width: `${Math.min(100, (value / (maxVal || 1)) * 100)}%`,
                                                                            backgroundColor: '#2196f3'
                                                                        }}
                                                                    ></div>
                                                                </div>
                                                                <div className="bar-value">{value} m²</div>
                                                            </div>
                                                        ));
                                                    })()
                                                }
                                            </div>
                                        </div>
                                    </div>

                                </div>


                            </div>
                            <div className="panel workload-panel">
                                <div className="panel-header">
                                    <Shield size={20} />
                                    <h3>Revestimientos</h3>
                                    <span className="panel-badge">
                                        {Object.keys(data?.Coatings || {}).length || 0} tipos
                                    </span>
                                </div>
                                <div className="panel-content">
                                    <div className="workload-table-container">
                                        {/* Gráfico para Revestimientos */}
                                        <div  style={{ marginTop: '20px' }}>
                                            <div className="chart-title">Distribución de Revestimientos</div>
                                            <div className="bar-chart">
                                                {Object.entries(data?.Coatings || {})
                                                    .sort(([, a], [, b]) => b - a)
                                                    .slice(0, 6)
                                                    .map(([name, value], index) => (
                                                        <div key={name} className="bar-chart-item">
                                                            <div className="bar-label">{name}</div>
                                                            <div className="bar-track">
                                                                <div
                                                                    className="bar-fill"
                                                                    style={{
                                                                        width: `${Math.min(100, (value / Object.values(data?.Coatings || {})[0]) * 100)}%`,
                                                                        backgroundColor: '#9c27b0'
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <div className="bar-value">{value} aplic.</div>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        <div className="content-column">
                            {/* TOP 10 MATERIALES GENERAL */}
                            <div className="panel alerts-panel">
                                <div className="panel-header">
                                    <TrendingUp size={20} />
                                    <h3>Top 10 Materiales General</h3>
                                    <span className="alerts-badge">{data?.TopMaterials?.length || 0}</span>
                                </div>
                                <div className="panel-content">
                                    <div className="alerts-list" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                        {data?.TopMaterials && data.TopMaterials.length > 0 ? (
                                            data.TopMaterials.map((material, index) => (
                                                <div key={index} className="alert-item">
                                                    <div
                                                        className="alert-indicator"
                                                        style={{
                                                            backgroundColor:
                                                                material.type === 'vidrio' ? '#2196f3' :
                                                                    material.type === 'aluminio' ? '#ff9800' : '#9c27b0'
                                                        }}
                                                    ></div>
                                                    <div className="alert-content">
                                                        <div className="alert-title">
                                                            #{index + 1} - {material.name}
                                                        </div>
                                                        <div className="alert-description">
                                                            {material.category} • {material.value} {material.unit}
                                                        </div>
                                                        <div className="alert-meta">
                                                            Tipo: {material.type}
                                                        </div>
                                                    </div>
                                                    <div className="alert-time">
                                                        {Math.round((material.value / data.TopMaterials[0].value) * 100)}%
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="no-data-message">
                                                No hay datos disponibles
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

export default ReporteMaterialesUsados;