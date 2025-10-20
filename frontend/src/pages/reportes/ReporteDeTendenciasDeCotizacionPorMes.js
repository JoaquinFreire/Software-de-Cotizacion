import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import html2pdf from 'html2pdf.js';
import ReactLoading from 'react-loading';
import logoAnodal from '../../images/logo_secundario.webp';
import '../../styles/reportes.css';
import '../../styles/reporteindividual.css';
import { safeArray } from '../../utils/safeArray';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const API_URL = process.env.REACT_APP_API_URL;
const monthsShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function resolveRefs(array) {
  const byId = {};
  array.forEach(obj => {
    if (obj && obj.$id) byId[obj.$id] = obj;
    if (obj?.Customer && obj.Customer.$id) byId[obj.Customer.$id] = obj.Customer;
    if (obj?.WorkPlace && obj.WorkPlace.$id) byId[obj.WorkPlace.$id] = obj.WorkPlace;
  });
  function resolve(obj) {
    if (!obj || typeof obj !== "object") return obj;
    if (obj.$ref) return byId[obj.$ref] || {};
    const out = Array.isArray(obj) ? [] : {};
    for (const k in obj) out[k] = resolve(obj[k]);
    return out;
  }
  return array.map(resolve);
}

const getDefaultMonths = () => {
  const year = new Date().getFullYear();
  return { desde: `${year}-01`, hasta: `${year}-12` };
};

const formatFechaCorta = (fecha) => {
  if (!fecha) return '';
  const [datePart] = fecha.split('T');
  const [y, m, d] = datePart.split('-');
  return `${d}-${m}-${y.slice(2)}`;
};

const parseMonthValueToDate = (monthValue) => {
  if (!monthValue) return null;
  const [y, m] = monthValue.split('-').map(Number);
  return new Date(y, (m || 1) - 1, 1);
};
const lastDayOfMonth = (year, monthOneBased) => new Date(year, monthOneBased, 0).getDate();
const addMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1);

