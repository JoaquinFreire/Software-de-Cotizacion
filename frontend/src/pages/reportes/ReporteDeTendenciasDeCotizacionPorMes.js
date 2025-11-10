import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import html2pdf from 'html2pdf.js';
import ReactLoading from 'react-loading';
import {
    TrendingUp,
    Download,
    Printer,
    Calendar,
    Users,
    CheckCircle,
    Clock,
    XCircle,
    BarChart3,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Target,
    Zap,
    Award,
    GitCompare
} from 'lucide-react';
import logoAnodal from '../../images/logo_secundario.webp';
import { safeArray } from '../../utils/safeArray';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import '../../styles/ReporteTendencias.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const API_URL = process.env.REACT_APP_API_URL;
const monthsShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function resolveRefs(array) {
    const byId = {};
    array.forEach(obj => {
        if (obj && obj.$id) byId[obj.$id] = obj;
        if (obj?.Customer && obj.Customer.$id) byId[obj.Customer.$id] = obj.Customer;
        if (obj?.WorkPlace && obj.WorkPlace.$id) byId[obj.WorkPlace.$id] = obj.WorkPlace;
    });
    function resolve(obj) {
        if (!obj || typeof obj !== "object") return obj;
        if (obj.$ref) return byId[obj.$ref] || {};
        const out = Array.isArray(obj) ? [] : {};
        for (const k in obj) out[k] = resolve(obj[k]);
        return out;
    }
    return array.map(resolve);
}

const getDefaultMonths = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // Por defecto: últimos 6 meses completos
    const hastaMonth = currentMonth - 1;
    const desdeMonth = hastaMonth - 5;

    // Ajustar si cruzamos año
    let desdeYear = currentYear;
    let desdeMonthAdj = desdeMonth;

    if (desdeMonth < 1) {
        desdeYear = currentYear - 1;
        desdeMonthAdj = desdeMonth + 12;
    }

    return {
        desde: `${desdeYear}-${String(desdeMonthAdj).padStart(2, '0')}`,
        hasta: `${currentYear}-${String(hastaMonth).padStart(2, '0')}`
    };
};

const formatFechaCorta = (fecha) => {
    if (!fecha) return '';
    const [datePart] = fecha.split('T');
    const [y, m, d] = datePart.split('-');
    return `${d}-${m}-${y.slice(2)}`;
};

const parseMonthValueToDate = (monthValue) => {
    if (!monthValue) return null;
    const [y, m] = monthValue.split('-').map(Number);
    return new Date(y, (m || 1) - 1, 1);
};

