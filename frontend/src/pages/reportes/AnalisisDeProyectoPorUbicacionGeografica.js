import React, { useState, useRef } from 'react';
import axios from 'axios';
import logoAnodal from '../../images/logo_secundario.png';
import ciudadesBarrios from '../../json/ciudadesBarriosCordoba.json';
import html2pdf from 'html2pdf.js';
import ReactLoading from 'react-loading';
import '../../styles/reportes.css';
import '../../styles/reporteindividual.css';

const API_URL = process.env.REACT_APP_API_URL;

const getDefaultDates = () => {
  const year = new Date().getFullYear();
  return {
    desde: `${year}-01-01`,
    hasta: `${year}-12-31`
  };
};

const AnalisisDeProyectoPorUbicacionGeografica = () => {
  const defaultDates = getDefaultDates();
  const [fechaDesde, setFechaDesde] = useState(defaultDates.desde);
  const [fechaHasta, setFechaHasta] = useState(defaultDates.hasta);
  const [ciudad, setCiudad] = useState('');
  const [generar, setGenerar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [mostrarBarrio, setMostrarBarrio] = useState({});
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const pdfRef = useRef();

  // Obtiene lista de ciudades del JSON
  const ciudades = ciudadesBarrios.Cordoba.ciudades.map(c => c.nombre);

  // Consulta cotizaciones filtradas por fechas y ciudad
  const fetchData = async () => {
    if (!fechaDesde || !fechaHasta || !ciudad) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${API_URL}/api/quotations/by-period-location?from=${fechaDesde}&to=${fechaHasta}&location=${encodeURIComponent(ciudad)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(res.data, " esta es la respuesta");
      const data = res.data || [];
      // Agrupa por barrio
      const barriosMap = {};
      let total = data.length;
      data.forEach(q => {
        // Extrae barrio de location: "Villa Carlos Paz - Centro" => "Centro"
        let barrio = '';
        if (q.WorkPlace && q.WorkPlace.Location) {
          const parts = q.WorkPlace.Location.split(' - ');
          barrio = parts.length > 1 ? parts[1] : '(Sin barrio)';
        } else {
          barrio = '(Sin barrio)';
        }
        console.log(q.WorkPlace.Location, " location");

        const tipoObra = q.WorkPlace?.workTypeId || '';
        if (!barriosMap[barrio]) {
          barriosMap[barrio] = { count: 0, tipoObra, cotizaciones: [] };
        }
        barriosMap[barrio].count += 1;
        barriosMap[barrio].cotizaciones.push(q);
      });
      // Convierte a array y calcula porcentaje
      const resultadosTabla = Object.entries(barriosMap).map(([barrio, info]) => ({
        barrio,
        count: info.count,
        porcentaje: total ? ((info.count / total) * 100).toFixed(1) + '%' : '0%',
        tipoObra: info.cotizaciones[0]?.WorkPlace?.workTypeId || '',
        cotizaciones: info.cotizaciones
      }));
      setResultados(resultadosTabla);
      setMostrarBarrio({});
      setMostrarTodos(false);
    } catch (err) {
      setResultados([]);
    }
    setLoading(false);
  };

  const handleGenerarReporte = () => {
    setGenerar(true);
    fetchData();
  };

  const handleDescargarPDF = async () => {
    if (!pdfRef.current) return;
    const opt = {
      margin: [0.2, 0.2, 0.2, 0.2],
      filename: `analisis_proyecto_ubicacion_${fechaDesde}_a_${fechaHasta}_${ciudad}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    setTimeout(() => {
      html2pdf().set(opt).from(pdfRef.current).save();
    }, 100);
  };

  // Muestra/oculta tabla de cotizaciones por barrio
  const toggleBarrio = (barrio) => {
    setMostrarBarrio(prev => ({
      ...prev,
      [barrio]: !prev[barrio]
    }));
  };

  // Muestra/oculta todas las tablas
  const toggleTodos = () => {
    if (!mostrarTodos) {
      // Mostrar todos
      const nuevoMostrar = {};
      resultados.forEach(r => { nuevoMostrar[r.barrio] = true; });
      setMostrarBarrio(nuevoMostrar);
      setMostrarTodos(true);
    } else {
      // Ocultar todos
      setMostrarBarrio({});
      setMostrarTodos(false);
    }
  };

  // Total general
  const totalProyectos = resultados.reduce((acc, r) => acc + r.count, 0);
  console.log(mostrarTodos, " mostrar barrio");
  return (
    <div className="reporte-cotizaciones-root">
      <div className="reporte-cotizaciones-toolbar">
        <div className="reporte-cotizaciones-filtros">
          <label>
            Desde:
            <input
              type="date"
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
            />
          </label>
          <label>
            Hasta:
            <input
              type="date"
              value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
            />
          </label>
          <label>
            Ciudad:
            <select
              value={ciudad}
              onChange={e => setCiudad(e.target.value)}
              className="reporte-cotizaciones-select"
            >
              <option value="">Seleccione ciudad</option>
              {ciudades.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <div className="reporte-cotizaciones-pdf-btn-container">
            <button onClick={handleGenerarReporte} disabled={loading || !fechaDesde || !fechaHasta || !ciudad}>
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
      </div>
      <div className="reporte-cotizaciones-a4">
        <div className="reporte-cotizaciones-pdf" ref={pdfRef}>
          <header className="reporte-cotizaciones-header">
            <img src={logoAnodal} alt="Logo Anodal" className="reporte-cotizaciones-logo" />
            <h1 className="reporte-cotizaciones-title">Análisis de Proyecto por Ubicación Geográfica</h1>
            <div className="reporte-cotizaciones-logo-placeholder" />
          </header>
          {/* Texto explicativo */}
          <section className="reporte-cotizaciones-analisis" style={{ marginBottom: 24 }}>
            <div className="reporte-cotizaciones-analisis-bloque">
              <strong>Descripción del Reporte:</strong> Este informe muestra la distribución de proyectos por barrio dentro de la ciudad seleccionada, permitiendo identificar los barrios con mayor actividad y el tipo de obra predominante. Puede visualizar el detalle de cotizaciones por barrio y descargar el reporte en PDF.
            </div>
            <div className="reporte-cotizaciones-analisis-bloque">
              <strong>Cómo usar:</strong> Seleccione el período y la ciudad, luego presione <b>Generar Reporte</b>. Puede ver el detalle de cada barrio presionando <b>Ver</b> o <b>Ver todo</b>.
            </div>
          </section>
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
              <span style={{ fontSize: 16, marginTop: 8 }}>Seleccione fechas y ciudad, luego presione <b>Generar Reporte</b>.</span>
            </div>
          ) : (
            generar && !loading && (
              <main className="reporte-cotizaciones-main">
                <div className="reporte-cotizaciones-info">
                  <div>
                    <strong>Período:</strong> {fechaDesde} al {fechaHasta}
                  </div>
                  <div>
                    <strong>Ciudad:</strong> {ciudad}
                  </div>
                  <div>
                    <strong>Fecha y Hora:</strong> {new Date().toLocaleString()}
                  </div>
                </div>
                <table className="reporte-cotizaciones-tabla tablachild">
                  <thead>
                    <tr>
                      <th>Barrio</th>
                      <th>Número de Proyectos</th>
                      <th>Porcentaje</th>
                      <th>Tipo de Obra</th>
                      <th>Mostrar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.map((r, idx) => (
                      <tr key={r.barrio + idx}>
                        <td>{r.barrio}</td>
                        <td>{r.count}</td>
                        <td>{r.porcentaje}</td>
                        <td>{r.tipoObra}</td>
                        <td>
                          <button
                            className="btn-ver-barrio"
                            onClick={() => toggleBarrio(r.barrio)}
                          >
                            {mostrarBarrio[r.barrio] ? 'Ocultar' : 'Ver'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {/* Fila de total */}
                    <tr style={{ background: '#f6f8fa', fontWeight: 'bold' }}>
                      <td>Total</td>
                      <td>{totalProyectos}</td>
                      <td>100%</td>
                      <td>-</td>
                      <td>
                        <button
                          className="btn-ver-todo"
                          onClick={toggleTodos}
                        >
                          {mostrarTodos ? 'Ocultar todo' : 'Ver todo'}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                {/* Tablas de cotizaciones por barrio */}
                {resultados.map((r, idx) =>
                  mostrarBarrio[r.barrio] ? (
                    <div key={'tabla-' + r.barrio + idx} style={{ margin: '24px 0' }}>
                      <h2 className="titulo-barrio-detalle">
                        Cotizaciones en {r.barrio}
                      </h2>
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
                            {r.cotizaciones.map((q, i) => (
                              <tr key={q.Id || q.id || i}>
                                <td>
                                  {q.Customer?.Customer?.name || q.Customer?.Name || q.customer?.name || ''}
                                  {' '}
                                  {q.Customer?.Customer?.lastname || q.Customer?.Lastname || q.customer?.lastname || ''}
                                </td>
                                <td>{q.Customer?.Customer?.tel || q.Customer?.Tel || q.customer?.tel || ''}</td>
                                <td>{q.Customer?.Customer?.mail || q.Customer?.Mail || q.customer?.mail || ''}</td>
                                <td>{q.Customer?.Customer?.address || q.Customer?.Address || q.customer?.address || ''}</td>
                                <td>{q.CreationDate ? formatFechaCorta(q.CreationDate) : (q.creationDate ? formatFechaCorta(q.creationDate) : '')}</td>
                                <td>{q.LastEdit ? formatFechaCorta(q.LastEdit) : (q.lastEdit ? formatFechaCorta(q.lastEdit) : '')}</td>
                                <td style={{ whiteSpace: 'nowrap' }}>${q.TotalPrice || q.totalPrice}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null
                )}
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
    </div>
  );
};

// Utilidad para formato corto de fecha
function formatFechaCorta(fecha) {
  if (!fecha) return '';
  const [datePart] = fecha.split('T');
  const [y, m, d] = datePart.split('-');
  return `${d}-${m}-${y.slice(2)}`;
}

export default AnalisisDeProyectoPorUbicacionGeografica;