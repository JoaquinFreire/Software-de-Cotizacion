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
    Package,
    DollarSign
} from 'lucide-react';
import ReactLoading from 'react-loading';
import html2pdf from 'html2pdf.js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Importar el JSON de ubicaciones
import ciudadesBarriosCordoba from '../../json/ciudadesBarriosCordoba.json';

const API_URL = process.env.REACT_APP_API_URL;

const estadoColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'accepted': return '#4caf50';
        case 'rejected': return '#f44336';
        case 'pending': return '#ff9800';
        default: return '#9e9e9e';
    }
};

const estadoTexto = (status) => {
    switch (status?.toLowerCase()) {
        case 'accepted': return 'Aceptada';
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

// Funciones para formatear números
const formatearNumero = (numero) => {
    if (!numero && numero !== 0) return '';
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parsearNumeroFormateado = (valor) => {
    if (!valor) return '';
    return valor.toString().replace(/\./g, '');
};

// Componente para flechas de ordenamiento
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

// Componente de Filtros Avanzados
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
    loadingOpciones = false
}) => {
    return (
        <div className={`filtros-avanzados ${isOpen ? 'open' : ''}`}>
            <div className="filtros-header" onClick={onToggle}>
                <Filter size={18} />
                <span>Filtros Avanzados</span>
                <ChevronDown className={`toggle-icon ${isOpen ? 'open' : ''}`} size={18} />
            </div>

            {isOpen && (
                <div className="filtros-content">
                    {/* Filtros de Fecha */}
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

                    {/* Filtro de Monto */}
                    <div className="filtro-grupo">
                        <div className="filtro-header">
                            <label className="filtro-label">
                                <DollarSign size={16} />
                                Monto Total
                            </label>
                            <OrdenamientoFlecha
                                campo="monto"
                                ordenActual={filtros.ordenamientos.monto}
                                onOrdenar={onOrdenar}
                                tieneDatos={true}
                            />
                        </div>
                        <div className="rango-monto">
                            <div className="rango-input">
                                <input
                                    type="text"
                                    placeholder="Mínimo"
                                    value={filtros.montoMin ? formatearNumero(filtros.montoMin) : ''}
                                    onChange={(e) => {
                                        const valorLimpio = parsearNumeroFormateado(e.target.value);
                                        onFiltrosChange('montoMin', valorLimpio);
                                    }}
                                    className="rango-min"
                                />
                            </div>
                            <span className="rango-separador">-</span>
                            <div className="rango-input">
                                <input
                                    type="text"
                                    placeholder="Máximo"
                                    value={filtros.montoMax ? formatearNumero(filtros.montoMax) : ''}
                                    onChange={(e) => {
                                        const valorLimpio = parsearNumeroFormateado(e.target.value);
                                        onFiltrosChange('montoMax', valorLimpio);
                                    }}
                                    className="rango-max"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filtro de Ubicación */}
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

                    {/* Filtro de Usuario Generador */}
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
                                <option key={index} value={usuario.nombre}>  {/* ← CAMBIADO: value={usuario.nombre} */}
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

                    {/* Filtro de Agente */}
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

                    {/* Filtro de Tipo de Producto */}
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

                    {/* Acciones de Filtros */}
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

    // Estado inicial de los filtros (para reset)
    const filtrosIniciales = {
        search: '',
        fromDate: '',
        toDate: '',
        avanzados: {
            montoMin: '',
            montoMax: '',
            ubicacion: '',
            usuarioGenerador: '',
            agenteId: '',
            tipoProducto: '',
            ordenamientos: {
                monto: 'desc',
                fecha: 'desc',
                ubicacion: 'asc'
            }
        }
    };

    const [filtros, setFiltros] = useState(filtrosIniciales);

    const pdfRef = useRef();

    useEffect(() => {
        cargarClientes();
        cargarOpcionesFiltros();
    }, []);

    const cargarClientes = async () => {
        setLoadingClientes(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/TimeLineBudgetReport/customers`, {
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

    // Función para cargar todas las opciones de filtros desde los endpoints SQL
    const cargarOpcionesFiltros = async () => {
        setLoadingOpciones(true);
        try {
            const token = localStorage.getItem('token');
            console.log('🔑 Token disponible:', !!token);

            // Cargar todas las opciones en paralelo con mejor manejo de errores
            const [usuariosResponse, agentesResponse, productosResponse] = await Promise.all([
                // Usuarios - con manejo específico de errores
                axios.get(`${API_URL}/api/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(error => {
                    console.error('❌ Error cargando usuarios:', error.response?.status, error.message);
                    // Si falla, intentar con un endpoint alternativo o datos de prueba
                    return { data: generarUsuariosDePrueba() };
                }),

                // Agentes
                axios.get(`${API_URL}/api/customer-agents`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(error => {
                    console.error('❌ Error cargando agentes:', error.response?.status, error.message);
                    return { data: [] };
                }),

                // Productos (opening types)
                axios.get(`${API_URL}/api/opening-types`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(error => {
                    console.error('❌ Error cargando productos:', error.response?.status, error.message);
                    return { data: [] };
                })
            ]);

            // Procesar usuarios con estructura más flexible
            const usuariosData = safeArray(usuariosResponse.data);
            const usuarios = usuariosData.map(user => ({
                id: user.id || user.userId || user.UserId || Math.random(),
                nombre: `${user.name || user.firstName || ''} ${user.lastName || user.lastname || ''}`.trim() || `Usuario ${user.id || ''}`
            })).filter(user => user.nombre); // Filtrar usuarios sin nombre

            // Procesar agentes
            const agentesData = safeArray(agentesResponse.data);
            const agentes = agentesData.map(agente => ({
                id: agente.id,
                dni: agente.dni || 'N/A',
                nombre: `${agente.name || ''} ${agente.lastName || agente.lastname || ''}`.trim()
            })).filter(agente => agente.nombre && agente.dni !== 'N/A');

            // Procesar productos (opening types)
            const productosData = safeArray(productosResponse.data);
            const productos = productosData.map(producto => ({
                id: producto.id,
                nombre: producto.name || producto.nombre || 'Producto sin nombre'
            })).filter(producto => producto.nombre);

            // Generar ubicaciones desde el JSON
            const ubicaciones = generarUbicacionesDesdeJSON();

            setOpcionesFiltros({
                ubicaciones: ubicaciones,
                usuarios: usuarios,
                agentes: agentes,
                productos: productos
            });

            console.log('✅ Opciones cargadas:', {
                ubicaciones: ubicaciones.length,
                usuarios: usuarios.length,
                agentes: agentes.length,
                productos: productos.length
            });

            if (usuarios.length === 0) {
                console.warn('⚠️ No se pudieron cargar usuarios, usando datos de prueba');
            }

        } catch (error) {
            console.error('Error general al cargar opciones de filtros:', error);
            toast.error('Error al cargar algunas opciones de filtros');

            // Fallback con datos básicos
            setOpcionesFiltros({
                ubicaciones: generarUbicacionesDesdeJSON(),
                usuarios: generarUsuariosDePrueba(),
                agentes: [],
                productos: []
            });
        } finally {
            setLoadingOpciones(false);
        }
    };

    // Función para generar usuarios de prueba si el endpoint falla
    const generarUsuariosDePrueba = () => {
        return [
            { id: 1, nombre: 'Leonardo Morales' },
            { id: 2, nombre: 'Usuario Coordinador' },
            { id: 3, nombre: 'Usuario Manager' }
        ];
    };

    // Función para generar ubicaciones desde el JSON
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

        // Agregar ubicaciones comunes que pueden no estar en el JSON
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

            // Filtros básicos
            if (filtros.fromDate) params.append('fromDate', filtros.fromDate);
            if (filtros.toDate) params.append('toDate', filtros.toDate);

            // Filtros avanzados - SOLO si tienen valor
            if (filtros.avanzados.montoMin) params.append('montoMin', filtros.avanzados.montoMin);
            if (filtros.avanzados.montoMax) params.append('montoMax', filtros.avanzados.montoMax);
            if (filtros.avanzados.ubicacion) params.append('ubicacion', filtros.avanzados.ubicacion);

            // ✅ CORREGIDO: Enviar el ID del usuario (no el nombre)
            if (filtros.avanzados.usuarioGenerador) {
                params.append('usuarioGenerador', filtros.avanzados.usuarioGenerador);
                console.log('👤 Filtrando por usuario ID:', filtros.avanzados.usuarioGenerador);
            }

            if (filtros.avanzados.agenteId) params.append('agenteDni', filtros.avanzados.agenteId);
            if (filtros.avanzados.tipoProducto) params.append('tipoProducto', filtros.avanzados.tipoProducto);

            // Ordenamientos
            params.append('ordenMonto', filtros.avanzados.ordenamientos.monto);
            params.append('ordenFecha', filtros.avanzados.ordenamientos.fecha);

            const url = `${API_URL}/api/TimeLineBudgetReport/${cliente.dni}?${params}`;
            console.log('📡 URL de consulta con filtros:', url);

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
        console.log('🧹 Limpiando TODOS los filtros...');

        // Resetear a estado inicial
        setFiltros(JSON.parse(JSON.stringify(filtrosIniciales)));

        console.log('✅ Filtros reseteados a estado inicial');

        // Recargar los datos con filtros limpios si hay un cliente seleccionado
        if (clienteSeleccionado) {
            setTimeout(() => {
                console.log('🔄 Recargando datos después de limpiar filtros');
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

    return (
        <div className="dashboard-container">
            <Navigation />
            <ToastContainer position="bottom-right" autoClose={3000} />

            <div className="timeline-report-container">
                <h2 className="title timeline-title">
                    <FileText size={32} />
                    Trazabilidad de cotizaciones
                </h2>

                <div className="timeline-layout">
                    {/* Panel lateral - Lista de clientes */}
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

                        <div className="filters-section">
                            <div className="filter-group">
                                <label>Desde:</label>
                                <input
                                    type="date"
                                    value={filtros.fromDate}
                                    onChange={(e) => setFiltros({ ...filtros, fromDate: e.target.value })}
                                />
                            </div>
                            <div className="filter-group">
                                <label>Hasta:</label>
                                <input
                                    type="date"
                                    value={filtros.toDate}
                                    onChange={(e) => setFiltros({ ...filtros, toDate: e.target.value })}
                                />
                            </div>
                            <div className="filter-group">
                                <label>Estado:</label>
                                <select
                                    value={filtros.status}
                                    onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                                >
                                    <option value="">Todos</option>
                                    <option value="accepted">Aprobadas</option>
                                    <option value="pending">Pendientes</option>
                                    <option value="rejected">Rechazadas</option>
                                </select>
                            </div>
                            <div className="filter-actions">
                                <button
                                    className="btn-apply-filters"
                                    onClick={aplicarFiltros}
                                >
                                    <Filter size={16} />
                                    Aplicar
                                </button>
                                <button
                                    className="btn-clear-filters"
                                    onClick={limpiarFiltros}
                                >
                                    Limpiar
                                </button>
                            </div>
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

                    {/* Panel principal - Timeline */}
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
                                        
                                    </div>
                                    <div className="report-info">
                                        <div><strong>DNI:</strong> {getClienteProp(clienteSeleccionado, 'dni')}</div>
                                        <div><strong>Cotizaciones:</strong> {timelineData.length}</div>
                                    </div>
                                </div>

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
                                            <div className="timeline-header">
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