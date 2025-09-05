import React, { useState, useRef } from 'react';
import { Pie } from 'react-chartjs-2';
import axios from 'axios';
import 'chart.js/auto';
import logoAnodal from '../../images/logo_secundario.webp';
import '../../styles/reportes.css';
import '../../styles/reporteindividual.css';
/* import jsPDF from 'jspdf';
import html2canvas from 'html2canvas'; */
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js/auto';
import ScrollToTopButton from '../../components/ScrollToTopButton';
import html2pdf from 'html2pdf.js';
import ReactLoading from 'react-loading'; // <--- agregar import
import { safeArray } from '../../utils/safeArray'; // agrega este import
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
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

// Formato corto para detalles (dd-MM-yy)
const formatFechaCorta = (fecha) => {
  if (!fecha) return '';
  // Soporta tanto "2024-06-11" como "2024-06-11T13:00:00"
  const [datePart] = fecha.split('T');
  const [y, m, d] = datePart.split('-');
  return `${d}-${m}-${y.slice(2)}`;
};

// Utilidad para resolver referencias $ref en un array de cotizaciones
function resolveRefs(array) {
  const byId = {};
  // Indexa todos los objetos con $id
  array.forEach(obj => {
    if (obj && obj.$id) byId[obj.$id] = obj;
    // También indexa Customer y WorkPlace si tienen $id
    if (obj.Customer && obj.Customer.$id) byId[obj.Customer.$id] = obj.Customer;
    if (obj.WorkPlace && obj.WorkPlace.$id) byId[obj.WorkPlace.$id] = obj.WorkPlace;
  });
  // Reemplaza $ref por el objeto real
  function resolve(obj) {
    if (!obj || typeof obj !== "object") return obj;
    // Si es una referencia
    if (obj.$ref) return byId[obj.$ref] || {};
    // Si es un objeto normal, resuelve recursivamente sus propiedades
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
  const [counts, setCounts] = useState([0, 0, 0, 0]); // [Pendiente, Aprobado, Rechazado, Finalizado]
  const [loading, setLoading] = useState(false);
  const [cotizaciones, setCotizaciones] = useState([]);
  // switches para mostrar/ocultar cada grupo
  const [mostrarPendientes, setMostrarPendientes] = useState(true);
  const [mostrarAprobados, setMostrarAprobados] = useState(true);
  const [mostrarRechazados, setMostrarRechazados] = useState(true);
  const [mostrarFinalizados, setMostrarFinalizados] = useState(true);
  // Ref para el área a exportar como PDF
  const pdfRef = useRef();
  // refs para scroll a cada grupo
  const pendientesRef = useRef();
  const aprobadosRef = useRef();
  const rechazadosRef = useRef();
  const finalizadosRef = useRef();

  const fetchData = async () => {
    if (!fechaDesde || !fechaHasta) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${API_URL}/api/quotations/by-period?from=${fechaDesde}&to=${fechaHasta}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Normaliza y resuelve referencias
      let data = safeArray(res.data);
      data = resolveRefs(data); // <-- Resuelve $ref aquí
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
    }
    setLoading(false);
  };

  const handleGenerarReporte = () => {
    setGenerar(true);
    fetchData();
  };

  // PDF download handler
  const handleDescargarPDF = async () => {
    if (!pdfRef.current) return;
    // Oculta el botón flotante antes de exportar (opcional)
    const scrollBtn = document.querySelector('.scroll-to-top-btn');
    if (scrollBtn) scrollBtn.style.display = 'none';

    // Opciones para html2pdf.js
    const opt = {
      margin: [0.2, 0.2, 0.2, 0.2], // pulgadas
      filename: `reporte_estado_cotizaciones_${fechaDesde}_a_${fechaHasta}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Espera un pequeño delay para asegurar que todo se renderice bien
    setTimeout(() => {
      html2pdf().set(opt).from(pdfRef.current).save().then(() => {
        if (scrollBtn) scrollBtn.style.display = '';
      });
    }, 100);
  };

  // Agrupar cotizaciones por estado
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

  // Colores sólidos y bordes para mejor impresión B/N
  const data = {
    labels: ['Pendiente', 'Aprobado', 'Rechazado', 'Finalizado'],
    datasets: [{
      data: counts,
      backgroundColor: [
        '#36A2EB', // azul
        '#4BC0C0', // celeste
        '#FF6384', // rojo
        '#FFCE56'  // amarillo
      ],
      borderColor: [
        '#222', '#222', '#222', '#222'
      ],
      borderWidth: 2,
    }]
  };

  // Utilidades para resumen y observaciones
  const estadosNombres = ['Pendiente', 'Aprobado', 'Rechazado', 'Finalizado'];
  const estadoMasComunIdx = counts.indexOf(Math.max(...counts));
  const porcentajeMasComun = porcentajes[estadoMasComunIdx];
  const estadoMasComun = estadosNombres[estadoMasComunIdx];

  // Observaciones automáticas simples
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

  // Handler para click en la torta
  const handlePieClick = (evt, elements) => {
    if (!elements.length) return;
    const idx = elements[0].index;
    // Scroll al grupo correspondiente
    const refs = [pendientesRef, aprobadosRef, rechazadosRef, finalizadosRef];
    setTimeout(() => {
      if (refs[idx].current) refs[idx].current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="dashboard-container">
      <Navigation />
      <h2 className="title">Reporte de Estado de Cotizaciones</h2>
      <div className="reporte-cotizaciones-root">
        {/* Filtros y acciones arriba de todo */}
        <div className="reporte-cotizaciones-toolbar">
          <div className="reporte-cotizaciones-filtros">
            <label>
              Desde:
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </label>
            <label>
              Hasta:
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </label>
            <button className="botton-Report" onClick={handleGenerarReporte} disabled={loading || !fechaDesde || !fechaHasta}>
              {loading ? 'Cargando...' : 'Generar Reporte'}
            </button>
            <button
              className="botton-Save"
              onClick={handleDescargarPDF}
              disabled={!generar}
            /*  onClick={() => window.print()}
            disabled={!generar} */
            >
              Guardar PDF
            </button>
          </div>
        </div>

        {/* Simulación de hoja A4 */}
        <div className="reporte-cotizaciones-a4">
          <div className="reporte-cotizaciones-pdf" ref={pdfRef}>
            {/* Encabezado */}
            <header className="reporte-cotizaciones-header">
              <img src={logoAnodal} alt="Logo Anodal" className="reporte-cotizaciones-logo" />
              <h1 className="reporte-cotizaciones-title">Reporte de Estado de Cotizaciones</h1>
              <div className="reporte-cotizaciones-logo-placeholder" />
            </header>

            {/* Reporte */}
            {loading && generar ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 500
              }}>
                <ReactLoading type="spin" color="#1976d2" height={80} width={80} />
                <div style={{ marginTop: 24, fontSize: 18, color: '#1976d2' }}>Cargando reporte...</div>
              </div>
            ) : !generar ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 500,
                color: '#888',
                fontSize: 20
              }}>
                <span>El reporte aún no fue generado.</span>
                <span style={{ fontSize: 16, marginTop: 8 }}>Seleccione un rango de fechas y presione <b>Generar Reporte</b>.</span>
              </div>
            ) : (
              generar && !loading && (
                <main className="reporte-cotizaciones-main">
                  {/* Info superior */}
                  <div className="reporte-cotizaciones-info">
                    <div>
                      <strong>Período:</strong> {formatFecha(fechaDesde) || '____'} al {formatFecha(fechaHasta) || '____'}
                    </div>
                    <div>
                      <strong>Destinatario:</strong> {window.localStorage.getItem('usuario') || 'Usuario'}
                    </div>
                    <div>
                      <strong>Fecha y Hora:</strong> {new Date().toLocaleString()}
                    </div>
                  </div>

                  {/* Gráfico */}
                  <div className="reporte-cotizaciones-grafico">
                    <Pie
                      data={data}
                      options={{
                        plugins: {
                          datalabels: {
                            color: '#222',
                            font: { weight: 'bold', size: 20 },
                            formatter: (value, context) => value,
                          }
                        },
                        onClick: handlePieClick
                      }}
                    />
                  </div>

                  {/* Tabla */}
                  <table className="reporte-cotizaciones-tabla tablachild">
                    <thead>
                      <tr>
                        <th>Parámetro</th>
                        <th>Cantidad</th>
                        <th>Porcentaje</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Pendiente</td>
                        <td>{counts[0]}</td>
                        <td>{porcentajes[0]}</td>
                      </tr>
                      <tr>
                        <td>Aprobado</td>
                        <td>{counts[1]}</td>
                        <td>{porcentajes[1]}</td>
                      </tr>
                      <tr>
                        <td>Rechazado</td>
                        <td>{counts[2]}</td>
                        <td>{porcentajes[2]}</td>
                      </tr>
                      <tr>
                        <td>Finalizado</td>
                        <td>{counts[3]}</td>
                        <td>{porcentajes[3]}</td>
                      </tr>
                      <tr>
                        <td><strong>Total</strong></td>
                        <td><strong>{total}</strong></td>
                        <td><strong>100%</strong></td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Sección de descripción y análisis */}
                  <section className="reporte-cotizaciones-analisis">
                    <div className="reporte-cotizaciones-analisis-bloque">
                      <strong>Tipo de Gráfico:</strong> Gráfico de torta que muestra la proporción de cotizaciones en diferentes estados.
                    </div>
                    <div className="reporte-cotizaciones-analisis-bloque">
                      <strong>Descripción del Gráfico:</strong> Este gráfico ofrece una visualización rápida de la proporción de cotizaciones en cada estado, permitiendo identificar cuántas cotizaciones están aprobadas, cuántas rechazadas y cuántas permanecen pendientes o finalizadas.
                    </div>
                    <div className="reporte-cotizaciones-analisis-bloque">
                      <strong>Tabla de Resumen:</strong>
                      <ul>
                        <li><strong>Encabezados de la Tabla:</strong>
                          <ul>
                            <li>Parámetro: Describe cada estado de cotización (Pendiente, Aprobado, Rechazado, Finalizado, Total).</li>
                            <li>Cantidad: Total de cotizaciones en cada estado específico.</li>
                            <li>Porcentaje: Proporción de cada estado en relación al total de cotizaciones.</li>
                          </ul>
                        </li>
                        <li><strong>Contenido de la Tabla:</strong>
                          <ul>
                            <li>Pendiente: {counts[0]} cotizaciones. {porcentajes[0]} del total.</li>
                            <li>Aprobado: {counts[1]} cotizaciones. {porcentajes[1]} del total.</li>
                            <li>Rechazado: {counts[2]} cotizaciones. {porcentajes[2]} del total.</li>
                            <li>Finalizado: {counts[3]} cotizaciones. {porcentajes[3]} del total.</li>
                            <li>Total: {total} cotizaciones, 100% del total.</li>
                          </ul>
                        </li>
                      </ul>
                    </div>
                    <div className="reporte-cotizaciones-analisis-bloque">
                      <strong>Resultados Generales:</strong><br />
                      {total > 0
                        ? <>Durante el período evaluado, el <strong>{porcentajeMasComun}</strong> de las cotizaciones se encuentran en estado <strong>{estadoMasComun}</strong>.</>
                        : <>No hay datos para mostrar resultados generales.</>
                      }
                    </div>
                    <div className="reporte-cotizaciones-analisis-bloque">
                      <strong>Observaciones:</strong>
                      <div>{observacion}</div>
                      <strong>Recomendaciones:</strong>
                      <div>{recomendacion}</div>
                    </div>
                  </section>

                  {/* Switches para mostrar/ocultar grupos */}
                  <section style={{ margin: '30px 0 10px 0', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                    <label>
                      <input type="checkbox" checked={mostrarPendientes} onChange={e => setMostrarPendientes(e.target.checked)} />
                      Mostrar Pendientes
                    </label>
                    <label>
                      <input type="checkbox" checked={mostrarAprobados} onChange={e => setMostrarAprobados(e.target.checked)} />
                      Mostrar Aprobados
                    </label>
                    <label>
                      <input type="checkbox" checked={mostrarRechazados} onChange={e => setMostrarRechazados(e.target.checked)} />
                      Mostrar Rechazados
                    </label>
                    <label>
                      <input type="checkbox" checked={mostrarFinalizados} onChange={e => setMostrarFinalizados(e.target.checked)} />
                      Mostrar Finalizados
                    </label>
                  </section>

                  {/* Detalle de cotizaciones por estado, siempre visible, dentro del PDF */}
                  <section style={{ marginTop: 10 }}>
                    {mostrarPendientes && (
                      <>
                        <h2 className='estadosreporte' ref={pendientesRef} style={{ marginBottom: 10, color: '#1976d2' }}>Pendientes</h2>
                        {cotizacionesPorEstado.pending.length === 0 ? (
                          <div>No hay cotizaciones pendientes.</div>
                        ) : (
                          <div className="tabla-cotizaciones-responsive">
                            <table className="reporte-cotizaciones-tabla tabla-ajustada">
                              <thead>
                                <tr>
                                  <th>Cliente</th>
                                  <th>Teléfono</th>
                                  <th>Email</th>
                                  <th>Dirección</th>
                                  <th>Fecha Creación</th>
                                  <th>Última Edición</th>
                                  <th>Precio Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cotizacionesPorEstado.pending.map(q => (
                                  <tr key={q.Id || q.id}>
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
                                    <td style={{ whiteSpace: 'nowrap' }}>${q.TotalPrice || q.totalPrice}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    )}
                    {mostrarAprobados && (
                      <>
                        <h2 className='estadosreporte' ref={aprobadosRef} style={{ marginBottom: 10, color: '#388e3c' }}>Aprobados</h2>
                        {cotizacionesPorEstado.approved.length === 0 ? (
                          <div>No hay cotizaciones aprobadas.</div>
                        ) : (
                          <div className="tabla-cotizaciones-responsive">
                            <table className="reporte-cotizaciones-tabla tabla-ajustada">
                              <thead>
                                <tr>
                                  <th>Cliente</th>
                                  <th>Teléfono</th>
                                  <th>Email</th>
                                  <th>Dirección</th>
                                  <th>Fecha Creación</th>
                                  <th>Última Edición</th>
                                  <th>Precio Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cotizacionesPorEstado.approved.map(q => (
                                  <tr key={q.Id || q.id}>
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
                                    <td style={{ whiteSpace: 'nowrap' }}>${q.TotalPrice || q.totalPrice}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    )}
                    {mostrarRechazados && (
                      <>
                        <h2 className='estadosreporte' ref={rechazadosRef} style={{ marginBottom: 10, color: '#d32f2f' }}>Rechazados</h2>
                        {cotizacionesPorEstado.rejected.length === 0 ? (
                          <div>No hay cotizaciones rechazadas.</div>
                        ) : (
                          <div className="tabla-cotizaciones-responsive">
                            <table className="reporte-cotizaciones-tabla tabla-ajustada">
                              <thead>
                                <tr>
                                  <th>Cliente</th>
                                  <th>Teléfono</th>
                                  <th>Email</th>
                                  <th>Dirección</th>
                                  <th>Fecha Creación</th>
                                  <th>Última Edición</th>
                                  <th>Precio Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cotizacionesPorEstado.rejected.map(q => (
                                  <tr key={q.Id || q.id}>
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
                                    <td style={{ whiteSpace: 'nowrap' }}>${q.TotalPrice || q.totalPrice}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    )}
                    {mostrarFinalizados && (
                      <>
                        <h2 className='estadosreporte' ref={finalizadosRef} style={{ marginBottom: 10, color: '#fbc02d' }}>Finalizados</h2>
                        {cotizacionesPorEstado.finished.length === 0 ? (
                          <div>No hay cotizaciones finalizadas.</div>
                        ) : (
                          <div className="tabla-cotizaciones-responsive">
                            <table className="reporte-cotizaciones-tabla tabla-ajustada">
                              <thead>
                                <tr>
                                  <th>Cliente</th>
                                  <th>Teléfono</th>
                                  <th>Email</th>
                                  <th>Dirección</th>
                                  <th>Fecha Creación</th>
                                  <th>Última Edición</th>
                                  <th>Precio Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cotizacionesPorEstado.finished.map(q => (
                                  <tr key={q.Id || q.id}>
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
                                    <td style={{ whiteSpace: 'nowrap' }}>${q.TotalPrice || q.totalPrice}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    )}
                  </section>
                </main>
              )
            )}

            {/* Pie de página */}
            <footer className="reporte-cotizaciones-footer">
              <div className="reporte-cotizaciones-direccion">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {/* SVG de ubicación */}
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="#1976d2" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 4 }}>
                    <path d="M10 2C6.686 2 4 4.686 4 8c0 4.418 5.25 9.54 5.473 9.753a1 1 0 0 0 1.054 0C10.75 17.54 16 12.418 16 8c0-3.314-2.686-6-6-6zm0 15.07C8.14 15.13 6 11.98 6 8c0-2.206 1.794-4 4-4s4 1.794 4 4c0 3.98-2.14 7.13-4 7.07z" />
                    <circle cx="10" cy="8" r="2" fill="#1976d2" />
                  </svg>
                  Avenida Japón 1292 / Córdoba / Argentina
                </span>
                <br />
                Solo para uso interno de la empresa Anodal S.A.
              </div>
              <img src={logoAnodal} alt="Logo Anodal" className="reporte-cotizaciones-footer-logo" />
            </footer>
          </div>
        </div>
        {/* Botón flotante para ir arriba */}
        <ScrollToTopButton />
      </div>
      <Footer />
    </div>
  );
};

export default ReporteEstadoCotizaciones;