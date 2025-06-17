import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import logoAnodal from '../images/logo_secundario.png';
import '../styles/reporteindividual.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactLoading from 'react-loading';
import Navbar from '../components/Navigation'; // Cambia el path si tu navbar está en otro lugar

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5187";

const BudgetDetail = () => {
  const { id } = useParams();
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const pdfRef = useRef();

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/Mongo/GetBudgetByBudgetId/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setBudget(res.data);
      } catch (err) {
        setBudget(null);
      }
      setLoading(false);
    };
    fetchBudget();
  }, [id]);

  const show = (val) => val !== undefined && val !== null && val !== "" ? val : "No especificado";

  const handleDescargarPDF = async () => {
    if (!pdfRef.current) return;
    setPdfLoading(true);
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
    pdf.save(`detalle_cotizacion_${show(budget.budgetId)}.pdf`);
    setPdfLoading(false);
  };

  return (
    <>
      <Navbar />

      {/* Botón fuera del área exportable */}
      <div className="only-screen" style={{display: 'flex', justifyContent: 'center', margin: '24px 0'}}>
        <button
          className="reporte-cotizaciones-btn-pdf"
          onClick={handleDescargarPDF}
          disabled={pdfLoading}
        >
          {pdfLoading ? (
            <ReactLoading type="spin" color="#fff" height={24} width={24} />
          ) : (
            "Descargar PDF"
          )}
        </button>
      </div>

      {/* Contenedor centrado para el PDF */}
      <div className="budget-detail-main-bg" style={{ minHeight: "100vh", background: "rgb(51, 57, 71)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="budget-detail-center" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
          <div style={{position: 'relative', display: "flex", alignItems: "center", justifyContent: "center"}}>
            {/* Spinner sobre el área del PDF */}
            {loading && (
              <div className="budget-detail-loading-overlay" style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(255,255,255,0.8)",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                minWidth: 794, minHeight: 1123
              }}>
                <ReactLoading type="spin" color="#1976d2" height={80} width={80} />
              </div>
            )}

            {/* Área exportable */}
            {!loading && budget && (
              <div className="reporte-cotizaciones-root" style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
                <div className="reporte-cotizaciones-a4" style={{margin: "0 auto"}}>
                  <div className="reporte-cotizaciones-pdf" ref={pdfRef}>
                    <header className="reporte-cotizaciones-header">
                      <img src={logoAnodal} alt="Logo Anodal" className="reporte-cotizaciones-logo" />
                      <h1 className="reporte-cotizaciones-title">Detalle de Cotización</h1>
                      <div className="reporte-cotizaciones-logo-placeholder" />
                    </header>
                    <main className="reporte-cotizaciones-main">
                      <div className="reporte-cotizaciones-info">
                        <div>
                          <strong>ID:</strong> {show(budget.budgetId)}
                        </div>
                        <div>
                          <strong>Versión:</strong> {show(budget.version)}
                        </div>
                        <div>
                          <strong>Estado:</strong> {show(budget.status)}
                        </div>
                        <div>
                          <strong>Fecha de creación:</strong> {budget.creationDate ? new Date(budget.creationDate).toLocaleString() : "No especificado"}
                        </div>
                        <div>
                          <strong>Fecha de vencimiento:</strong> {budget.ExpirationDate ? new Date(budget.ExpirationDate).toLocaleString() : "No especificado"}
                        </div>
                      </div>
                      <section className="reporte-cotizaciones-analisis">
                        <div className="reporte-cotizaciones-analisis-bloque">
                          <strong>Usuario que creó:</strong><br />
                          {budget.user &&
                            <>
                              <b>Nombre:</b> {show(budget.user.name)}<br />
                              <b>Apellido:</b> {show(budget.user.lastName)}<br />
                              <b>Mail:</b> {show(budget.user.mail)}
                            </>
                          }
                        </div>
                        <div className="reporte-cotizaciones-analisis-bloque">
                          <strong>Cliente:</strong><br />
                          {budget.customer &&
                            <>
                              <b>Nombre:</b> {show(budget.customer.name)}<br />
                              <b>Apellido:</b> {show(budget.customer.lastname)}<br />
                              <b>Tel:</b> {show(budget.customer.tel)}<br />
                              <b>Mail:</b> {show(budget.customer.mail)}<br />
                              <b>Dirección:</b> {show(budget.customer.address)}<br />
                              <b>DNI:</b> {show(budget.customer.dni)}<br />
                              <b>Agente:</b> {budget.customer.agent &&
                                <>
                                  <br /><b>Nombre:</b> {show(budget.customer.agent.name)}
                                  <br /><b>Apellido:</b> {show(budget.customer.agent.lastname)}
                                  <br /><b>Tel:</b> {show(budget.customer.agent.tel)}
                                  <br /><b>Mail:</b> {show(budget.customer.agent.mail)}
                                </>
                              }
                            </>
                          }
                        </div>
                        <div className="reporte-cotizaciones-analisis-bloque">
                          <strong>Lugar de trabajo:</strong><br />
                          {budget.workPlace &&
                            <>
                              <b>Nombre:</b> {show(budget.workPlace.name)}<br />
                              <b>Dirección:</b> {show(budget.workPlace.address)}<br />
                              <b>Tipo de trabajo:</b> {budget.workPlace.WorkType?.type}
                            </>
                          }
                        </div>
                        <div className="reporte-cotizaciones-analisis-bloque">
                          <strong>Comentario:</strong> {show(budget.Comment)}
                        </div>
                        <div className="reporte-cotizaciones-analisis-bloque">
                          <strong>Productos:</strong>
                          <ul>
                            {(budget.Products || []).map((prod, idx) => (
                              <li key={idx}>
                                <b>Abertura:</b> {prod.OpeningType?.name || "N/A"}<br />
                                <b>Cantidad:</b> {prod.Quantity}<br />
                                <b>Tratamiento aluminio:</b> {prod.AlumTreatment?.name || "N/A"}<br />
                                <b>Vidrio:</b> {prod.GlassComplement?.name || "N/A"}<br />
                                <b>Precio vidrio:</b> ${prod.GlassComplement?.price ?? "N/A"}<br />
                                <b>Ancho:</b> {prod.width}<br />
                                <b>Alto:</b> {prod.height}<br />
                                <b>Accesorios:</b> {(prod.Accesory && prod.Accesory.length > 0)
                                  ? prod.Accesory.map((a, i) => <span key={i}>{a.name}{i < prod.Accesory.length - 1 ? ', ' : ''}</span>)
                                  : "Ninguno"}
                                <hr />
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="reporte-cotizaciones-analisis-bloque">
                          <strong>Referencias:</strong><br />
                          <b>Dólar:</b> {show(budget.DollarReference)}<br />
                          <b>Mano de obra:</b> {show(budget.LabourReference)}
                        </div>
                        <div className="reporte-cotizaciones-analisis-bloque">
                          <strong>Total:</strong> ${show(budget.Total)}
                        </div>
                      </section>
                    </main>
                    <footer className="reporte-cotizaciones-footer">
                      <div className="reporte-cotizaciones-direccion">
                        Avenida Japón 1292 / Córdoba / Argentina<br />
                        Solo para uso interno de la empresa Anodal S.A.
                      </div>
                      <img src={logoAnodal} alt="Logo Anodal" className="reporte-cotizaciones-footer-logo" />
                    </footer>
                  </div>
                </div>
              </div>
            )}
            {!loading && !budget && (
              <div style={{padding: 40, textAlign: 'center', background: '#fff', borderRadius: 12}}>
                No se encontró la cotización.
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Estilos para ocultar elementos en PDF */}
      <style>
        {`
          @media print {
            .only-screen {
              display: none !important;
            }
          }
        `}
      </style>
    </>
  );
};

export default BudgetDetail;