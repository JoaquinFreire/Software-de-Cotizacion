import React, { useState, useRef } from 'react';
import { Pie } from 'react-chartjs-2';
import axios from 'axios';
import 'chart.js/auto';
import logoAnodal from '../../images/logo_secundario.png';
import '../../styles/reportes.css';
import '../../styles/reporteindividual.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_URL = process.env.REACT_APP_API_URL;

const getDefaultDates = () => {
  const year = new Date().getFullYear();
  return {
    desde: `${year}-01-01`,
    hasta: `${year}-12-31`
  };
};

const ReporteEstadoCotizaciones = () => {
  const defaultDates = getDefaultDates();
  const [fechaDesde, setFechaDesde] = useState(defaultDates.desde);
  const [fechaHasta, setFechaHasta] = useState(defaultDates.hasta);
  const [generar, setGenerar] = useState(false);
  const [counts, setCounts] = useState([0, 0, 0, 0]); // [Pendiente, Aprobado, Rechazado, Finalizado]
  const [loading, setLoading] = useState(false);

  // Ref para el área a exportar como PDF
  const pdfRef = useRef();

  const fetchData = async () => {
    if (!fechaDesde || !fechaHasta) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${API_URL}/api/quotations/by-period?from=${fechaDesde}&to=${fechaHasta}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Contar por estado
      const data = res.data;
      const newCounts = [
        data.filter(q => q.Status === 'pending').length,
        data.filter(q => q.Status === 'approved').length,
        data.filter(q => q.Status === 'rejected').length,
        data.filter(q => q.Status === 'finished').length,
      ];
      setCounts(newCounts);
    } catch (err) {
      setCounts([0, 0, 0, 0]);
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
    const input = pdfRef.current;
    const canvas = await html2canvas(input, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    let position = 0;

    // Si la imagen es más alta que la página, hacer multipágina
    if (pdfHeight < pageHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    } else {
      let heightLeft = pdfHeight;
      while (heightLeft > 0) {
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
        position -= pageHeight;
        if (heightLeft > 0) pdf.addPage();
      }
    }
    pdf.save(`reporte_estado_cotizaciones_${fechaDesde}_a_${fechaHasta}.pdf`);
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

  return (
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
          <button onClick={handleGenerarReporte} disabled={loading || !fechaDesde || !fechaHasta}>
            {loading ? 'Cargando...' : 'Generar Reporte'}
          </button>
          <button
            className="reporte-cotizaciones-btn-pdf"
            onClick={handleDescargarPDF}
            disabled={!generar}
          >
            Descargar PDF
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
          {generar && (
            <main className="reporte-cotizaciones-main">
              {/* Info superior */}
              <div className="reporte-cotizaciones-info">
                <div>
                  <strong>Período:</strong> {fechaDesde || '____'} al {fechaHasta || '____'}
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
                <Pie data={data} />
              </div>

              {/* Tabla */}
              <table className="reporte-cotizaciones-tabla">
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
            </main>
          )}

          {/* Pie de página */}
          <footer className="reporte-cotizaciones-footer">
            <div className="reporte-cotizaciones-direccion">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {/* SVG de ubicación */}
                <svg width="18" height="18" viewBox="0 0 20 20" fill="#1976d2" xmlns="http://www.w3.org/2000/svg" style={{marginRight: 4}}>
                  <path d="M10 2C6.686 2 4 4.686 4 8c0 4.418 5.25 9.54 5.473 9.753a1 1 0 0 0 1.054 0C10.75 17.54 16 12.418 16 8c0-3.314-2.686-6-6-6zm0 15.07C8.14 15.13 6 11.98 6 8c0-2.206 1.794-4 4-4s4 1.794 4 4c0 3.98-2.14 7.13-4 7.07z"/>
                  <circle cx="10" cy="8" r="2" fill="#1976d2"/>
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

export default ReporteEstadoCotizaciones;