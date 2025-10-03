import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import logoAnodal from '../../images/logo_secundario.webp';
import '../../styles/reportes.css';
import '../../styles/reporteindividual.css';
import html2pdf from 'html2pdf.js';
import { safeArray } from '../../utils/safeArray';
import ReactLoading from 'react-loading'; // <--- spinner

const API_URL = process.env.REACT_APP_API_URL;

const formatFecha = (fecha) => {
  if (!fecha) return '';
  const [y, m, d] = fecha.split('-');
  return `${d}-${m}-${y.slice(2)}`;
};

// --- Añadir resolveRefs y helpers (igual que en el otro reporte) ---
function resolveRefs(array) {
  const byId = {};
  array.forEach(obj => {
    if (obj && obj.$id) byId[obj.$id] = obj;
    if (obj.Customer && obj.Customer.$id) byId[obj.Customer.$id] = obj.Customer;
    if (obj.WorkPlace && obj.WorkPlace.$id) byId[obj.WorkPlace.$id] = obj.WorkPlace;
  });
  function resolve(obj) {
    if (!obj || typeof obj !== "object") return obj;
    if (obj.$ref) return byId[obj.$ref] || {};
    const out = Array.isArray(obj) ? [] : {};
    for (const k in obj) out[k] = resolve(obj[k]);
    return out;
  }
  return array.map(resolve);
}

