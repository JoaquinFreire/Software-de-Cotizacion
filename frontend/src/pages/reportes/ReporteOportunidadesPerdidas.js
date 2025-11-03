import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import logoAnodal from '../../images/logo_secundario.webp';
import '../../styles/reportes.css';
import '../../styles/reporteindividual.css';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js/auto';
import ScrollToTopButton from '../../components/ScrollToTopButton';
import html2pdf from 'html2pdf.js';
import ReactLoading from 'react-loading';
import { safeArray } from '../../utils/safeArray';
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

const ReporteDeOportunidadesPerdidas = () => {
  const defaultDates = getDefaultDates();
  const [fechaDesde, setFechaDesde] = useState(defaultDates.desde);
  const [fechaHasta, setFechaHasta] = useState(defaultDates.hasta);
  const [generar, setGenerar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cotizaciones, setCotizaciones] = useState([]);
  const pdfRef = useRef();
  const navigate = useNavigate();
        const handleLogout = () => {
          localStorage.removeItem("token");
          navigate("/");}

  // nuevo estado para ordenamiento por precio
  const [priceSortDirection, setPriceSortDirection] = useState(null); // 'asc' | 'desc' | null

  const fetchData = async () => {
    if (!fechaDesde || !fechaHasta) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${API_URL}/api/Mongo/GetAllBudgets`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Normalizar la fuente de datos: soporta varias formas de respuesta
      let raw = res.data;
      let data = [];
      if (Array.isArray(raw)) data = raw;
      else if (Array.isArray(raw.budgets)) data = raw.budgets;
      else if (Array.isArray(raw.quotations)) data = raw.quotations;
      else if (Array.isArray(raw.items)) data = raw.items;
      else data = safeArray(raw);

      // Filtrar por fechas (tolerante a diferentes nombres y formatos)
      const fromDate = new Date(fechaDesde);
      const toDate = new Date(fechaHasta);
      data = data.filter(b => {
        const fechaRaw = b.creationDate ?? b.CreationDate ?? b.creation_date ?? b.Creationdate ?? b.createdAt ?? b.created_at;
        if (!fechaRaw) return false;
        const fechaObj = new Date(typeof fechaRaw === 'string' ? fechaRaw : fechaRaw);
        if (isNaN(fechaObj.getTime())) return false;
        // compare by date portion
        const f = new Date(fechaObj.toISOString().slice(0,10));
        return f >= fromDate && f <= toDate;
      });

      // Solo rechazadas (case-insensitive)
      data = data.filter(q => {
        const status = (q.status ?? q.Status ?? q.StatusName ?? '').toString().toLowerCase();
        return status === 'rejected' || status === 'rechazado';
      });

      setCotizaciones(data);
    } catch (err) {
      setCotizaciones([]);
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
      filename: `reporte_oportunidades_perdidas_${fechaDesde}_a_${fechaHasta}.pdf`,
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

  // Gráfico: cantidad por motivo de rechazo
  const motivos = {};
  cotizaciones.forEach(c => {
    const motivo = c.comment || c.Comment || c.RejectionReason || c.motivoRechazo || 'Sin especificar';
    motivos[motivo] = (motivos[motivo] || 0) + 1;
  });
  const chartDataMotivos = {
    labels: Object.keys(motivos),
    datasets: [
      {
        label: 'Cantidad de Cotizaciones Rechazadas',
        data: Object.values(motivos),
        backgroundColor: '#FF6384',
        borderColor: '#d32f2f',
        borderWidth: 1,
      }
    ]
  };

  // Agrupa cotizaciones rechazadas por mes (MM-YYYY)
  const rechazadasPorMes = {};
  cotizaciones.forEach(c => {
    let fecha = c.creationDate || c.CreationDate;
    if (fecha) {
      const [datePart] = fecha.split('T');
      const [y, m] = datePart.split('-');
      const mesAnio = `${m}-${y}`;
      rechazadasPorMes[mesAnio] = (rechazadasPorMes[mesAnio] || 0) + 1;
    } else {
      rechazadasPorMes['Sin fecha'] = (rechazadasPorMes['Sin fecha'] || 0) + 1;
    }
  });
  const chartDataMeses = {
    labels: Object.keys(rechazadasPorMes),
    datasets: [
      {
        label: 'Cotizaciones Rechazadas',
        data: Object.values(rechazadasPorMes),
        backgroundColor: '#3f9793ff',
        borderColor: '#000000ff',
        borderWidth: 1,
      }
    ]
  };

  const totalMonto = cotizaciones.reduce((sum, c) => {
    const val = Number(c.total ?? c.Total ?? c.TotalPrice ?? c.monto ?? c.amount ?? 0) || 0;
    return sum + val;
  }, 0);

  // normalizar motivo: toma la parte antes de "Validez de la cotización" u otros bloques largos
  const extractShortComment = (q) => {
    const raw =
      q.comment ||
      q.Comment ||
      q.RejectionReason ||
      q.motivoRechazo ||
      q.rejectionReason ||
      q.MotivoRechazo ||
      (q.extra && (q.extra.RejectionReason || q.extra.motivoRechazo)) ||
      (q.meta && (q.meta.comment || q.meta.Comment)) ||
      '';
    if (!raw) return 'Sin especificar';
    // separar por la frase de validez u otros encabezados largos comunes
    const separators = [
      'Validez de la cotización',
      'Validez',
      'Precio de los materiales',
      'Precio de los materiales'
    ];
    let short = raw;
    for (const sep of separators) {
      const idx = short.indexOf(sep);
      if (idx > -1) {
        short = short.slice(0, idx);
        break;
      }
    }
    short = short.trim();
    // Si contiene múltiples líneas, devolver hasta la primera línea en blanco grande (o la primera 3 líneas como fallback)
    const lines = short.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return 'Sin especificar';
    // juntar hasta 3 líneas para no perder contexto
    return lines.slice(0, 3).join(' ').trim() || 'Sin especificar';
  };

  const parseTotalNumeric = (q) => {
    const val = q.total ?? q.Total ?? q.TotalPrice ?? q.monto ?? q.amount ?? 0;
    const n = Number(String(val).replace(/[^0-9.-]+/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  const togglePriceSort = () => {
    setPriceSortDirection(prev => {
      if (prev === 'asc') return 'desc';
      if (prev === 'desc') return null;
      return 'asc';
    });
  };

  // crear array ordenado según priceSortDirection
  const cotizacionesToRender = (() => {
    if (!Array.isArray(cotizaciones)) return [];
    if (!priceSortDirection) return cotizaciones;
    const copy = [...cotizaciones];
    copy.sort((a, b) => {
      const pa = parseTotalNumeric(a);
      const pb = parseTotalNumeric(b);
      return priceSortDirection === 'asc' ? pa - pb : pb - pa;
    });
    return copy;
  })();

  return (
    <div className="dashboard-container">
      <Navigation onLogout={handleLogout} />
      <h2 className="title">Reporte de Oportunidades Perdidas</h2>
      <div className="reporte-cotizaciones-root">
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
            >
              Guardar PDF
            </button>
          </div>
        </div>
        <div className="reporte-cotizaciones-a4">
          <div className="reporte-cotizaciones-pdf" ref={pdfRef}>
            <header className="reporte-cotizaciones-header">
              <img src={logoAnodal} alt="Logo Anodal" className="reporte-cotizaciones-logo" />
              <h1 className="reporte-cotizaciones-title">Reporte de Oportunidades Perdidas</h1>
              <div className="reporte-cotizaciones-logo-placeholder" />
            </header>
            {loading && generar ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 500
              }}>
                 <ReactLoading type="spin" color="#26b7cd" height={60} width={60}/>
                <div style={{ marginTop: 24, fontSize: 18, color: '#1dc8ceff' }}>Cargando reporte...</div>
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
                  <div className="reporte-oportunidad-grafico">
                    <h2>Cotizaciones Rechazadas por Motivo</h2>
                    <Bar
                      data={chartDataMeses}
                      options={{
                        plugins: {
                          legend: { display: false },
                          title: { display: true},
                          datalabels: {
                            color: '#222',
                            font: { weight: 'bold', size: 16 },
                            anchor: 'end',
                            align: 'top',
                            formatter: (value) => value,
                          }
                        },
                        responsive: true,
                        scales: {
                          x: {
                            title: { display: true, text: 'Mes' }
                          },
                          y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 },
                            title: { display: true, text: 'Cantidad' }
                          }
                        }
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <strong>Total de cotizaciones rechazadas:</strong> {cotizaciones.length}<br />
                    <strong>Monto total rechazado:</strong> ${totalMonto.toLocaleString()}
                  </div>
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
                              onClick={togglePriceSort}
                              style={{ marginLeft: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14 }}
                              title="Ordenar por precio"
                            >
                              {priceSortDirection === 'asc' ? '↑' : priceSortDirection === 'desc' ? '↓' : '↕'}
                            </button>
                          </th>
                          <th>Motivo Rechazo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cotizaciones.length === 0 ? (
                          <tr>
                            <td colSpan={8}>No hay cotizaciones rechazadas en el período seleccionado.</td>
                          </tr>
                        ) : cotizacionesToRender.map(q => {
                          const qId = q.budgetId || q.Id || q.id || q.BudgetId || null;
                          return (
                            <tr
                              key={qId || Math.random()}
                              className={qId ? 'clickable-row' : ''}
                              onClick={() => qId && navigate(`/quotation/${qId}`)}
                              tabIndex={qId ? 0 : -1}
                              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && qId) navigate(`/quotation/${qId}`); }}
                            >
                              <td>
                                {q.customer?.name || q.Customer?.name || ''}
                                {' '}
                                {q.customer?.lastname || q.Customer?.lastname || ''}
                              </td>
                              <td>{q.customer?.tel || q.Customer?.tel || ''}</td>
                              <td>{q.customer?.mail || q.Customer?.mail || ''}</td>
                              <td>{q.customer?.address || q.Customer?.address || ''}</td>
                              <td>{q.creationDate ? formatFechaCorta(q.creationDate) : (q.CreationDate ? formatFechaCorta(q.CreationDate) : '')}</td>
                              <td>{q.lastEdit ? formatFechaCorta(q.lastEdit) : (q.LastEdit ? formatFechaCorta(q.LastEdit) : '')}</td>
                              <td style={{ whiteSpace: 'nowrap' }}>${(parseTotalNumeric(q)).toLocaleString()}</td>
                              <td>{extractShortComment(q)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </main>
              )
            )}
            <footer className="reporte-cotizaciones-footer">
              <div className="reporte-cotizaciones-direccion">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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
        <ScrollToTopButton />
      </div>
      <Footer />
    </div>
  );
};

export default ReporteDeOportunidadesPerdidas;