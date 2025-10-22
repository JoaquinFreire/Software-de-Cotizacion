import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import html2pdf from 'html2pdf.js';
import ReactLoading from 'react-loading';
import { 
  TrendingUp, 
  Filter, 
  Download, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Package,
  AlertTriangle,
  BarChart3,
  FileText,
  X
} from 'lucide-react';
import logoAnodal from '../../images/logo_secundario.webp';
import '../../styles/reportes.css';
import '../../styles/reporteindividual.css';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import ScrollToTopButton from '../../components/ScrollToTopButton';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

const formatFecha = (fecha) => {
  if (!fecha) return '';
  const [datePart] = fecha.split('T');
  const [y, m, d] = datePart.split('-');
  return `${d}-${m}-${y.slice(2)}`;
};

const formatNumber = (num) => {
  return new Intl.NumberFormat('es-AR').format(num);
};

const categorizeComplement = (name) => {
  if (!name) return 'Otros';
  
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('puerta') || lowerName.includes('door')) return 'Puertas';
  if (lowerName.includes('baranda') || lowerName.includes('rail')) return 'Barandas';
  if (lowerName.includes('tabique') || lowerName.includes('partition')) return 'Tabiques';
  if (lowerName.includes('ventana') || lowerName.includes('window')) return 'Ventanas';
  if (lowerName.includes('escalera') || lowerName.includes('stair')) return 'Escaleras';
  if (lowerName.includes('marco') || lowerName.includes('frame')) return 'Marcos';
  if (lowerName.includes('accesorio') || lowerName.includes('accessory')) return 'Accesorios';
  
  return 'Otros';
};

const normalizeArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (val.$values && Array.isArray(val.$values)) return val.$values;
  return [val];
};

const extractName = (item) => {
  if (!item) return null;
  return item.name ?? item.Name ?? item.Nombre ?? item.Title ?? null;
};

const extractNamesFromSection = (section) => {
  const arr = normalizeArray(section);
  const out = [];
  arr.forEach(it => {
    if (!it) return;
    if (it.$values && Array.isArray(it.$values)) {
      it.$values.forEach(inner => {
        const n = extractName(inner);
        if (n) out.push(n);
      });
    } else {
      const n = extractName(it);
      if (n) out.push(n);
    }
  });
  return out;
};

const pickSection = (obj, keys) => {
  if (!obj) return null;
  for (const k of keys) {
    if (obj[k]) return obj[k];
  }
  return null;
};

const getComplementNames = (complement) => {
  if (!complement) return [];
  const items = Array.isArray(complement) ? complement : (complement.$values && Array.isArray(complement.$values) ? complement.$values : [complement]);
  const names = [];
  items.forEach(c => {
    if (!c) return;
    const door = pickSection(c, ['ComplementDoor','complementDoor','ComplementDoorItems','ComplementDoors']);
    const railing = pickSection(c, ['ComplementRailing','complementRailing','ComplementRailingItems','ComplementRailings']);
    const partition = pickSection(c, ['ComplementPartition','complementPartition','ComplementPartitionItems','ComplementPartitions']);
    names.push(...extractNamesFromSection(door));
    names.push(...extractNamesFromSection(railing));
    names.push(...extractNamesFromSection(partition));
    const direct = extractName(c);
    if (direct) names.push(direct);
  });
  return names;
};

const getDefaultDates = () => {
  const year = new Date().getFullYear();
  return {
    desde: `${year}-01-01`,
    hasta: `${year}-12-31`
  };
};

const parseDateString = (s) => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d) ? null : d;
};

