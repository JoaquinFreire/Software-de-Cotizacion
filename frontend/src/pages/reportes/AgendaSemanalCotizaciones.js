import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../../styles/AgendaSemanalCotizaciones.css';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import ScrollToTopButton from '../../components/ScrollToTopButton';
import ReactLoading from 'react-loading';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    Filter,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    FileText,
    MapPin,
    DollarSign,
    CheckCircle,
    XCircle,
    Clock,
    Award,
    Edit3,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

axios.defaults.headers.post['Content-Type'] = 'application/json; charset=utf-8';
axios.defaults.headers.get['Content-Type'] = 'application/json; charset=utf-8';

// Formateo fecha
const formatFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR');
};

// Formateo hora
const formatHora = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

// Nombres de los dias
const getNombreDia = (fecha) => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const date = new Date(fecha);
    return dias[date.getDay()];
};

const agruparEventosPorDia = (eventos) => {
    const agrupados = {};

    eventos.forEach(evento => {
        const fecha = new Date(evento.fecha);
        const fechaStr = fecha.toISOString().split('T')[0];

        if (!agrupados[fechaStr]) {
            agrupados[fechaStr] = [];
        }
        agrupados[fechaStr].push(evento);
    });

    Object.keys(agrupados).forEach(fecha => {
        agrupados[fecha].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    });

    return agrupados;
};

// Obtener semanas del mes
const getSemanasDelMes = (ano, mes) => {
    const semanas = [];
    const primerDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);

    let fechaInicio = new Date(primerDia);
    // Empezar desde el lunes
    fechaInicio.setDate(fechaInicio.getDate() - fechaInicio.getDay() + 1);

    while (fechaInicio <= ultimoDia) {
        const fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaFin.getDate() + 6);

        if (fechaFin >= primerDia) {
            semanas.push({
                inicio: new Date(fechaInicio),
                fin: fechaFin,
                numero: getNumeroSemana(fechaInicio)
            });
        }

        fechaInicio.setDate(fechaInicio.getDate() + 7);
    }

    return semanas;
};

// Obtener número de semana
const getNumeroSemana = (fecha) => {
    const date = new Date(fecha);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const semana1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - semana1.getTime()) / 86400000 - 3 + (semana1.getDay() + 6) % 7) / 7);
};

// Semana actual
const getSemanaActual = () => {
    const hoy = new Date();
    const ano = hoy.getFullYear();
    const mes = hoy.getMonth();
    const semanas = getSemanasDelMes(ano, mes);

    const semanaActual = semanas.find(semana =>
        hoy >= semana.inicio && hoy <= semana.fin
    );

    return semanaActual || semanas[0];
};

