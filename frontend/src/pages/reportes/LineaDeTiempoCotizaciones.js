import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import "../../styles/reportes.css";
import "../../styles/reporteindividual.css";
import "../../styles/LineaDeTiempoReporte.css";
import {
    FileText,
    Users,
    Calendar,
    Filter,
    Download,
    ChevronDown,
    ChevronUp,
    MapPin,
    User,
    Briefcase,
    Package
} from 'lucide-react';
import ReactLoading from 'react-loading';
import html2pdf from 'html2pdf.js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from "react-router-dom";

import ciudadesBarriosCordoba from '../../json/ciudadesBarriosCordoba.json';

const API_URL = process.env.REACT_APP_API_URL;

const estadoColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'accepted': return '#4caf50';
        case 'approved': return '#4caf50';
        case 'rejected': return '#f44336';
        case 'pending': return '#ff9800';
        default: return '#9e9e9e';
    }
};

const estadoTexto = (status) => {
    switch (status?.toLowerCase()) {
        case 'accepted': return 'Aceptada';
        case 'approved': return 'Aprobada';
        case 'rejected': return 'Rechazada';
        case 'pending': return 'Pendiente';
        default: return status || 'Desconocido';
    }
};

const safeArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.$values && Array.isArray(data.$values)) return data.$values;
    if (typeof data === 'object') return [data];
    return [];
};

const OrdenamientoFlecha = ({ campo, ordenActual, onOrdenar, tieneDatos = true }) => {
    if (!tieneDatos) return null;

    const esAscendente = ordenActual === 'asc';

    return (
        <button
            className="btn-ordenar"
            onClick={() => onOrdenar(campo, esAscendente ? 'desc' : 'asc')}
            title={`Ordenar por ${campo} ${esAscendente ? 'descendente' : 'ascendente'}`}
        >
            <ChevronUp size={16} className={esAscendente ? 'active' : ''} />
            <ChevronDown size={16} className={!esAscendente ? 'active' : ''} />
        </button>
    );
};