const formatMoney = (v) => {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return `$0.00`;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Helper: obtener nombre/apellido del cliente sin recorrer objetos arbitrarios (evita leer WorkPlace)
const getClientFullName = (q) => {
  if (!q || typeof q !== 'object') return '';
  // Rutas explícitas donde debería estar el cliente
  const paths = [
    q.customer,
    q.Customer,
    q.Customer && q.Customer.Customer,
    q.customer && q.customer.Customer
  ];
  for (const c of paths) {
    if (!c || typeof c !== 'object') continue;
    const name = (c.name || c.nombre || c.firstName || c.first_name);
    const lastname = (c.lastname || c.lastName || c.last_name || c.apellido);
    const n = name ? String(name).trim() : '';
    const ln = lastname ? String(lastname).trim() : '';
    if (n || ln) return `${n || ''}${n && ln ? ' ' : ''}${ln || ''}`.trim();
  }
  // fallback conservador: no buscar en todo el objeto, devolver vacío para evitar WorkPlace
  return '';
};

const ReporteDeProductividadPorCotizador = () => {
  const [desde, setDesde] = useState(() => {
    const y = new Date().getFullYear();
    return `${y}-01-01`;
  });
  const [hasta, setHasta] = useState(() => {
    const y = new Date().getFullYear();
    return `${y}-12-31`;
  });
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(''); // '' => todos
  const [generado, setGenerado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quotations, setQuotations] = useState([]);
  const pdfRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUsers(safeArray(res.data)))
      .catch(() => setUsers([]));
  }, []);

  const fetchData = async () => {
    if (!desde || !hasta) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = { from: desde, to: hasta };
      if (selectedUserId) params.userId = selectedUserId;
      const res = await axios.get(`${API_URL}/api/quotations/by-period`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      let data = safeArray(res.data);
      data = resolveRefs(data); // <-- resolver $ref si vienen en la respuesta
      setQuotations(data);
      setGenerado(true);
    } catch (err) {
      setQuotations([]);
      setGenerado(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerar = () => {
    fetchData();
  };

  const handleDownloadPdf = async () => {
    if (!pdfRef.current) return;
    const opt = {
      margin: [0.2, 0.2, 0.2, 0.2],
      filename: `productividad_${selectedUserId || 'todos'}_${desde}_a_${hasta}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    // Ejecuta la exportación sin overlay global
    setTimeout(() => {
      html2pdf().set(opt).from(pdfRef.current).save();
    }, 300);
  };

  // Resumen simple: conteos y suma total
  const totalCount = quotations.length;
  const totalAmount = quotations.reduce((s, q) => {
    const v = q.TotalPrice ?? q.totalPrice ?? q.Total ?? 0;
    const n = Number(String(v).replace(/[^0-9.-]+/g, ''));
    return s + (Number.isFinite(n) ? n : 0);
  }, 0);

  return (
    <div className="dashboard-container productividad-report">
      <Navigation />
      <h2 className="title">Reporte de Productividad por Cotizador</h2>

      <div className="reporte-cotizaciones-root">
        <div className="reporte-cotizaciones-toolbar">
          <div className="reporte-cotizaciones-filtros" style={{ gap: 12 }}>
            <label>
              Desde:
              <input type="date" value={desde} onChange={e => setDesde(e.target.value)} />
            </label>
            <label>
              Hasta:
              <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
            </label>
            <label>
              Cotizador:
              <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                <option value="">Todos</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} {u.lastname} ({u.id})</option>)}
              </select>
            </label>
            <button className="botton-Report" onClick={handleGenerar} disabled={loading}>Generar Reporte</button>
            <button className="reporte-cotizaciones-btn-pdf" onClick={handleDownloadPdf} disabled={!generado}>Guardar PDF</button>
          </div>
        </div>

        <div className="reporte-cotizaciones-a4">
          <div className="reporte-cotizaciones-pdf" ref={pdfRef}>
            <header className="reporte-cotizaciones-header">
              <img src={logoAnodal} alt="logo" className="reporte-cotizaciones-logo" />
              <h1 className="reporte-cotizaciones-title">Productividad por Cotizador</h1>
              <div />
            </header>

            {loading && generado ? (
              <div style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <ReactLoading type="spin" color="#1976d2" height={64} width={64} />
                <div style={{ marginTop: 12, color: '#1976d2' }}>Cargando reporte...</div>
              </div>
            ) : !generado ? (
              <div style={{ minHeight: 200, color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Seleccione rango y cotizador, luego presione Generar Reporte.
              </div>
            ) : (
              <main className="reporte-cotizaciones-main">
                <div className="reporte-cotizaciones-info">
                  <div><strong>Período:</strong> {formatFecha(desde)} al {formatFecha(hasta)}</div>
                  <div><strong>Cotizador:</strong> {selectedUserId ? (users.find(u => String(u.id) === String(selectedUserId))?.name || selectedUserId) : 'Todos'}</div>
                  <div><strong>Generado:</strong> {new Date().toLocaleString()}</div>
                </div>

                <table className="reporte-cotizaciones-tabla" style={{ width: '100%', marginBottom: 12 }}>
                  <thead>
                    <tr><th>Indicador</th><th style={{ textAlign: 'right' }}>Valor</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Total cotizaciones</td><td style={{ textAlign: 'right' }}>{totalCount}</td></tr>
                    <tr><td>Total facturado (suma TotalPrice)</td><td style={{ textAlign: 'right' }}>${totalAmount.toFixed(2)}</td></tr>
                    <tr><td>Promedio por cotización</td><td style={{ textAlign: 'right' }}>${(totalCount ? (totalAmount / totalCount).toFixed(2) : '0.00')}</td></tr>
                  </tbody>
                </table>

                <h3>Detalle de cotizaciones</h3>
                <div className="tabla-cotizaciones-responsive tabla-cotizaciones-responsive-ajustada">
                  <table className="reporte-cotizaciones-tabla tabla-ajustada">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th style={{ textAlign: 'right' }}>Precio Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotations.map(q => (
                        <tr key={q.Id ?? q.id}>
                          <td>{getClientFullName(q) || '-'}</td>
                          <td>{q.CreationDate ? q.CreationDate.split('T')[0] : (q.creationDate ? q.creationDate.split('T')[0] : '')}</td>
                          <td>{q.Status ?? q.status ?? ''}</td>
                          <td style={{ textAlign: 'right' }}>{formatMoney(q.TotalPrice ?? q.totalPrice ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </main>
            )}

            <footer className="reporte-cotizaciones-footer">
              <div className="reporte-cotizaciones-direccion">
                Avenida Japón 1292 / Córdoba / Argentina
              </div>
              <img src={logoAnodal} alt="Logo" className="reporte-cotizaciones-footer-logo" />
            </footer>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ReporteDeProductividadPorCotizador;
              
