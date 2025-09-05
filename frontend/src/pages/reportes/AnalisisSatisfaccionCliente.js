import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js/auto';
import html2pdf from 'html2pdf.js';
import ReactLoading from 'react-loading';
import logoAnodal from '../../images/logo_secundario.webp';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import '../../styles/reportes.css';
import '../../styles/reporteindividual.css';

Chart.register(ChartDataLabels);


const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT5uVdkf1MHTdCmOK3Lp3A03vrPmKp3H7qyRsbIYRfz8-yNpXlcjtrOIrrL_vS5EZUdH62iF-UL4XB-/pub?output=csv';

// Preguntas y sus opciones posibles (según el formulario real)
const preguntasYOpciones = {
  "¿Cómo calificaría la amabilidad del personal que lo atendió?": ["1", "2", "3", "4", "5"],
  "Califique la claridad de la cotización recibida": ["1", "2", "3", "4", "5"],
  "¿Cómo calificaría el tiempo de respuesta a su solicitud?": ["1", "2", "3", "4", "5"],
  "¿La cotización fue clara y detallada?": ["1", "2", "3", "4", "5"],
  "  ¿Cómo percibe el precio en relación a la calidad ofrecida?  ": ["Muy Alto", "Aceptable", "Muy bueno"],
  "¿El diseño y variedad de opciones de aberturas fue suficiente para su necesidad?": ["Sí", "No", "Podria Mejorar"],
};
const getDefaultDates = () => {
  const year = new Date().getFullYear();
  return {
    desde: `${year}-01-01`,
    hasta: `${year}-12-31`
  };
};

function analizarRespuestas(data) {
  return Object.entries(preguntasYOpciones).map(([pregunta, opciones]) => {
    const conteo = {};
    opciones.forEach(op => { conteo[op] = 0; });
    data.forEach(row => {
      const respuesta = row[pregunta];
      if (conteo.hasOwnProperty(respuesta)) {
        conteo[respuesta]++;
      }
    });
    return { pregunta, opciones, conteo };
  });
}

