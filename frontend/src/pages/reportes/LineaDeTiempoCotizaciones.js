import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import "../../styles/reportes.css";
import "../../styles/reporteindividual.css";
import "../../styles/LineaDeTiempoReporte.css";
import { FileText, Users, Calendar, Filter, Download } from 'lucide-react';
import ReactLoading from 'react-loading';
import html2pdf from 'html2pdf.js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

const LineaDeTiempoCotizaciones = () => {
    const [clientes, setClientes] = useState([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [timelineData, setTimelineData] = useState([]);
    const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingClientes, setLoadingClientes] = useState(false);
    const [filtros, setFiltros] = useState({
        search: '',
        fromDate: '',
        toDate: '',
        status: ''
    });

    const pdfRef = useRef();

    useEffect(() => {
        cargarClientes();
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

    const cargarTimelineCliente = async (cliente) => {
        if (!cliente?.dni) return;

        setLoading(true);
        setClienteSeleccionado(cliente);

        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();

            if (filtros.fromDate) params.append('fromDate', filtros.fromDate);
            if (filtros.toDate) params.append('toDate', filtros.toDate);
            if (filtros.status) params.append('status', filtros.status);

            const url = `${API_URL}/api/TimeLineBudgetReport/${cliente.dni}?${params}`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = safeArray(response.data);
            setTimelineData(data);
            setCotizacionSeleccionada(data[0] || null);

            if (data.length === 0) {
                toast.info('El cliente no tiene cotizaciones registradas');
            }
        } catch (error) {
            console.error('Error al cargar timeline:', error);
            toast.error('Error al cargar el timeline del cliente');
            setTimelineData([]);
            setCotizacionSeleccionada(null);
        } finally {
            setLoading(false);
        }
    };

    const aplicarFiltros = () => {
        if (clienteSeleccionado) {
            cargarTimelineCliente(clienteSeleccionado);
        }
    };

    const limpiarFiltros = () => {
        setFiltros({
            search: '',
            fromDate: '',
            toDate: '',
            status: ''
        });
        if (clienteSeleccionado) {
            cargarTimelineCliente(clienteSeleccionado);
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
                    Línea de Tiempo de Cotizaciones
                </h2>

                <div className="timeline-layout">
                    {/* Panel lateral - Lista de clientes */}
                    <div className="timeline-sidebar">
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
                                    <option value="accepted">Aceptadas</option>
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

                        <div className="clientes-list">
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
                                        className={`cliente-item ${clienteSeleccionado?.id === cliente.id ? 'selected' : ''
                                            }`}
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
                                        <h2>Línea de Tiempo - {getClienteProp(clienteSeleccionado, 'name')} {getClienteProp(clienteSeleccionado, 'lastname')}</h2>
                                        <button
                                            className="btn-download-pdf"
                                            onClick={handleDescargarPDF}
                                        >
                                            <Download size={18} />
                                            Descargar PDF
                                        </button>
                                    </div>
                                    <div className="report-info">
                                        <div><strong>DNI:</strong> {getClienteProp(clienteSeleccionado, 'dni')}</div>
                                        <div><strong>Total de series:</strong> {timelineData.length}</div>
                                        <div><strong>Fecha de reporte:</strong> {new Date().toLocaleDateString()}</div>
                                    </div>
                                </div>

                                <div className="cotizaciones-sidebar">
                                    <h4>Series de Cotizaciones</h4>
                                    {safeArray(timelineData).map((item) => (
                                        <div
                                            key={item.BudgetId}
                                            className={`cotizacion-item ${cotizacionSeleccionada?.BudgetId === item.BudgetId ? 'selected' : ''
                                                }`}
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
                                                <h3>Serie: {cotizacionSeleccionada.BudgetId || 'N/A'}</h3>
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
                                                {safeArray(cotizacionSeleccionada.Versions).map((version, index) => (
                                                    <div key={version.Id || index} className="timeline-item">
                                                        <div className="timeline-point" style={{ backgroundColor: estadoColor(version.Status) }}>
                                                            <div className="version-number">v{version.Version || '?'}</div>
                                                        </div>
                                                        <div className="timeline-content">
                                                            <div className="version-header">
                                                                <h4>Versión {version.Version || '?'}</h4>
                                                                <div className="version-status" style={{ color: estadoColor(version.Status) }}>
                                                                    {estadoTexto(version.Status)}
                                                                </div>
                                                            </div>
                                                            <div className="version-details">
                                                                <div className="detail-row">
                                                                    <strong>Fecha:</strong>
                                                                    {version.CreationDate ? new Date(version.CreationDate).toLocaleString() : 'Fecha desconocida'}
                                                                </div>
                                                                <div className="detail-row">
                                                                    <strong>Total:</strong>
                                                                    ${(version.Total || 0)?.toFixed(2)}
                                                                </div>
                                                                {version.Comment && (
                                                                    <div className="detail-row">
                                                                        <strong>Comentario:</strong>
                                                                        <div className="comment-text">
                                                                            {version.Comment.split('Validez de la cotización')[0] || version.Comment}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {/* ✅ BOTÓN PARA VER PDF */}
                                                                <div className="detail-row">
                                                                    <strong>Acciones:</strong>
                                                                    <div className="version-actions">
                                                                        <button
                                                                            className="btn-ver-pdf"
                                                                            onClick={() => window.open(`/quotation/${version.BudgetId}`, '_blank')}
                                                                            title="Ver PDF detallado de esta cotización"
                                                                        >
                                                                            📄 Ver PDF
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : clienteSeleccionado ? (
                            <div className="no-timeline-data">
                                <FileText size={48} />
                                <h3>No hay cotizaciones</h3>
                                <p>El cliente seleccionado no tiene cotizaciones registradas.</p>
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