const ReporteConsumoComplementos = () => {
  const [loading, setLoading] = useState(false);
  const [budgets, setBudgets] = useState([]);
  const [complementCounts, setComplementCounts] = useState({});
  const [categoryCounts, setCategoryCounts] = useState({});
  const [monthlyTrends, setMonthlyTrends] = useState({});
  const [generar, setGenerar] = useState(false);
  const [stats, setStats] = useState({
    totalCotizaciones: 0,
    cotizacionesConComplementos: 0,
    totalComplementos: 0,
    promedioPorCotizacion: 0,
    complementosUnicos: 0
  });

  const defaultDates = getDefaultDates();
  const [fechaDesde, setFechaDesde] = useState(defaultDates.desde);
  const [fechaHasta, setFechaHasta] = useState(defaultDates.hasta);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const pdfRef = useRef();
  const navigate = useNavigate();
  const [selectedBudgetKey, setSelectedBudgetKey] = useState(null);

  const invalidRange = (() => {
    const d = parseDateString(fechaDesde);
    const h = parseDateString(fechaHasta);
    if (!d || !h) return true;
    return d.getTime() > h.getTime();
  })();

  const fetchData = async (fromStr, toStr) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = `${API_URL}/api/Mongo/GetAllBudgetsWithComplements?from=${encodeURIComponent(fromStr)}&to=${encodeURIComponent(toStr)}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let data = [];
      if (Array.isArray(res.data)) data = res.data;
      else if (res.data && Array.isArray(res.data.$values)) data = res.data.$values;
      else if (res.data && Array.isArray(res.data.values)) data = res.data.values;
      else if (res.data && typeof res.data === 'object') {
        const possible = Object.values(res.data).find(v => Array.isArray(v));
        data = Array.isArray(possible) ? possible : [];
      }
      
      setBudgets(data);

      // Análisis completo de datos
      const counts = {};
      const categories = {};
      const monthlyData = {};
      let totalComplementos = 0;
      let cotizacionesConComplementos = 0;

      data.forEach(b => {
        const names = getComplementNames(b.Complement || b.complement || b.Complements || b.Complemento);
        
        if (names.length > 0) {
          cotizacionesConComplementos++;
          totalComplementos += names.length;

          names.forEach(name => {
            counts[name] = (counts[name] || 0) + 1;
            const category = categorizeComplement(name);
            categories[category] = (categories[category] || 0) + 1;
          });

          const fecha = b.creationDate || b.creationDateString;
          if (fecha) {
            const month = fecha.substring(0, 7);
            monthlyData[month] = (monthlyData[month] || 0) + names.length;
          }
        }
      });

      const complementosUnicos = Object.keys(counts).length;
      const promedioPorCotizacion = cotizacionesConComplementos > 0 
        ? (totalComplementos / cotizacionesConComplementos).toFixed(2) 
        : 0;

      setComplementCounts(counts);
      setCategoryCounts(categories);
      setMonthlyTrends(monthlyData);
      setStats({
        totalCotizaciones: data.length,
        cotizacionesConComplementos,
        totalComplementos,
        promedioPorCotizacion: parseFloat(promedioPorCotizacion),
        complementosUnicos
      });

    } catch (err) {
      console.error('Error fetching budgets with complements:', err);
      alert('Error al obtener cotizaciones con complementos. Ver consola para más detalles.');
      setBudgets([]);
      setComplementCounts({});
      setCategoryCounts({});
      setMonthlyTrends({});
      setStats({
        totalCotizaciones: 0,
        cotizacionesConComplementos: 0,
        totalComplementos: 0,
        promedioPorCotizacion: 0,
        complementosUnicos: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarReporte = () => {
    if (!fechaDesde || !fechaHasta || invalidRange) {
      alert('Rango inválido: Verifique las fechas Desde/Hasta.');
      return;
    }
    setGenerar(true);
    fetchData(fechaDesde, fechaHasta);
  };

  const handleImprimir = () => window.print();

  const handleDescargarPDF = () => {
    if (!pdfRef.current) return;
    const scrollBtn = document.querySelector('.scroll-to-top-btn');
    if (scrollBtn) scrollBtn.style.display = 'none';
    const opt = {
      margin: [0.2, 0.2, 0.2, 0.2],
      filename: `reporte_consumo_complementos.pdf`,
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

  const handleRefresh = () => {
    if (fechaDesde && fechaHasta && !invalidRange) {
      fetchData(fechaDesde, fechaHasta);
    }
  };

  // Datos para gráficos
  const sortedComplements = Object.entries(complementCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 15)
    .reduce((acc, [name, count]) => {
      acc.names.push(name);
      acc.values.push(count);
      return acc;
    }, { names: [], values: [] });

  const complementNames = sortedComplements.names;
  const complementValues = sortedComplements.values;
  const maxUsed = complementNames.length > 0 ? complementNames[0] : null;

  const categoryData = {
    labels: Object.keys(categoryCounts),
    datasets: [{
      data: Object.values(categoryCounts),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#8AC926', '#1982C4'
      ],
      borderWidth: 2,
      borderColor: '#000000ff'
    }]
  };

  const monthlyLabels = Object.keys(monthlyTrends).sort();
  const monthlyData = {
    labels: monthlyLabels,
    datasets: [{
      label: 'Complementos por mes',
      data: monthlyLabels.map(month => monthlyTrends[month]),
      backgroundColor: '#4BC0C0',
      borderColor: '#000000ff',
      borderWidth: 2,
      fill: true
    }]
  };

  const chartOptions = {
    plugins: {
      datalabels: {
        color: '#ffffffff',
        font: { weight: 'bold', size: 12 },
        anchor: 'end',
        align: 'right',
        formatter: (value) => value,
      },
      legend: { display: false }
    },
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { beginAtZero: true, precision: 0, grid: { display: true } },
      y: {
        ticks: { autoSkip: false, maxRotation: 0, minRotation: 0 },
        grid: { display: false }
      }
    }
  };

  const pieOptions = {
    plugins: {
      legend: {
        position: 'right',
        labels: { font: { size: 11 } }
      },
      datalabels: {
        color: '#fff',
        font: { weight: 'bold', size: 11 },
        formatter: (value, ctx) => {
          const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${percentage}%`;
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };

  const monthlyOptions = {
    plugins: {
      legend: { display: false },
      datalabels: { display: false }
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, precision: 0 }
    }
  };

  const handleRowSelect = (key) => {
    setSelectedBudgetKey(prev => prev === key ? null : key);
  };

  const handleOpenQuotation = (b) => {
    const qId = b.budgetId || b._id || b.id || null;
    if (qId) {
      navigate(`/quotation/${qId}`);
    } else {
      alert('No se encontró ID de cotización para abrir.');
    }
  };

  return (
    <div className="dashboard-container">
      <Navigation />

      <div className="dashboard-main-wrapper">
        <div className="dashboard-content-container">

          {/* HEADER */}
          <div className="dashboard-header">
            <div className="header-title">
              <Package size={32} />
              <div>
                <h1>Reporte de Consumo de Complementos</h1>
                <p>Análisis de uso y tendencias de complementos en cotizaciones</p>
              </div>
            </div>
            <div className="header-actions">
              <div className="filter-group">
                    <button 
                      className="btn-primary"
                      onClick={handleGenerarReporte}
                      disabled={loading || invalidRange}
                    >
                      {loading ? 'Generando...' : 'Generar Reporte'}
                    </button>
							</div>
              <button 
                className="btn-primary"
                onClick={handleDescargarPDF}
                disabled={!generar}
              >
                <Download size={18} />
                Exportar PDF
              </button>
            </div>
          </div>

          {/* FILTROS */}
          <div className="filters-accordion">
            <div className="filters-header-toggle" onClick={() => setFiltersVisible(!filtersVisible)}>
              <div className="filters-toggle-left">
                <Filter size={20} />
                <span>Filtros del Reporte</span>
              </div>
              <div className="filters-toggle-right">
                {filtersVisible ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>

            {filtersVisible && (
              <div className="filters-content-expanded">
                <div className="filters-grid">
                  <div className="filter-group">
                    <label>Fecha Desde:</label>
                    <input 
                      type="date" 
                      value={fechaDesde} 
                      onChange={e => setFechaDesde(e.target.value)}
                      className="filter-select"
                    />
                  </div>
                  <div className="filter-group">
                    <label>Fecha Hasta:</label>
                    <input 
                      type="date" 
                      value={fechaHasta} 
                      onChange={e => setFechaHasta(e.target.value)}
                      className="filter-select"
                    />
                  </div>
                  
                </div>
                {invalidRange && (
                  <div className="filter-error">
                    <AlertTriangle size={16} />
                    El rango de fechas es inválido
                  </div>
                )}
              </div>
            )}
          </div>

          {loading && generar ? (
            <div className="dashboard-loading">
              <div className="loading-spinner"></div>
              <p>Generando reporte...</p>
            </div>
          ) : !generar ? (
            <div className="dashboard-empty-state">
              <BarChart3 size={64} />
              <h3>Reporte no generado</h3>
              <p>Configure los filtros y presione "Generar Reporte" para visualizar los datos</p>
            </div>
          ) : (
            <div className="reporte-cotizaciones-pdf" ref={pdfRef}>
              
              {/* KPI CARDS */}
              <div className="kpi-section">
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: '#2196f3' }}>
                      <FileText size={24} />
                    </div>
                    <div className="kpi-content">
                      <div className="kpi-value">{formatNumber(stats.totalCotizaciones)}</div>
                      <div className="kpi-label">Total Cotizaciones</div>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: '#4caf50' }}>
                      <Package size={24} />
                    </div>
                    <div className="kpi-content">
                      <div className="kpi-value">{formatNumber(stats.cotizacionesConComplementos)}</div>
                      <div className="kpi-label">Con Complementos</div>
                      <div className="kpi-trend">
                        {((stats.cotizacionesConComplementos / stats.totalCotizaciones) * 100 || 0).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: '#ff9800' }}>
                      <TrendingUp size={24} />
                    </div>
                    <div className="kpi-content">
                      <div className="kpi-value">{formatNumber(stats.totalComplementos)}</div>
                      <div className="kpi-label">Total Complementos</div>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: '#9c27b0' }}>
                      <Users size={24} />
                    </div>
                    <div className="kpi-content">
                      <div className="kpi-value">{formatNumber(stats.complementosUnicos)}</div>
                      <div className="kpi-label">Complementos Únicos</div>
                      <div className="kpi-trend">
                        Promedio: {stats.promedioPorCotizacion}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* GRÁFICOS */}
              <div className="main-content-grid">
                <div className="content-column">
                  {/* COMPLEMENTOS MÁS USADOS */}
                  <div className="panel workload-panel">
                    <div className="panel-header">
                      <TrendingUp size={20} />
                      <h3>Top 15 Complementos Más Usados</h3>
                      <span className="panel-badge">{complementNames.length} complementos</span>
                    </div>
                    <div className="panel-content">
                      {complementNames.length === 0 ? (
                        <div className="no-data-message">
                          No hay datos de complementos
                        </div>
                      ) : (
                        <div style={{ height: 400 }}>
                          <Bar data={{ 
                            labels: complementNames, 
                            datasets: [{
                              label: 'Cantidad de usos',
                              data: complementValues,
                              backgroundColor: '#36A2EB',
                              borderColor: '#222',
                              borderWidth: 2,
                            }]
                          }} options={chartOptions} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TENDENCIAS MENSUALES */}
                  {monthlyLabels.length > 1 && (
                    <div className="panel workload-panel">
                      <div className="panel-header">
                        <BarChart3 size={20} />
                        <h3>Cantidad de Uso Mensual</h3>
                        <span className="panel-badge">{monthlyLabels.length} meses</span>
                      </div>
                      <div className="panel-content">
                        <div style={{ height: 300 }}>
                          <Bar data={monthlyData} options={monthlyOptions} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="content-column">
                  {/* DISTRIBUCIÓN POR CATEGORÍAS */}
                  <div className="panel alerts-panel-complements">
                    <div className="panel-header">
                      <Package size={20} />
                      <h3>Distribución por Categorías</h3>
                      <span className="panel-badge">{Object.keys(categoryCounts).length} categorías</span>
                    </div>
                    <div className="panel-content">
                      {Object.keys(categoryCounts).length === 0 ? (
                        <div className="no-data-message">
                          No hay categorías para mostrar
                        </div>
                      ) : (
                        <div style={{ height: 400 }}>
                          <Pie data={categoryData} options={pieOptions} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* COMPLEMENTO MÁS POPULAR */}
                  {maxUsed && (
                    <div className="panel alerts-panel">
                      <div className="panel-header">
                        <AlertTriangle size={20} />
                        <h3>Complemento Más Popular</h3>
                        <span className="panel-badge">Top 1</span>
                      </div>
                      <div className="panel-content">
                        <div className="top-complement-info">
                          <div className="top-complement-name"><h3>{maxUsed}</h3></div>
                          <div className="top-complement-stats">
                            <div className="stat-item">
                              <span className="stat-label">Usos:</span>
                              <span className="stat-value">{complementCounts[maxUsed]}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Participación:</span>
                              <span className="stat-value">
                                {((complementCounts[maxUsed] / stats.totalComplementos) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* TABLA DE COTIZACIONES */}
              <div className="panel quotations-panel">
                <div className="panel-header">
                  <FileText size={20} />
                  <h3>Detalle de Cotizaciones con Complementos</h3>
                  <span className="panel-badge">
                    {budgets.filter(b => getComplementNames(b.Complement || b.complement || b.Complemento).length > 0).length} cotizaciones
                  </span>
                </div>
                <div className="panel-content">
                  <div className="tabla-cotizaciones-responsive">
                    <table className="workload-table">
                      <thead>
                        <tr >
                          <th>ID</th>
                          <th>Cliente</th>
                          <th>Fecha</th>
                          <th>Complementos</th>
                          <th>Cantidad</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {budgets.filter(b => getComplementNames(b.Complement || b.complement || b.Complemento).length > 0).length === 0 ? (
                          <tr>
                            <td colSpan="6" className="no-data-message">
                              No hay cotizaciones con complementos en el período seleccionado
                            </td>
                          </tr>
                        ) : (
                          budgets.map((b, idx) => {
                            const complementos = getComplementNames(b.Complement || b.complement || b.Complemento);
                            if (complementos.length === 0) return null;
                            const key = `${b.budgetId || b._id || 'noid'}-${idx}`;
                            const isSelected = selectedBudgetKey === key;
                            const qId = b.budgetId || b._id || b.id || '';
                            return (
                              <tr
                                key={key}
                                onClick={() => handleRowSelect(key)}
                                className={isSelected ? 'selected-row' : ''}
                                style={{ cursor: qId ? 'pointer' : 'default' }}
                              >
                                <td className="quotation-id">#{qId}</td>
                                <td>
                                  {b.customer?.name || b.customer?.lastname ? 
                                    `${b.customer?.name || ''} ${b.customer?.lastname || ''}` : 
                                    'N/A'
                                  }
                                </td>
                                <td>
                                  {b.creationDate ? formatFecha(b.creationDate) : 
                                    (b.creationDateString ? formatFecha(b.creationDateString) : 'N/A')
                                  }
                                </td>
                                <td className="complements-list">
                                  {complementos.join(', ')}
                                </td>
                                <td className="complement-count">
                                  <span className="count-badge">{complementos.length}</span>
                                </td>
                                <td>
                                  <button
                                    className="btn-ver-pdf"
                                    onClick={(e) => { e.stopPropagation(); handleOpenQuotation(b); }}
                                    disabled={!qId}
                                  >
                                    <FileText size={14} />
                                    Abrir
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* FOOTER DEL REPORTE PDF */}
              <footer className="reporte-cotizaciones-footer">
                <div className="reporte-cotizaciones-direccion">
                  <span>
                    Avenida Japón 1292 / Córdoba / Argentina
                  </span>
                  <br />
                  Solo para uso interno de la empresa Anodal S.A.
                </div>
                <div className="reporte-cotizaciones-meta">
                  Generado el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()}
                </div>
              </footer>
            </div>
          )}
        </div>
      </div>

      <ScrollToTopButton />
      <Footer />
    </div>
  );
};

export default ReporteConsumoComplementos;