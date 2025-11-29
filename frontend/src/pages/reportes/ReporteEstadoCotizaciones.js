import React, { useState, useRef, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import axios from 'axios';
import 'chart.js/auto';
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
    Clock,
    CheckCircle,
    XCircle,
    Award,
    Filter,
    RefreshCw,
    ChevronUp,
    ChevronDown,
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
    const [currentRole, setCurrentRole] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [sortDirection, setSortDirection] = useState({
        pending: null,
        approved: null,
        rejected: null,
        finished: null
    });

    // Estados para validación de roles
    const [userRole, setUserRole] = useState(null);
    const [roleLoading, setRoleLoading] = useState(true);
    const requiredRoles = ['quotator', 'coordinator']; // Cotizador y coordinador pueden ver este reporte

    const pdfRef = useRef();
    const pendientesRef = useRef();
    const aprobadosRef = useRef();
    const rechazadosRef = useRef();
    const finalizadosRef = useRef();

    const navigate = useNavigate();

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

    // Cargar datos del usuario una sola vez - MOVIDO AL NIVEL SUPERIOR
    useEffect(() => {
        if (userRole && requiredRoles.includes(userRole)) {
            const token = localStorage.getItem('token');
            if (!token) return;

            const loadUserData = async () => {
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

                } catch (err) {
                    console.error("Error fetching current role for report:", err);
                }
            };

            loadUserData();
        }
    }, [userRole]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

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

    const fetchData = async () => {
        if (!fechaDesde || !fechaHasta) return;

        setLoading(true);

        try {
            const token = localStorage.getItem('token');

            let userIdParam = '';
            if (currentRole === 'quotator' && currentUserId) {
                userIdParam = `&userId=${currentUserId}`;
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

        } catch (err) {
            setCounts([0, 0, 0, 0]);
            setCotizaciones([]);
        } finally {
            setLoading(false);
        }
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

        html2pdf().set(opt).from(pdfRef.current).save().then(() => {
            if (scrollBtn) scrollBtn.style.display = '';
        });
    };

    // Botón imprimir solo el área del reporte
    const handlePrint = () => {
        document.body.classList.add('print-agenda-only');
        setTimeout(() => {
            window.print();
            setTimeout(() => {
                document.body.classList.remove('print-agenda-only');
            }, 100);
        }, 50);
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

    // fecha maxima
    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const maxDate = getTodayDate();

    const renderTablaEstado = (estado, titulo, colorClase, icono, ref) => {
        const count = cotizacionesPorEstado[estado].length;
        return (
            <div ref={ref} style={{ marginTop: '40px' }}>
                <div className="section-header">
                    {icono}
                    <h2 className={colorClase}>
                        {titulo} <span className="estado-count">({count})</span>
                    </h2>
                </div>
                <div className="tabla-container">
                    {count === 0 ? (
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
                                            onClick={() => qId && window.open(`/quotation/${qId}`)}
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
                        Este reporte está disponible únicamente para los roles de Cotizador y Supervisor.
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
            <Navigation onLogout={handleLogout} />

            <div className="estado-main-wrapper">
                <div className="estado-content-container">
                    <div className="estado-main-container">

                        {/* Header con badge que carga inmediatamente */}
                        <div className="estado-header">
                            <BarChart3 size={32} />
                            <div>
                                <h1 className="estado-header-title">Reporte de Estado de Cotizaciones</h1>
                                <p>Análisis detallado por estados y períodos</p>
                            </div>
                        </div>

                        {/* Filtros unificados */}
                        <div className="estado-filtros">
                            <div className="filtros-grid-unificado">
                                <div className="filtro-group fecha-group">
                                    <label>Desde:</label>
                                    <input
                                        type="date"
                                        value={fechaDesde}
                                        onChange={(e) => setFechaDesde(e.target.value)}
                                        className="filtro-input"
                                    />
                                </div>

                                <div className="filtro-group fecha-group">
                                    <label>Hasta:</label>
                                    <input
                                        type="date"
                                        value={fechaHasta}
                                        onChange={(e) => setFechaHasta(e.target.value)}
                                        className="filtro-input"
                                        max={maxDate}
                                    />
                                </div>

                                <div className="filtro-group estado-filtros-checkbox">
                                    <label>Mostrar:</label>
                                    <div className="estado-checkboxes-container">
                                        <div className="estado-checkboxes">
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
                                    </div>
                                </div>

                                <div className="filtro-actions">
                                    <button
                                        className="estado-btn estado-btn-primary"
                                        onClick={handleGenerarReporte}
                                        disabled={loading || !fechaDesde || !fechaHasta}
                                    >
                                        <RefreshCw size={18} />
                                        {loading ? 'Generando...' : 'Generar Reporte'}
                                    </button>
                                    {/* Botón Imprimir */}
                                    <button
                                        className="estado-btn estado-btn-secondary"
                                        style={{ marginLeft: 8 }}
                                        onClick={handlePrint}
                                        disabled={loading}
                                        type="button"
                                    >
                                        🖨️ Imprimir
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Contenido del reporte con loading interno */}
                        <div className="satisfaction-content">
                            {loading && generar ? (
                                <div className="satisfaction-loading">
                                    <ReactLoading type="spin" color="#26b7cd" height={80} width={80} />
                                    <div className="loading-text">Cargando reporte...</div>
                                </div>
                            ) : !generar ? (
                                <div className="satisfaction-empty">
                                    <BarChart3 size={64} />
                                    <h3>Reporte no generado</h3>
                                    <p>Presione "Generar Reporte" para analizar las cotizaciones</p>
                                </div>
                            ) : (
                                <div className="satisfaction-report" ref={pdfRef}>
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
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ScrollToTopButton />
            <Footer />
        </div>
    );
};

export default ReporteEstadoCotizaciones;