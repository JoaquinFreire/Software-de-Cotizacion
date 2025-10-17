import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import html2pdf from 'html2pdf.js';
import ReactLoading from 'react-loading';
import logoAnodal from '../../images/logo_secundario.webp';
import '../../styles/reportes.css';
import '../../styles/reporteindividual.css';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import ScrollToTopButton from '../../components/ScrollToTopButton';

const API_URL = process.env.REACT_APP_API_URL;

const formatFecha = (fecha) => {
  if (!fecha) return '';
  const [datePart] = fecha.split('T');
  const [y, m, d] = datePart.split('-');
  return `${d}-${m}-${y.slice(2)}`;
};

const getComplementNames = (complement) => {
  // Devuelve un array de nombres de complementos usados en un presupuesto
  if (!complement) return [];
  let names = [];
  if (Array.isArray(complement)) {
    complement.forEach(c => {
      if (!c) return;
      if (c.ComplementDoor && Array.isArray(c.ComplementDoor)) {
        c.ComplementDoor.forEach(cd => cd?.name && names.push(cd.name));
      }
      if (c.ComplementRailing && Array.isArray(c.ComplementRailing)) {
        c.ComplementRailing.forEach(cr => cr?.name && names.push(cr.name));
      }
      if (c.ComplementPartition && Array.isArray(c.ComplementPartition)) {
        c.ComplementPartition.forEach(cp => cp?.name && names.push(cp.name));
      }
    });
  }
  return names;
};

const ReporteConsumoComplementos = () => {
  const [loading, setLoading] = useState(false);
  const [budgets, setBudgets] = useState([]);
  const [complementCounts, setComplementCounts] = useState({});
  const [generar, setGenerar] = useState(false);
  const pdfRef = useRef();

  useEffect(() => {
    if (!generar) return;
    setLoading(true);
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/Mongo/GetAllBudgetsWithComplements`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = Array.isArray(res.data) ? res.data : [];
        setBudgets(data);

        // Contar complementos
        const counts = {};
        data.forEach(b => {
          const names = getComplementNames(b.Complement || b.complement);
          names.forEach(name => {
            counts[name] = (counts[name] || 0) + 1;
          });
        });
        setComplementCounts(counts);
      } catch (err) {
        setBudgets([]);
        setComplementCounts({});
      }
      setLoading(false);
    };
    fetchData();
  }, [generar]);

  const handleGenerarReporte = () => setGenerar(true);

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

  // Datos para el gráfico
  const complementNames = Object.keys(complementCounts);
  const complementValues = complementNames.map(name => complementCounts[name]);
  const maxUsed = complementNames.length
    ? complementNames[complementValues.indexOf(Math.max(...complementValues))]
    : null;

  const chartData = {
    labels: complementNames,
    datasets: [{
      label: 'Cantidad de usos',
      data: complementValues,
      backgroundColor: '#36A2EB',
      borderColor: '#222',
      borderWidth: 2,
    }]
  };

  return (
    <div className="dashboard-container">
      <Navigation />
      <h2 className="title">Reporte de Consumo de Complementos</h2>
      <div className="reporte-cotizaciones-root">
        <div className="reporte-cotizaciones-toolbar">
          <button className="botton-Report" onClick={handleGenerarReporte} disabled={loading || generar}>
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
        <div className="reporte-cotizaciones-a4">
          <div className="reporte-cotizaciones-pdf" ref={pdfRef}>
            <header className="reporte-cotizaciones-header">
              <img src={logoAnodal} alt="Logo Anodal" className="reporte-cotizaciones-logo" />
              <h1 className="reporte-cotizaciones-title">Reporte de Consumo de Complementos</h1>
              <div className="reporte-cotizaciones-logo-placeholder" />
            </header>
            {loading && generar ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', minHeight: 500
              }}>
                <ReactLoading type="spin" color="#1976d2" height={80} width={80} />
                <div style={{ marginTop: 24, fontSize: 18, color: '#1976d2' }}>Cargando reporte...</div>
              </div>
            ) : !generar ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', minHeight: 500, color: '#888', fontSize: 20
              }}>
                <span>El reporte aún no fue generado.</span>
                <span style={{ fontSize: 16, marginTop: 8 }}>Presione <b>Generar Reporte</b> para ver el consumo de complementos.</span>
              </div>
            ) : (
              <main className="reporte-cotizaciones-main">
                <div className="reporte-cotizaciones-info">
                  <div>
                    <strong>Fecha y Hora:</strong> {new Date().toLocaleString()}
                  </div>
                  <div>
                    <strong>Destinatario:</strong> {window.localStorage.getItem('usuario') || 'Usuario'}
                  </div>
                </div>
                {/* Gráfico de barras */}
                <section style={{ margin: '30px 0 10px 0' }}>
                  <h3 style={{ marginBottom: 10 }}>Complementos más usados</h3>
                  {complementNames.length === 0 ? (
                    <div>No hay complementos registrados en las cotizaciones.</div>
                  ) : (
                    <div style={{ maxWidth: 700, margin: '0 auto' }}>
                      <Bar
                        data={chartData}
                        options={{
                          plugins: {
                            datalabels: {
                              color: '#222',
                              font: { weight: 'bold', size: 16 },
                              anchor: 'end',
                              align: 'top',
                              formatter: (value) => value,
                            }
                          },
                          indexAxis: 'y',
                          responsive: true,
                          scales: {
                            x: { beginAtZero: true, precision: 0 }
                          }
                        }}
                      />
                    </div>
                  )}
                  {maxUsed && (
                    <div style={{ marginTop: 16 }}>
                      <strong>Complemento más usado:</strong> {maxUsed} ({complementCounts[maxUsed]} usos)
                    </div>
                  )}
                </section>
                {/* Tabla de cotizaciones con complementos */}
                <section style={{ marginTop: 30 }}>
                  <h3 style={{ marginBottom: 10 }}>Cotizaciones con Complementos</h3>
                  {budgets.length === 0 ? (
                    <div>No hay cotizaciones con complementos.</div>
                  ) : (
                    <div className="tabla-cotizaciones-responsive">
                      <table className="reporte-cotizaciones-tabla tabla-ajustada">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Cliente</th>
                            <th>Fecha Creación</th>
                            <th>Complementos</th>
                            <th>Comentario</th>
                          </tr>
                        </thead>
                        <tbody>
                          {budgets.map(b => {
                            const complementos = getComplementNames(b.Complement || b.complement);
                            if (complementos.length === 0) return null;
                            return (
                              <tr key={b.budgetId || b._id || Math.random()}>
                                <td>{b.budgetId || b._id || ''}</td>
                                <td>
                                  {b.customer?.name || ''} {b.customer?.lastname || ''}
                                </td>
                                <td>{b.creationDate ? formatFecha(b.creationDate) : ''}</td>
                                <td>{complementos.join(', ')}</td>
                                <td>{b.Comment || b.comment || ''}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
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
        <ScrollToTopButton />
      </div>
      <Footer />
    </div>
  );
};

export default ReporteConsumoComplementos;