const lastDayOfMonth = (year, monthOneBased) => new Date(year, monthOneBased, 0).getDate();
const addMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1);
const formatYYYYMM = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const ReporteDeTendenciasDeCotizacionPorMes = () => {
    const defaultMonths = getDefaultMonths();
    const [fechaDesde, setFechaDesde] = useState(defaultMonths.desde);
    const [fechaHasta, setFechaHasta] = useState(defaultMonths.hasta);
    const [generar, setGenerar] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tableData, setTableData] = useState([]);
    const [cotizaciones, setCotizaciones] = useState([]);

    // Estados para comparativa
    const [compareDesde, setCompareDesde] = useState('');
    const [compareHasta, setCompareHasta] = useState('');
    const [compareTableData, setCompareTableData] = useState([]);
    const [compareCotizaciones, setCompareCotizaciones] = useState([]);
    const [compareLoading, setCompareLoading] = useState(false);
    const [showComparison, setShowComparison] = useState(false);

    const navigate = useNavigate();
    const pdfRef = useRef();

    // Calcular métricas para KPIs - CORREGIDO con estado "approved"
    const calculateKPIs = (data, cotizacionesData) => {
        const total = data.reduce((sum, row) => sum + row.count, 0);

        // Contar por estados CORREGIDOS
        const approved = cotizacionesData.filter(q => q.Status === 'approved').length;
        const pending = cotizacionesData.filter(q => q.Status === 'pending').length;
        const rejected = cotizacionesData.filter(q => q.Status === 'rejected').length;
        const finished = cotizacionesData.filter(q => q.Status === 'finished').length;

        const conversionRate = total > 0 ? (approved / total) * 100 : 0;

        return {
            total,
            approved,
            pending,
            rejected,
            finished,
            conversionRate
        };
    };

    const kpis = calculateKPIs(tableData, cotizaciones);
    const compareKpis = calculateKPIs(compareTableData, compareCotizaciones);

    const invalidRange = (() => {
        const d = parseMonthValueToDate(fechaDesde);
        const h = parseMonthValueToDate(fechaHasta);
        if (!d || !h) return true;
        return d.getFullYear() > h.getFullYear() || (d.getFullYear() === h.getFullYear() && d.getMonth() > h.getMonth());
    })();

    const fetchAndAggregate = async () => {
        if (!fechaDesde || !fechaHasta) return [];
        if (invalidRange) {
            alert('Rango inválido: El mes Desde no puede ser posterior al mes Hasta.');
            return [];
        }
        setLoading(true);
        try {
            const [yDesde, mDesde] = fechaDesde.split('-').map(Number);
            const [yHasta, mHasta] = fechaHasta.split('-').map(Number);
            const fromStr = `${yDesde}-${String(mDesde).padStart(2, '0')}-01`;
            const toLast = lastDayOfMonth(yHasta, mHasta);
            const toStr = `${yHasta}-${String(mHasta).padStart(2, '0')}-${String(toLast).padStart(2, '0')}`;

            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/quotations/by-period?from=${fromStr}&to=${toStr}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            let data = safeArray(res.data);
            data = resolveRefs(data);
            setCotizaciones(data);

            const buckets = {};
            data.forEach(q => {
                const dateStr = q.CreationDate || q.creationDate || q.Creation || null;
                const d = dateStr ? new Date(dateStr) : null;
                if (!d || isNaN(d)) return;
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (!buckets[key]) buckets[key] = {
                    count: 0,
                    approved: 0,
                    pending: 0,
                    rejected: 0,
                    finished: 0
                };
                buckets[key].count += 1;

                // Contar por estados CORREGIDOS
                if (q.Status === 'approved') buckets[key].approved += 1;
                else if (q.Status === 'pending') buckets[key].pending += 1;
                else if (q.Status === 'rejected') buckets[key].rejected += 1;
                else if (q.Status === 'finished') buckets[key].finished += 1;
            });

            const desdeD = parseMonthValueToDate(fechaDesde);
            const hastaD = parseMonthValueToDate(fechaHasta);
            const months = [];
            for (let cur = new Date(desdeD); cur <= hastaD; cur = addMonth(cur)) months.push(new Date(cur));

            const table = months.map((d, idx) => {
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const bucket = buckets[key] || {
                    count: 0,
                    approved: 0,
                    pending: 0,
                    rejected: 0,
                    finished: 0
                };
                const conversion = bucket.count > 0 ? (bucket.approved / bucket.count) * 100 : 0;

                const prevKey = idx > 0 ? `${months[idx - 1].getFullYear()}-${String(months[idx - 1].getMonth() + 1).padStart(2, '0')}` : null;
                const prev = prevKey ? (buckets[prevKey]?.count ?? 0) : null;
                const variation = prev === null ? null : (prev === 0 ? (bucket.count === 0 ? 0 : 100) : ((bucket.count - prev) / prev) * 100);

                return {
                    monthKey: key,
                    monthLabel: `${monthsShort[d.getMonth()]} ${d.getFullYear()}`,
                    year: d.getFullYear(),
                    monthNum: d.getMonth() + 1,
                    count: bucket.count,
                    approved: bucket.approved,
                    pending: bucket.pending,
                    rejected: bucket.rejected,
                    finished: bucket.finished,
                    conversion: conversion,
                    variationPct: variation
                };
            });

            setTableData(table);
            return table;
        } catch (err) {
            console.error("Error generando reporte de tendencias:", err);
            setTableData([]);
            setCotizaciones([]);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const fetchAndAggregateCompare = async () => {
        if (!compareDesde || !compareHasta) return [];
        const d = parseMonthValueToDate(compareDesde);
        const h = parseMonthValueToDate(compareHasta);
        if (!d || !h || d > h) {
            alert('Rango de comparación inválido');
            return [];
        }
        setCompareLoading(true);
        try {
            const [yDesde, mDesde] = compareDesde.split('-').map(Number);
            const [yHasta, mHasta] = compareHasta.split('-').map(Number);
            const fromStr = `${yDesde}-${String(mDesde).padStart(2, '0')}-01`;
            const last = lastDayOfMonth(yHasta, mHasta);
            const toStr = `${yHasta}-${String(mHasta).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/quotations/by-period?from=${fromStr}&to=${toStr}`,
                { headers: { Authorization: `Bearer ${token}` } });
            let data = safeArray(res.data);
            data = resolveRefs(data);

            setCompareCotizaciones(data);

            const buckets = {};
            data.forEach(q => {
                const dateStr = q.CreationDate || q.creationDate || q.Creation || null;
                const dt = dateStr ? new Date(dateStr) : null;
                if (!dt || isNaN(dt)) return;
                const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
                if (!buckets[key]) buckets[key] = {
                    count: 0,
                    approved: 0,
                    pending: 0,
                    rejected: 0,
                    finished: 0
                };
                buckets[key].count += 1;

                // Contar por estados CORREGIDOS
                if (q.Status === 'approved') buckets[key].approved += 1;
                else if (q.Status === 'pending') buckets[key].pending += 1;
                else if (q.Status === 'rejected') buckets[key].rejected += 1;
                else if (q.Status === 'finished') buckets[key].finished += 1;
            });

            const desdeD = parseMonthValueToDate(compareDesde);
            const hastaD = parseMonthValueToDate(compareHasta);
            const months = [];
            for (let cur = new Date(desdeD); cur <= hastaD; cur = addMonth(cur)) months.push(new Date(cur));

            const table = months.map((d) => {
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const bucket = buckets[key] || {
                    count: 0,
                    approved: 0,
                    pending: 0,
                    rejected: 0,
                    finished: 0
                };
                const conversion = bucket.count > 0 ? (bucket.approved / bucket.count) * 100 : 0;

                return {
                    monthKey: key,
                    monthLabel: `${monthsShort[d.getMonth()]} ${d.getFullYear()}`,
                    count: bucket.count,
                    approved: bucket.approved,
                    pending: bucket.pending,
                    rejected: bucket.rejected,
                    finished: bucket.finished,
                    conversion: conversion
                };
            });

            setCompareTableData(table);
            setShowComparison(true);
        } catch (err) {
            setCompareTableData([]);
            setCompareCotizaciones([]);
            setShowComparison(false);
            console.error("Error generando periodo de comparación:", err);
        } finally {
            setCompareLoading(false);
        }
    };

    const handleGenerar = async () => {
        setGenerar(true);
        setShowComparison(false); // Resetear comparación al generar nuevo reporte
        const mainTable = await fetchAndAggregate();
        if (!mainTable || mainTable.length === 0) return;

        // Calcular período de comparación inteligente (mismo período del año anterior)
        const [yDesde, mDesde] = fechaDesde.split('-').map(Number);
        const [yHasta, mHasta] = fechaHasta.split('-').map(Number);

        // Usar el año anterior para la comparación
        const compareDesdeVal = `${yDesde }-${String(mDesde).padStart(2, '0')}`;
        const compareHastaVal = `${yHasta }-${String(mHasta).padStart(2, '0')}`;

        console.log('Período principal:', fechaDesde, 'a', fechaHasta);
        console.log('Período comparación:', compareDesdeVal, 'a', compareHastaVal);

        setCompareDesde(compareDesdeVal);
        setCompareHasta(compareHastaVal);
    };

    const handleComparar = async () => {
        await fetchAndAggregateCompare();
    };

    const handleImprimir = () => window.print();
    //const handleDescargarPDF = async () => {
    //    if (!pdfRef.current) return;
    //    const el = pdfRef.current;
    //    document.body.classList.add('pdf-exporting');
    //    const opt = {
    //        margin: [0.2, 0.2, 0.2, 0.2],
    //        filename: `reporte_tendencias_${fechaDesde}_a_${fechaHasta}.pdf`,
    //        image: { type: 'jpeg', quality: 0.98 },
    //        html2canvas: { scale: 2, useCORS: true },
    //        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    //    };
    //    await html2pdf().set(opt).from(el).save();
    //    document.body.classList.remove('pdf-exporting');
    //};

    // Datos para gráficos
    const chartData = {
        labels: tableData.map(row => row.monthLabel),
        datasets: [
            {
                label: 'Aprobadas',
                data: tableData.map(row => row.approved),
                backgroundColor: '#10b981',
                borderColor: '#0da271',
                borderWidth: 2,
            },
            {
                label: 'Pendientes',
                data: tableData.map(row => row.pending),
                backgroundColor: '#f59e0b',
                borderColor: '#d97706',
                borderWidth: 2,
            },
            {
                label: 'Rechazadas',
                data: tableData.map(row => row.rejected),
                backgroundColor: '#ef4444',
                borderColor: '#dc2626',
                borderWidth: 2,
            },
            {
                label: 'Finalizadas',
                data: tableData.map(row => row.finished),
                backgroundColor: '#6b7280',
                borderColor: '#4b5563',
                borderWidth: 2,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top'
            },
            tooltip: {
                callbacks: {
                    afterBody: function (context) {
                        const datasetIndex = context[0].datasetIndex;
                        const dataIndex = context[0].dataIndex;
                        const value = context[0].raw;
                        const total = tableData[dataIndex]?.count || 0;

                        if (total > 0 && value > 0) {
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `Porcentaje: ${percentage}% del total`;
                        }
                        return '';
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    font: {
                        size: 14 // ← AUMENTAR TAMAÑO DE FUENTE EJE X
                    }
                }            },
            y: {
                beginAtZero: true,
                ticks: {
                    font: {
                        size: 14 // ← AUMENTAR TAMAÑO DE FUENTE EJE Y
                    },
                    callback: function (value) {
                        if (value === 0) return '';
                        return value;
                    }
                }
            }
        }
    };

    return (
        <div className="dashboard-container">
            <Navigation onLogout={() => {
                localStorage.removeItem("token");
                navigate("/");
            }} />

            <div className="tendencias-main-wrapper">
                <div className="tendencias-content-container">
                    <div className="tendencias-main-container">
                        {/* HEADER */}
                        <div className="tendencias-header">
                            <div className="tendencias-header-title">
                                <TrendingUp size={32} />
                                <div>
                                    <h1>Reporte de Tendencias - Cotizaciones por Mes</h1>
                                    <p>Análisis de volumen y performance por período</p>
                                </div>
                            </div>
                            <div className="tendencias-header-actions">
                                <button className="tendencias-btn tendencias-btn-primary" onClick={handleGenerar} disabled={loading}>
                                    <RefreshCw size={18} />
                                    {loading ? 'Generando...' : 'Generar Reporte'}
                                </button>
                            </div>
                        </div>

                        {/* FILTROS PRINCIPALES */}
                        <div className="tendencias-filtros">
                            <div className="filtros-grid">
                                <div className="filtro-group">
                                    <label>Desde (mes):</label>
                                    <input
                                        type="month"
                                        value={fechaDesde}
                                        onChange={e => setFechaDesde(e.target.value)}
                                        className="filtro-input"
                                    />
                                </div>
                                <div className="filtro-group">
                                    <label>Hasta (mes):</label>
                                    <input
                                        type="month"
                                        value={fechaHasta}
                                        onChange={e => setFechaHasta(e.target.value)}
                                        className="filtro-input"
                                    />
                                </div>
                                <div className="filtro-actions">
                                    {/*<button className="tendencias-btn tendencias-btn-secondary" onClick={handleDescargarPDF} disabled={!generar}>*/}
                                    {/*    <Download size={18} />*/}
                                    {/*    PDF*/}
                                    {/*</button>*/}
                                    {/*<button className="tendencias-btn tendencias-btn-secondary" onClick={handleImprimir} disabled={!generar}>*/}
                                    {/*    <Printer size={18} />*/}
                                    {/*    Imprimir*/}
                                    {/*</button>*/}
                                </div>
                            </div>
                        </div>

                        {/* COMPARACIÓN - Debajo de los filtros principales */}
                        <div className="tendencias-comparar-filtros">
                            <div className="comparar-header">
                                <GitCompare size={20} />
                                <h3>Comparar con Otro Período</h3>
                            </div>
                            <div className="comparar-grid">
                                <div className="filtro-group">
                                    <label>Desde (comparación):</label>
                                    <input
                                        type="month"
                                        value={compareDesde}
                                        onChange={e => setCompareDesde(e.target.value)}
                                        className="filtro-input"
                                        disabled={!generar}
                                    />
                                </div>
                                <div className="filtro-group">
                                    <label>Hasta (comparación):</label>
                                    <input
                                        type="month"
                                        value={compareHasta}
                                        onChange={e => setCompareHasta(e.target.value)}
                                        className="filtro-input"
                                        disabled={!generar}
                                    />
                                </div>
                                <button
                                    className="tendencias-btn tendencias-btn-comparar"
                                    onClick={handleComparar}
                                    disabled={compareLoading || !compareDesde || !compareHasta || !generar}
                                >
                                    {compareLoading ? 'Cargando...' : 'Generar Comparación'}
                                </button>
                            </div>
                        </div>

                        <div className="tendencias-pdf-container" ref={pdfRef}>
                            {/* KPIs PRINCIPALES */}
                            {generar && !loading && (
                                <div className="tendencias-kpis">
                                    <div className="kpi-card">
                                        <div className="kpi-icon" style={{ background: 'rgba(38, 183, 205, 0.1)' }}>
                                            <BarChart3 size={24} />
                                        </div>
                                        <div className="kpi-content">
                                            <div className="kpi-value">{kpis.total}</div>
                                            <div className="kpi-label">Total Cotizaciones</div>
                                        </div>
                                    </div>
                                    <div className="kpi-card">
                                        <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                                            <CheckCircle size={24} />
                                        </div>
                                        <div className="kpi-content">
                                            <div className="kpi-value">{kpis.approved}</div> {/* CORREGIDO: changed from accepted to approved */}
                                            <div className="kpi-label">Aprobadas</div> {/* CORREGIDO: changed from Aceptadas to Aprobadas */}
                                            <div className="kpi-subtext">{kpis.conversionRate.toFixed(1)}% conversión</div>
                                        </div>
                                    </div>
                                    <div className="kpi-card">
                                        <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                                            <Clock size={24} />
                                        </div>
                                        <div className="kpi-content">
                                            <div className="kpi-value">{kpis.pending}</div>
                                            <div className="kpi-label">Pendientes</div>
                                            <div className="kpi-subtext">{((kpis.pending / kpis.total) * 100).toFixed(1)}% del total</div>
                                        </div>
                                    </div>
                                    <div className="kpi-card">
                                        <div className="kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                                            <XCircle size={24} />
                                        </div>
                                        <div className="kpi-content">
                                            <div className="kpi-value">{kpis.rejected + kpis.finished}</div> {/* Incluir finished en "otras" */}
                                            <div className="kpi-label">Otras</div>
                                            <div className="kpi-subtext">Rechazadas + Finalizadas</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* COMPARATIVA ENTRE PERÍODOS - Debajo de KPIs */}
                            {showComparison && compareTableData.length > 0 && (
                                <div className="tendencias-comparativa-section">
                                    <div className="section-header">
                                        <Target size={24} />
                                        <h2>Comparativa Entre Períodos</h2>
                                    </div>
                                    <div className="comparativa-grid">
                                        <div className="comparativa-periodo">
                                            <h3>Período Actual</h3>
                                            <div className="periodo-fechas">{fechaDesde} a {fechaHasta}</div>
                                            <div className="periodo-stats">
                                                <div className="stat">
                                                    <span className="stat-value">{kpis.total}</span>
                                                    <span className="stat-label">Total</span>
                                                </div>
                                                <div className="stat">
                                                    <span className="stat-value">{kpis.approved}</span> {/* CORREGIDO */}
                                                    <span className="stat-label">Aprobadas</span> {/* CORREGIDO */}
                                                </div>
                                                <div className="stat">
                                                    <span className="stat-value">{kpis.conversionRate.toFixed(1)}%</span>
                                                    <span className="stat-label">Conversión</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="comparativa-variacion">
                                            <div className="variacion-content">
                                                <Award size={32} />
                                                <div className="variacion-text">
                                                    <div className="variacion-titulo">Variación General</div>
                                                    <div className="variacion-valor">
                                                        {compareKpis.total > 0 ?
                                                            `${(((kpis.total - compareKpis.total) / compareKpis.total) * 100).toFixed(1)}%`
                                                            : 'N/A'}
                                                    </div>
                                                    <div className="variacion-subtext">
                                                        en volumen total
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="comparativa-periodo">
                                            <h3>Período Comparación</h3>
                                            <div className="periodo-fechas">{compareDesde} a {compareHasta}</div>
                                            <div className="periodo-stats">
                                                <div className="stat">
                                                    <span className="stat-value">{compareKpis.total}</span>
                                                    <span className="stat-label">Total</span>
                                                </div>
                                                <div className="stat">
                                                    <span className="stat-value">{compareKpis.approved}</span> {/* CORREGIDO */}
                                                    <span className="stat-label">Aprobadas</span> {/* CORREGIDO */}
                                                </div>
                                                <div className="stat">
                                                    <span className="stat-value">{compareKpis.conversionRate.toFixed(1)}%</span>
                                                    <span className="stat-label">Conversión</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* GRÁFICO PRINCIPAL */}
                            {generar && !loading && tableData.length > 0 && (
                                <div className="tendencias-grafico-section">
                                    <div className="section-header">
                                        <TrendingUp size={24} />
                                        <h2>Evolución Mensual - Volumen de Cotizaciones</h2>
                                    </div>
                                    <div className="grafico-container">
                                        {tableData.length > 0 ? (
                                            <Bar data={chartData} options={chartOptions} />
                                        ) : (
                                            <div className="grafico-vacio">
                                                <p>No hay datos para mostrar en el gráfico</p>
                                                <span>No se encontraron cotizaciones para el período seleccionado</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* RESUMEN MENSUAL DETALLADO */}
                            {generar && !loading && (
                                <div className="tendencias-tabla-section">
                                    <div className="section-header">
                                        <BarChart3 size={24} />
                                        <h2>Resumen Mensual Detallado</h2>
                                    </div>
                                    <div className="tabla-container">
                                        <table className="tendencias-tabla">
                                            <thead>
                                                <tr>
                                                    <th>Mes</th>
                                                    <th>Total</th>
                                                    <th>Aprobadas</th> {/* CORREGIDO */}
                                                    <th>Pendientes</th>
                                                    <th>Otras</th>
                                                    <th>Conversión</th>
                                                    <th>Variación</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tableData.map(row => (
                                                    <tr key={row.monthKey}>
                                                        <td className="mes-cell">{row.monthLabel}</td>
                                                        <td>{row.count}</td>
                                                        <td className="aprobadas-cell">{row.approved}</td> {/* CORREGIDO */}
                                                        <td className="pendientes-cell">{row.pending}</td>
                                                        <td className="rechazadas-cell">{row.rejected + row.finished}</td> {/* Combinar rejected y finished */}
                                                        <td className="conversion-cell">{row.conversion.toFixed(1)}%</td>
                                                        <td className={`variacion-cell ${row.variationPct > 0 ? 'positivo' : row.variationPct < 0 ? 'negativo' : ''}`}>
                                                            {row.variationPct === null ? '-' : `${row.variationPct > 0 ? '+' : ''}${Math.round(row.variationPct)}%`}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* LOADING STATE */}
                            {loading && (
                                <div className="tendencias-loading">
                                    <ReactLoading type="spin" color="#26b7cd" height={60} width={60} />
                                    <p>Generando reporte...</p>
                                </div>
                            )}

                            {/* EMPTY STATE */}
                            {!generar && !loading && (
                                <div className="tendencias-empty">
                                    <TrendingUp size={64} />
                                    <h3>Reporte No Generado</h3>
                                    <p>Seleccione un rango de meses y presione "Generar Reporte"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ReporteDeTendenciasDeCotizacionPorMes;