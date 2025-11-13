import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ciudadesBarrios from '../../json/ciudadesBarriosCordoba.json';
import ReactLoading from 'react-loading';
import '../../styles/AnalisisUbicacionGeografica.css';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useNavigate } from "react-router-dom";
import { safeArray } from '../../utils/safeArray';
import {
    TrendingUp,
    MapPin,
    Building,
    BarChart3,
    Filter,
    Eye,
    EyeOff,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    FileText,
    Calendar,
    CheckCircle,
    Clock,
    XCircle,
    Award
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

const getDefaultDates = () => {
    const year = new Date().getFullYear();
    return {
        desde: `${year}-01-01`,
        hasta: `${year}-12-31`
    };
};

const AnalisisDeProyectoPorUbicacionGeografica = () => {
    const defaultDates = getDefaultDates();
    const [fechaDesde, setFechaDesde] = useState(defaultDates.desde);
    const [fechaHasta, setFechaHasta] = useState(defaultDates.hasta);
    const [ciudad, setCiudad] = useState('');
    const [status, setStatus] = useState('all');
    const [generar, setGenerar] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resultados, setResultados] = useState([]);
    const [mostrarBarrio, setMostrarBarrio] = useState({});
    const [mostrarTodos, setMostrarTodos] = useState(false);
    const [filtrosVisibles, setFiltrosVisibles] = useState(true);

    const navigate = useNavigate();

    const [userRole, setUserRole] = useState(null);
    const [roleLoading, setRoleLoading] = useState(true);
    const requiredRoles = ['coordinator', 'manager'];

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

    if (roleLoading) {
        return (
            <div className="dashboard-container">
                <Navigation onLogout={() => { localStorage.removeItem("token"); navigate("/"); }} />
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
                <Navigation onLogout={() => { localStorage.removeItem("token"); navigate("/"); }} />
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

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    }

    //Ciudades json
    const ciudades = ciudadesBarrios.Cordoba.ciudades.map(c => c.nombre);

    const fetchData = async () => {
        if (!fechaDesde || !fechaHasta || !ciudad) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(
                `${API_URL}/api/quotations/by-period-location?from=${fechaDesde}&to=${fechaHasta}&location=${encodeURIComponent(ciudad)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = safeArray(res.data) || [];

            let filteredData = data;
            if (status !== 'all') {
                filteredData = data.filter(q => q.Status === status);
            }

            const barriosMap = {};
            let total = filteredData.length;
            filteredData.forEach(q => {
                let barrio = '';
                if (q.WorkPlace && q.WorkPlace.Location) {
                    const parts = q.WorkPlace.Location.split(' - ');
                    barrio = parts.length > 1 ? parts[1] : '(Sin barrio)';
                } else {
                    barrio = '(Sin barrio)';
                }

                let tipoObra = q.WorkPlace?.WorkTypeName || q.WorkPlace?.workTypeName || '';
                if (!tipoObra) {
                    const workTypeId = q.WorkPlace?.WorkTypeId || q.WorkPlace?.workTypeId;
                    if (workTypeId === 1) tipoObra = "Instalación";
                    else if (workTypeId === 2) tipoObra = "Reparación";
                    else if (workTypeId === 3) tipoObra = "Continuación";
                    else if (workTypeId) tipoObra = `Tipo ${workTypeId}`;
                    else tipoObra = '';
                }

                if (!barriosMap[barrio]) {
                    barriosMap[barrio] = { count: 0, tipoObra, cotizaciones: [] };
                }
                barriosMap[barrio].count += 1;
                barriosMap[barrio].cotizaciones.push(q);
            });

            const resultadosTabla = Object.entries(barriosMap).map(([barrio, info]) => ({
                barrio,
                count: info.count,
                porcentaje: total ? ((info.count / total) * 100).toFixed(1) + '%' : '0%',
                tipoObra: info.tipoObra,
                cotizaciones: info.cotizaciones
            }));

            setResultados(resultadosTabla);
            setMostrarBarrio({});
            setMostrarTodos(false);
        } catch (err) {
            setResultados([]);
        }
        setLoading(false);
    };

    const handleGenerarReporte = () => {
        setGenerar(true);
        fetchData();
    };

    const toggleBarrio = (barrio) => {
        setMostrarBarrio(prev => ({
            ...prev,
            [barrio]: !prev[barrio]
        }));
    };

    const toggleTodos = () => {
        if (!mostrarTodos) {
            const nuevoMostrar = {};
            resultados.forEach(r => { nuevoMostrar[r.barrio] = true; });
            setMostrarBarrio(nuevoMostrar);
            setMostrarTodos(true);
        } else {
            setMostrarBarrio({});
            setMostrarTodos(false);
        }
    };

    const handleVerCotizacion = (cotizacionId) => {
        if (cotizacionId) {
            window.open(`/quotation/${cotizacionId}`, '_blank');
        }
    };

    const getEstadoInfo = (status) => {
        switch (status) {
            case 'approved':
                return { icon: <CheckCircle size={14} />, color: '#10b981', label: 'Aprobado' };
            case 'pending':
                return { icon: <Clock size={14} />, color: '#f59e0b', label: 'Pendiente' };
            case 'rejected':
                return { icon: <XCircle size={14} />, color: '#ef4444', label: 'Rechazado' };
            case 'finished':
                return { icon: <Award size={14} />, color: '#3b82f6', label: 'Finalizado' };
            default:
                return { icon: <Clock size={14} />, color: '#6b7280', label: status };
        }
    };

    const totalProyectos = resultados.reduce((acc, r) => acc + r.count, 0);
    const totalBarrios = resultados.length;
    const tipoObraPredominante = resultados.length > 0
        ? resultados.reduce((prev, current) =>
            prev.count > current.count ? prev : current
        ).tipoObra
        : 'N/A';

    const getQuotationId = (q) => q?.Id || q?.id || null;

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />

            <div className="analisis-ubicacion-content">

                {/* HEADER */}
                <div className="analisis-ubicacion-header">
                    <div className="header-title-moderno">
                        <TrendingUp size={32} />
                        <div>
                            <h1>Análisis de Proyectos por Ubicación Geográfica</h1>
                            <p>Monitoreo de distribución de proyectos por barrios</p>
                        </div>
                    </div>
                    <div className="header-actions-moderno">
                        <button
                            className="btn-moderno btn-primary-moderno"
                            onClick={handleGenerarReporte}
                            disabled={loading || !fechaDesde || !fechaHasta || !ciudad}
                        >
                            <RefreshCw size={18} />
                            {loading ? 'Generando...' : 'Generar Reporte'}
                        </button>
                    </div>
                </div>

                {/* FILTROS */}
                <div className="filtros-ubicacion-modernos">
                    <div
                        className="filtros-header-moderno"
                        onClick={() => setFiltrosVisibles(!filtrosVisibles)}
                    >
                        <div className="filtros-toggle-left">
                            <Filter size={20} />
                            <span>Filtros del Reporte</span>
                        </div>
                        <div className="filtros-toggle-right">
                            {filtrosVisibles ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                    </div>

                    {filtrosVisibles && (
                        <div className="filtros-content-moderno">
                            <div className="filtros-grid-moderno">
                                <div className="filtro-group-moderno">
                                    <label>
                                        <Calendar size={16} />
                                        Desde:
                                    </label>
                                    <input
                                        type="date"
                                        value={fechaDesde}
                                        onChange={e => setFechaDesde(e.target.value)}
                                        className="filtro-input-moderno"
                                    />
                                </div>
                                <div className="filtro-group-moderno">
                                    <label>
                                        <Calendar size={16} />
                                        Hasta:
                                    </label>
                                    <input
                                        type="date"
                                        value={fechaHasta}
                                        onChange={e => setFechaHasta(e.target.value)}
                                        className="filtro-input-moderno"
                                    />
                                </div>
                                <div className="filtro-group-moderno">
                                    <label>
                                        <Building size={16} />
                                        Ciudad:
                                    </label>
                                    <select
                                        value={ciudad}
                                        onChange={e => setCiudad(e.target.value)}
                                        className="filtro-select-moderno"
                                    >
                                        <option value="">Seleccione ciudad</option>
                                        {ciudades.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="filtro-group-moderno">
                                    <label>
                                        <CheckCircle size={16} />
                                        Estado:
                                    </label>
                                    <select
                                        value={status}
                                        onChange={e => setStatus(e.target.value)}
                                        className="filtro-select-moderno"
                                    >
                                        <option value="all">Todos los estados</option>
                                        <option value="pending">Pendiente</option>
                                        <option value="approved">Aprobado</option>
                                        <option value="rejected">Rechazado</option>
                                        <option value="finished">Finalizado</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* KPI's */}
                {generar && !loading && (
                    <div className="kpi-section-moderno">
                        <div className="kpi-grid-moderno">
                            <div className="kpi-card-moderno">
                                <div className="kpi-icon-moderno" style={{ background: '#2196f3' }}>
                                    <BarChart3 size={24} />
                                </div>
                                <div className="kpi-content-moderno">
                                    <div className="kpi-value-moderno">{totalProyectos}</div>
                                    <div className="kpi-label-moderno">Total Proyectos</div>
                                </div>
                            </div>

                            <div className="kpi-card-moderno">
                                <div className="kpi-icon-moderno" style={{ background: '#4caf50' }}>
                                    <Building size={24} />
                                </div>
                                <div className="kpi-content-moderno">
                                    <div className="kpi-value-moderno" style={{ fontSize: '20px' }}>
                                        {ciudad || '-'}
                                    </div>
                                    <div className="kpi-label-moderno">Ciudad Analizada</div>
                                </div>
                            </div>

                            <div className="kpi-card-moderno">
                                <div className="kpi-icon-moderno" style={{ background: '#ff9800' }}>
                                    <MapPin size={24} />
                                </div>
                                <div className="kpi-content-moderno">
                                    <div className="kpi-value-moderno">{totalBarrios}</div>
                                    <div className="kpi-label-moderno">Barrios con Datos</div>
                                </div>
                            </div>

                            <div className="kpi-card-moderno">
                                <div className="kpi-icon-moderno" style={{ background: '#9c27b0' }}>
                                    <TrendingUp size={24} />
                                </div>
                                <div className="kpi-content-moderno">
                                    <div className="kpi-value-moderno" style={{ fontSize: '18px' }}>
                                        {tipoObraPredominante}
                                    </div>
                                    <div className="kpi-label-moderno">Tipo Obra Predominante</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="loading-moderno">
                        <div className="loading-spinner-moderno"></div>
                        <p>Cargando reporte...</p>
                    </div>
                )}

                {/* CUERPO */}
                {!generar && !loading && (
                    <div className="estado-vacio-moderno">
                        <BarChart3 size={64} />
                        <h3>Reporte No Generado</h3>
                        <p>Seleccione fechas y ciudad, luego presione <b>Generar Reporte</b>.</p>
                    </div>
                )}

                {generar && !loading && resultados.length > 0 && (
                    <div className="tabla-ubicacion-moderna">
                        <div className="tabla-header-moderno">
                            <BarChart3 size={20} />
                            <h3>Distribución por Barrio</h3>
                            <span className="panel-badge-moderno">{resultados.length} barrios</span>
                        </div>

                        <div className="tabla-contenido-moderno">
                            <div className="tabla-responsive-moderna">
                                <table className="tabla-moderna">
                                    <thead>
                                        <tr>
                                            <th>Barrio</th>
                                            <th>Proyectos</th>
                                            <th>Porcentaje</th>
                                            <th>Tipo de Obra</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resultados.map((r, idx) => (
                                            <tr key={r.barrio + idx}>
                                                <td className="texto-primario">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div
                                                            style={{
                                                                width: '12px',
                                                                height: '12px',
                                                                borderRadius: '50%',
                                                                backgroundColor: '#1976d2'
                                                            }}
                                                        ></div>
                                                        {r.barrio}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        fontWeight: '600',
                                                        color: '#e0e0e0'
                                                    }}>
                                                        {r.count}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        fontWeight: '600',
                                                        color: '#4caf50'
                                                    }}>
                                                        {r.porcentaje}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                                        color: '#1976d2',
                                                        fontSize: '12px',
                                                        fontWeight: '500'
                                                    }}>
                                                        {r.tipoObra}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn-accion-tabla"
                                                        onClick={() => toggleBarrio(r.barrio)}
                                                    >
                                                        {mostrarBarrio[r.barrio] ? (
                                                            <>
                                                                <EyeOff size={14} />
                                                                Ocultar
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Eye size={14} />
                                                                Ver
                                                            </>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}

                                        <tr style={{ background: 'var(--background-light)', fontWeight: 'bold' }}>
                                            <td className="texto-acentuado">TOTAL</td>
                                            <td className="texto-acentuado">{totalProyectos}</td>
                                            <td className="texto-acentuado">100%</td>
                                            <td>-</td>
                                            <td>
                                                <button
                                                    className="btn-accion-tabla secundario"
                                                    onClick={toggleTodos}
                                                >
                                                    {mostrarTodos ? (
                                                        <>
                                                            <EyeOff size={14} />
                                                            Ocultar Todo
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Eye size={14} />
                                                            Ver Todo
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {generar && !loading && resultados.map((r, idx) =>
                    mostrarBarrio[r.barrio] ? (
                        <div key={'tabla-' + r.barrio + idx} className="detalle-barrio-moderno">
                            <div className="detalle-barrio-header">
                                <MapPin size={18} />
                                <h4>Cotizaciones en {r.barrio} ({r.count} proyectos)</h4>
                                <span className="panel-badge-moderno">{r.tipoObra}</span>
                            </div>

                            <div className="detalle-barrio-contenido">
                                <div className="tabla-responsive-moderna">
                                    <table className="tabla-moderna">
                                        <thead>
                                            <tr>
                                                <th>Cliente</th>
                                                <th>Teléfono</th>
                                                <th>Email</th>
                                                <th>Dirección</th>
                                                <th>Fecha Creación</th>
                                                <th>Última Edición</th>
                                                <th>Estado</th>
                                                <th>Precio Total</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {r.cotizaciones.map((q, i) => {
                                                const quotationId = getQuotationId(q);
                                                const estadoInfo = getEstadoInfo(q.Status);
                                                return (
                                                    <tr key={quotationId || i}>
                                                        <td>
                                                            {q.Customer?.Customer?.name || q.Customer?.Name || q.customer?.name || ''}
                                                            {' '}
                                                            {q.Customer?.Customer?.lastname || q.Customer?.Lastname || q.customer?.lastname || ''}
                                                        </td>
                                                        <td>{q.Customer?.Customer?.tel || q.Customer?.Tel || q.customer?.tel || ''}</td>
                                                        <td>{q.Customer?.Customer?.mail || q.Customer?.Mail || q.customer?.mail || ''}</td>
                                                        <td>{q.Customer?.Customer?.address || q.Customer?.Address || q.customer?.address || ''}</td>
                                                        <td>{q.CreationDate ? formatFechaCorta(q.CreationDate) : (q.creationDate ? formatFechaCorta(q.creationDate) : '')}</td>
                                                        <td>{q.LastEdit ? formatFechaCorta(q.LastEdit) : (q.lastEdit ? formatFechaCorta(q.lastEdit) : '')}</td>
                                                        <td>
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                backgroundColor: `${estadoInfo.color}20`,
                                                                color: estadoInfo.color,
                                                                fontSize: '12px',
                                                                fontWeight: '500',
                                                                width: 'fit-content'
                                                            }}>
                                                                {estadoInfo.icon}
                                                                {estadoInfo.label}
                                                            </div>
                                                        </td>
                                                        <td style={{ whiteSpace: 'nowrap', fontWeight: '600' }}>
                                                            ${(q.TotalPrice || q.totalPrice || 0)?.toLocaleString('es-AR')}
                                                        </td>
                                                        <td>
                                                            {quotationId && (
                                                                <button
                                                                    className="btn-accion-tabla"
                                                                    onClick={() => handleVerCotizacion(quotationId)}
                                                                    title="Ver PDF de la cotización"
                                                                >
                                                                    <FileText size={14} />
                                                                    Ver PDF
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : null
                )}

                {generar && !loading && resultados.length === 0 && (
                    <div className="estado-vacio-moderno">
                        <MapPin size={64} />
                        <h3>No se encontraron proyectos</h3>
                        <p>No hay cotizaciones para los filtros seleccionados</p>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

function formatFechaCorta(fecha) {
    if (!fecha) return '';
    const [datePart] = fecha.split('T');
    const [y, m, d] = datePart.split('-');
    return `${d}-${m}-${y.slice(2)}`;
}

export default AnalisisDeProyectoPorUbicacionGeografica;