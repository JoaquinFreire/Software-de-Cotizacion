import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
    TrendingDown,
    Download,
    Printer,
    Calendar,
    DollarSign,
    AlertTriangle,
    BarChart3,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Target,
    Zap,
    Award,
    GitCompare,
    Eye,
    FileText,
    ArrowLeft
} from 'lucide-react';
import logoAnodal from '../../images/logo_secundario.webp';
import { safeArray } from '../../utils/safeArray';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import '../../styles/reporteOportunidadesPerdidas.css';

const API_URL = process.env.REACT_APP_API_URL;
const monthsShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Estados para validación de roles
const requiredRoles = ['manager']; // Roles permitidos según la página de reportes

// Función para categorizar motivos automáticamente
const categorizarMotivo = (comentario) => {
    const motivo = comentario?.toLowerCase() || '';

    if (motivo.includes('precio') || motivo.includes('costo') || motivo.includes('caro') ||
        motivo.includes('elevado') || motivo.includes('presupuesto') || motivo.includes('valor')) {
        return 'Precio/Costo';
    }
    if (motivo.includes('competencia') || motivo.includes('otra empresa') ||
        motivo.includes('mejor oferta') || motivo.includes('otro proveedor')) {
        return 'Competencia';
    }
    if (motivo.includes('plazo') || motivo.includes('tiempo') || motivo.includes('entrega') ||
        motivo.includes('fecha') || motivo.includes('demora')) {
        return 'Plazos';
    }
    if (motivo.includes('error') || motivo.includes('incorrecto') ||
        motivo.includes('mal calculado') || motivo.includes('equivocación')) {
        return 'Error cotización';
    }
    if (motivo.includes('calidad') || motivo.includes('material') ||
        motivo.includes('terminación') || motivo.includes('acabado')) {
        return 'Calidad';
    }
    if (motivo === 'sin especificar' || motivo === '' || !motivo || motivo === 'sin motivo') {
        return 'Sin especificar';
    }

    return 'Otros';
};

// Función para extraer comentario corto
const extractShortComment = (q) => {
    const raw =
        q.comment ||
        q.Comment ||
        q.RejectionReason ||
        q.motivoRechazo ||
        q.rejectionReason ||
        q.MotivoRechazo ||
        (q.extra && (q.extra.RejectionReason || q.extra.motivoRechazo)) ||
        (q.meta && (q.meta.comment || q.meta.Comment)) ||
        '';

    if (!raw) return 'Sin especificar';

    // Limpiar texto largo
    const separators = [
        'Validez de la cotización',
        'Validez',
        'Precio de los materiales',
        'Precio de los materiales',
        '--- MOTIVO DE RECHAZO ---'
    ];

    let short = raw;
    for (const sep of separators) {
        const idx = short.indexOf(sep);
        if (idx > -1) {
            short = short.slice(0, idx);
            break;
        }
    }

    short = short.trim();
    const lines = short.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return 'Sin especificar';

    return lines.slice(0, 2).join(' ').trim() || 'Sin especificar';
};

const handleVerPDFCotizacion = async (cotizacion) => {
    try {
        // IMPORTANTE: Priorizar budgetId sobre id
        const budgetId = cotizacion.budgetId || cotizacion.BudgetId || cotizacion.id;

        console.log('Datos de cotización para PDF:', {
            budgetId: budgetId,
            cotizacionId: cotizacion.id,
            cotizacionBudgetId: cotizacion.budgetId,
            cotizacionBudgetId2: cotizacion.BudgetId,
            cotizacionCompleta: cotizacion
        });

        if (!budgetId) {
            console.error('No se pudo obtener el ID de la cotización:', cotizacion);
            return;
        }

        // Abrir el PDF en una nueva pestaña
        window.open(`/quotation/${budgetId}`, '_blank');

    } catch (error) {
        console.error('Error al abrir el PDF:', error);
    }
};

const getDefaultDates = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    return {
        desde: `${currentYear}-01-01`,
        hasta: `${currentYear}-12-31`
    };
};

const formatFecha = (fecha) => {
    if (!fecha) return '';
    const [y, m, d] = fecha.split('-');
    return `${d}-${m}-${y.slice(2)}`;
};