const formatYYYYMM = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const ReporteDeTendenciasDeCotizacionPorMes = () => {
  const defaultMonths = getDefaultMonths();
  const [fechaDesde, setFechaDesde] = useState(defaultMonths.desde);
  const [fechaHasta, setFechaHasta] = useState(defaultMonths.hasta);
  const [generar, setGenerar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [metric, setMetric] = useState('count');
  const [tableData, setTableData] = useState([]); // primary table with monthKey, count, total, avg
  const [cotizaciones, setCotizaciones] = useState([]);
  const [openMonths, setOpenMonths] = useState({});
  const [compareDesde, setCompareDesde] = useState('');
  const [compareHasta, setCompareHasta] = useState('');
  const [compareTableData, setCompareTableData] = useState([]);
  const [compareTotals, setCompareTotals] = useState({ count: 0, total: 0 }); // resumen simple

  // Nuevo estado: cotizaciones crudas del periodo comparado
  const [compareCotizaciones, setCompareCotizaciones] = useState([]); // <-- nuevo
  const [openCompareMonths, setOpenCompareMonths] = useState({}); // <-- nuevo

  const pdfRef = useRef();
  const navigate = useNavigate(); // <-- nuevo

  const invalidRange = (() => {
    const d = parseMonthValueToDate(fechaDesde);
    const h = parseMonthValueToDate(fechaHasta);
    if (!d || !h) return true;
    return d.getFullYear() > h.getFullYear() || (d.getFullYear() === h.getFullYear() && d.getMonth() > h.getMonth());
  })();

  const fetchAndAggregate = async () => {
    if (!fechaDesde || !fechaHasta) return [];
    if (invalidRange) {
      alert('Rango inválido: El mes Desde no puede ser posterior al mes Hasta.');
      return [];
    }
    setLoading(true);
    try {
      const [yDesde, mDesde] = fechaDesde.split('-').map(Number);
      const [yHasta, mHasta] = fechaHasta.split('-').map(Number);
      const fromStr = `${yDesde}-${String(mDesde).padStart(2,'0')}-01`;
      const toLast = lastDayOfMonth(yHasta, mHasta);
      const toStr = `${yHasta}-${String(mHasta).padStart(2,'0')}-${String(toLast).padStart(2,'0')}`;

      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/quotations/by-period?from=${fromStr}&to=${toStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let data = safeArray(res.data);
      data = resolveRefs(data);
      setCotizaciones(data);

      const buckets = {};
      data.forEach(q => {
        const dateStr = q.CreationDate || q.creationDate || q.Creation || null;
        const d = dateStr ? new Date(dateStr) : null;
        if (!d || isNaN(d)) return;
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        if (!buckets[key]) buckets[key] = { count: 0, total: 0 };
        buckets[key].count += 1;
        const v = q?.TotalPrice ?? q?.totalPrice ?? q?.Total ?? q?.price ?? 0;
        const n = Number(String(v).replace(/[^0-9.-]+/g, '')) || 0;
        buckets[key].total += n;
      });

      const desdeD = parseMonthValueToDate(fechaDesde);
      const hastaD = parseMonthValueToDate(fechaHasta);
      const months = [];
      for (let cur = new Date(desdeD); cur <= hastaD; cur = addMonth(cur)) months.push(new Date(cur));

      const table = months.map((d, idx) => {
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const count = buckets[key]?.count ?? 0;
        const total = buckets[key]?.total ?? 0;
        const avg = count ? (total / count) : 0;
        const prevKey = idx > 0 ? `${months[idx-1].getFullYear()}-${String(months[idx-1].getMonth()+1).padStart(2,'0')}` : null;
        const prev = prevKey ? (buckets[prevKey]?.count ?? 0) : null;
        const variation = prev === null ? null : (prev === 0 ? (count === 0 ? 0 : 100) : ((count - prev) / prev) * 100);
        return { monthKey: key, monthLabel: `${monthsShort[d.getMonth()]} ${d.getFullYear()}`, year: d.getFullYear(), monthNum: d.getMonth()+1, count, total, avg, variationPct: variation };
      });

      setTableData(table);
      return table;
    } catch (err) {
      console.error("Error generando reporte de tendencias:", err);
      setTableData([]);
      setCotizaciones([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchAndAggregateCompare = async () => {
    if (!compareDesde || !compareHasta) return [];
    // validate range
    const d = parseMonthValueToDate(compareDesde);
    const h = parseMonthValueToDate(compareHasta);
    if (!d || !h || d > h) {
      alert('Rango de comparación inválido');
      return [];
    }
    setLoading(true);
    try {
      const [yDesde, mDesde] = compareDesde.split('-').map(Number);
      const [yHasta, mHasta] = compareHasta.split('-').map(Number);
      const fromStr = `${yDesde}-${String(mDesde).padStart(2,'0')}-01`;
      const last = lastDayOfMonth(yHasta, mHasta);
      const toStr = `${yHasta}-${String(mHasta).padStart(2,'0')}-${String(last).padStart(2,'0')}`;
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/quotations/by-period?from=${fromStr}&to=${toStr}`,
        { headers: { Authorization: `Bearer ${token}` } });
      let data = safeArray(res.data);
      data = resolveRefs(data);

      // Guardar cotizaciones crudas del periodo comparado
      setCompareCotizaciones(data); // <-- nuevo

      // Agrupar por meses dentro del periodo seleccionado
      const buckets = {};
      data.forEach(q => {
        const dateStr = q.CreationDate || q.creationDate || q.Creation || null;
        const dt = dateStr ? new Date(dateStr) : null;
        if (!dt || isNaN(dt)) return;
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
        if (!buckets[key]) buckets[key] = { count: 0, total: 0 };
        buckets[key].count += 1;
        const v = q?.TotalPrice ?? q?.totalPrice ?? q?.Total ?? q?.price ?? 0;
        const n = Number(String(v).replace(/[^0-9.-]+/g, '')) || 0;
        buckets[key].total += n;
      });

      const desdeD = parseMonthValueToDate(compareDesde);
      const hastaD = parseMonthValueToDate(compareHasta);
      const months = [];
      for (let cur = new Date(desdeD); cur <= hastaD; cur = addMonth(cur)) months.push(new Date(cur));

      const table = months.map((d, idx) => {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const count = buckets[key]?.count ?? 0;
        const total = buckets[key]?.total ?? 0;
        const avg = count ? (total / count) : 0;
        return { monthKey: key, monthLabel: `${monthsShort[d.getMonth()]} ${d.getFullYear()}`, count, total, avg };
      });

      // Guardar la tabla comparativa (las series se generan dinámicamente desde compareTableData)
      setCompareTableData(table);
      // resumen simple totals
      const totalCount = table.reduce((s, x) => s + x.count, 0);
      const totalAmount = table.reduce((s, x) => s + x.total, 0);
      setCompareTotals({ count: totalCount, total: totalAmount });
    } catch (err) {
      // limpiar estado de comparación en caso de error
      setCompareTableData([]);
      setCompareTotals({ count: 0, total: 0 });
      setCompareCotizaciones([]); // <-- limpiar en caso de error
      console.error("Error generando periodo de comparación:", err);
    } finally {
      setLoading(false);
    }
  };

  // Al generar el principal, autocompletar compareDesde/compareHasta con periodo anterior de la misma longitud
  const handleGenerar = async () => {
    setGenerar(true);
    const mainTable = await fetchAndAggregate();
    if (!mainTable || mainTable.length === 0) return;
    const monthsCount = mainTable.length;
    const desdeDate = parseMonthValueToDate(fechaDesde);
    const compareHastaDate = new Date(desdeDate.getFullYear(), desdeDate.getMonth() - 1, 1);
    const compareHastaVal = formatYYYYMM(compareHastaDate);
    const compareDesdeDate = new Date(compareHastaDate.getFullYear(), compareHastaDate.getMonth() - (monthsCount - 1), 1);
    const compareDesdeVal = formatYYYYMM(compareDesdeDate);
    setCompareDesde(compareDesdeVal);
    setCompareHasta(compareHastaVal);
    // not auto-running comparison; user must press "Generar Comparación"
  };

  const handleImprimir = () => window.print();

  const handleDescargarPDF = async () => {
    if (!pdfRef.current) return;
    const el = pdfRef.current;
    document.body.classList.add('pdf-exporting');
    const prevStyle = { width: el.style.width, boxShadow: el.style.boxShadow, borderRadius: el.style.borderRadius, overflow: el.style.overflow };
    el.style.boxShadow = 'none'; el.style.borderRadius = '0'; el.style.overflow = 'visible';
    try {
      const width = el.scrollWidth, height = el.scrollHeight;
      const opt = {
        margin: [0.2,0.2,0.2,0.2],
        filename: `reporte_tendencias_${fechaDesde}_a_${fechaHasta}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, width, height, scrollY: -window.scrollY },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css','legacy'] }
      };
      await new Promise(r => setTimeout(r, 120));
      await html2pdf().set(opt).from(el).save();
    } catch (err) {
      console.error("Error exportando PDF:", err);
    } finally {
      el.style.width = prevStyle.width; el.style.boxShadow = prevStyle.boxShadow; el.style.borderRadius = prevStyle.borderRadius; el.style.overflow = prevStyle.overflow;
      document.body.classList.remove('pdf-exporting');
    }
  };

  // Crear unión cronológica de monthKeys y mapear ambas series (valores faltantes => 0)
  const unionKeys = React.useMemo(() => {
    const s = new Set();
    tableData.forEach(t => s.add(t.monthKey));
    compareTableData.forEach(t => s.add(t.monthKey));
    return Array.from(s).sort();
  }, [tableData, compareTableData]);

  const unionLabels = unionKeys.map(k => {
    const [y, m] = k.split('-').map(Number);
    return `${monthsShort[m-1]} ${y}`;
  });

  const mapFromTable = (tbl) => {
    const m = {};
    tbl.forEach(r => { m[r.monthKey] = metric === 'count' ? r.count : metric === 'total' ? Math.round(r.total) : Math.round(r.avg); });
    return m;
  };

  const primaryMap = React.useMemo(() => mapFromTable(tableData), [tableData, metric]);
  const compareMap = React.useMemo(() => mapFromTable(compareTableData), [compareTableData, metric]);

  const primarySeries = unionKeys.map(k => primaryMap[k] ?? 0);
  const compareSeries = unionKeys.map(k => compareMap[k] ?? 0);

  const chartData = {
    labels: unionLabels,
    datasets: [
      {
        label: metric === 'count' ? 'Periodo seleccionado (cantidad)' : metric === 'total' ? 'Periodo seleccionado (total $)' : 'Periodo seleccionado (promedio $)',
        data: primarySeries,
        backgroundColor: '#36A2EB',
        borderColor: '#1976d2',
        borderWidth: 1,
        tension: 0.2,
      },
      ...(compareTableData && compareTableData.length ? [{
        label: metric === 'count' ? 'Periodo comparación (cantidad)' : metric === 'total' ? 'Periodo comparación (total $)' : 'Periodo comparación (promedio $)',
        data: compareSeries,
        backgroundColor: 'rgba(220,53,69,0.5)',
        borderColor: '#d32f2f',
        borderWidth: 1,
        tension: 0.2,
      }] : [])
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: true, position: 'top' }, tooltip: {
      callbacks: {
        label: (ctx) => {
          const val = ctx.raw ?? ctx.parsed?.y ?? 0;
          if (metric === 'count') return `${ctx.dataset.label}: ${val} cot.`;
          return `${ctx.dataset.label}: $${Number(val).toLocaleString()}`;
        }
      }
    } }
  };

  // Agrupar cotizaciones por monthKey "YYYY-MM" para el periodo principal (ya existe)
  const cotizacionesPorMes = React.useMemo(() => {
    const map = {};
    cotizaciones.forEach(q => {
      const dateStr = q.CreationDate || q.creationDate || q.Creation || null;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(q);
    });
    return map;
  }, [cotizaciones]);

  // Nuevo: agrupar cotizaciones del periodo comparado
  const compareCotizacionesPorMes = React.useMemo(() => {
    const map = {};
    compareCotizaciones.forEach(q => {
      const dateStr = q.CreationDate || q.creationDate || q.Creation || null;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(q);
    });
    return map;
  }, [compareCotizaciones]);

  // Nuevo: toggle para meses del periodo principal (evita error toggleMonth not defined)
  const toggleMonth = (key) => {
    setOpenMonths(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper para obtener id de cotización (más robusto)
  const getQuotationId = (q) => q?.Id ?? q?.id ?? q?.IdBudget ?? null;

  // Nuevo: toggle para meses del periodo comparado
  const toggleCompareMonth = (key) => {
    setOpenCompareMonths(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="dashboard-container beneficio-report">
      <Navigation />
      <h2 className="title">Reporte de Tendencias de Cotizaciones por Mes</h2>
      <div className="reporte-cotizaciones-root">
        <div className="reporte-cotizaciones-toolbar">
          <div className="reporte-cotizaciones-filtros">
            <label>
              Desde (mes):
              <input type="month" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
            </label>
            <label>
              Hasta (mes):
              <input type="month" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
            </label>
            <label>
              Métrica:
              <select className="reporte-cotizaciones-select" value={metric} onChange={e => setMetric(e.target.value)}>
                <option value="count">Cantidad</option>
                <option value="total">Monto total</option>
                <option value="avg">Promedio</option>
              </select>
            </label>

            <div className="report-actions">
              <button className="botton-Report" onClick={handleGenerar} disabled={loading || !fechaDesde || !fechaHasta || invalidRange}>
                {loading ? 'Cargando...' : 'Generar Reporte'}
              </button>

              <button className="reporte-cotizaciones-btn-pdf" onClick={handleDescargarPDF} disabled={!generar || loading}>
                Guardar PDF
              </button>

              <button className="botton-Report reporte-cotizaciones-btn-print" onClick={handleImprimir} disabled={!generar}>
                Imprimir
              </button>
            </div>
          </div>
        </div>

        <div className="reporte-cotizaciones-a4">
          <div className="reporte-cotizaciones-pdf" ref={pdfRef}>
            <header className="reporte-cotizaciones-header">
              <img src={logoAnodal} alt="Logo" className="reporte-cotizaciones-logo" />
              <h1 className="reporte-cotizaciones-title">Tendencias por Mes</h1>
              <div className="reporte-cotizaciones-logo-placeholder" />
            </header>

            {loading && generar ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:300 }}>
                <ReactLoading type="spin" color="#1976d2" height={60} width={60} />
                <div style={{ marginTop: 12 }}>Generando reporte...</div>
              </div>
            ) : !generar ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:300, color:'#888' }}>
                <span>El reporte aún no fue generado.</span>
                <span style={{ fontSize: 14, marginTop:8 }}>Seleccione un rango de meses y presione <b>Generar Reporte</b>.</span>
              </div>
            ) : (
              <main className="reporte-cotizaciones-main">
                <div className="reporte-cotizaciones-info" style={{ width:'90%' }}>
                  <div><strong>Período:</strong> {formatYYYYMM(parseMonthValueToDate(fechaDesde))} → {formatYYYYMM(parseMonthValueToDate(fechaHasta))}</div>
                  <div><strong>Métrica:</strong> {metric === 'count' ? 'Cantidad' : metric === 'total' ? 'Monto total' : 'Promedio'}</div>
                  <div><strong>Generado:</strong> {new Date().toLocaleString()}</div>
                </div>

                <section className="reporte-cotizaciones-analisis" style={{ width:'90%' }}>
                  <div><strong>Interpretación automática:</strong></div>
                  <div>
                    {tableData.length === 0 ? 'No hay datos para el período seleccionado.' :
                      `Se muestran ${tableData.reduce((s,x)=>s+x.count,0)} cotizaciones en el período seleccionado.`}
                  </div>
                </section>

                {/* Tabla resumen mensual */}
                <table className="reporte-cotizaciones-tabla tabla-ajustada" style={{ width:'90%', marginBottom: 24 }}>
                  <thead>
                    <tr>
                      <th>Mes</th>
                      <th>Cotizaciones</th>
                      <th>Promedio</th>
                      <th>Total cotizado</th>
                      <th>Variación vs mes anterior</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map(row => (
                      <tr key={`${row.year}-${row.monthNum}`}>
                        <td>{row.monthLabel}</td>
                        <td>{row.count}</td>
                        <td>${Math.round(row.avg).toLocaleString()}</td>
                        <td>${row.total.toLocaleString()}</td>
                        <td>{row.variationPct === null ? '-' : `${Math.round(row.variationPct)}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Único gráfico: muestra periodo principal y, si existe, comparison en la misma gráfica */}
                <div style={{ width: '90%', margin: '0 auto 18px' }}>
                  { (unionKeys.length === 0) ? null : (metric === 'count' || metric === 'avg') ? (
                    <Line data={chartData} options={chartOptions} />
                  ) : (
                    <Bar data={chartData} options={chartOptions} />
                  )}
                </div>

                {/* PANEL DE COMPARACIÓN (debajo del gráfico) */}
                <section className="compare-panel" style={{ width:'90%', margin: '12px auto', display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                  <div style={{ flex: '1 1 auto', minWidth: 200 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Período de comparación (opcional)</div>
                    <div style={{ fontSize: 12, color: '#555' }}>
                      Después de generar el reporte principal, las fechas de comparación se autocompletan con el período anterior de la misma longitud.
                    </div>
                  </div>

                  <label>
                    Desde (comparación):
                    <input type="month" value={compareDesde} onChange={e => setCompareDesde(e.target.value)} />
                  </label>

                  <label>
                    Hasta (comparación):
                    <input type="month" value={compareHasta} onChange={e => setCompareHasta(e.target.value)} />
                  </label>

                  <div style={{ display:'flex', gap:8 }}>
                    <button className="botton-Report" onClick={fetchAndAggregateCompare} disabled={loading || !compareDesde || !compareHasta}>
                      Generar Comparación
                    </button>
                  </div>

                  {/* Resumen comparativo simple (si existe) */}
                  {(compareTotals.count !== 0 || compareTotals.total !== 0) && (
                    <div style={{ width: '100%', marginTop: 8, color: '#333' }}>
                      <strong>Resumen:</strong>
                      <div style={{ fontSize: 13 }}>
                        Período 1: {tableData.reduce((s,x)=>s+x.count,0)} cot. / ${tableData.reduce((s,x)=>s+x.total,0).toLocaleString()} &nbsp; | &nbsp;
                        Período 2: {compareTotals.count} cot. / ${compareTotals.total.toLocaleString()} &nbsp; | &nbsp;
                        Variación total: {tableData.length ? `${Math.round(((compareTotals.count - tableData.reduce((s,x)=>s+x.count,0)) / (tableData.reduce((s,x)=>s+x.count,0) || 1)) * 100)}%` : '-'}
                      </div>
                    </div>
                  )}
                </section>

                {/* Listado expandible de cotizaciones por mes */}
                <section style={{ width:'90%', marginTop: 8 }}>
                  {tableData.map(row => {
                    const key = row.monthKey;
                    const list = cotizacionesPorMes[key] || [];
                    const isOpen = !!openMonths[key];
                    return (
                      <div key={key} style={{ marginBottom: 12 }}>
                        <button onClick={() => toggleMonth(key)} style={{ width:'100%', textAlign:'left', padding:'10px 12px', background:'#f1f5fb', border:'1px solid #dfe7fb', borderRadius:4, cursor:'pointer', fontWeight:700, color:'#1976d2' }} aria-expanded={isOpen}>
                          {row.monthLabel} — {row.count} cotizaciones
                        </button>
                        {isOpen && (
                          <div className="tabla-cotizaciones-responsive" style={{ marginTop:8 }}>
                            <table className="reporte-cotizaciones-tabla tabla-ajustada">
                              <thead>
                                <tr>
                                  <th>Cliente</th>
                                  <th>Teléfono</th>
                                  <th>Email</th>
                                  <th>Dirección</th>
                                  <th>Fecha Creación</th>
                                  <th>Última Edición</th>
                                  <th style={{ whiteSpace:'nowrap' }}>Precio Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {list.map(q => {
                                  const qId = getQuotationId(q);
                                  return (
                                    <tr key={qId || Math.random()} className={qId ? 'clickable-row' : ''} onClick={() => qId && navigate(`/quotation/${qId}`)} tabIndex={qId ? 0 : -1} onKeyDown={(e)=>{ if((e.key==='Enter'||e.key===' ')&&qId) navigate(`/quotation/${qId}`); }}>
                                      <td>{q.Customer?.Customer?.name || q.Customer?.name || q.customer?.name || ''} {q.Customer?.Customer?.lastname || q.Customer?.lastname || q.customer?.lastname || ''}</td>
                                      <td>{q.Customer?.Customer?.tel || q.Customer?.tel || q.customer?.tel || ''}</td>
                                      <td>{q.Customer?.Customer?.mail || q.Customer?.mail || q.customer?.mail || ''}</td>
                                      <td>{q.Customer?.Customer?.address || q.Customer?.address || q.customer?.address || ''}</td>
                                      <td>{q.CreationDate ? formatFechaCorta(q.CreationDate) : (q.creationDate ? formatFechaCorta(q.creationDate) : '')}</td>
                                      <td>{q.LastEdit ? formatFechaCorta(q.LastEdit) : (q.lastEdit ? formatFechaCorta(q.lastEdit) : '')}</td>
                                      <td style={{ whiteSpace:'nowrap' }}>${(q.TotalPrice ?? q.totalPrice ?? q.Total ?? q.price ?? 0).toLocaleString?.() ?? (q.TotalPrice ?? q.totalPrice ?? q.Total ?? q.price ?? 0)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </section>

                {/* Nuevo: listado de cotizaciones del período comparado */}
                {compareTableData.length > 0 && (
                  <section style={{ width: '100%', marginTop: 12 }}>
                    <h3 style={{ color: '#c62828', marginBottom: 8 }}>Detalle — Período comparado</h3>
                    {compareTableData.map(row => {
                      const key = row.monthKey;
                      const list = compareCotizacionesPorMes[key] || [];
                      const isOpen = !!openCompareMonths[key];
                      return (
                        <div key={`cmp-${key}`} style={{ marginBottom: 12 }}>
                          <button
                            onClick={() => toggleCompareMonth(key)}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '8px 10px',
                              background: '#fff6f6',
                              border: '1px solid #f5c6cb',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontWeight: 700,
                              color: '#c62828'
                            }}
                            aria-expanded={isOpen}
                          >
                            {row.monthLabel} — {row.count} cotizaciones (Periodo comparación)
                          </button>

                          {isOpen && (
                            <div className="tabla-cotizaciones-responsive" style={{ marginTop: 8 }}>
                              <table className="reporte-cotizaciones-tabla tabla-ajustada">
                                <thead>
                                  <tr>
                                    <th>Cliente</th>
                                    <th>Teléfono</th>
                                    <th>Email</th>
                                    <th>Dirección</th>
                                    <th>Fecha Creación</th>
                                    <th>Última Edición</th>
                                    <th style={{ whiteSpace: 'nowrap' }}>Precio Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {list.map(q => {
                                    const qId = getQuotationId(q);
                                    return (
                                      <tr
                                        key={qId || Math.random()}
                                        className={qId ? 'clickable-row' : ''}
                                        onClick={() => qId && navigate(`/quotation/${qId}`)}
                                        tabIndex={qId ? 0 : -1}
                                        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && qId) navigate(`/quotation/${qId}`); }}
                                      >
                                        <td>{q.Customer?.Customer?.name || q.Customer?.name || q.customer?.name || ''} {q.Customer?.Customer?.lastname || q.Customer?.lastname || q.customer?.lastname || ''}</td>
                                        <td>{q.Customer?.Customer?.tel || q.Customer?.tel || q.customer?.tel || ''}</td>
                                        <td>{q.Customer?.Customer?.mail || q.Customer?.mail || q.customer?.mail || ''}</td>
                                        <td>{q.Customer?.Customer?.address || q.Customer?.address || q.customer?.address || ''}</td>
                                        <td>{q.CreationDate ? formatFechaCorta(q.CreationDate) : (q.creationDate ? formatFechaCorta(q.creationDate) : '')}</td>
                                        <td>{q.LastEdit ? formatFechaCorta(q.LastEdit) : (q.lastEdit ? formatFechaCorta(q.lastEdit) : '')}</td>
                                        <td style={{ whiteSpace: 'nowrap' }}>${(q.TotalPrice ?? q.totalPrice ?? q.Total ?? q.price ?? 0).toLocaleString?.() ?? (q.TotalPrice ?? q.totalPrice ?? q.Total ?? q.price ?? 0)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </section>
                )}

                <footer className="reporte-cotizaciones-footer" style={{ width:'90%', marginTop:12 }}>
                  <div className="reporte-cotizaciones-direccion">
                    <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                      Avenida Japón 1292 / Córdoba / Argentina
                    </span>
                    <br />Solo para uso interno de la empresa Anodal S.A.
                  </div>
                  <img src={logoAnodal} alt="Logo Anodal" className="reporte-cotizaciones-footer-logo" />
                </footer>
              </main>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ReporteDeTendenciasDeCotizacionPorMes;