const AgendaSemanalCotizaciones = () => {
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [userId, setUserId] = useState(null);
    const [eventos, setEventos] = useState([]);
    const [eventosFiltrados, setEventosFiltrados] = useState([]);
    const [semanaSeleccionada, setSemanaSeleccionada] = useState(null);
    const [filtros, setFiltros] = useState({
        tiposEvento: ['nueva', 'modificacion', 'aceptada', 'rechazada', 'finalizada'],
        cliente: 'todos'
    });
    const [clientes, setClientes] = useState([]);
    const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
    const [generar, setGenerar] = useState(false);
    const [anoSeleccionado, setAnoSeleccionado] = useState(new Date().getFullYear());
    const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
    const [semanasDelMes, setSemanasDelMes] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [roleLoading, setRoleLoading] = useState(true);
    const requiredRoles = ['quotator']; // Solo cotizadores pueden ver este reporte

    const navigate = useNavigate();
    const initialized = useRef(false);

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
    };

    const aplicarFiltros = () => {
        let eventosFiltrados = [...eventos];

        if (filtros.tiposEvento.length > 0) {
            eventosFiltrados = eventosFiltrados.filter(evento =>
                filtros.tiposEvento.includes(evento.tipo)
            );
        }

        if (filtros.cliente !== 'todos') {
            eventosFiltrados = eventosFiltrados.filter(evento =>
                evento.cliente === filtros.cliente
            );
        }

        setEventosFiltrados(eventosFiltrados);
    };

    const obtenerAnosDisponibles = () => {
        const anoActual = new Date().getFullYear();
        return Array.from({ length: anoActual - 2021 }, (_, i) => anoActual - i);
    };

    const obtenerMesesDelAno = () => {
        return [
            { nombre: 'Enero', valor: 0 },
            { nombre: 'Febrero', valor: 1 },
            { nombre: 'Marzo', valor: 2 },
            { nombre: 'Abril', valor: 3 },
            { nombre: 'Mayo', valor: 4 },
            { nombre: 'Junio', valor: 5 },
            { nombre: 'Julio', valor: 6 },
            { nombre: 'Agosto', valor: 7 },
            { nombre: 'Septiembre', valor: 8 },
            { nombre: 'Octubre', valor: 9 },
            { nombre: 'Noviembre', valor: 10 },
            { nombre: 'Diciembre', valor: 11 }
        ];
    };

    useEffect(() => {
        const semanas = getSemanasDelMes(anoSeleccionado, mesSeleccionado);
        setSemanasDelMes(semanas);

        if (!semanaSeleccionada || !semanas.some(s => s.inicio.getTime() === semanaSeleccionada.inicio.getTime())) {
            if (semanas.length > 0) {
                setSemanaSeleccionada(semanas[0]);
            }
        }
    }, [anoSeleccionado, mesSeleccionado]);

    useEffect(() => {
        const cargarInicial = async () => {
            if (initialized.current) return;
            initialized.current = true;

            try {
                setLoading(true);

                const token = localStorage.getItem('token');
                const responseMe = await axios.get(`${API_URL}/api/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json; charset=utf-8'
                    }
                });

                const userFromMe = responseMe.data;
                setUserData(userFromMe);

                const userIdFromMe = userFromMe.user?.id || userFromMe.userId;

                if (userIdFromMe) {
                    setUserId(userIdFromMe);
                }

                const semanaActual = getSemanaActual();
                setSemanaSeleccionada(semanaActual);
                setAnoSeleccionado(semanaActual.inicio.getFullYear());
                setMesSeleccionado(semanaActual.inicio.getMonth());

                if (userIdFromMe) {
                    await cargarEventosSemana(semanaActual, userIdFromMe);
                }

            } catch (error) {
                console.error('Error cargando datos iniciales:', error);
            } finally {
                setLoading(false);
            }
        };

        cargarInicial();
    }, []);

    useEffect(() => {
        if (semanaSeleccionada && userId && initialized.current) {
            cargarEventosSemana(semanaSeleccionada, userId);
        }
    }, [semanaSeleccionada, userId]);

    useEffect(() => {
        aplicarFiltros();
    }, [eventos, filtros]);

    const semanaAnterior = () => {
        const indexActual = semanasDelMes.findIndex(s =>
            s.inicio.getTime() === semanaSeleccionada?.inicio.getTime()
        );

        if (indexActual > 0) {
            setSemanaSeleccionada(semanasDelMes[indexActual - 1]);
        } else {
            const mesAnterior = mesSeleccionado === 0 ? 11 : mesSeleccionado - 1;
            const anoAnterior = mesSeleccionado === 0 ? anoSeleccionado - 1 : anoSeleccionado;

            const semanasMesAnterior = getSemanasDelMes(anoAnterior, mesAnterior);
            if (semanasMesAnterior.length > 0) {
                setSemanaSeleccionada(semanasMesAnterior[semanasMesAnterior.length - 1]);
                setMesSeleccionado(mesAnterior);
                setAnoSeleccionado(anoAnterior);
            }
        }
    };

    const semanaSiguiente = () => {
        const indexActual = semanasDelMes.findIndex(s =>
            s.inicio.getTime() === semanaSeleccionada?.inicio.getTime()
        );

        if (indexActual < semanasDelMes.length - 1) {
            setSemanaSeleccionada(semanasDelMes[indexActual + 1]);
        } else {
            const mesSiguiente = mesSeleccionado === 11 ? 0 : mesSeleccionado + 1;
            const anoSiguiente = mesSeleccionado === 11 ? anoSeleccionado + 1 : anoSeleccionado;

            const semanasMesSiguiente = getSemanasDelMes(anoSiguiente, mesSiguiente);
            if (semanasMesSiguiente.length > 0) {
                setSemanaSeleccionada(semanasMesSiguiente[0]);
                setMesSeleccionado(mesSiguiente);
                setAnoSeleccionado(anoSiguiente);
            }
        }
    };

    const irAHoy = () => {
        const hoy = new Date();
        const semanaActual = getSemanaActual();
        setSemanaSeleccionada(semanaActual);
        setAnoSeleccionado(hoy.getFullYear());
        setMesSeleccionado(hoy.getMonth());
    };

    const cambiarAno = (e) => {
        const nuevoAno = parseInt(e.target.value);
        setAnoSeleccionado(nuevoAno);
    };

    const cambiarMes = (e) => {
        const nuevoMes = parseInt(e.target.value);
        setMesSeleccionado(nuevoMes);
    };

    const cambiarSemana = (e) => {
        const index = parseInt(e.target.value);
        if (semanasDelMes[index]) {
            setSemanaSeleccionada(semanasDelMes[index]);
        }
    };

    const cargarEventosSemana = async (semana = semanaSeleccionada, userIdParam = userId) => {
        if (!semana || !userIdParam) return;

        setLoading(true);
        setGenerar(true);
        try {
            const token = localStorage.getItem('token');
            const desde = semana.inicio.toISOString().split('T')[0];
            const hasta = semana.fin.toISOString().split('T')[0];

            const responseSQL = await axios.get(
                `${API_URL}/api/quotations/by-period?from=${desde}&to=${hasta}&userId=${userIdParam}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json; charset=utf-8'
                    }
                }
            );

            let cotizacionesSQL = [];

            if (Array.isArray(responseSQL.data)) {
                cotizacionesSQL = responseSQL.data;
            } else if (responseSQL.data && responseSQL.data.$values) {
                cotizacionesSQL = responseSQL.data.$values;
            } else if (responseSQL.data && typeof responseSQL.data === 'object') {
                cotizacionesSQL = [responseSQL.data];
            }

            const eventosCombinados = [];

            for (const cotizacionSQL of cotizacionesSQL) {
                try {
                    const budgetId = cotizacionSQL.Id || cotizacionSQL.id;

                    if (!budgetId) {
                        console.warn('Cotización sin ID:', cotizacionSQL);
                        continue;
                    }

                    const responseVersiones = await axios.get(
                        `${API_URL}/api/Mongo/GetBudgetVersions/${budgetId}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json; charset=utf-8'
                            }
                        }
                    );

                    let versiones = [];

                    if (Array.isArray(responseVersiones.data)) {
                        versiones = responseVersiones.data;
                    } else if (responseVersiones.data && responseVersiones.data.$values) {
                        versiones = responseVersiones.data.$values;
                    } else if (responseVersiones.data && typeof responseVersiones.data === 'object') {
                        versiones = [responseVersiones.data];
                    }

                    for (const versionData of versiones) {
                        const eventosVersion = transformarVersionAEventos(versionData, cotizacionSQL);
                        eventosCombinados.push(...eventosVersion);
                    }

                } catch (error) {
                    console.error(`Error procesando cotización ${cotizacionSQL.Id}:`, error);
                    const eventoBasico = crearEventoDesdeSQL(cotizacionSQL);
                    if (eventoBasico) {
                        eventosCombinados.push(eventoBasico);
                    }
                }
            }

            setEventos(eventosCombinados);

            const clientesUnicos = [...new Set(eventosCombinados
                .map(evento => evento.cliente)
                .filter(cliente => cliente && cliente.trim() !== '')
            )];
            setClientes(clientesUnicos);

        } catch (error) {
            console.error('Error cargando eventos:', error);
            setEventos([]);
        } finally {
            setLoading(false);
        }
    };

    const crearEventoDesdeSQL = (cotizacionSQL) => {
        try {
            const budgetId = cotizacionSQL.Id || cotizacionSQL.id;
            const creationDate = cotizacionSQL.CreationDate || cotizacionSQL.creationDate;

            if (!creationDate) {
                console.warn('Cotización sin fecha de creación:', cotizacionSQL);
                return null;
            }

            return {
                id: `${budgetId}-creacion`,
                tipo: 'nueva',
                fecha: creationDate,
                budgetId: budgetId,
                version: 1,
                cliente: `${cotizacionSQL.Customer?.Customer?.name || cotizacionSQL.Customer?.name || ''} ${cotizacionSQL.Customer?.Customer?.lastname || cotizacionSQL.Customer?.lastname || ''}`.trim(),
                obra: cotizacionSQL.WorkPlace?.name || '',
                ubicacion: cotizacionSQL.WorkPlace?.location || '',
                monto: cotizacionSQL.TotalPrice || cotizacionSQL.totalPrice || 0,
                comentario: null
            };
        } catch (error) {
            console.error('Error creando evento desde SQL:', error);
            return null;
        }
    };

    const transformarVersionAEventos = (versionData, cotizacionSQL) => {
        const eventos = [];
        const budgetId = versionData.budgetId || cotizacionSQL.Id || cotizacionSQL.id;
        const version = versionData.version || 1;
        const creationDate = versionData.creationDate;
        const status = (versionData.status || '').toLowerCase();

        // Función para mantener tildes
        const decodeText = (text) => {
            if (!text) return '';
            return String(text).trim();
        };

        const nombreCliente = decodeText(versionData.customer?.name || cotizacionSQL.Customer?.Customer?.name || '');
        const apellidoCliente = decodeText(versionData.customer?.lastname || cotizacionSQL.Customer?.Customer?.lastname || '');
        const cliente = `${nombreCliente} ${apellidoCliente}`.trim();

        // EVENTO DE CREACIÓN
        if (version === 1 && creationDate) {
            eventos.push({
                id: `${budgetId}-v${version}-creacion`,
                tipo: 'nueva',
                fecha: creationDate,
                budgetId: budgetId,
                version,
                cliente: cliente,
                obra: decodeText(versionData.workPlace?.name || cotizacionSQL.WorkPlace?.name || ''),
                ubicacion: decodeText(versionData.workPlace?.location || cotizacionSQL.WorkPlace?.location || ''),
                monto: versionData.Total || versionData.total || cotizacionSQL.TotalPrice || 0,
                comentario: null
            });
        }

        // EVENTO DE MODIFICACIÓN
        if (version > 1 && creationDate) {
            eventos.push({
                id: `${budgetId}-v${version}-modificacion`,
                tipo: 'modificacion',
                fecha: creationDate,
                budgetId: budgetId,
                version,
                cliente: cliente,
                obra: decodeText(versionData.workPlace?.name || cotizacionSQL.WorkPlace?.name || ''),
                ubicacion: decodeText(versionData.workPlace?.location || cotizacionSQL.WorkPlace?.location || ''),
                monto: versionData.Total || versionData.total || cotizacionSQL.TotalPrice || 0,
                comentario: null
            });
        }

        // EVENTO DE CIERRE
        if (['accepted', 'rejected', 'finished', 'approved', 'pending'].includes(status)) {
            let tipoCierre = '';
            switch (status) {
                case 'accepted':
                case 'approved':
                    tipoCierre = 'aceptada';
                    break;
                case 'rejected':
                    tipoCierre = 'rechazada';
                    break;
                case 'finished':
                    tipoCierre = 'finalizada';
                    break;
                case 'pending':
                    break;
                default:
                    tipoCierre = 'finalizada';
            }

            if (tipoCierre) {
                eventos.push({
                    id: `${budgetId}-v${version}-${tipoCierre}`,
                    tipo: tipoCierre,
                    fecha: creationDate,
                    budgetId: budgetId,
                    version,
                    cliente: cliente,
                    obra: decodeText(versionData.workPlace?.name || cotizacionSQL.WorkPlace?.name || ''),
                    ubicacion: decodeText(versionData.workPlace?.location || cotizacionSQL.WorkPlace?.location || ''),
                    monto: versionData.Total || versionData.total || cotizacionSQL.TotalPrice || 0,
                    comentario: null
                });
            }
        }

        return eventos;
    };

    const handleFiltroTipoEvento = (tipo) => {
        setFiltros(prev => {
            const nuevosTipos = prev.tiposEvento.includes(tipo)
                ? prev.tiposEvento.filter(t => t !== tipo)
                : [...prev.tiposEvento, tipo];

            return { ...prev, tiposEvento: nuevosTipos };
        });
    };

    const handleFiltroCliente = (cliente) => {
        setFiltros(prev => ({ ...prev, cliente }));
    };

    const limpiarFiltros = () => {
        setFiltros({
            tiposEvento: ['nueva', 'modificacion', 'aceptada', 'rechazada', 'finalizada'],
            cliente: 'todos'
        });
    };

    const getIconoEvento = (tipo) => {
        switch (tipo) {
            case 'nueva': return <FileText size={16} />;
            case 'modificacion': return <Edit3 size={16} />;
            case 'aceptada': return <CheckCircle size={16} />;
            case 'rechazada': return <XCircle size={16} />;
            case 'finalizada': return <Award size={16} />;
            default: return <Clock size={16} />;
        }
    };

    const getColorEvento = (tipo) => {
        switch (tipo) {
            case 'nueva': return '#3b82f6';
            case 'modificacion': return '#f59e0b';
            case 'aceptada': return '#10b981';
            case 'rechazada': return '#ef4444';
            case 'finalizada': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    const getTextoEvento = (tipo) => {
        switch (tipo) {
            case 'nueva': return 'NUEVA COTIZACIÓN';
            case 'modificacion': return 'MODIFICACIÓN';
            case 'aceptada': return 'ACEPTADA';
            case 'rechazada': return 'RECHAZADA';
            case 'finalizada': return 'FINALIZADA';
            default: return 'EVENTO';
        }
    };

    const abrirPDF = (budgetId, version, tipoEvento) => {
        const versionParam = `?version=${version}`;
        const url = `/quotation/${budgetId}${versionParam}`;
        window.open(url, '_blank');
    };

    const eventosAgrupados = agruparEventosPorDia(eventosFiltrados);

    const diasSemana = [];
    if (semanaSeleccionada) {
        const fecha = new Date(semanaSeleccionada.inicio);
        for (let i = 0; i < 6; i++) {
            const diaFecha = new Date(fecha);
            diaFecha.setDate(fecha.getDate() + i);
            diasSemana.push(diaFecha);
        }
    }

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
                        Este reporte está disponible solo para cotizadores.
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

                        {/* Header */}
                        <div className="estado-header">
                                <Calendar size={32} />
                                <div>
                                    <h1 className="estado-header-title">Agenda Semanal de Cotizaciones</h1>
                                    <p>Seguimiento cronológico de tus actividades</p>
                                </div>
                            
                        </div>

                        {/* Filtros y Navegación */}
                        <div className="estado-filtros">
                            <div className="filtros-grid-unificado">
                                {/* Navegación rápida */}
                                <div className="filtro-group">
                                    <label>Navegación:</label>
                                    <div className="date-navigation">
                                        <button
                                            className="nav-btn"
                                            onClick={semanaAnterior}
                                            title="Semana anterior"
                                            disabled={loading}
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <div className="current-week-display">
                                            {semanaSeleccionada ?
                                                `Sem ${semanaSeleccionada.numero}: ${formatFecha(semanaSeleccionada.inicio)} - ${formatFecha(semanaSeleccionada.fin)}` :
                                                'Seleccione semana'
                                            }
                                        </div>
                                        <button
                                            className="nav-btn"
                                            onClick={semanaSiguiente}
                                            title="Semana siguiente"
                                            disabled={loading}
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                        <button
                                            className="today-btn"
                                            onClick={irAHoy}
                                            title="Ir a semana actual"
                                            disabled={loading}
                                        >
                                            <Calendar size={14} />
                                            Hoy
                                        </button>
                                    </div>
                                </div>

                                <div className="filtro-group">
                                    <label>Ir a fecha:</label>
                                    <div className="hierarchical-selector">
                                        <select
                                            value={anoSeleccionado}
                                            onChange={cambiarAno}
                                            className="filtro-input small"
                                            disabled={loading}
                                        >
                                            {obtenerAnosDisponibles().map(ano => (
                                                <option key={ano} value={ano}>{ano}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={mesSeleccionado}
                                            onChange={cambiarMes}
                                            className="filtro-input small"
                                            disabled={loading}
                                        >
                                            {obtenerMesesDelAno().map(mes => (
                                                <option key={mes.valor} value={mes.valor}>
                                                    {mes.nombre}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={semanasDelMes.findIndex(s =>
                                                s.inicio.getTime() === semanaSeleccionada?.inicio.getTime()
                                            )}
                                            onChange={cambiarSemana}
                                            className="filtro-input small"
                                            disabled={loading}
                                        >
                                            {semanasDelMes.map((semana, index) => (
                                                <option key={index} value={index}>
                                                    Sem {semana.numero}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Botón actualizar */}
                                <div className="filtro-actions">
                                    <button
                                        className="estado-btn estado-btn-primary"
                                        onClick={() => cargarEventosSemana()}
                                        disabled={loading}
                                    >
                                        <RefreshCw size={18} />
                                        {loading ? 'Cargando...' : 'Actualizar'}
                                    </button>
                                </div>
                            </div>

                            {/* Contenedor de filtros desplegable */}
                            <div className="filtros-desplegable-container">
                                <div
                                    className="filtros-desplegable-header"
                                    onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
                                >
                                    <div className="filtros-desplegable-title">
                                        <Filter size={18} />
                                        <span>Filtros</span>
                                    </div>
                                    <div className="filtros-desplegable-icon">
                                        {filtrosAbiertos ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </div>
                                </div>

                                {filtrosAbiertos && (
                                    <div className="filtros-desplegable-content">
                                        <div className="filtro-grupo-avanzado">
                                            <label>Tipos de Evento:</label>
                                            <div className="filtros-checkbox-grid">
                                                {['nueva', 'modificacion', 'aceptada', 'rechazada', 'finalizada'].map(tipo => (
                                                    <label key={tipo} className="control-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={filtros.tiposEvento.includes(tipo)}
                                                            onChange={() => handleFiltroTipoEvento(tipo)}
                                                        />
                                                        {getTextoEvento(tipo)}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="filtro-grupo-avanzado">
                                            <label>Cliente:</label>
                                            <select
                                                value={filtros.cliente}
                                                onChange={(e) => handleFiltroCliente(e.target.value)}
                                                className="filtro-input compact"
                                            >
                                                <option value="todos">Todos los clientes</option>
                                                {clientes.map((cliente, index) => (
                                                    <option key={index} value={cliente}>
                                                        {cliente}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="filtro-acciones-avanzadas">
                                            <div style={{ flex: 1 }}></div>
                                            <button
                                                className="estado-btn btn-limpiar-filtros"
                                                onClick={limpiarFiltros}
                                            >
                                                Limpiar Filtros
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cuerpo */}
                        <div className="satisfaction-content">
                            {loading ? (
                                <div className="satisfaction-loading">
                                    <ReactLoading type="spin" color="#26b7cd" height={80} width={80} />
                                    <div className="loading-text">Cargando agenda...</div>
                                </div>
                            ) : !generar ? (
                                <div className="satisfaction-empty">
                                    <Calendar size={64} />
                                    <h3>Agenda no generada</h3>
                                    <p>Presione "Actualizar" para cargar los eventos de la semana</p>
                                </div>
                            ) : (
                                <div className="agenda-semanal-content">
                                    <div className="dias-semana-grid">
                                        {diasSemana.map((dia, index) => {
                                            const fechaStr = dia.toISOString().split('T')[0];
                                            const eventosDia = eventosAgrupados[fechaStr] || [];
                                            const esFinde = dia.getDay() === 0 || dia.getDay() === 6;

                                            return (
                                                <div
                                                    key={index}
                                                    className={`dia-container ${esFinde ? 'dia-finde' : ''} ${eventosDia.length === 0 ? 'sin-eventos' : ''}`}
                                                >
                                                    <div className="dia-header">
                                                        <div className="dia-nombre">{getNombreDia(dia)}</div>
                                                        <div className="dia-fecha">{formatFecha(dia)}</div>
                                                        <div className="dia-contador">{eventosDia.length} eventos</div>
                                                    </div>

                                                    <div className="eventos-del-dia">
                                                        {eventosDia.length === 0 ? (
                                                            <div className="sin-eventos-mensaje">
                                                                No hay eventos este día
                                                            </div>
                                                        ) : (
                                                            eventosDia.map(evento => (
                                                                <div
                                                                    key={evento.id}
                                                                    className="evento-item"
                                                                    style={{ borderLeftColor: getColorEvento(evento.tipo) }}
                                                                >
                                                                    <div className="evento-hora">
                                                                        {formatHora(evento.fecha)}
                                                                    </div>
                                                                    <div className="evento-contenido">
                                                                        <div className="evento-header">
                                                                            <div className="evento-id-version">
                                                                                <div className="evento-id">#{evento.budgetId}</div>
                                                                                <div className="evento-version">v{evento.version}</div>
                                                                            </div>
                                                                            <button
                                                                                className="btn-ver-pdf"
                                                                                onClick={() => abrirPDF(evento.budgetId, evento.version, evento.tipo)}
                                                                                title="Ver PDF de la cotización"
                                                                            >
                                                                                <FileText size={14} />
                                                                                PDF
                                                                            </button>
                                                                        </div>

                                                                        <div className="evento-cliente-principal">
                                                                            {evento.cliente}
                                                                        </div>

                                                                        <div className="evento-tipo-container">
                                                                            <div
                                                                                className="evento-tipo"
                                                                                style={{ color: getColorEvento(evento.tipo) }}
                                                                            >
                                                                                {getIconoEvento(evento.tipo)}
                                                                                {getTextoEvento(evento.tipo)}
                                                                            </div>
                                                                        </div>

                                                                        <div className="evento-info">
                                                                            <div className="evento-obra">
                                                                                <MapPin size={14} />
                                                                                {evento.obra} - {evento.ubicacion}
                                                                            </div>
                                                                            <div className="evento-monto">
                                                                                <DollarSign size={14} />
                                                                                ${evento.monto?.toLocaleString()}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
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

export default AgendaSemanalCotizaciones;