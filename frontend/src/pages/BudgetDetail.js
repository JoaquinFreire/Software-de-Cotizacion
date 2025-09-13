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
import '../styles/reporteindividual.css';

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
        setBudget(res.data);
      } catch {
        setBudget(null);
      }
      setLoading(false);
    };
    fetchBudget();
  }, [id]);

  const show = (val) => val !== undefined && val !== null && val !== "" ? val : "No especificado";

  // Generador de PDF en memoria
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

  // Descargar PDF
  const handleDescargarPDF = async () => {
    setPdfLoading(true);
    const pdf = await generatePDF();
    if (pdf) pdf.save(`detalle_cotizacion_${show(budget.budgetId)}.pdf`);
    setPdfLoading(false);
  };

  // Enviar por Email (usa backend para mandar adjunto)
  const handleEnviarEmail = async () => {
    setMailLoading(true);
    const pdf = await generatePDF();
    if (!pdf) return;

    const pdfBlob = pdf.output('blob');
    const formData = new FormData();
    formData.append("file", pdfBlob, `cotizacion_${budget.budgetId}.pdf`);
    formData.append("to", budget.customer?.mail || "cliente@ejemplo.com");
//VER ESTO FALTA endpoint
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

  // Compartir por WhatsApp (con link al PDF en el backend)
  const handleEnviarWhatsApp = async () => {
    setWhatsAppLoading(true);

    // 👇 lo ideal es que el backend te genere un link al PDF
    const pdfLink = `${API_URL}/files/cotizacion_${budget.budgetId}.pdf`;
    const phone = budget.customer?.tel || "5493510000000"; // con código de país
    const mensaje = `Hola ${budget.customer?.name}, aquí tienes tu cotización:\n${pdfLink}`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`, "_blank");

    setWhatsAppLoading(false);
  };

  return (
    <>
      <Navbar />
      <div className="Content-bottom" style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="only-screen" style={{ margin: '24px 20px' }}>
          <button className="reporte-cotizaciones-btn-pdf" onClick={handleDescargarPDF} disabled={pdfLoading}>
            {pdfLoading ? <ReactLoading type="spin" color="#fff" height={24} width={24} /> : "Descargar PDF"}
          </button>
        </div>
        <div className="only-screen" style={{ margin: '24px 20px' }}>
          <button className="reporte-cotizaciones-btn-email" onClick={handleEnviarEmail} disabled={mailLoading}>
            {mailLoading ? <ReactLoading type="spin" color="#fff" height={24} width={24} /> : "Enviar por Email"}
          </button>
        </div>
        <div className="only-screen" style={{ margin: '24px 20px' }}>
          <button className="reporte-cotizaciones-btn-WhatsApp" onClick={handleEnviarWhatsApp} disabled={whatsAppLoading}>
            {whatsAppLoading ? <ReactLoading type="spin" color="#fff" height={24} width={24} /> : "Enviar por WhatsApp"}
          </button>
        </div>
      </div>

      {/* Contenido del PDF */}
      <div style={{ backgroundColor: '#ccc', padding: 40, display: 'flex', justifyContent: 'center' }}>
        {loading ? (
          <ReactLoading type="spin" color="#1976d2" height={80} width={80} />
        ) : budget ? (
          <div
            ref={pdfRef}
            style={{
              width: 794,
              height: 1123,
              background: '#fff',
              padding: 30,
              fontFamily: 'Arial, sans-serif',
              color: '#000',
              boxShadow: '0 0 0 1px #999',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {/* Header del PDF */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <img src={logoAnodal} alt="Logo" style={{ height: 30, marginLeft: 80 }} />
                <h1 style={{ fontSize: 28, fontWeight: 'bold', marginLeft: 40 }}>Cotización</h1>
                <div style={{ textAlign: 'right', fontSize: 14 }}>
                  <div>Anodal S.A.</div>
                  <div>Av. Japón 1292 Córdoba</div>
                  <div>info@anodal.com.ar</div>
                  <div>0351 4995870</div>
                </div>
              </div>
              <hr style={{ marginBottom: 20, borderTop: '1px solid #ccc' }} />

              {/* Datos principales */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 'bold' }}>Cotización N°: {show(budget.budgetId)}</div>
                <div style={{ textAlign: 'right', fontSize: 14 }}>
                  <div>Fecha: {new Date(budget.creationDate).toLocaleDateString()}</div>
                  <div>Válido hasta: {new Date(budget.ExpirationDate).toLocaleDateString()}</div>
                </div>
              </div>
              <hr style={{ margin: '10px 0', borderTop: '1px solid #ccc' }} />

              {/* Cliente, lugar y vendedor */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 14 }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 16 }}>Cliente</strong><br />
                  Nombre: {show(budget.customer?.name)} {show(budget.customer?.lastname)}<br />
                  Correo: {show(budget.customer?.mail)}<br />
                  Tel: {show(budget.customer?.tel)}<br />
                  Dirección: {show(budget.customer?.address)}
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 16 }}>Lugar de Trabajo</strong><br />
                  Nombre: {show(budget.workPlace?.name)}<br />
                  Dirección: {show(budget.workPlace?.address)}
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 16 }}>Vendedor</strong><br />
                  Nombre: {show(budget.user?.name)} {show(budget.user?.lastName)}<br />
                  Mail: {show(budget.user?.mail)}
                </div>
              </div>

              <hr style={{ margin: '20px 0', borderTop: '1px solid #ccc' }} />

              {/* Productos */}
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Productos</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, border: '1px solid #ccc' }}>
                <thead style={{ backgroundColor: '#f0f0f0' }}>
                  <tr>
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
                    <React.Fragment key={i}>
                      <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <td>{p.OpeningType?.name || '-'}</td>
                        <td>{p.Quantity}</td>
                        <td>{p.width}x{p.height} cm</td>
                        <td>{p.GlassComplement?.name || '-'}</td>
                        <td>{p.AlumTreatment?.name || '-'}</td>
                        <td>$ abc</td>
                        <td colSpan={6} style={{ textAlign: 'right', paddingBottom: 15, borderBottom: '1px solid #ccc' }}>
                          <b>Subtotal:</b>
                        </td>
                      </tr>
                      
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginTop:10, marginBottom: 10}}>Complemento</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, border: '1px solid #ccc' }}>
                <thead style={{ backgroundColor: '#f0f0f0' }}>
                  <tr>
                    <th>Tipo</th>
                    <th>Complemento</th>
                    <th>Dimensiones</th>
                    <th>Cantidad</th>
                    <th>Revestimiento</th>
                    <th>Precio/u</th>
                  </tr>
                </thead>
                <tbody>
                  {safeArray(budget.Products).map((p, i) => (
                    <React.Fragment key={i}>
                      {/* Debug: muestra los complementos en consola */}
                      {i === 0 && console.log('DEBUG Complements:', p.Complements)}
                      {safeArray(p.Complements).length > 0 ? (
                        safeArray(p.Complements).map((c, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                            <td>{c.type || c.Type || '-'}</td>
                            <td>{c.name || c.Name || '-'}</td>
                            <td>
                              {(c.custom?.width || '-') + 'x' + (c.custom?.height || '-') + ' cm'}
                            </td>
                            <td>{c.quantity || c.Quantity || '-'}</td>
                            <td>{c.coating || c.Coating || '-'}</td>
                            <td>${c.price || c.Price || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} style={{ color: '#888' }}>Sin complementos</td>
                        </tr>
                      )}
                      {/* Accesorios y subtotal, si quieres mantenerlos aquí */}
                      <tr>
                        <td colSpan={6} style={{ paddingLeft: 10, paddingBottom: 5 }}>
                          {p.Accesory?.length > 0 ? (
                            <div>
                              <strong style={{ textDecoration: 'underline' }}>Accesorios:</strong>
                              {safeArray(p.Accesory).map((a, j) => (
                                <div key={j} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>• {a.Name || '-'}</span>
                                  <span>x{a.Quantity}</span>
                                  <span>${a.Price}</span>
                                </div>
                              ))}
                            </div>
                          ) : <i style={{ color: '#888' }}>Sin accesorios</i>}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'right', paddingBottom: 15, borderBottom: '1px solid #ccc' }}>
                          <b>Subtotal:</b>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>

              {/* Totales */}
              <div style={{ textAlign: 'right', marginTop: 20, fontSize: 16 }}>
                <div><b>Total:</b> </div>
                <div><b>Dólar Ref:</b> {show(budget.DollarReference)}</div>
                <div><b>Mano de Obra:</b> {show(budget.LabourReference)}</div>
              </div>

              {/* Observaciones */}
              <div style={{ marginTop: 20, fontSize: 14 }}>
                <b>Observaciones:</b> {show(budget.Comment)}
              </div>
            </div>
            

            {/* Encuesta mejorada */}
            <div
              style={{
                marginTop: 30,
                padding: 20,
                border: '1px solid #26b7cd',
                borderRadius: 10,
                background: '#f5feffff',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)'
              }}
            >
              <h3 style={{ color: '#26b7cd', marginBottom: 10 }}>Encuesta de Satisfacción</h3>
              <div style={{ marginBottom: 12, fontSize: 15 }}>
                Nos gustaría conocer tu opinión sobre nuestro servicio.<br />
                Por favor, completa la siguiente encuesta:
              </div>
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSciI6afTuXOIujR1CjCTo3-HCOBaBo6cOdo7MfU_WtZ_SgvEA/viewform?usp=sharing&ouid=105538931547743841857"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <button
                  style={{
                    background: '#26b7cd',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 24px',
                    fontSize: 16,
                    cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(25, 118, 210, 0.12)'
                  }}
                >
                  Ir a la Encuesta
                </button>
              </a>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: 12, borderTop: '1px solid #ccc', paddingTop: 10 }}>
              <img src={miniLogo} alt="Mini Logo" style={{ height: 16, marginBottom: 4 }} /><br />
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
