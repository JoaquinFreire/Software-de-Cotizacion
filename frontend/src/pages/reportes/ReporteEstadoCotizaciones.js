import React, { useState, useRef, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom'; // <-- agregado
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

  // Nuevo: estado para rol actual
  const [currentRole, setCurrentRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null); // <-- ya agregado previamente

  // Estado de dirección de ordenamiento por grupo ('asc'|'desc'|null)
  const [sortDirection, setSortDirection] = useState({
    pending: null,
    approved: null,
    rejected: null,
    finished: null
  });

  // nuevos estados para lista de usuarios / selección (coordinator/manager)
  const [selectedUserId, setSelectedUserId] = useState(''); // '' = Todos

  const navigate = useNavigate();
        const handleLogout = () => {
          localStorage.removeItem("token");
          navigate("/");}

  // Fetch current user role on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Normalizamos el nombre del rol como string lower-case
        const user = res.data?.user || {};
        const roleRaw = (user?.role?.role_name ?? user?.role ?? "").toString().toLowerCase();
        const roleName = roleRaw || "";
        setCurrentRole(roleName);

        // guardar id de usuario (si viene)
        const resolvedUserId = user?.id ?? res.data?.userId ?? null;
        if (resolvedUserId) setCurrentUserId(resolvedUserId);

        // Si es coordinator o manager, cargar lista de usuarios (para seleccionar cotizador)
        const roleLower = roleName.toLowerCase();
        if (roleLower === 'manager' || roleLower === 'coordinator') {
          try {
            const usersRes = await axios.get(`${API_URL}/api/users`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            // Normalizar respuesta posible: array directo o { users: [...]} o { data: [...] }
            const raw = usersRes.data;
            let arr = [];
            if (Array.isArray(raw)) arr = raw;
            else if (raw && Array.isArray(raw.users)) arr = raw.users;
            else if (raw && Array.isArray(raw.data)) arr = raw.data;
            else arr = []; // fallback
            setSelectedUserId(''); // por defecto Todos
          } catch (uErr) {
            console.error("Error fetching users list:", uErr);
          }
        }

        // Si no es manager, ocultar por defecto todos excepto pendientes.
        if (roleName !== 'manager') {
          setMostrarPendientes(true);
          setMostrarAprobados(false);
          setMostrarRechazados(false);
          setMostrarFinalizados(false);
        } else {
          // manager ve todo por defecto
          setMostrarPendientes(true);
          setMostrarAprobados(true);
          setMostrarRechazados(true);
          setMostrarFinalizados(true);
        }
      } catch (err) {
        // si hay error, dejamos comportamiento por defecto (mostrar todo)
        console.error("Error fetching current role for report:", err);
      }
    })();
  }, []);

  const fetchData = async () => {
    if (!fechaDesde || !fechaHasta) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Determinar parámetro userId según rol y selección
      let userIdParam = '';
      if (currentRole === 'quotator' && currentUserId) {
        userIdParam = `&userId=${currentUserId}`;
      } else if ((currentRole === 'manager' || currentRole === 'coordinator') && selectedUserId) {
        // si selectedUserId es '' => todos (no param)
        userIdParam = selectedUserId ? `&userId=${selectedUserId}` : '';
      }

      const res = await axios.get(
        `${API_URL}/api/quotations/by-period?from=${fechaDesde}&to=${fechaHasta}${userIdParam}`,
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

  // Helper para obtener precio numérico
  const getPrice = (q) => {
    const v = q?.TotalPrice ?? q?.totalPrice ?? q?.Total ?? q?.price ?? 0;
    const n = Number(String(v).replace(/[^0-9.-]+/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  // Toggle de orden para un grupo
  const toggleSort = (group) => {
    setSortDirection(prev => {
      const current = prev[group];
      const next = current === 'asc' ? 'desc' : 'asc';
      return { ...prev, [group]: next };
    });
  };

  // Devuelve arreglo ordenado según la dirección para un grupo
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

  // Helper para obtener id de cotización (más robusto)
  const getQuotationId = (q) => q?.Id ?? q?.id ?? q?.IdBudget ?? null;

  return (
    <div className="dashboard-container">
      <Navigation onLogout={handleLogout} />
      <h2 className="title">Reporte de Estado de Cotizaciones</h2>
      <div className="reporte-cotizaciones-root">
        {/* Filtros y acciones arriba de todo */}
        <div className="reporte-cotizaciones-toolbar">
          <div className="reporte-cotizaciones-filtros">
            {/* ...existing controls... */}
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
              className="reporte-cotizaciones-btn-pdf"
              onClick={handleDescargarPDF}
              disabled={!generar}
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

                  {/* Gráfico - sólo para manager */}
                  {currentRole === 'manager' && (
                    <div className="reporte-cotizaciones-grafico">
                      <Pie
                        data={data}
                        options={{
                          plugins: {
                            datalabels:
                            {
                              color: '#222',
                              font: { weight: 'bold', size: 20 },
                              formatter: (value, context) => value,
                            }
                          },
                          onClick: handlePieClick
                        }}
                      />
                    </div>
                  )}

                  {/* Tabla resumen: mostrar siempre completa */}
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

                  {/* Sección de descripción y análisis - sólo manager */}
                  {currentRole === 'manager' && (
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
                  )}

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

                  {/* Detalle de cotizaciones por estado, con ordenamiento por Precio Total */}
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
                                  <th style={{ whiteSpace: 'nowrap' }}>
                                    Precio Total
                                    <button
                                      onClick={() => toggleSort('pending')}
                                      style={{ marginLeft: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14 }}
                                      title="Ordenar por precio"
                                    >
                                      {sortDirection.pending === 'asc' ? '↑' : sortDirection.pending === 'desc' ? '↓' : '↕'}
                                    </button>
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedGroup(cotizacionesPorEstado.pending, 'pending').map(q => {
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
                                      <td style={{ whiteSpace: 'nowrap' }}>${q.TotalPrice || q.totalPrice}</td>
                                    </tr>
                                  );
                                })}
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
                                  <th style={{ whiteSpace: 'nowrap' }}>
                                    Precio Total
                                    <button
                                      onClick={() => toggleSort('approved')}
                                      style={{ marginLeft: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14 }}
                                      title="Ordenar por precio"
                                    >
                                      {sortDirection.approved === 'asc' ? '↑' : sortDirection.approved === 'desc' ? '↓' : '↕'}
                                    </button>
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedGroup(cotizacionesPorEstado.approved, 'approved').map(q => {
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
                                      <td style={{ whiteSpace: 'nowrap' }}>${q.TotalPrice || q.totalPrice}</td>
                                    </tr>
                                  );
                                })}
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
                                  <th style={{ whiteSpace: 'nowrap' }}>
                                    Precio Total
                                    <button
                                      onClick={() => toggleSort('rejected')}
                                      style={{ marginLeft: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14 }}
                                      title="Ordenar por precio"
                                    >
                                      {sortDirection.rejected === 'asc' ? '↑' : sortDirection.rejected === 'desc' ? '↓' : '↕'}
                                    </button>
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedGroup(cotizacionesPorEstado.rejected, 'rejected').map(q => {
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
                                      <td style={{ whiteSpace: 'nowrap' }}>${q.TotalPrice || q.totalPrice}</td>
                                    </tr>
                                  );
                                })}
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
                                  <th style={{ whiteSpace: 'nowrap' }}>
                                    Precio Total
                                    <button
                                      onClick={() => toggleSort('finished')}
                                      style={{ marginLeft: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14 }}
                                      title="Ordenar por precio"
                                    >
                                      {sortDirection.finished === 'asc' ? '↑' : sortDirection.finished === 'desc' ? '↓' : '↕'}
                                    </button>
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedGroup(cotizacionesPorEstado.finished, 'finished').map(q => {
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
                                      <td style={{ whiteSpace: 'nowrap' }}>${q.TotalPrice || q.totalPrice}</td>
                                    </tr>
                                  );
                                })}
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
                  <svg width="18" height="18" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 4 }}>
                    <path fill="#1976d2" d="M10 2C6.686 2 4 4.686 4 8c0 4.418 5.25 9.54 5.473 9.753a1 1 0 0 0 1.054 0C10.75 17.54 16 12.418 16 8c0-3.314-2.686-6-6-6zm0 15.07C8.14 15.13 6 11.98 6 8c0-2.206 1.794-4 4-4s4 1.794 4 4c0 3.98-2.14 7.13-4 7.07z" />
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