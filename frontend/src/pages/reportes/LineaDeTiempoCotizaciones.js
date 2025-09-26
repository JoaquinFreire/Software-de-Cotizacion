import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
    VerticalTimeline,
    VerticalTimelineElement
} from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import html2pdf from 'html2pdf.js';
import ReactLoading from 'react-loading';
import logoAnodal from '../../images/logo_secundario.webp';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import '../../styles/reportes.css';
import '../../styles/reporteindividual.css';
import '../../styles/LineaDeTiempoReporte.css';

const API_URL = process.env.REACT_APP_API_URL;

const estadoColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'accepted': return '#4caf50'; // verde
        case 'rejected': return '#f44336'; // rojo
        case 'pending': return '#9e9e9e'; // gris
        default: return '#9e9e9e';
    }
};

const getComentarioImportante = (comment) => {
    if (!comment) return '-';
    const splitIndex = comment.indexOf('Validez de la cotización');
    return splitIndex > 0 ? comment.substring(0, splitIndex).trim() : comment.trim();
};

const LineaDeTiempoCotizaciones = () => {
    const [budgetId, setBudgetId] = useState('');
    const [reporte, setReporte] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generar, setGenerar] = useState(false);
    const pdfRef = useRef();

    const fetchReporte = async () => {
        if (!budgetId) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/TimeLineBudgetReport/${budgetId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const versions = res.data.Versions?.$values ?? res.data.versions ?? [];

            setReporte({
                budgetId: res.data.BudgetId ?? res.data.budgetId,
                customerName: versions[0]?.Customer?.name ?? '-',
                customerLastname: versions[0]?.Customer?.lastname ?? '-',
                versions: versions.map(v => ({
                    version: v.Version ?? v.version,
                    creationDate: v.CreationDate ?? v.creationDate,
                    status: v.Status ?? v.status,
                    user: v.User ?? v.user,
                    customer: v.Customer ?? v.customer,
                    agent: v.Agent ?? v.agent,
                    total: v.Total ?? v.total,
                    comment: v.Comment ?? v.comment,
                }))
            });

            setGenerar(true);
        } catch (err) {
            console.error('Error al obtener reporte:', err);
            setReporte(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDescargarPDF = () => {
        if (!pdfRef.current) return;
        const opt = {
            margin: [0.2, 0.2, 0.2, 0.2],
            filename: `linea_tiempo_${budgetId}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        setTimeout(() => {
            html2pdf().set(opt).from(pdfRef.current).save();
        }, 100);
    };

    return (
        <div className="dashboard-container">
            <Navigation />
            <h2 className="title">Línea de Tiempo de Cotizaciones</h2>

            <div className="reporte-cotizaciones-root">
                <div className="reporte-cotizaciones-toolbar">
                    <div className="reporte-cotizaciones-filtros">
                        <label>
                            Budget ID:
                            <input
                                type="text"
                                value={budgetId}
                                onChange={e => setBudgetId(e.target.value)}
                                placeholder="Ingrese ID de cotización"
                            />
                        </label>
                        <button
                            className="botton-Report"
                            onClick={fetchReporte}
                            disabled={loading || !budgetId}
                        >
                            {loading ? 'Cargando...' : 'Generar Reporte'}
                        </button>
                        <button
                            className="botton-Save"
                            onClick={handleDescargarPDF}
                            disabled={!generar || !reporte}
                        >
                            Guardar PDF
                        </button>
                    </div>
                </div>

                <div className="reporte-cotizaciones-a4" ref={pdfRef}>
                    <header className="reporte-cotizaciones-header">
                        <img src={logoAnodal} alt="Logo Anodal" className="reporte-cotizaciones-logo" />
                        <h1 className="reporte-cotizaciones-title">
                            Reporte Línea de Tiempo - Cotización {reporte?.budgetId}
                        </h1>
                        <div className="reporte-cotizaciones-logo-placeholder" />
                    </header>

                    {loading ? (
                        <div className="reporte-cotizaciones-loading">
                            <ReactLoading type="spin" color="#1976d2" height={80} width={80} />
                            <div style={{ marginTop: 24, fontSize: 18, color: '#1976d2' }}>
                                Cargando reporte...
                            </div>
                        </div>
                    ) : reporte ? (
                        <div className="timeline-wrapper">
                            {/* Recuadro superior con datos generales */}
                            <div className="timeline-header-box">
                                <div><strong>Budget ID:</strong> {reporte.budgetId}</div>
                                <div><strong>Fecha y Hora:</strong> {new Date().toLocaleString()}</div>
                                <div><strong>Total de versiones:</strong> {reporte.versions.length}</div>
                            </div>

                            <VerticalTimeline layout="1-column-left">
                                {reporte.versions.map((v, idx) => (
                                    <VerticalTimelineElement
                                        key={idx}
                                        contentStyle={{
                                            background: '#f5f5f5',
                                            border: '1px solid #ccc',
                                            borderRadius: '8px',
                                            padding: '15px',
                                            color: '#000'
                                        }}
                                        contentArrowStyle={{ borderRight: '7px solid  #f5f5f5' }}
                                        date={new Date(v.creationDate).toLocaleDateString()}
                                        iconStyle={{
                                            background: estadoColor(v.status),
                                            color: '#fff',
                                            border: '2px solid #fff'
                                        }}
                                    >
                                        <h3>Versión {v.version}</h3>
                                        <p><strong>Estado:</strong> {v.status}</p>
                                        <p><strong>Usuario:</strong> {v.user}</p>
                                        <p><strong>Agente:</strong> {v.agent}</p>
                                        <p><strong>Total:</strong> ${v.total?.toFixed(2)}</p>
                                        <p><strong>Comentario:</strong> {getComentarioImportante(v.comment)}</p>
                                    </VerticalTimelineElement>
                                ))}
                            </VerticalTimeline>
                        </div>
                    ) : (
                        <div className="reporte-cotizaciones-loading">
                            <span>No hay datos cargados.</span>
                            <span style={{ fontSize: 16, marginTop: 8 }}>
                                Ingrese un <b>Budget ID</b> y presione <b>Generar Reporte</b>.
                            </span>
                        </div>
                    )}

                    <footer className="reporte-cotizaciones-footer">
                        <div className="reporte-cotizaciones-direccion">
                            Avenida Japón 1292 / Córdoba / Argentina <br />
                            Solo para uso interno de la empresa Anodal S.A.
                        </div>
                        <img src={logoAnodal} alt="Logo Anodal" className="reporte-cotizaciones-footer-logo" />
                    </footer>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default LineaDeTiempoCotizaciones;