const formatFechaCorta = (fecha) => {
    if (!fecha) return '';
    const [datePart] = fecha.split('T');
    const [y, m, d] = datePart.split('-');
    return `${d}-${m}-${y.slice(2)}`;
};

const parseTotalNumeric = (q) => {
    const val = q.total ?? q.Total ?? q.TotalPrice ?? q.monto ?? q.amount ?? 0;
    const n = Number(String(val).replace(/[^0-9.-]+/g, ''));
    return Number.isFinite(n) ? n : 0;
};

const ReporteOportunidadesPerdidas = () => {
    const defaultDates = getDefaultDates();
    const [fechaDesde, setFechaDesde] = useState(defaultDates.desde);
    const [fechaHasta, setFechaHasta] = useState(defaultDates.hasta);
    const [generar, setGenerar] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cotizaciones, setCotizaciones] = useState([]);

    // Estados para la vista detallada
    const [view, setView] = useState('resumen'); // 'resumen' | 'mes' | 'detalle'
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [monthData, setMonthData] = useState([]);

    // Estados para validación de roles
    const [userRole, setUserRole] = useState(null);
    const [roleLoading, setRoleLoading] = useState(true);

    const navigate = useNavigate();
    const pdfRef = useRef();

    // Verificación de rol
    useEffect(() => {
        const checkUserRole = () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/");
                return;
            }

            try {
                // Decodificar el JWT directamente - INSTANTÁNEO
                const payload = JSON.parse(atob(token.split('.')[1]));
                const role = payload?.role?.toLowerCase() ||
                    payload?.Role?.toLowerCase() ||
                    payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']?.toLowerCase();

                if (role) {
                    setUserRole(role);
                    setRoleLoading(false);
                    return; // ¡No hace falta llamar a la API!
                }
            } catch (error) {
                console.debug('No se pudo decodificar JWT');
            }

            // Fallback: llamar a la API solo si falla el JWT
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

    // Calcular métricas para KPIs
    const calculateKPIs = () => {
        const total = cotizaciones.reduce((sum, q) => sum + parseTotalNumeric(q), 0);
        const cantidad = cotizaciones.length;
        const promedio = cantidad > 0 ? total / cantidad : 0;
        const maxima = cantidad > 0 ? Math.max(...cotizaciones.map(q => parseTotalNumeric(q))) : 0;

        return { total, cantidad, promedio, maxima };
    };

    const kpis = calculateKPIs();

    // Agrupar por mes para el gráfico
    const datosPorMes = React.useMemo(() => {
        const meses = {};

        cotizaciones.forEach(q => {
            const fecha = q.creationDate || q.CreationDate;
            if (!fecha) return;

            const [datePart] = fecha.split('T');
            const [y, m] = datePart.split('-');
            const mesKey = `${y}-${m}`;
            const mesLabel = `${monthsShort[parseInt(m) - 1]} ${y}`;

            if (!meses[mesKey]) {
                meses[mesKey] = {
                    label: mesLabel,
                    cantidad: 0,
                    monto: 0,
                    cotizaciones: []
                };
            }

            meses[mesKey].cantidad += 1;
            meses[mesKey].monto += parseTotalNumeric(q);
            meses[mesKey].cotizaciones.push(q);
        });

        return meses;
    }, [cotizaciones]);

    // Datos para el gráfico
    const chartData = {
        labels: Object.values(datosPorMes).map(mes => mes.label),
        datasets: [
            {
                label: 'Monto Perdido ($)',
                data: Object.values(datosPorMes).map(mes => mes.monto),
                backgroundColor: '#ef4444',
                borderColor: '#dc2626',
                borderWidth: 2,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false
            },
            datalabels: {
                color: '#ffffff',
                font: {
                    weight: 'bold',
                    size: 12
                },
                formatter: function (value) {
                    return `$${(value / 1000).toFixed(0)}K`;
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        if (value === 0) return '';
                        return `$${(value / 1000).toFixed(0)}K`;
                    },
                    color: '#94a3b8'
                },
                grid: {
                    color: 'rgba(148, 163, 184, 0.1)'
                }
            },
            x: {
                ticks: {
                    color: '#94a3b8'
                },
                grid: {
                    color: 'rgba(148, 163, 184, 0.1)'
                }
            }
        }
    };

    // Categorizar motivos
    const motivosCategorizados = React.useMemo(() => {
        const categorias = {};

        cotizaciones.forEach(q => {
            const comentario = extractShortComment(q);
            const categoria = categorizarMotivo(comentario);

            if (!categorias[categoria]) {
                categorias[categoria] = {
                    cantidad: 0,
                    monto: 0
                };
            }

            categorias[categoria].cantidad += 1;
            categorias[categoria].monto += parseTotalNumeric(q);
        });

        return categorias;
    }, [cotizaciones]);

    const fetchData = async () => {
        if (!fechaDesde || !fechaHasta) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(
                `${API_URL}/api/Mongo/GetAllBudgets`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            let raw = res.data;
            let data = [];
            if (Array.isArray(raw)) data = raw;
            else if (Array.isArray(raw.budgets)) data = raw.budgets;
            else if (Array.isArray(raw.quotations)) data = raw.quotations;
            else if (Array.isArray(raw.items)) data = raw.items;
            else data = safeArray(raw);

            // Filtrar por fechas
            const fromDate = new Date(fechaDesde);
            const toDate = new Date(fechaHasta);
            data = data.filter(b => {
                const fechaRaw = b.creationDate ?? b.CreationDate ?? b.creation_date ?? b.Creationdate ?? b.createdAt ?? b.created_at;
                if (!fechaRaw) return false;
                const fechaObj = new Date(typeof fechaRaw === 'string' ? fechaRaw : fechaRaw);
                if (isNaN(fechaObj.getTime())) return false;
                const f = new Date(fechaObj.toISOString().slice(0, 10));
                return f >= fromDate && f <= toDate;
            });

            // NUEVO: Filtrar solo las últimas versiones rechazadas (oportunidades realmente perdidas)
            data = filtrarUltimasVersionesRechazadas(data);

            setCotizaciones(data);
        } catch (err) {
            console.error("Error cargando datos:", err);
            setCotizaciones([]);
        }
        setLoading(false);
    };

    const filtrarUltimasVersionesRechazadas = (cotizaciones) => {
        // Agrupar por budgetId
        const agrupadasPorBudgetId = {};

        cotizaciones.forEach(cotizacion => {
            const budgetId = cotizacion.budgetId || cotizacion.BudgetId;
            if (!budgetId) return;

            if (!agrupadasPorBudgetId[budgetId]) {
                agrupadasPorBudgetId[budgetId] = [];
            }

            agrupadasPorBudgetId[budgetId].push(cotizacion);
        });

        const ultimasVersionesRechazadas = [];

        Object.values(agrupadasPorBudgetId).forEach(grupo => {
            // Ordenar por versión (descendente) para tomar la última
            const ordenadasPorVersion = grupo.sort((a, b) => {
                const versionA = a.version || a.Version || 0;
                const versionB = b.version || b.Version || 0;
                return versionB - versionA;
            });

            const ultimaVersion = ordenadasPorVersion[0];

            const status = (ultimaVersion.status ?? ultimaVersion.Status ?? '').toString().toLowerCase();
            if (status === 'rejected' || status === 'rechazado') {
                ultimasVersionesRechazadas.push(ultimaVersion);
            }
        });

        console.log('📊 Filtro de oportunidades perdidas:', {
            totalCotizaciones: cotizaciones.length,
            gruposPorBudgetId: Object.keys(agrupadasPorBudgetId).length,
            oportunidadesPerdidas: ultimasVersionesRechazadas.length,
            detalles: ultimasVersionesRechazadas.map(c => ({
                budgetId: c.budgetId,
                version: c.version,
                status: c.status,
                total: c.Total
            }))
        });

        return ultimasVersionesRechazadas;
    };

    const handleGenerarReporte = () => {
        setGenerar(true);
        setView('resumen');
        fetchData();
    };

    const [expandedMonth, setExpandedMonth] = useState(null);

    const handleVerDetalleMes = (mesKey) => {
        if (expandedMonth === mesKey) {
            // Si ya está expandido, lo contraemos
            setExpandedMonth(null);
        } else {
            // Expandimos el nuevo mes
            setExpandedMonth(mesKey);
            setMonthData(datosPorMes[mesKey]?.cotizaciones || []);
        }
    };

    const handleCerrarDetalle = () => {
        setExpandedMonth(null);
        setMonthData([]);
    };

    const handleVolverResumen = () => {
        setView('resumen');
        setSelectedMonth(null);
        setMonthData([]);
    };

    const handleDescargarPDF = async () => {
        if (!pdfRef.current) return;
        const opt = {
            margin: [0.2, 0.2, 0.2, 0.2],
            filename: `reporte_oportunidades_perdidas_${fechaDesde}_a_${fechaHasta}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Ocultar botones de acción en PDF
        document.body.classList.add('pdf-exporting');
        //await html2pdf().set(opt).from(pdfRef.current).save();
        document.body.classList.remove('pdf-exporting');
    };

    const handleImprimir = () => window.print();

    // Loading mientras verifica rol
    if (roleLoading) {
        return (
            <div className="dashboard-container">
                <Navigation onLogout={() => {
                    localStorage.removeItem("token");
                    navigate("/");
                }} />
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
                <Navigation onLogout={() => {
                    localStorage.removeItem("token");
                    navigate("/");
                }} />
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
                        Este reporte está disponible únicamente para los roles de Coordinador y Gerente.
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
            <Navigation onLogout={() => {
                localStorage.removeItem("token");
                navigate("/");
            }} />

            <div className="oportunidades-main-wrapper">
                <div className="oportunidades-content-container">
                    <div className="oportunidades-main-container">
                        {/* HEADER */}
                        <div className="oportunidades-header">
                            <div className="oportunidades-header-title">
                                <TrendingDown size={32} />
                                <div>
                                    <h1>Reporte de Oportunidades Perdidas</h1>
                                    <p>Análisis de cotizaciones rechazadas y su impacto</p>
                                </div>
                            </div>
                            <div className="oportunidades-header-actions">
                                <button className="oportunidades-btn oportunidades-btn-primary" onClick={handleGenerarReporte} disabled={loading}>
                                    <RefreshCw size={18} />
                                    {loading ? 'Generando...' : 'Generar Reporte'}
                                </button>
                            </div>
                        </div>

                        {/* FILTROS */}
                        <div className="oportunidades-filtros">
                            <div className="filtros-grid">
                                <div className="filtro-group">
                                    <label>Desde:</label>
                                    <input
                                        type="date"
                                        value={fechaDesde}
                                        onChange={e => setFechaDesde(e.target.value)}
                                        className="filtro-input"
                                    />
                                </div>
                                <div className="filtro-group">
                                    <label>Hasta:</label>
                                    <input
                                        type="date"
                                        value={fechaHasta}
                                        onChange={e => setFechaHasta(e.target.value)}
                                        className="filtro-input"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="oportunidades-pdf-container" ref={pdfRef}>
                            {/* BREADCRUMB NAVIGATION */}
                            {view !== 'resumen' && (
                                <div className="oportunidades-breadcrumb">
                                    <button className="breadcrumb-btn" onClick={handleVolverResumen}>
                                        <ArrowLeft size={16} />
                                        Volver al Resumen
                                    </button>
                                    {view === 'detalle' && (
                                        <span className="breadcrumb-separator">/</span>
                                    )}
                                    {view === 'detalle' && (
                                        <span className="breadcrumb-current">
                                            Detalle - {datosPorMes[selectedMonth]?.label}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* VISTA RESUMEN */}
                            {view === 'resumen' && (
                                <>
                                    {/* KPIs PRINCIPALES */}
                                    {generar && !loading && cotizaciones.length > 0 && (
                                        <div className="oportunidades-kpis">
                                            <div className="kpi-card">
                                                <div className="kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                                                    <DollarSign size={24} />
                                                </div>
                                                <div className="kpi-content">
                                                    <div className="kpi-value">${(kpis.total / 1000000).toFixed(2)}M</div>
                                                    <div className="kpi-label">Total Pérdida</div>
                                                </div>
                                            </div>
                                            <div className="kpi-card">
                                                <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                                                    <BarChart3 size={24} />
                                                </div>
                                                <div className="kpi-content">
                                                    <div className="kpi-value">${(kpis.promedio / 1000).toFixed(1)}K</div>
                                                    <div className="kpi-label">Promedio por cot.</div>
                                                </div>
                                            </div>
                                            <div className="kpi-card">
                                                <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                                                    <AlertTriangle size={24} />
                                                </div>
                                                <div className="kpi-content">
                                                    <div className="kpi-value">${(kpis.maxima / 1000).toFixed(0)}K</div>
                                                    <div className="kpi-label">Pérdida Máxima</div>
                                                </div>
                                            </div>
                                            <div className="kpi-card">
                                                <div className="kpi-icon" style={{ background: 'rgba(107, 114, 128, 0.1)' }}>
                                                    <TrendingDown size={24} />
                                                </div>
                                                <div className="kpi-content">
                                                    <div className="kpi-value">{kpis.cantidad}</div>
                                                    <div className="kpi-label">Rechazadas</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* GRÁFICO DE DISTRIBUCIÓN MENSUAL */}
                                    {generar && !loading && Object.keys(datosPorMes).length > 0 && (
                                        <div className="oportunidades-grafico-section">
                                            <div className="section-header">
                                                <BarChart3 size={24} />
                                                <h2>Distribución de Pérdidas por Mes</h2>
                                            </div>
                                            <div className="grafico-container">
                                                <Bar data={chartData} options={chartOptions} />
                                            </div>
                                        </div>
                                    )}

                                    {/* PRINCIPALES MOTIVOS DE RECHAZO */}
                                    {generar && !loading && Object.keys(motivosCategorizados).length > 0 && (
                                        <div className="oportunidades-motivos-section">
                                            <div className="section-header">
                                                <Target size={24} />
                                                <h2>Principales Motivos de Rechazo</h2>
                                            </div>
                                            <div className="motivos-grid">
                                                {Object.entries(motivosCategorizados)
                                                    .sort(([, a], [, b]) => b.cantidad - a.cantidad)
                                                    .map(([motivo, datos]) => (
                                                        <div key={motivo} className="motivo-item">
                                                            <div className="motivo-header">
                                                                <span className="motivo-nombre">{motivo}</span>
                                                                <span className="motivo-cantidad">
                                                                    {datos.cantidad} ({((datos.cantidad / kpis.cantidad) * 100).toFixed(1)}%)
                                                                </span>
                                                            </div>
                                                            <div className="motivo-bar">
                                                                <div
                                                                    className="motivo-bar-fill"
                                                                    style={{
                                                                        width: `${(datos.cantidad / kpis.cantidad) * 100}%`,
                                                                        backgroundColor: getMotivoColor(motivo)
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <div className="motivo-monto">
                                                                ${(datos.monto / 1000).toFixed(0)}K en pérdidas
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                </>
                            )}

                            {/* VISTA DETALLE DEL MES */}
                            {generar && !loading && Object.keys(datosPorMes).length > 0 && (
                                <div className="oportunidades-meses-section">
                                    <div className="section-header">
                                        <Calendar size={24} />
                                        <h2>Vista Detallada por Mes</h2>
                                    </div>
                                    <div className="meses-grid">
                                        {Object.entries(datosPorMes)
                                            .sort(([a], [b]) => new Date(b) - new Date(a))
                                            .map(([mesKey, datos]) => (
                                                <React.Fragment key={mesKey}>
                                                    <div className={`mes-card ${expandedMonth === mesKey ? 'expanded' : ''}`}>
                                                        <div className="mes-header">
                                                            <h3>{datos.label}</h3>
                                                            <div className="mes-stats">
                                                                <span className="mes-cantidad">{datos.cantidad} rechazos</span>
                                                                <span className="mes-monto">${(datos.monto / 1000).toFixed(0)}K</span>
                                                            </div>
                                                        </div>
                                                        <div className="mes-actions">
                                                            <button
                                                                className="oportunidades-btn oportunidades-btn-detalle"
                                                                onClick={() => handleVerDetalleMes(mesKey)}
                                                            >
                                                                <Eye size={16} />
                                                                {expandedMonth === mesKey ? 'Ocultar' : 'Ver'} Detalle
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Vista detalle expandida */}
                                                    {expandedMonth === mesKey && (
                                                        <div className="mes-detalle-expandido">
                                                            <div className="detalle-expandido-header">
                                                                <h4>Cotizaciones Rechazadas - {datos.label}</h4>
                                                                <button
                                                                    className="btn-cerrar-detalle"
                                                                    onClick={handleCerrarDetalle}
                                                                >
                                                                    Cerrar
                                                                </button>
                                                            </div>

                                                            <div className="detalle-cotizaciones">
                                                                {monthData.map((q, index) => {
                                                                    const motivo = extractShortComment(q);
                                                                    const categoria = categorizarMotivo(motivo);
                                                                    const monto = parseTotalNumeric(q);

                                                                    return (
                                                                        <div key={q.id || q.budgetId || index} className="cotizacion-card">
                                                                            <div className="cotizacion-header">
                                                                                <div className="cotizacion-monto-categoria">
                                                                                    <span
                                                                                        className={`categoria-badge ${categoria.replace('/', '-').toLowerCase()}`}
                                                                                        style={{ backgroundColor: getMotivoColor(categoria) }}
                                                                                    >
                                                                                        {categoria}
                                                                                    </span>
                                                                                    <span className="cotizacion-monto">${monto.toLocaleString()}</span>
                                                                                </div>
                                                                                <div className="cotizacion-fecha">
                                                                                    {q.creationDate ? formatFechaCorta(q.creationDate) : 'Sin fecha'}
                                                                                </div>
                                                                            </div>

                                                                            <div className="cotizacion-cliente">
                                                                                <strong>{q.customer?.name || q.Customer?.name || 'Cliente'} {q.customer?.lastname || q.Customer?.lastname || ''}</strong>
                                                                            </div>

                                                                            <div className="cotizacion-contacto">
                                                                                <span>📞 {q.customer?.tel || q.Customer?.tel || 'Sin teléfono'}</span>
                                                                                <span>📧 {q.customer?.mail || q.Customer?.mail || 'Sin email'}</span>
                                                                                <span>🏢 {q.customer?.address || q.Customer?.address || 'Sin dirección'}</span>
                                                                            </div>

                                                                            <div className="cotizacion-motivo">
                                                                                <strong>Motivo:</strong> "{motivo}"
                                                                            </div>

                                                                            <div className="cotizacion-actions">
                                                                                <button
                                                                                    className="oportunidades-btn oportunidades-btn-pdf"
                                                                                    onClick={() => handleVerPDFCotizacion(q)}
                                                                                >
                                                                                    <FileText size={14} />
                                                                                    Ver PDF
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* LOADING STATE */}
                            {loading && (
                                <div className="oportunidades-loading">
                                    <div className="loading-spinner"></div>
                                    <p>Generando reporte...</p>
                                </div>
                            )}

                            {/* EMPTY STATE */}
                            {!generar && !loading && (
                                <div className="oportunidades-empty">
                                    <TrendingDown size={64} />
                                    <h3>Reporte No Generado</h3>
                                    <p>Seleccione un rango de fechas y presione "Generar Reporte"</p>
                                </div>
                            )}

                            {/* NO DATA STATE */}
                            {generar && !loading && cotizaciones.length === 0 && (
                                <div className="oportunidades-empty">
                                    <TrendingDown size={64} />
                                    <h3>No Hay Datos</h3>
                                    <p>No se encontraron cotizaciones rechazadas en el período seleccionado</p>
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

// Función auxiliar para colores de motivos
const getMotivoColor = (motivo) => {
    const colores = {
        'Precio/Costo': '#ef4444',
        'Competencia': '#f59e0b',
        'Plazos': '#3b82f6',
        'Error cotización': '#8b5cf6',
        'Calidad': '#10b981',
        'Sin especificar': '#6b7280',
        'Otros': '#9ca3af'
    };
    return colores[motivo] || '#9ca3af';
};

export default ReporteOportunidadesPerdidas;