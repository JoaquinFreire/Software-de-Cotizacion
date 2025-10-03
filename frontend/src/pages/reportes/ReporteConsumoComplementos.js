// IMPORTACIONES
import React, { useState, useRef } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import ReactLoading from 'react-loading';
import logoAnodal from '../../images/logo_secundario.webp';
import '../../styles/reportes.css';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import ScrollToTopButton from '../../components/ScrollToTopButton';
import { Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js/auto';

Chart.register(ChartDataLabels);
const API_URL = process.env.REACT_APP_API_URL;

// FUNCIONES AUXILIARES
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

// COMPONENTE PRINCIPAL
const ReporteConsumoComplementos = () => {
  const defaultDates = getDefaultDates();
  const [fechaDesde, setFechaDesde] = useState(defaultDates.desde);
  const [fechaHasta, setFechaHasta] = useState(defaultDates.hasta);
  const [generar, setGenerar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [complementosResumen, setComplementosResumen] = useState([]);
  const [detalleCotizaciones, setDetalleCotizaciones] = useState([]);
  const [error, setError] = useState(null);
  const pdfRef = useRef();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      console.log('Solicitando datos desde:', fechaDesde, 'hasta:', fechaHasta);
      
      const res = await axios.get(
        `${API_URL}/api/quotations/by-period?from=${fechaDesde}&to=${fechaHasta}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Respuesta completa del endpoint:', res.data);
      
      const cotizaciones = Array.isArray(res.data) ? res.data : [];
      console.log('Número de cotizaciones encontradas:', cotizaciones.length);

      // DEBUG: Mostrar estructura de cada cotización
      cotizaciones.forEach((cot, index) => {
        console.log(`--- Cotización ${index} ---`);
        console.log('ID:', cot.Id || cot.id);
        console.log('Cliente:', cot.Customer?.name, cot.Customer?.lastname);
        console.log('Complementos encontrados:', cot.Complements || cot.complements);
        console.log('Todas las propiedades:', Object.keys(cot));
      });

      let todosLosComplementos = [];
      
      cotizaciones.forEach(cot => {
        // Buscar complementos en diferentes posibles ubicaciones
        const comps = cot.Complements || cot.complements || [];
        console.log(`Cotización ${cot.Id}: ${comps.length} complementos encontrados`, comps);
        
        comps.forEach((c, index) => {
          const complementoData = {
            id: c.id || c.Id || c.complementId || `temp-${cot.Id}-${index}`,
            nombre: c.name || c.Name || c.nombre || c.complementName || 'Complemento sin nombre',
            cantidad: Number(c.quantity || c.Quantity || c.cantidad || 1),
            precio: Number(c.price || c.Price || c.precio || 0),
            cotizacionId: cot.Id || cot.id,
            cliente: cot.Customer ? 
              `${cot.Customer.name || ''} ${cot.Customer.lastname || ''}`.trim() : 
              'Cliente no disponible',
            fecha: cot.CreationDate || cot.creationDate
          };
          
          console.log('Complemento procesado:', complementoData);
          todosLosComplementos.push(complementoData);
        });
      });

      console.log('Total de complementos extraídos:', todosLosComplementos.length);
      console.log('Detalle de complementos:', todosLosComplementos);

      // Crear resumen agrupado por ID de complemento
      const resumenMap = {};
      todosLosComplementos.forEach(c => {
        const key = c.id;
        if (!resumenMap[key]) {
          resumenMap[key] = {
            id: c.id,
            nombre: c.nombre,
            cantidadTotal: 0,
            precioPromedio: 0,
            usadoEnCotizaciones: new Set(),
            precios: []
          };
        }
        
        resumenMap[key].cantidadTotal += c.cantidad;
        resumenMap[key].usadoEnCotizaciones.add(c.cotizacionId);
        resumenMap[key].precios.push(c.precio);
      });

      // Calcular promedios y preparar resumen final
      const resumen = Object.values(resumenMap).map(item => {
        const precioPromedio = item.precios.length > 0 ? 
          item.precios.reduce((sum, precio) => sum + precio, 0) / item.precios.length : 0;
        
        return {
          id: item.id,
          nombre: item.nombre,
          cantidadTotal: item.cantidadTotal,
          precioPromedio: precioPromedio,
          usadoEnCotizaciones: Array.from(item.usadoEnCotizaciones).length
        };
      });

      console.log('Resumen final de complementos:', resumen);

      setComplementosResumen(resumen);
      setDetalleCotizaciones(cotizaciones.filter(cot => {
        const comps = cot.Complements || cot.complements || [];
        return comps.length > 0;
      }));
      
    } catch (err) {
      console.error('Error al obtener datos:', err);
      setError('Error al cargar los datos: ' + (err.response?.data?.message || err.message));
      setComplementosResumen([]);
      setDetalleCotizaciones([]);
    }
    setLoading(false);
  };

  const handleGenerarReporte = () => {
    setGenerar(true);
    fetchData();
  };

  const handleDescargarPDF = () => {
    if (!pdfRef.current) return;
    const opt = {
      margin: [0.2, 0.2, 0.2, 0.2],
      filename: `reporte_consumo_complementos_${fechaDesde}_a_${fechaHasta}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    setTimeout(() => {
      html2pdf().set(opt).from(pdfRef.current).save();
    }, 100);
  };

  const getPieData = () => {
    if (!complementosResumen.length) return null;
    const sorted = [...complementosResumen].sort((a, b) => b.cantidadTotal - a.cantidadTotal);
    const top = sorted.slice(0, 5);
    const otros = sorted.slice(5);
    const labels = top.map(c => c.nombre.length > 20 ? c.nombre.substring(0, 20) + '...' : c.nombre);
    const data = top.map(c => c.cantidadTotal);
    if (otros.length) {
      labels.push('Otros');
      data.push(otros.reduce((sum, c) => sum + c.cantidadTotal, 0));
    }
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: [
          '#36A2EB', '#4BC0C0', '#FF6384', '#FFCE56', '#7edfc6', '#888'
        ],
        borderColor: '#222',
        borderWidth: 2,
      }]
    };
  };

  return (
    <div className="dashboard-container">
      <Navigation />
      <h2 className="title">Reporte de Consumo de Complementos</h2>

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
            <button className="botton-Report" onClick={handleGenerarReporte} disabled={loading || !fechaDesde || !fechaHasta}>
              {loading ? 'Cargando...' : 'Generar Reporte'}
            </button>
            <button className="reporte-cotizaciones-btn-pdf" onClick={handleDescargarPDF} disabled={!generar || complementosResumen.length === 0}>
              Guardar PDF
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message" style={{ 
            color: 'red', 
            padding: '10px', 
            margin: '10px 0', 
            border: '1px solid red',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}

        <div className="reporte-cotizaciones-a4">
          <div className="reporte-cotizaciones-pdf" ref={pdfRef}>
            <header className="reporte-cotizaciones-header">
              <img src={logoAnodal} alt="Logo Anodal" className="reporte-cotizaciones-logo" />
              <h1 className="reporte-cotizaciones-title">Reporte de Consumo de Complementos</h1>
              <div className="reporte-cotizaciones-logo-placeholder" />
            </header>

            {loading && generar ? (
              <div className="reporte-cotizaciones-estado-cargando">
                <ReactLoading type="spin" color="#1976d2" height={80} width={80} />
                <div className="reporte-cotizaciones-texto-cargando">Cargando reporte...</div>
              </div>
            ) : !generar ? (
              <div className="reporte-cotizaciones-no-generado">
                <span>El reporte aún no fue generado.</span>
                <span className="reporte-cotizaciones-instruccion">Seleccione un rango de fechas y presione <b>Generar Reporte</b>.</span>
              </div>
            ) : (
              <main className="reporte-cotizaciones-main">
                <div className="reporte-cotizaciones-info">
                  <div><strong>Período:</strong> {formatFecha(fechaDesde)} al {formatFecha(fechaHasta)}</div>
                  <div><strong>Destinatario:</strong> {window.localStorage.getItem('usuario') || 'Usuario'}</div>
                  <div><strong>Fecha y Hora:</strong> {new Date().toLocaleString()}</div>
                  <div><strong>Total de cotizaciones con complementos:</strong> {detalleCotizaciones.length}</div>
                  <div><strong>Total de complementos diferentes:</strong> {complementosResumen.length}</div>
                </div>

                {complementosResumen.length > 0 ? (
                  <>
                    <section className="reporte-cotizaciones-chart">
                      <h3>Complementos más usados</h3>
                      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                        <Pie
                          data={getPieData()}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: {
                                position: 'bottom',
                              },
                              datalabels: {
                                color: '#222',
                                font: { weight: 'bold', size: 14 },
                                formatter: (value) => value,
                              }
                            }
                          }}
                        />
                      </div>
                    </section>

                    <h3>Resumen de Consumo de Complementos</h3>
                    <div className="tabla-cotizaciones-responsive">
                      <table className="reporte-cotizaciones-tabla tablachild">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Cantidad Total</th>
                            <th>Precio Promedio</th>
                            <th>Usado en # Cotizaciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {complementosResumen.map(c => (
                            <tr key={c.id}>
                              <td>{c.id}</td>
                              <td>{c.nombre}</td>
                              <td>{c.cantidadTotal}</td>
                              <td>${c.precioPromedio.toFixed(2)}</td>
                              <td>{c.usadoEnCotizaciones}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <details className="reporte-cotizaciones-detalle">
                      <summary>Ver detalle de cotizaciones ({detalleCotizaciones.length} cotizaciones con complementos)</summary>
                      <div className="tabla-cotizaciones-responsive">
                        <table className="reporte-cotizaciones-tabla tabla-ajustada">
                          <thead>
                            <tr>
                              <th>ID Cotización</th>
                              <th>Cliente</th>
                              <th>Fecha</th>
                              <th>Complementos</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detalleCotizaciones.map(cot => {
                              const comps = cot.Complements || cot.complements || [];
                              return (
                                <tr key={cot.Id || cot.id}>
                                  <td>{cot.Id || cot.id}</td>
                                  <td>{(cot.Customer?.name || cot.customer?.name || '') + ' ' + (cot.Customer?.lastname || cot.customer?.lastname || '')}</td>
                                  <td>{formatFecha(cot.CreationDate?.slice(0, 10) || cot.creationDate?.slice(0, 10) || '')}</td>
                                  <td>
                                    {comps.map((c, index) => (
                                      <div key={c.id || c.complementId || index} style={{ marginBottom: '4px' }}>
                                        • {c.name || c.Name || c.nombre || 'Complemento'} 
                                        (x{c.quantity || c.Quantity || c.cantidad || 1}) - 
                                        ${(c.price || c.Price || c.precio || 0).toFixed(2)}
                                      </div>
                                    ))}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  </>
                ) : (
                  <div className="reporte-cotizaciones-no-data">
                    <h3>No se encontraron complementos</h3>
                    <p>No hay complementos registrados en las cotizaciones del período seleccionado.</p>
                    <p><strong>Sugerencias:</strong></p>
                    <ul>
                      <li>Verifique que el rango de fechas sea correcto</li>
                      <li>Asegúrese de que las cotizaciones tengan complementos asociados</li>
                      <li>Revise la consola del navegador para más detalles (F12 → Console)</li>
                    </ul>
                  </div>
                )}
              </main>
            )}

            <footer className="reporte-cotizaciones-footer">
              <div className="reporte-cotizaciones-direccion">
                <span>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="#1976d2" xmlns="http://www.w3.org/2000/svg">
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
      <ScrollToTopButton />
      <Footer />
    </div>
  );
};

export default ReporteConsumoComplementos;