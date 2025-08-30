import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import logoAnodal from '../images/logo_secundario.png';
import miniLogo from '../images/logo_secundario.png';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactLoading from 'react-loading';
import Navbar from '../components/Navigation';
import '../styles/reporteindividual.css';

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
        const res = await axios.get(`${API_URL}/api/Mongo/GetBudgetByBudgetId/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(res.data, "res.data");
        setBudget(res.data);
      } catch {
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

    pdf.save(`detalle_cotizacion_${show(budget.budgetId)}.pdf`);
    setPdfLoading(false);
  };

  return (
    <>
      <Navbar />
      <div className="only-screen" style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
        <button className="reporte-cotizaciones-btn-pdf" onClick={handleDescargarPDF} disabled={pdfLoading}>
          {pdfLoading ? <ReactLoading type="spin" color="#fff" height={24} width={24} /> : "Descargar PDF"}
        </button>
      </div>

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

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 'bold' }}>Cotización N°: {show(budget.budgetId)}</div>
                <div style={{ textAlign: 'right', fontSize: 14 }}>
                  <div>Fecha: {new Date(budget.creationDate).toLocaleDateString()}</div>
                  <div>Válido hasta: {new Date(budget.ExpirationDate).toLocaleDateString()}</div>
                </div>
              </div>

              <hr style={{ margin: '10px 0', borderTop: '1px solid #ccc' }} />

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

              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Productos</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, border: '1px solid #ccc' }}>
                <thead style={{ backgroundColor: '#f0f0f0' }}>
                  <tr>
                    <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Producto</th>
                    <th style={{ borderBottom: '1px solid #ccc' }}>Cant.</th>
                    <th style={{ borderBottom: '1px solid #ccc' }}>Dimensiones</th>
                    <th style={{ borderBottom: '1px solid #ccc' }}>Vidrio</th>
                    <th style={{ borderBottom: '1px solid #ccc' }}>Tratamiento</th>
                    <th style={{ borderBottom: '1px solid #ccc' }}>Precio/u</th>
                  </tr>
                </thead>
                <tbody>
                  {budget.Products.map((p, i) => (
                    <React.Fragment key={i}>
                      <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <td>{p.OpeningType?.name || '-'}</td>
                        <td>{p.Quantity}</td>
                        <td>{p.width}x{p.height} cm</td>
                        <td>{p.GlassComplement?.name || '-'}</td>
                        <td>{p.AlumTreatment?.name || '-'}</td>
                        <td>$ abc</td>
                      </tr>
                      <tr>
                        <td colSpan={6} style={{ paddingLeft: 10, paddingBottom: 5 }}>
                          {p.Accesory?.length > 0 ? (
                            <div>
                              <strong style={{ textDecoration: 'underline' }}>Accesorios:</strong>
                              {p.Accesory.map((a, j) => (
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

              <div style={{ textAlign: 'right', marginTop: 20, fontSize: 16 }}>
                <div><b>Total:</b> </div>
                <div><b>Dólar Ref:</b> {show(budget.DollarReference)}</div>
                <div><b>Mano de Obra:</b> {show(budget.LabourReference)}</div>
              </div>

              <div style={{ marginTop: 20, fontSize: 14 }}>
                <b>Observaciones:</b> {show(budget.Comment)}
              </div>
            </div>

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