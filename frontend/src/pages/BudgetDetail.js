import React, { useEffect, useState, useRef } from 'react'; 
import { useParams } from 'react-router-dom';
import axios from 'axios';
import logoAnodal from '../images/logo_secundario.webp';
import miniLogo from '../images/logo_secundario.webp';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactLoading from 'react-loading';
import Navbar from '../components/Navigation';
import { safeArray } from '../utils/safeArray';
import '../styles/BudgetDetail.css';
import Qrcode from '../images/qr-code.png';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5187";

const BudgetDetail = () => {
  const { id } = useParams();
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [mailLoading, setMailLoading] = useState(false);
  const [whatsAppLoading, setWhatsAppLoading] = useState(false);
  const pdfRef = useRef();

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/Mongo/GetBudgetByBudgetId/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(res.data);
        setBudget(res.data);
      } catch {
        setBudget(null);
      }
      setLoading(false);
    };
    fetchBudget();
  }, [id]);

  const show = (val) => val !== undefined && val !== null && val !== "" ? val : "No especificado";

  const generatePDF = async () => {
    if (!pdfRef.current) return null;
    const input = pdfRef.current;
    const canvas = await html2canvas(input, { scale: 3, useCORS: true });
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;

    let position = 0;
    let heightLeft = pdfHeight;
    let pageNumber = 1;

    while (heightLeft > 0) {
      pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, pdfHeight);
      pdf.setFontSize(10);
      pdf.text(`Página ${pageNumber}`, pageWidth - 60, pageHeight - 10);
      pdf.addImage(miniLogo, 'PNG', 20, pageHeight - 30, 20, 20);
      heightLeft -= pageHeight;
      position -= pageHeight;
      if (heightLeft > 0) pdf.addPage();
      pageNumber++;
    }

    return pdf;
  };

  const handleDescargarPDF = async () => {
    setPdfLoading(true);
    const pdf = await generatePDF();
    if (pdf) pdf.save(`detalle_cotizacion_${show(budget.budgetId)}.pdf`);
    setPdfLoading(false);
  };

  const handleEnviarEmail = async () => {
    setMailLoading(true);
    const pdf = await generatePDF();
    if (!pdf) return;
    const pdfBlob = pdf.output('blob');
    const formData = new FormData();
    formData.append("file", pdfBlob, `cotizacion_${budget.budgetId}.pdf`);
    formData.append("to", budget.customer?.mail || "cliente@ejemplo.com");

    try {
      await axios.post(`${API_URL}/api/SendMail`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      alert("Correo enviado correctamente ✅");
    } catch (err) {
      console.error(err);
      alert("Error enviando el correo ❌");
    }
    setMailLoading(false);
  };

  const handleEnviarWhatsApp = async () => {
    setWhatsAppLoading(true);
    const pdfLink = `${API_URL}/files/cotizacion_${budget.budgetId}.pdf`;
    const phone = budget.customer?.tel || "5493510000000"; 
    const mensaje = `Hola ${budget.customer?.name}, aquí tienes tu cotización:\n${pdfLink}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`, "_blank");
    setWhatsAppLoading(false);
  };

  // Helper: asegura párrafo (double newline) antes de frases clave
  const insertParagraphsBefore = (text) => {
    if (!text) return text || '';
    const phrases = [
      "Validez de la cotización",
      "Todo pedido queda sujeto",
      "Los precios presupuestados se",
      "Fuerza mayor Anodal no será responsable",
      "Solicitudes de cambios del cliente",
      "Impuestos Los precios cotizados"
    ].map(p => p.trim().toLowerCase());

    let out = String(text);
    let lower = out.toLowerCase();

    for (const phrase of phrases) {
      let start = 0;
      while (true) {
        const idx = lower.indexOf(phrase, start);
        if (idx === -1) break;

        // si ya hay doble salto justo antes o estamos al inicio, no insertar
        const before = out.slice(0, idx);
        if (!before.endsWith('\n\n') && before !== '') {
          out = before + '\n\n' + out.slice(idx);
          // actualizar lower y avanzar índice pasado lo insertado
          lower = out.toLowerCase();
          start = idx + 2 + phrase.length;
        } else {
          start = idx + phrase.length;
        }
      }
    }

    // normalizar >2 saltos a exactamente 2 (evita acumulaciones)
    out = out.replace(/\n{3,}/g, '\n\n');
    return out;
  };

  return (
    <>
      <Navbar />
      <div className="content-bottom">
        <div className="only-screen">
          <button className="reporte-cotizaciones-btn-pdf" onClick={handleDescargarPDF} disabled={pdfLoading}>
            {pdfLoading ? <ReactLoading type="spin" color="#fff" height={24} width={24} /> : "Descargar PDF"}
          </button>
        </div>
        <div className="only-screen">
          <button className="reporte-cotizaciones-btn-email" onClick={handleEnviarEmail} disabled={mailLoading}>
            {mailLoading ? <ReactLoading type="spin" color="#fff" height={24} width={24} /> : "Enviar por Email"}
          </button>
        </div>
        <div className="only-screen">
          <button className="reporte-cotizaciones-btn-whatsapp" onClick={handleEnviarWhatsApp} disabled={whatsAppLoading}>
            {whatsAppLoading ? <ReactLoading type="spin" color="#fff" height={24} width={24} /> : "Enviar por WhatsApp"}
          </button>
        </div>
      </div>

      <div className="pdf-background">
        {loading ? (
          <ReactLoading type="spin" color="#1976d2" height={80} width={80} />
        ) : budget ? (
          <div ref={pdfRef} className="pdf-container">
            {/* Header */}
            <div>
              <div className="pdf-header">
                <img src={logoAnodal} alt="Logo" className="pdf-logo" />
                <h1 className="pdf-title">Cotización</h1>
                <div className="pdf-company-info">
                  <div>Anodal S.A.</div>
                  <div>Av. Japón 1292 Córdoba</div>
                  <div>info@anodal.com.ar</div>
                  <div>0351 4995870</div>
                </div>
              </div>
              <hr className="pdf-separator" />

              {/* Datos principales */}
              <div className="pdf-main-data">
                <div className="pdf-budget-id">Cotización N°: {show(budget.budgetId)}</div>
                <div className="pdf-date-info">
                  <div>Fecha: {new Date(budget.creationDate).toLocaleDateString()}</div>
                  <div>Válido hasta: {new Date(budget.ExpirationDate).toLocaleDateString()}</div>
                </div>
              </div>
              <hr className="pdf-separator" />

              {/* Cliente, lugar y vendedor */}
              <div className="pdf-sections">
                <div className="pdf-section">
                  <h4><strong>Cliente</strong><br /></h4>
                  Nombre: {show(budget.customer?.name)} {show(budget.customer?.lastname)}<br />
                  Correo: {show(budget.customer?.mail)}<br />
                  Tel: {show(budget.customer?.tel)}<br />
                  Dirección: {show(budget.customer?.address)}
                </div>
                <div className="pdf-section">
                  <h4><strong>Lugar de Trabajo</strong><br /></h4>
                  Nombre: {show(budget.workPlace?.name)}<br />
                  Dirección: {show(budget.workPlace?.address)}
                </div>
                <div className="pdf-section">
                  <h4><strong>Vendedor</strong><br /></h4>
                  Nombre: {show(budget.user?.name)} {show(budget.user?.lastName)}<br />
                  Mail: {show(budget.user?.mail)}
                </div>
              </div>
              <hr className="pdf-separator" />

              {/* Productos */}
              <h3 className="pdf-subtitle">Abertura</h3>
              <table className="pdf-table">
                <thead>
                  <tr className="pdf-Date">
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Dimensiones</th>
                    <th>Vidrio</th>
                    <th>Tratamiento</th>
                    <th>Precio/u</th>
                  </tr>
                </thead>
                <tbody>
                  {safeArray(budget.Products).map((p, i) => (
                    <tr key={i}>
                      <td>{p.OpeningType?.name || '-'}</td>
                      <td>{p.Quantity}</td>
                      <td>{p.width}x{p.height} cm</td>
                      <td>{p.GlassType?.name || '-'}</td>
                      <td>{p.AlumTreatment?.name || '-'}</td>
                      <td>{p.price ? `$${p.price}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Complementos Puerta */}
              {safeArray(budget.Complement?.$values).some(c => safeArray(c.ComplementDoor?.$values).length > 0) && (
                <>
                  <h3 className="pdf-subtitle">Complemento Puerta</h3>
                  <table className="pdf-table">
                    <thead>
                      <tr className="pdf-Date">
                        <th>Tipo</th>
                        <th>Dimensiones</th>
                        <th>Cantidad</th>
                        <th>Revestimiento</th>
                        <th>Precio/u</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeArray(budget.Complement?.$values).map((c, i) => (
                        safeArray(c.ComplementDoor?.$values).length > 0 ? (
                          safeArray(c.ComplementDoor.$values).map((door, idx) => (
                            <tr key={idx}>
                              <td>{door?.Name || '-'}</td>
                              <td>{door?.Width}x{door?.Weight} cm</td>
                              <td>{door?.Quantity || '-'}</td>
                              <td>{door?.Coating?.name || '-'}</td>
                              <td>${door?.Price || '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr key={i}>
                            <td colSpan={5} className="pdf-empty">Sin complementos</td>
                          </tr>
                        )
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* Complementos Baranda */}
              {safeArray(budget.Complement?.$values).some(c => safeArray(c.ComplementRailing?.$values).length > 0) && (
                <>
                  <h3 className="pdf-subtitle">Complemento Baranda</h3>
                  <table className="pdf-table">
                    <thead>
                      <tr className="pdf-Date">
                        <th>Tipo</th>
                        <th>Cantidad</th>
                        <th>Tratamiento</th>
                        <th>Precio/u</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeArray(budget.Complement?.$values).map((c, i) => (
                        safeArray(c.ComplementRailing?.$values).length > 0 ? (
                          safeArray(c.ComplementRailing.$values).map((railing, idx) => (
                            <tr key={idx}>
                              <td>{railing?.Name || '-'}</td>
                              <td>{railing?.Quantity || '-'}</td>
                              <td>{railing?.AlumTreatment?.name || '-'}</td>
                              <td>${railing?.Price || '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr key={i}>
                            <td colSpan={5} className="pdf-empty">Sin complementos</td>
                          </tr>
                        )
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* Complementos Tabique */}
              {safeArray(budget.Complement?.$values).some(c => safeArray(c.ComplementPartition?.$values).length > 0) && (
                <>
                  <h3 className="pdf-subtitle">Complemento Tabique</h3>
                  <table className="pdf-table">
                    <thead>
                      <tr className="pdf-Date">
                        <th>Tipo</th>
                        <th>Alto</th>
                        <th>Cantidad</th>
                        <th>Espesor</th>
                        <th>Simple</th>
                        <th>Precio/u</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeArray(budget.Complement?.$values).map((c, i) => (
                        safeArray(c.ComplementPartition?.$values).length > 0 ? (
                          safeArray(c.ComplementPartition.$values).map((partition, idx) => (
                            <tr key={idx}>
                              <td>{partition?.Name || '-'}</td>
                              <td>{partition?.Height} cm</td>
                              <td>{partition?.Quantity || '-'}</td>
                              <td>{partition?.GlassMilimeters || '-'}</td>
                              <td>{partition?.Simple || 'No'}</td>
                              <td>${partition?.Price || '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr key={i}>
                            <td colSpan={5} className="pdf-empty">Sin complementos</td>
                          </tr>
                        )
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* Totales */}
              <div className="pdf-totals">
                <div><b>Dólar Ref:</b> {show(budget.DollarReference)}</div>
                <div><b>Mano de Obra:</b> {show(budget.LabourReference)}</div>
                <h3 className="pdf-total" ><b>Total:</b></h3>{show(budget.Total)}
              </div>
              <hr className="pdf-separator" />
              {/* Observaciones */}
              <div className="pdf-comments">
                <b>Observaciones:</b>
                {(() => {
                  const raw = budget?.Comment ?? "";
                  const formatted = insertParagraphsBefore(raw);
                  // dividir en párrafos por doble salto de línea
                  const paragraphs = formatted.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
                  if (paragraphs.length === 0) return <div>{show(raw)}</div>;
                  return paragraphs.map((p, i) => (
                    <p key={i} style={{ margin: '6px 0' }} dangerouslySetInnerHTML={{ __html: p.replace(/\n/g, '<br/>') }} />
                  ));
                })()}
              </div>
            </div>

            {/* Encuesta */}
            <div className="pdf-survey">
              <h3>Encuesta de Satisfacción</h3>
              <div>
                Nos gustaría conocer tu opinión sobre nuestro servicio.<br />
                Por favor, completa la siguiente encuesta:
              </div>
              <img src={Qrcode} alt="QR Code" className="pdf-qr-code" />
              <div className="pdf-qr-instruction">Escanea el código QR para acceder a la encuesta</div>
            </div>

            {/* Footer */}
            <div className="pdf-footer">
              <img src={miniLogo} alt="Mini Logo" /><br />
              Avenida Japón 1292 / Córdoba / Argentina<br />
              Solo para uso interno de la empresa Anodal S.A.
            </div>
          </div>
        ) : (
          <div>No se encontró la cotización.</div>
        )}
      </div>
    </>
  );
};

export default BudgetDetail;