function parseFecha(fechaStr) {
  // Ejemplo: "5/09/2025 15:08:18"
  const [d, m, yAndRest] = fechaStr.split('/');
  const [y] = yAndRest.split(' ');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

const AnalisisSatisfaccionCliente = () => {
  const defaultDates = getDefaultDates();
  const [fechaDesde, setFechaDesde] = useState(defaultDates.desde);
  const [fechaHasta, setFechaHasta] = useState(defaultDates.hasta);
  const [loading, setLoading] = useState(false);
  const [respuestas, setRespuestas] = useState([]);
  const [resumen, setResumen] = useState([]);
  const [generar, setGenerar] = useState(false);
  const pdfRef = useRef();

  const fetchCSV = async () => {
    setLoading(true);
    try {
      const res = await fetch(CSV_URL);
      const text = await res.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Filtra por fecha
          const desde = new Date(fechaDesde);
          const hasta = new Date(fechaHasta);
          const filtradas = results.data.filter(row => {
            const marca = row["Marca temporal"];
            if (!marca) return false;
            const fechaStr = parseFecha(marca);
            const fecha = new Date(fechaStr);
            return fecha >= desde && fecha <= hasta;
          });
          setRespuestas(filtradas);
          setResumen(analizarRespuestas(filtradas));
          setLoading(false);
        }
      });
    } catch (err) {
      setRespuestas([]);
      setResumen([]);
      setLoading(false);
    }
  };

  const handleGenerarReporte = () => {
    setGenerar(true);
    fetchCSV();
  };

  const handleDescargarPDF = () => {
    if (!pdfRef.current) return;
    const opt = {
      margin: [0.2, 0.2, 0.2, 0.2],
      filename: `reporte_satisfaccion_cliente.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    setTimeout(() => {
      html2pdf().set(opt).from(pdfRef.current).save();
    }, 100);
  };

  const graficos = resumen.map((r, idx) => {
    const total = Object.values(r.conteo).reduce((a, b) => a + b, 0);
    return {
      pregunta: r.pregunta,
      opciones: r.opciones,
      data: {
        labels: r.opciones,
        datasets: [{
          data: r.opciones.map(op => r.conteo[op]),
          backgroundColor: [
            '#1a9cf3e1', '#4b4e4eff', '#cf778aff', '#d4ba79ff', '#7edfc6ff', '#f5c18cff', '#90a9dbff'
          ],
          borderColor: '#222',
          borderWidth: 2,
        }]
      },
      total
    };
  });

  return (
    <div className="dashboard-container">
      <Navigation />
      <h2 className="title">Análisis de Satisfacción del Cliente</h2>
      <div className="reporte-cotizaciones-root">
        {/* Filtros y acciones arriba de todo */}
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
            <button className="botton-Report"onClick={handleGenerarReporte} disabled={loading || !fechaDesde || !fechaHasta}>
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
              <h1 className="reporte-cotizaciones-title">Reporte de Satisfacción del Cliente</h1>
              <div className="reporte-cotizaciones-logo-placeholder" />
            </header>

            <section className="reporte-cotizaciones-analisis" style={{ marginBottom: 24 }}>
              <div className="reporte-cotizaciones-analisis-bloque">
                <strong>Descripción del Reporte:</strong> Este informe muestra el análisis de las respuestas de satisfacción de los clientes obtenidas mediante el formulario de Google. Se visualizan los resultados por pregunta y opción de respuesta.
              </div>
            </section>

            {loading && generar ? (
              <div className="reporte-cotizaciones-loading">
                <ReactLoading type="spin" color="#1976d2" height={80} width={80} />
                <div style={{ marginTop: 24, fontSize: 18, color: '#1976d2' }}>Cargando reporte...</div>
              </div>
            ) : !generar ? (
              <div className="reporte-cotizaciones-loading">
                <span>El reporte aún no fue generado.</span>
                <span style={{ fontSize: 16, marginTop: 8 }}>Presione <b>Generar Reporte</b> para analizar las respuestas.</span>
              </div>
            ) : (
              <main className="reporte-cotizaciones-main">
                <div className="reporte-cotizaciones-info">
                  <div><strong>Fuente de datos:</strong> Formulario de Google</div>
                  <div><strong>Fecha y Hora:</strong> {new Date().toLocaleString()}</div>
                  <div><strong>Total de respuestas:</strong> {respuestas.length}</div>
                </div>

                {graficos.map((g, idx) => (
                  <section key={g.pregunta + idx} style={{ marginBottom: 40 }}>
                    <h2 style={{ color: '#1976d2', marginBottom: 10 }}>{g.pregunta}</h2>
                    <div className="reporte-cotizaciones-grafico" style={{ maxWidth: 400 }}>
                      <Pie
                        data={g.data}
                        options={{
                          plugins: {
                            datalabels: {
                              color: '#222',
                              font: { weight: 'bold', size: 16 },
                              formatter: (value) => value,
                            }
                          }
                        }}
                      />
                    </div>
                    <table className="reporte-cotizaciones-tabla tablachild" style={{ marginTop: 20 }}>
                      <thead>
                        <tr>
                          <th>Respuesta</th>
                          <th>Cantidad</th>
                          <th>Porcentaje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.opciones.map((op, i) => (
                          <tr key={op}>
                            <td>{op}</td>
                            <td>{g.data.datasets[0].data[i]}</td>
                            <td>{g.total ? ((g.data.datasets[0].data[i] / g.total) * 100).toFixed(1) + '%' : '0%'}</td>
                          </tr>
                        ))}
                        <tr>
                          <td><strong>Total</strong></td>
                          <td><strong>{g.total}</strong></td>
                          <td><strong>100%</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </section>
                ))}

                <section className="reporte-cotizaciones-analisis">
                  <div className="reporte-cotizaciones-analisis-bloque">
                    <strong>Observaciones:</strong>
                    <div>
                      {respuestas.length === 0
                        ? 'No hay respuestas registradas en el período.'
                        : 'La mayoría de los clientes reportan una experiencia positiva. Se recomienda mantener la calidad de atención y buscar oportunidades de mejora en las áreas con respuestas menos satisfactorias.'}
                    </div>
                  </div>
                </section>
              </main>
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
      <Footer />
    </div>
  );
};

export default AnalisisSatisfaccionCliente;
