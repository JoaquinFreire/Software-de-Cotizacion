import React, { useState, useRef, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import axios from 'axios';
import 'chart.js/auto';
import logoAnodal from '../../images/logo_secundario.webp';
import '../../styles/ReporteEstadoCotizaciones.css';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js/auto';
import ScrollToTopButton from '../../components/ScrollToTopButton';
import html2pdf from 'html2pdf.js';
import ReactLoading from 'react-loading';
import { safeArray } from '../../utils/safeArray';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3,
    User,
    Clock,
    CheckCircle,
    XCircle,
    Award,
    Download,
    Filter,
    RefreshCw,
    ChevronUp,
    ChevronDown,
    Users,
    PieChart
} from 'lucide-react';

Chart.register(ChartDataLabels);

const API_URL = process.env.REACT_APP_API_URL;
const getDefaultDates = () => {
    const year = new Date().getFullYear();
    return {
        desde: `${year}-01-01`,
        hasta: `${year}-12-31`
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

function resolveRefs(array) {
    const byId = {};
    array.forEach(obj => {
        if (obj && obj.$id) byId[obj.$id] = obj;
        if (obj.Customer && obj.Customer.$id) byId[obj.Customer.$id] = obj.Customer;
        if (obj.WorkPlace && obj.WorkPlace.$id) byId[obj.WorkPlace.$id] = obj.WorkPlace;
    });
    function resolve(obj) {
        if (!obj || typeof obj !== "object") return obj;
        if (obj.$ref) return byId[obj.$ref] || {};
        const out = Array.isArray(obj) ? [] : {};
        for (const k in obj) {
            out[k] = resolve(obj[k]);
        }
        return out;
    }
    return array.map(resolve);
}

const ReporteEstadoCotizaciones = () => {
    const defaultDates = getDefaultDates();
    const [fechaDesde, setFechaDesde] = useState(defaultDates.desde);
    const [fechaHasta, setFechaHasta] = useState(defaultDates.hasta);
    const [generar, setGenerar] = useState(false);
    const [counts, setCounts] = useState([0, 0, 0, 0]);
    const [loading, setLoading] = useState(false);
    const [cotizaciones, setCotizaciones] = useState([]);
    const [mostrarPendientes, setMostrarPendientes] = useState(true);
    const [mostrarAprobados, setMostrarAprobados] = useState(false);
    const [mostrarRechazados, setMostrarRechazados] = useState(false);
    const [mostrarFinalizados, setMostrarFinalizados] = useState(false);
    const [contentLoaded, setContentLoaded] = useState(false);
    const pdfRef = useRef();
    const pendientesRef = useRef();
    const aprobadosRef = useRef();
    const rechazadosRef = useRef();
    const finalizadosRef = useRef();
    const [currentRole, setCurrentRole] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [sortDirection, setSortDirection] = useState({
        pending: null,
        approved: null,
        rejected: null,
        finished: null
    });
    const [selectedUserId, setSelectedUserId] = useState('');
    const [usersList, setUsersList] = useState([]);

    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    // Mover handlePieClick aquí, antes de chartOptions
    const handlePieClick = (evt, elements) => {
        if (!elements.length) return;
        const idx = elements[0].index;
        const refs = [pendientesRef, aprobadosRef, rechazadosRef, finalizadosRef];
        setTimeout(() => {
            if (refs[idx].current) refs[idx].current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            datalabels: {
                color: '#222',
                font: { weight: 'bold', size: 12 },
                formatter: (value, context) => {
                    const total = counts.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return `${percentage}%`;
                },
            },
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 12,
                    font: {
                        size: 11
                    }
                }
            }
        },
        onClick: handlePieClick
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        (async () => {
            try {
                const res = await axios.get(`${API_URL}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const user = res.data?.user || {};
                const roleRaw = (user?.role?.role_name ?? user?.role ?? "").toString().toLowerCase();
                const roleName = roleRaw || "";
                setCurrentRole(roleName);

                const resolvedUserId = user?.id ?? res.data?.userId ?? null;
                if (resolvedUserId) setCurrentUserId(resolvedUserId);

                // Cargar lista de usuarios para coordinadores y managers
                //const roleLower = roleName.toLowerCase();
                //if (roleLower === 'manager' || roleLower === 'coordinator') {
                //    try {
                //        const usersRes = await axios.get(`${API_URL}/api/users`, {
                //            headers: { Authorization: `Bearer ${token}` }
                //        });

                //        const raw = usersRes.data;
                //        let arr = [];
                //        if (Array.isArray(raw)) arr = raw;
                //        else if (raw && Array.isArray(raw.users)) arr = raw.users;
                //        else if (raw && Array.isArray(raw.data)) arr = raw.data;
                //        else arr = [];

                //        // Filtrar usuarios activos (status === 1) y que no sean managers
                //        const usuariosFiltrados = arr.filter(user =>
                //            user.status === 1 &&
                //            user.role?.role_name !== 'manager' &&
                //            user.role !== 'manager'
                //        );

                //        setUsersList(usuariosFiltrados);
                //        setSelectedUserId('');
                //    } catch (uErr) {
                //        console.error("Error fetching users list:", uErr);
                //    }
                //}

                // Configurar visibilidad por defecto según rol
                if (roleName !== 'manager') {
                    setMostrarPendientes(true);
                    setMostrarAprobados(false);
                    setMostrarRechazados(false);
                    setMostrarFinalizados(false);
                } else {
                    setMostrarPendientes(true);
                    setMostrarAprobados(true);
                    setMostrarRechazados(true);
                    setMostrarFinalizados(true);
                }
            } catch (err) {
                console.error("Error fetching current role for report:", err);
            }
        })();
    }, []);

    const fetchData = async () => {
        if (!fechaDesde || !fechaHasta) return;
        setLoading(true);
        setContentLoaded(false);

        try {
            const token = localStorage.getItem('token');

            let userIdParam = '';
            if (currentRole === 'quotator' && currentUserId) {
                userIdParam = `&userId=${currentUserId}`;
            } else if ((currentRole === 'manager' || currentRole === 'coordinator') && selectedUserId) {
                userIdParam = selectedUserId ? `&userId=${selectedUserId}` : '';
            }

            const res = await axios.get(
                `${API_URL}/api/quotations/by-period?from=${fechaDesde}&to=${fechaHasta}${userIdParam}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            let data = safeArray(res.data);
            data = resolveRefs(data);
            setCotizaciones(data);

            const newCounts = [
                data.filter(q => q.Status === 'pending').length,
                data.filter(q => q.Status === 'approved').length,
                data.filter(q => q.Status === 'rejected').length,
                data.filter(q => q.Status === 'finished').length,
            ];
            setCounts(newCounts);

            // Delay más largo para que se renderice todo correctamente, especialmente para manager
            setTimeout(() => {
                setContentLoaded(true);
            }, 800);

        } catch (err) {
            setCounts([0, 0, 0, 0]);
            setCotizaciones([]);
            setContentLoaded(true);
        }
        setLoading(false);
    };

    const handleGenerarReporte = () => {
        setGenerar(true);
        fetchData();
    };

    const handleDescargarPDF = async () => {
        if (!pdfRef.current) return;
        const scrollBtn = document.querySelector('.scroll-to-top-btn');
        if (scrollBtn) scrollBtn.style.display = 'none';

        const opt = {
            margin: [0.2, 0.2, 0.2, 0.2],
            filename: `reporte_estado_cotizaciones_${fechaDesde}_a_${fechaHasta}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        setTimeout(() => {
            html2pdf().set(opt).from(pdfRef.current).save().then(() => {
                if (scrollBtn) scrollBtn.style.display = '';
            });
        }, 100);
    };

    const cotizacionesPorEstado = {
        pending: cotizaciones.filter(q => q.Status === 'pending'),
        approved: cotizaciones.filter(q => q.Status === 'approved'),
        rejected: cotizaciones.filter(q => q.Status === 'rejected'),
        finished: cotizaciones.filter(q => q.Status === 'finished'),
    };

    const total = counts.reduce((a, b) => a + b, 0);
    const porcentajes = counts.map(
        (valor) => total ? ((valor / total) * 100).toFixed(1) + '%' : '0%'
    );

    const data = {
        labels: ['Pendiente', 'Aprobado', 'Rechazado', 'Finalizado'],
        datasets: [{
            data: counts,
            backgroundColor: [
                '#f59e0b',
                '#10b981',
                '#ef4444',
                '#3b82f6'
            ],
            borderColor: [
                '#222', '#222', '#222', '#222'
            ],
            borderWidth: 2,
        }]
    };

    const estadosNombres = ['Pendiente', 'Aprobado', 'Rechazado', 'Finalizado'];
    const estadoMasComunIdx = counts.indexOf(Math.max(...counts));
    const porcentajeMasComun = porcentajes[estadoMasComunIdx];
    const estadoMasComun = estadosNombres[estadoMasComunIdx];

    let observacion = '';
    let recomendacion = '';
    if (counts[0] > total * 0.5 && total > 0) {
        observacion = 'Existe un alto número de cotizaciones en estado pendiente, lo que podría indicar la necesidad de mejorar el seguimiento y cierre de oportunidades.';
        recomendacion = 'Se recomienda enfocar recursos en la conversión de cotizaciones pendientes para mejorar el ratio de aceptación.';
    } else if (counts[1] > counts[0] && total > 0) {
        observacion = 'El número de cotizaciones aprobadas es mayor al de pendientes, lo que indica una buena gestión comercial.';
        recomendacion = 'Mantener las estrategias actuales y buscar oportunidades de mejora continua.';
    } else if (total === 0) {
        observacion = 'No hay cotizaciones registradas en el período seleccionado.';
        recomendacion = 'Verifique el rango de fechas o la carga de datos en el sistema.';
    } else {
        observacion = 'La distribución de estados es equilibrada, sin predominancia clara de un estado.';
        recomendacion = 'Analizar casos particulares para identificar oportunidades de mejora.';
    }

    const getPrice = (q) => {
        const v = q?.TotalPrice ?? q?.totalPrice ?? q?.Total ?? q?.price ?? 0;
        const n = Number(String(v).replace(/[^0-9.-]+/g, ''));
        return Number.isFinite(n) ? n : 0;
    };

    const toggleSort = (group) => {
        setSortDirection(prev => {
            const current = prev[group];
            const next = current === 'asc' ? 'desc' : 'asc';
            return { ...prev, [group]: next };
        });
    };

    const sortedGroup = (arr, groupName) => {
        const dir = sortDirection[groupName];
        if (!dir) return Array.isArray(arr) ? arr : [];
        const copy = [...(arr || [])];
        copy.sort((a, b) => {
            const pa = getPrice(a), pb = getPrice(b);
            return dir === 'asc' ? pa - pb : pb - pa;
        });
        return copy;
    };

    const getQuotationId = (q) => q?.Id ?? q?.id ?? q?.IdBudget ?? null;

    const getSortIcon = (group) => {
        const dir = sortDirection[group];
        if (dir === 'asc') return <ChevronUp size={14} />;
        if (dir === 'desc') return <ChevronDown size={14} />;
        return <Filter size={14} />;
    };

    // Función para renderizar las tablas de otros estados (aprobados, rechazados, finalizados)
    const renderTablaEstado = (estado, titulo, colorClase, icono, ref) => {
        return (
            <div ref={ref} style={{ marginTop: '40px' }}>
                <div className="section-header">
                    {icono}
                    <h2 className={colorClase}>{titulo}</h2>
                </div>
                <div className="tabla-container">
                    {cotizacionesPorEstado[estado].length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--estado-text-secondary)' }}>
                            No hay {titulo.toLowerCase()}
                        </div>
                    ) : (
                        <table className="estado-tabla">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Teléfono</th>
                                    <th>Email</th>
                                    <th>Dirección</th>
                                    <th>Fecha Creación</th>
                                    <th>Última Edición</th>
                                    <th>
                                        Precio Total
                                        <button
                                            className="sort-btn"
                                            onClick={() => toggleSort(estado)}
                                            title="Ordenar por precio"
                                        >
                                            {getSortIcon(estado)}
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedGroup(cotizacionesPorEstado[estado], estado).map(q => {
                                    const qId = getQuotationId(q);
                                    return (
                                        <tr
                                            key={qId || Math.random()}
                                            className={qId ? 'clickable-row' : ''}
                                            onClick={() => qId && navigate(`/quotation/${qId}`)}
                                            tabIndex={qId ? 0 : -1}
                                            onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && qId) navigate(`/quotation/${qId}`); }}
                                        >
                                            <td>
                                                {q.Customer?.Customer?.name || q.Customer?.name || q.customer?.name || ''}
                                                {' '}
                                                {q.Customer?.Customer?.lastname || q.Customer?.lastname || q.customer?.lastname || ''}
                                            </td>
                                            <td>{q.Customer?.Customer?.tel || q.Customer?.tel || q.customer?.tel || ''}</td>
                                            <td>{q.Customer?.Customer?.mail || q.Customer?.mail || q.customer?.mail || ''}</td>
                                            <td>{q.Customer?.Customer?.address || q.Customer?.address || q.customer?.address || ''}</td>
                                            <td>{q.CreationDate ? formatFechaCorta(q.CreationDate) : (q.creationDate ? formatFechaCorta(q.creationDate) : '')}</td>
                                            <td>{q.LastEdit ? formatFechaCorta(q.LastEdit) : (q.lastEdit ? formatFechaCorta(q.lastEdit) : '')}</td>
                                            <td style={{ whiteSpace: 'nowrap' }}>${(q.TotalPrice || q.totalPrice || 0).toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="estado-dashboard-container">
            <Navigation onLogout={handleLogout} />

            {/* Loading Overlay */}
            {loading && (
                <div className="estado-loading-overlay">
                    <ReactLoading type="spin" color="#26b7cd" height={80} width={80} />
                    <p>Cargando reporte...</p>
                </div>
            )}

            <div className="estado-main-wrapper">
                <div className="estado-content-container">
                    <div className={`estado-main-container ${!contentLoaded && generar ? 'content-hidden' : 'content-visible'}`}>

                        {/* Header moderno */}
                        <div className="estado-header">
                            <div className="estado-header-title">
                                <BarChart3 size={32} />
                                <div>
                                    <h1>Reporte de Estado de Cotizaciones</h1>
                                    <p>Análisis detallado por estados y períodos</p>
                                </div>
                            </div>
                            {currentRole && (
                                <div className="role-badge">
                                    <User size={16} />
                                    Rol: {currentRole}
                                </div>
                            )}
                        </div>

                        {/* Filtros modernos */}
                        <div className="estado-filtros">
                            <div className="filtros-grid">
                                <div className="filtro-group">
                                    <label>Desde:</label>
                                    <input
                                        type="date"
                                        value={fechaDesde}
                                        onChange={(e) => setFechaDesde(e.target.value)}
                                        className="filtro-input"
                                    />
                                </div>

                                <div className="filtro-group">
                                    <label>Hasta:</label>
                                    <input
                                        type="date"
                                        value={fechaHasta}
                                        onChange={(e) => setFechaHasta(e.target.value)}
                                        className="filtro-input"
                                    />
                                </div>

                                {/*{(currentRole === 'manager' || currentRole === 'coordinator') && (*/}
                                {/*    <div className="filtro-group user-selector">*/}
                                {/*        <label>Usuario:</label>*/}
                                {/*        <select*/}
                                {/*            value={selectedUserId}*/}
                                {/*            onChange={(e) => setSelectedUserId(e.target.value)}*/}
                                {/*            className="filtro-input"*/}
                                {/*        >*/}
                                {/*            <option value="">Todos los usuarios</option>*/}
                                {/*            {usersList.map(user => (*/}
                                {/*                <option key={user.id} value={user.id}>*/}
                                {/*                    {user.name} {user.lastName} ({user.role?.role_name || user.role})*/}
                                {/*                </option>*/}
                                {/*            ))}*/}
                                {/*        </select>*/}
                                {/*    </div>*/}
                                {/*)}*/}

                                <div className="filtro-actions">
                                    <button
                                        className="estado-btn estado-btn-primary"
                                        onClick={handleGenerarReporte}
                                        disabled={loading || !fechaDesde || !fechaHasta}
                                    >
                                        <RefreshCw size={18} />
                                        {loading ? 'Generando...' : 'Generar Reporte'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* KPIs modernos - Solo mostrar cuando todo esté cargado */}
                        {generar && !loading && contentLoaded && (
                            <>
                                <div className="estado-kpis">
                                    <div
                                        className="kpi-card"
                                        style={{ "--card-color": "#f59e0b" }}
                                        onClick={() => setMostrarPendientes(!mostrarPendientes)}
                                    >
                                        <div className="kpi-icon">
                                            <Clock size={24} />
                                        </div>
                                        <div className="kpi-content">
                                            <div className="kpi-value">{counts[0]}</div>
                                            <div className="kpi-label">Pendientes</div>
                                            <div className="kpi-subtext">{porcentajes[0]} del total</div>
                                        </div>
                                    </div>

                                    <div
                                        className="kpi-card"
                                        style={{ "--card-color": "#10b981" }}
                                        onClick={() => setMostrarAprobados(!mostrarAprobados)}
                                    >
                                        <div className="kpi-icon">
                                            <CheckCircle size={24} />
                                        </div>
                                        <div className="kpi-content">
                                            <div className="kpi-value">{counts[1]}</div>
                                            <div className="kpi-label">Aprobadas</div>
                                            <div className="kpi-subtext">{porcentajes[1]} del total</div>
                                        </div>
                                    </div>

                                    <div
                                        className="kpi-card"
                                        style={{ "--card-color": "#ef4444" }}
                                        onClick={() => setMostrarRechazados(!mostrarRechazados)}
                                    >
                                        <div className="kpi-icon">
                                            <XCircle size={24} />
                                        </div>
                                        <div className="kpi-content">
                                            <div className="kpi-value">{counts[2]}</div>
                                            <div className="kpi-label">Rechazadas</div>
                                            <div className="kpi-subtext">{porcentajes[2]} del total</div>
                                        </div>
                                    </div>

                                    <div
                                        className="kpi-card"
                                        style={{ "--card-color": "#3b82f6" }}
                                        onClick={() => setMostrarFinalizados(!mostrarFinalizados)}
                                    >
                                        <div className="kpi-icon">
                                            <Award size={24} />
                                        </div>
                                        <div className="kpi-content">
                                            <div className="kpi-value">{counts[3]}</div>
                                            <div className="kpi-label">Finalizadas</div>
                                            <div className="kpi-subtext">{porcentajes[3]} del total</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="estado-pdf-container" ref={pdfRef}>
                                    {/* Gráfico - sólo para manager */}
                                    {currentRole === 'manager' && total > 0 && (
                                        <div className="estado-grafico-section">
                                            <div className="section-header">
                                                <PieChart size={24} />
                                                <h2>Distribución de Estados</h2>
                                            </div>
                                            <div className="grafico-container" style={{ height: '350px' }}>
                                                <Pie data={data} options={chartOptions} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Análisis estratégico - sólo para manager */}
                                    {currentRole === 'manager' && (
                                        <div className="estado-analisis-section">
                                            <div className="section-header">
                                                <BarChart3 size={24} />
                                                <h2>Análisis Estratégico</h2>
                                            </div>
                                            <div className="analisis-container">
                                                <div className="analisis-content">
                                                    <div className="analisis-item">
                                                        <strong>Estado predominante:</strong> {estadoMasComun} ({porcentajeMasComun})
                                                    </div>
                                                    <div className="analisis-item">
                                                        <strong>Observaciones:</strong>
                                                        <div className="analisis-texto">{observacion}</div>
                                                    </div>
                                                    <div className="analisis-item">
                                                        <strong>Recomendaciones:</strong>
                                                        <div className="analisis-texto">{recomendacion}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Controles de visualización */}
                                    <div className="estado-controles">
                                        <div className="control-group">
                                            <label className="control-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={mostrarPendientes}
                                                    onChange={e => setMostrarPendientes(e.target.checked)}
                                                />
                                                Pendientes
                                            </label>

                                            <label className="control-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={mostrarAprobados}
                                                    onChange={e => setMostrarAprobados(e.target.checked)}
                                                />
                                                Aprobadas
                                            </label>

                                            <label className="control-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={mostrarRechazados}
                                                    onChange={e => setMostrarRechazados(e.target.checked)}
                                                />
                                                Rechazadas
                                            </label>

                                            <label className="control-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={mostrarFinalizados}
                                                    onChange={e => setMostrarFinalizados(e.target.checked)}
                                                />
                                                Finalizadas
                                            </label>
                                        </div>

                                        {/* Botón de PDF en los controles */}
                                        <button
                                            className="estado-btn estado-btn-secondary"
                                            onClick={handleDescargarPDF}
                                            disabled={!generar}
                                        >
                                            <Download size={18} />
                                            Descargar PDF
                                        </button>
                                    </div>

                                    {/* Detalle de cotizaciones */}
                                    <div className="estado-tabla-section">
                                        {mostrarPendientes && renderTablaEstado(
                                            'pending',
                                            'Cotizaciones Pendientes',
                                            'estado-pendiente',
                                            <Clock size={24} />,
                                            pendientesRef
                                        )}

                                        {mostrarAprobados && renderTablaEstado(
                                            'approved',
                                            'Cotizaciones Aprobadas',
                                            'estado-aprobado',
                                            <CheckCircle size={24} />,
                                            aprobadosRef
                                        )}

                                        {mostrarRechazados && renderTablaEstado(
                                            'rejected',
                                            'Cotizaciones Rechazadas',
                                            'estado-rechazado',
                                            <XCircle size={24} />,
                                            rechazadosRef
                                        )}

                                        {mostrarFinalizados && renderTablaEstado(
                                            'finished',
                                            'Cotizaciones Finalizadas',
                                            'estado-finalizado',
                                            <Award size={24} />,
                                            finalizadosRef
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Empty State */}
                        {!generar && !loading && (
                            <div className="estado-empty">
                                <BarChart3 size={64} />
                                <h3>Reporte No Generado</h3>
                                <p>Seleccione un rango de fechas y presione "Generar Reporte"</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ScrollToTopButton />
            <Footer />
        </div>
    );
};

export default ReporteEstadoCotizaciones;