const FiltrosAvanzados = ({
    filtros,
    onFiltrosChange,
    isOpen,
    onToggle,
    onOrdenar,
    filtrosBasicos,
    onAplicarFiltros,
    opciones = {
        ubicaciones: [],
        usuarios: [],
        agentes: [],
        productos: []
    },
    loadingOpciones = false,
    userRole
}) => {
    const esCotizador = userRole === 'quotator';

    return (
        <div className={`filtros-avanzados ${isOpen ? 'open' : ''}`}>
            <div className="filtros-header" onClick={onToggle}>
                <Filter size={18} />
                <span>Filtros Avanzados</span>
                <ChevronDown className={`toggle-icon ${isOpen ? 'open' : ''}`} size={18} />
            </div>

            {isOpen && (
                <div className="filtros-content">
                    <div className="filtro-grupo">
                        <label className="filtro-label">
                            <Calendar size={16} />
                            Rango de Fechas
                        </label>
                        <div className="fechas-container">
                            <div className="fecha-input">
                                <label>Desde:</label>
                                <input
                                    type="date"
                                    value={filtrosBasicos.fromDate || ''}
                                    onChange={(e) => filtrosBasicos.onFromDateChange(e.target.value)}
                                    className="fecha-input-field"
                                />
                            </div>
                            <div className="fecha-input">
                                <label>Hasta:</label>
                                <input
                                    type="date"
                                    value={filtrosBasicos.toDate || ''}
                                    onChange={(e) => filtrosBasicos.onToDateChange(e.target.value)}
                                    className="fecha-input-field"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="filtro-grupo">
                        <div className="filtro-header">
                            <label className="filtro-label">
                                <MapPin size={16} />
                                Ubicación
                            </label>
                            <OrdenamientoFlecha
                                campo="ubicacion"
                                ordenActual={filtros.ordenamientos.ubicacion}
                                onOrdenar={onOrdenar}
                                tieneDatos={false}
                            />
                        </div>
                        <select
                            value={filtros.ubicacion || ''}
                            onChange={(e) => onFiltrosChange('ubicacion', e.target.value)}
                            className="filtro-select"
                            disabled={loadingOpciones}
                        >
                            <option value="">Todas las ubicaciones</option>
                            {opciones.ubicaciones.map((ubicacion, index) => (
                                <option key={index} value={ubicacion}>
                                    {ubicacion}
                                </option>
                            ))}
                        </select>
                    </div>

                    {!esCotizador && (
                        <div className="filtro-grupo">
                            <label className="filtro-label">
                                <User size={16} />
                                Usuario Generador
                            </label>
                            <select
                                value={filtros.usuarioGenerador || ''}
                                onChange={(e) => onFiltrosChange('usuarioGenerador', e.target.value)}
                                className="filtro-select"
                                disabled={loadingOpciones || opciones.usuarios.length === 0}
                            >
                                <option value="">Todos los usuarios</option>
                                {opciones.usuarios.map((usuario, index) => (
                                    <option key={index} value={usuario.nombre}>
                                        {usuario.nombre || `Usuario ${usuario.id}`}
                                    </option>
                                ))}
                            </select>
                            {opciones.usuarios.length === 0 && !loadingOpciones && (
                                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                    No hay usuarios disponibles
                                </div>
                            )}
                        </div>
                    )}

                    <div className="filtro-grupo">
                        <label className="filtro-label">
                            <Briefcase size={16} />
                            Agente Representante
                        </label>
                        <select
                            value={filtros.agenteId || ''}
                            onChange={(e) => onFiltrosChange('agenteId', e.target.value)}
                            className="filtro-select"
                            disabled={loadingOpciones}
                        >
                            <option value="">Todos los agentes</option>
                            {opciones.agentes.map((agente, index) => (
                                <option key={index} value={agente.dni}>
                                    {agente.nombre} ({agente.dni})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filtro-grupo">
                        <label className="filtro-label">
                            <Package size={16} />
                            Tipo de Producto
                        </label>
                        <select
                            value={filtros.tipoProducto || ''}
                            onChange={(e) => onFiltrosChange('tipoProducto', e.target.value)}
                            className="filtro-select"
                            disabled={loadingOpciones}
                        >
                            <option value="">Todos los productos</option>
                            {opciones.productos.map((producto, index) => (
                                <option key={index} value={producto.id}>
                                    {producto.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filtro-acciones">
                        <button
                            className="btn-limpiar-avanzado"
                            onClick={() => {
                                onFiltrosChange('limpiarTodo', true);
                            }}
                        >
                            Limpiar Todo
                        </button>
                        <button
                            className="btn-aplicar-avanzado"
                            onClick={onAplicarFiltros}
                        >
                            <Filter size={16} />
                            Aplicar Filtros
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const LineaDeTiempoCotizaciones = () => {
    const [clientes, setClientes] = useState([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [timelineData, setTimelineData] = useState([]);
    const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingClientes, setLoadingClientes] = useState(false);
    const [filtrosAvanzadosOpen, setFiltrosAvanzadosOpen] = useState(false);
    const [opcionesFiltros, setOpcionesFiltros] = useState({
        ubicaciones: [],
        usuarios: [],
        agentes: [],
        productos: []
    });
    const [loadingOpciones, setLoadingOpciones] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [roleLoading, setRoleLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const requiredRoles = ['quotator', 'coordinator', 'manager'];

    const navigate = useNavigate();
    const pdfRef = useRef();
    const timelineReportRef = useRef();

    const filtrosIniciales = {
        search: '',
        fromDate: '',
        toDate: '',
        avanzados: {
            ubicacion: '',
            usuarioGenerador: '',
            agenteId: '',
            tipoProducto: '',
            ordenamientos: {
                fecha: 'desc',
                ubicacion: 'asc'
            }
        }
    };

    const [filtros, setFiltros] = useState(filtrosIniciales);

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

                const userId = payload?.userId || payload?.userid || payload?.sub;

                if (role) {
                    setUserRole(role);
                    setCurrentUserId(userId);
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
                        const userId = data?.user?.id || data?.userId;
                        setUserRole(role);
                        setCurrentUserId(userId);
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

    useEffect(() => {
        if (userRole && requiredRoles.includes(userRole)) {
            cargarClientes();
            cargarOpcionesFiltros();
        }
    }, [userRole]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
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
                        Este reporte está disponible únicamente para los roles de Cotizador, Supervisor y Gerente.
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

    const cargarClientes = async () => {
        setLoadingClientes(true);
        try {
            const token = localStorage.getItem('token');
            let url = `${API_URL}/api/TimeLineBudgetReport/customers`;

            if (userRole === 'quotator' && currentUserId) {
                url = `${API_URL}/api/TimeLineBudgetReport/customers/by-user/${currentUserId}`;
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const clientesData = safeArray(response.data);
            setClientes(clientesData);

        } catch (error) {
            console.error('Error al cargar clientes:', error);
            toast.error('Error al cargar la lista de clientes');
            setClientes([]);
        } finally {
            setLoadingClientes(false);
        }
    };

    const cargarOpcionesFiltros = async () => {
        setLoadingOpciones(true);
        try {
            const token = localStorage.getItem('token');

            const [usuariosResponse, agentesResponse, productosResponse] = await Promise.all([
                axios.get(`${API_URL}/api/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(error => {
                    console.error('Error cargando usuarios:', error);
                    return { data: [] };
                }),
                axios.get(`${API_URL}/api/customer-agents`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(error => {
                    console.error('Error cargando agentes:', error);
                    return { data: [] };
                }),
                axios.get(`${API_URL}/api/opening-types`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(error => {
                    console.error('Error cargando productos:', error);
                    return { data: [] };
                })
            ]);

            const usuariosData = safeArray(usuariosResponse.data);
            const usuarios = usuariosData.map(user => ({
                id: user.id || user.userId || user.UserId || Math.random(),
                nombre: `${user.name || user.firstName || ''} ${user.lastName || user.lastname || ''}`.trim() || `Usuario ${user.id || ''}`
            })).filter(user => user.nombre);

            const agentesData = safeArray(agentesResponse.data);
            const agentes = agentesData.map(agente => ({
                id: agente.id,
                dni: agente.dni || 'N/A',
                nombre: `${agente.name || ''} ${agente.lastName || agente.lastname || ''}`.trim()
            })).filter(agente => agente.nombre && agente.dni !== 'N/A');

            const productosData = safeArray(productosResponse.data);
            const productos = productosData.map(producto => ({
                id: producto.id,
                nombre: producto.name || producto.nombre || 'Producto sin nombre'
            })).filter(producto => producto.nombre);

            const ubicaciones = generarUbicacionesDesdeJSON();

            setOpcionesFiltros({
                ubicaciones: ubicaciones,
                usuarios: usuarios,
                agentes: agentes,
                productos: productos
            });

        } catch (error) {
            console.error('Error general al cargar opciones de filtros:', error);
            toast.error('Error al cargar algunas opciones de filtros');
            setOpcionesFiltros({
                ubicaciones: generarUbicacionesDesdeJSON(),
                usuarios: [],
                agentes: [],
                productos: []
            });
        } finally {
            setLoadingOpciones(false);
        }
    };

    const generarUbicacionesDesdeJSON = () => {
        const ubicaciones = new Set();

        try {
            const cordobaData = ciudadesBarriosCordoba.Cordoba;

            if (cordobaData && cordobaData.ciudades) {
                cordobaData.ciudades.forEach(ciudad => {
                    if (ciudad.barrios && Array.isArray(ciudad.barrios)) {
                        ciudad.barrios.forEach(barrio => {
                            if (barrio !== "Otro") {
                                const ubicacion = `${ciudad.nombre} - ${barrio}`;
                                ubicaciones.add(ubicacion);
                            }
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error al procesar JSON de ubicaciones:', error);
        }

        const ubicacionesComunes = [
            'Córdoba - Bella Vista',
            'Villa Carlos Paz - Centro',
            'Río Cuarto - Centro',
            'Villa María - Centro'
        ];

        ubicacionesComunes.forEach(ubicacion => ubicaciones.add(ubicacion));

        return Array.from(ubicaciones).sort();
    };

    const cargarTimelineCliente = async (cliente) => {
        if (!cliente?.dni) return;

        setLoading(true);
        setClienteSeleccionado(cliente);

        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();

            if (filtros.fromDate) params.append('fromDate', filtros.fromDate);
            if (filtros.toDate) params.append('toDate', filtros.toDate);
            if (filtros.avanzados.ubicacion) params.append('ubicacion', filtros.avanzados.ubicacion);

            if (filtros.avanzados.usuarioGenerador) {
                params.append('usuarioGenerador', filtros.avanzados.usuarioGenerador);
            }

            if (filtros.avanzados.agenteId) params.append('agenteDni', filtros.avanzados.agenteId);
            if (filtros.avanzados.tipoProducto) params.append('tipoProducto', filtros.avanzados.tipoProducto);

            params.append('ordenFecha', filtros.avanzados.ordenamientos.fecha);

            const url = `${API_URL}/api/TimeLineBudgetReport/${cliente.dni}?${params}`;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = safeArray(response.data);
            setTimelineData(data);
            setCotizacionSeleccionada(data[0] || null);

            if (data.length === 0) {
                toast.info('No se encontraron cotizaciones con los filtros aplicados');
            } else {
                toast.success(`Se encontraron ${data.length} series de cotizaciones`);
            }
        } catch (error) {
            console.error('Error al cargar timeline:', error);
            if (error.response?.status === 404) {
                toast.error('Cliente no encontrado');
            } else if (error.response?.status === 500) {
                toast.error('Error interno del servidor al procesar los filtros');
            } else {
                toast.error('Error al cargar el timeline del cliente');
            }
            setTimelineData([]);
            setCotizacionSeleccionada(null);
        } finally {
            setLoading(false);
        }
    };

    const aplicarFiltros = () => {
        if (clienteSeleccionado) {
            toast.info('Aplicando filtros...');
            cargarTimelineCliente(clienteSeleccionado);
        } else {
            toast.info('Selecciona un cliente primero');
        }
    };

    const limpiarFiltros = () => {
        setFiltros(JSON.parse(JSON.stringify(filtrosIniciales)));

        if (clienteSeleccionado) {
            setTimeout(() => {
                cargarTimelineCliente(clienteSeleccionado);
            }, 100);
        }

        toast.success('Todos los filtros han sido limpiados');
    };

    const handleFiltrosAvanzadosChange = (campo, valor) => {
        if (campo === 'limpiarTodo') {
            limpiarFiltros();
        } else {
            setFiltros(prev => ({
                ...prev,
                avanzados: {
                    ...prev.avanzados,
                    [campo]: valor
                }
            }));
        }
    };

    const handleOrdenar = (campo, direccion) => {
        setFiltros(prev => ({
            ...prev,
            avanzados: {
                ...prev.avanzados,
                ordenamientos: {
                    ...prev.avanzados.ordenamientos,
                    [campo]: direccion
                }
            }
        }));

        if (clienteSeleccionado) {
            setTimeout(() => {
                cargarTimelineCliente(clienteSeleccionado);
            }, 100);
        }
    };

    const handleDescargarPDF = () => {
        if (!pdfRef.current) return;

        const opt = {
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: `timeline_${clienteSeleccionado?.dni || 'cliente'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false,
                scrollY: 0,
                windowWidth: 1200
            },
            jsPDF: {
                unit: 'in',
                format: 'a4',
                orientation: 'portrait'
            }
        };

        setTimeout(() => {
            html2pdf().set(opt).from(pdfRef.current).save();
        }, 500);
    };

    const clientesFiltrados = safeArray(clientes).filter(cliente =>
        `${cliente.name || ''} ${cliente.lastname || ''} ${cliente.dni || ''}`
            .toLowerCase()
            .includes(filtros.search.toLowerCase())
    );

    const getClienteProp = (cliente, prop) => {
        return cliente?.[prop] || '-';
    };

    // Imprimir solo el área del reporte
    const handlePrint = () => {
        document.body.classList.add('print-timeline-only');
        setTimeout(() => {
            window.print();
            setTimeout(() => {
                document.body.classList.remove('print-timeline-only');
            }, 100);
        }, 50);
    };

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            <ToastContainer position="bottom-right" autoClose={3000} />

            {/* Botón Imprimir arriba del reporte */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '16px 32px 0 0' }}>
                <button
                    className="btn-secondary"
                    onClick={handlePrint}
                    type="button"
                    style={{ minWidth: 110 }}
                >
                    🖨️ Imprimir
                </button>
            </div>

            <div className="timeline-report-container" ref={timelineReportRef}>
                <div className="timeline-header">
                    <h1 className="estado-header-title">
                        <FileText size={32} />
                        Trazabilidad de cotizaciones
                    </h1>
                </div>

                <div className="timeline-layout">
                    <div className="timeline-sidebar">
                        <FiltrosAvanzados
                            filtros={filtros.avanzados}
                            onFiltrosChange={handleFiltrosAvanzadosChange}
                            isOpen={filtrosAvanzadosOpen}
                            onToggle={() => setFiltrosAvanzadosOpen(!filtrosAvanzadosOpen)}
                            onOrdenar={handleOrdenar}
                            filtrosBasicos={{
                                fromDate: filtros.fromDate,
                                toDate: filtros.toDate,
                                onFromDateChange: (value) => setFiltros({ ...filtros, fromDate: value }),
                                onToDateChange: (value) => setFiltros({ ...filtros, toDate: value })
                            }}
                            onAplicarFiltros={aplicarFiltros}
                            opciones={opcionesFiltros}
                            loadingOpciones={loadingOpciones}
                            userRole={userRole}
                        />

                        <div className="sidebar-header">
                            <Users size={20} />
                            <h3>Clientes</h3>
                        </div>

                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                value={filtros.search}
                                onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
                                className="search-input"
                            />
                        </div>

                        <div className="clientes-list-report">
                            {loadingClientes ? (
                                <div className="loading-clientes">
                                    <ReactLoading type="spin" color="#1976d2" height={30} width={30} />
                                    <span>Cargando clientes...</span>
                                </div>
                            ) : clientesFiltrados.length === 0 ? (
                                <div className="no-clientes">
                                    {filtros.search ? 'No se encontraron clientes' : 'No hay clientes'}
                                </div>
                            ) : (
                                clientesFiltrados.map((cliente) => (
                                    <div
                                        key={cliente.id || cliente.dni}
                                        className={`cliente-item ${clienteSeleccionado?.id === cliente.id ? 'selected' : ''}`}
                                        onClick={() => cargarTimelineCliente(cliente)}
                                    >
                                        <div className="cliente-info">
                                            <div className="cliente-nombre">
                                                {getClienteProp(cliente, 'name')} {getClienteProp(cliente, 'lastname')}
                                            </div>
                                            <div className="cliente-dni">DNI: {getClienteProp(cliente, 'dni')}</div>
                                            <div className="cliente-email">{getClienteProp(cliente, 'mail')}</div>
                                        </div>
                                        <div className="cliente-stats">
                                            <div className="stat-total">
                                                {cliente.TotalQuotations || 0} cotiz.
                                            </div>
                                            <div
                                                className="stat-accepted"
                                                style={{ color: estadoColor('accepted') }}
                                            >
                                                {cliente.AcceptedQuotations || 0} ✓
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="timeline-main">
                        {loading ? (
                            <div className="timeline-loading">
                                <ReactLoading type="spin" color="#1976d2" height={60} width={60} />
                                <div>Cargando timeline...</div>
                            </div>
                        ) : clienteSeleccionado && timelineData.length > 0 ? (
                            <div className="timeline-content" ref={pdfRef}>
                                <div className="report-header">
                                    <div className="report-title">
                                        <h2>Cotizaciones - {getClienteProp(clienteSeleccionado, 'name')} {getClienteProp(clienteSeleccionado, 'lastname')}</h2>
                                        <button className="btn-download-pdf" onClick={handleDescargarPDF}>
                                            <Download size={16} />
                                            Descargar PDF
                                        </button>
                                    </div>
                                    <div className="report-info">
                                        <div><strong>DNI:</strong> {getClienteProp(clienteSeleccionado, 'dni')}</div>
                                        <div><strong>Cotizaciones:</strong> {timelineData.length}</div>
                                    </div>
                                </div>

                                <div className="timeline-detalle-container">
                                    <div className="cotizaciones-sidebar">
                                        <h4>Series de Cotizaciones</h4>
                                        {safeArray(timelineData).map((item) => (
                                            <div
                                                key={item.BudgetId}
                                                className={`cotizacion-item ${cotizacionSeleccionada?.BudgetId === item.BudgetId ? 'selected' : ''}`}
                                                onClick={() => setCotizacionSeleccionada(item)}
                                            >
                                                <div className="cotizacion-header">
                                                    <div className="budget-id">{item.BudgetId || 'N/A'}</div>
                                                    <div
                                                        className="status-badge"
                                                        style={{ backgroundColor: estadoColor(item.Status) }}
                                                    >
                                                        {estadoTexto(item.Status)}
                                                    </div>
                                                </div>
                                                <div className="cotizacion-details">
                                                    <div className="workplace">{item.WorkPlaceName || 'Sin obra'}</div>
                                                    <div className="version-count">
                                                        {safeArray(item.Versions).length} versiones
                                                    </div>
                                                    <div className="creation-date">
                                                        {item.CreationDate ? new Date(item.CreationDate).toLocaleDateString() : 'Fecha desconocida'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="timeline-detalle">
                                        {cotizacionSeleccionada && (
                                            <>
                                                <div className="timeline-header-detalle">
                                                    <h3>Cotización N° {cotizacionSeleccionada.BudgetId || 'N/A'}</h3>
                                                    <div className="timeline-summary">
                                                        <span><strong>Obra:</strong> {cotizacionSeleccionada.WorkPlaceName || 'Sin obra'}</span>
                                                        <span><strong>Estado actual:</strong>
                                                            <span style={{ color: estadoColor(cotizacionSeleccionada.Status) }}>
                                                                {estadoTexto(cotizacionSeleccionada.Status)}
                                                            </span>
                                                        </span>
                                                        <span><strong>Total versiones:</strong> {safeArray(cotizacionSeleccionada.Versions).length}</span>
                                                    </div>
                                                </div>

                                                <div className="vertical-timeline">
                                                    {safeArray(cotizacionSeleccionada.Versions).map((version, index) => {
                                                        return (
                                                            <div key={`${version.BudgetId}-v${version.Version}-${index}`} className="timeline-item">
                                                                <div className="timeline-point" style={{ backgroundColor: estadoColor(version.Status) }}>
                                                                    <div className="version-number">v{version.Version || '?'}</div>
                                                                </div>
                                                                <div className="timeline-content-version">
                                                                    <div className="version-header-centered">
                                                                        <h4 className="version-title">Versión {version.Version || '?'}</h4>
                                                                        <div
                                                                            className="version-status-badge"
                                                                            style={{ backgroundColor: estadoColor(version.Status) }}
                                                                        >
                                                                            {estadoTexto(version.Status)}
                                                                        </div>
                                                                    </div>

                                                                    <div className="version-main-content">
                                                                        <div className="version-details-left">
                                                                            <div className="detail-item">
                                                                                <strong>Fecha creación:</strong>
                                                                                <span>{version.CreationDate ? new Date(version.CreationDate).toLocaleDateString() : 'No especificada'}</span>
                                                                            </div>
                                                                            <div className="detail-item">
                                                                                <strong>Presupuesto ID:</strong>
                                                                                <span>{version.BudgetId || 'N/A'}</span>
                                                                            </div>
                                                                            <div className="detail-item">
                                                                                <strong>Total:</strong>
                                                                                <span className="total-amount">${(version.Total || 0)?.toFixed(2)}</span>
                                                                            </div>
                                                                        </div>

                                                                        <div className="version-actions-right">
                                                                            <button
                                                                                className="btn-ver-pdf"
                                                                                onClick={() => window.open(`/quotation/${version.BudgetId}`, '_blank')}
                                                                                title="Ver PDF detallado de esta cotización"
                                                                            >
                                                                                📄 Ver PDF
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {version.Comment && (
                                                                        <div className="comment-section-full">
                                                                            <strong>Comentario:</strong>
                                                                            <div className="comment-text">
                                                                                {version.Comment.split('Validez de la cotización')[0]?.trim() || version.Comment}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : clienteSeleccionado ? (
                            <div className="no-timeline-data">
                                <FileText size={48} />
                                <h3>No hay cotizaciones</h3>
                                <p>El cliente seleccionado no tiene cotizaciones registradas con los filtros aplicados.</p>
                            </div>
                        ) : (
                            <div className="no-cliente-selected">
                                <Users size={48} />
                                <h3>Selecciona un cliente</h3>
                                <p>Elige un cliente de la lista para ver su línea de tiempo de cotizaciones.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default LineaDeTiempoCotizaciones;