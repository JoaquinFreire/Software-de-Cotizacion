import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import logoAnodal from '../../images/logo_secundario.webp';
import { safeArray } from '../../utils/safeArray';
import '../../styles/reportes.css';
import '../../styles/reporteindividual.css';
import html2pdf from 'html2pdf.js';
import ReactLoading from 'react-loading'; // nuevo import para spinner

const API_URL = process.env.REACT_APP_API_URL;

const formatMoney = (v) => `$${Number(v || 0).toFixed(2)}`;

const BeneficioEnCotizaciocionesPorTipoDeLinea = () => {
  const [openingTypes, setOpeningTypes] = useState([]);
  const [openingConfigurations, setOpeningConfigurations] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [glassTypes, setGlassTypes] = useState([]);
  const [alumPrice, setAlumPrice] = useState(0);
  const [labourPrice, setLabourPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [calcResult, setCalcResult] = useState(null);
  const [form, setForm] = useState({
    typeId: '',
    treatmentId: '',
    glassTypeId: '',
    widthCm: '',
    heightCm: '',
    numPanelsWidth: undefined,
    numPanelsHeight: undefined,
    quantity: 1
  });

  const pdfRef = useRef();
  const [exportingPdf, setExportingPdf] = useState(false); // nuevo estado

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    (async () => {
      try {
        const [typesRes, configsRes, treatmentsRes, glassRes, pricesRes] = await Promise.all([
          axios.get(`${API_URL}/api/opening-types`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/opening-configurations`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/alum-treatments`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/glass-types`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/prices`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setOpeningTypes(safeArray(typesRes.data));
        setOpeningConfigurations(safeArray(configsRes.data));
        setTreatments(safeArray(treatmentsRes.data));
        setGlassTypes(safeArray(glassRes.data));
        const prices = safeArray(pricesRes.data);
        const alum = prices.find(p => p.name?.toLowerCase().includes("aluminio"));
        const labour = prices.find(p =>
          p.name?.toLowerCase().includes("manoobra") ||
          p.name?.toLowerCase().includes("manodeobra") ||
          p.name?.toLowerCase().includes("mano de obra")
        );
        setAlumPrice(alum ? Number(alum.price) : 0);
        setLabourPrice(labour ? Number(labour.price) : 0);
      } catch (err) {
        console.error("Error cargando datos para reporte:", err);
      }
    })();
  }, []);

  // Suggested configuration helper (returns suggested panels and config)
  const getSuggestedConfig = (typeId, widthCm, heightCm) => {
    const widthMM = widthCm ? Number(widthCm) * 10 : null;
    const heightMM = heightCm ? Number(heightCm) * 10 : null;
    if (!typeId || !widthMM || !heightMM) return null;
    return safeArray(openingConfigurations).find(cfg =>
      Number(cfg.opening_type_id) === Number(typeId) &&
      widthMM >= cfg.min_width_mm &&
      widthMM <= cfg.max_width_mm &&
      heightMM >= cfg.min_height_mm &&
      heightMM <= cfg.max_height_mm
    );
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = () => {
    setCalcResult(null);
    const { typeId, treatmentId, glassTypeId, widthCm, heightCm, numPanelsWidth, numPanelsHeight, quantity } = form;
    if (!typeId || !widthCm || !heightCm || !treatmentId || !glassTypeId) {
      alert('Complete tipo, medidas, tratamiento y tipo de vidrio.');
      return;
    }
    setLoading(true);
    try {
      const widthCMn = Number(widthCm);
      const heightCMn = Number(heightCm);
      const widthMM = widthCMn * 10;
      const heightMM = heightCMn * 10;
      const cfg = getSuggestedConfig(typeId, widthCMn, heightCMn);

      const numW = numPanelsWidth && Number(numPanelsWidth) > 0 ? Number(numPanelsWidth) : (cfg ? cfg.num_panels_width : 1);
      const numH = numPanelsHeight && Number(numPanelsHeight) > 0 ? Number(numPanelsHeight) : (cfg ? cfg.num_panels_height : 1);
      const totalPanels = numW * numH;
      // panel sizes in mm
      const anchoPanelMM = (form.panelWidth && Number(form.panelWidth) > 0) ? Number(form.panelWidth) * 10 : (widthMM / numW);
      const altoPanelMM = (form.panelHeight && Number(form.panelHeight) > 0) ? Number(form.panelHeight) * 10 : (heightMM / numH);

      // Perimeter per panel (mm)
      const perimetroPanelMM = 2 * (anchoPanelMM + altoPanelMM);
      const totalAluminioMM = perimetroPanelMM * totalPanels * (Number(quantity) || 1);
      const totalAluminioM = totalAluminioMM / 1000; // metros
      const openingTypeObj = safeArray(openingTypes).find(t => Number(t.id) === Number(typeId));
      const pesoAluminio = openingTypeObj && openingTypeObj.weight ? totalAluminioM * Number(openingTypeObj.weight) : 0;
      const costoAluminio = pesoAluminio * Number(alumPrice || 0);

      // Vidrio
      const areaPanelM2 = (anchoPanelMM / 1000) * (altoPanelMM / 1000);
      const areaTotalVidrio = areaPanelM2 * totalPanels * (Number(quantity) || 1);
      const glassObj = safeArray(glassTypes).find(g => Number(g.id) === Number(glassTypeId));
      const costoVidrio = glassObj ? areaTotalVidrio * Number(glassObj.price || 0) : 0;

      // Tratamiento
      const treatmentObj = safeArray(treatments).find(t => Number(t.id) === Number(treatmentId));
      const tratamientoPorc = treatmentObj && (treatmentObj.pricePercentage || treatmentObj.price_percentage)
        ? Number(treatmentObj.pricePercentage || treatmentObj.price_percentage)
        : 0;
      const costoTratamiento = costoAluminio * (tratamientoPorc / 100);

      // Mano de obra: usar labourPrice (precio por unidad de abertura - asumimos valor por abertura)
      // El front original usaba un valor fijo labourPrice por abertura; replicamos eso multiplicando por quantity
      const costoManoObra = Number(labourPrice || 0) * (Number(quantity) || 1);

      // Subtotal (sin costos adicionales)
      const subtotal = costoAluminio + costoTratamiento + costoVidrio + costoManoObra;

      // Costos adicionales
      const costoFabricacion = subtotal * 0.10; // 10%
      const costoAdministrativo = subtotal * 0.05; // 5%

      // BENEFICIO: lo interpretamos como la suma de los cargos añadidos al subtotal
      // (Mano de obra + Costo fabricación + Costo administrativo)
      const beneficio = costoManoObra + costoFabricacion + costoAdministrativo;
      const beneficioPorcSobreSubtotal = subtotal > 0 ? (beneficio / subtotal) * 100 : 0;

      // Total acumulado paso a paso
      const pasos = [];
      let acumulado = 0;
      pasos.push({ label: `Aluminio (${totalAluminioM.toFixed(3)} m * peso/kg * $)`, amount: costoAluminio });
      acumulado += costoAluminio;
      pasos.push({ label: `Tratamiento (${tratamientoPorc}% sobre aluminio)`, amount: costoTratamiento, acumulado: acumulado + costoTratamiento });
      acumulado += costoTratamiento;
      pasos.push({ label: `Vidrio (m²: ${areaTotalVidrio.toFixed(3)})`, amount: costoVidrio, acumulado: acumulado + costoVidrio });
      acumulado += costoVidrio;
      pasos.push({ label: `Mano de obra (BD) x cantidad`, amount: costoManoObra, acumulado: acumulado + costoManoObra });
      acumulado += costoManoObra;
      pasos.push({ label: `Subtotal (antes de costos adicionales)`, amount: subtotal, acumulado: subtotal });
      pasos.push({ label: `Costo fabricación (10% sobre subtotal)`, amount: costoFabricacion, acumulado: subtotal + costoFabricacion });
      pasos.push({ label: `Costo administrativo (5% sobre subtotal)`, amount: costoAdministrativo, acumulado: subtotal + costoFabricacion + costoAdministrativo });
      const total = subtotal + costoFabricacion + costoAdministrativo;

      setCalcResult({
        cfg,
        numW, numH, totalPanels,
        anchoPanelMM, altoPanelMM,
        costoAluminio, costoTratamiento, costoVidrio, costoManoObra,
        subtotal, costoFabricacion, costoAdministrativo, total, pasos, quantity: Number(quantity)
        , beneficio, beneficioPorcSobreSubtotal
      });
    } catch (err) {
      console.error("Error calculando:", err);
      alert('Error al calcular. Revise la consola.');
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarPDF = () => {
    if (!pdfRef.current) return;
    setExportingPdf(true);
    window.scrollTo(0, 0);
    const scrollBtn = document.querySelector('.scroll-to-top-btn');
    if (scrollBtn) scrollBtn.style.display = 'none';

    // Guardar estilos originales para restaurar después
    const originals = new Map();
    const saveAndSet = (el, styles) => {
      if (!el) return;
      const prev = {};
      Object.keys(styles).forEach(k => { prev[k] = el.style[k]; el.style[k] = styles[k]; });
      originals.set(el, prev);
    };

    const a4 = pdfRef.current.closest('.reporte-cotizaciones-a4');
    // Aplicar correcciones inline temporales: reducir ancho y altura para probar si evita la página en blanco
    saveAndSet(document.body, { margin: '0', padding: '0' });
    saveAndSet(a4, {
      margin: '0',
      padding: '0',
      minHeight: '0',
      boxShadow: 'none',
      display: 'block',
      height: 'auto',
      overflow: 'visible',
      width: '700px',        // <--- ancho reducido para prueba
      minHeight: '900px'     // <--- altura reducida para prueba
    });
    saveAndSet(pdfRef.current, {
      minHeight: '0',
      marginTop: '0',
      paddingTop: '0',
      display: 'block',
      height: 'auto',
      justifyContent: 'flex-start',
      width: '680px'         // <--- ancho interior ligeramente menor
    });
    // Ocultar navegación y título que puedan empujar contenido
    const nav = document.querySelector('nav');
    const titleEl = document.querySelector('.dashboard-container > .title, .dashboard-container > h2.title');
    saveAndSet(nav, { display: 'none' });
    saveAndSet(titleEl, { display: 'none' });

    const opt = {
      margin: [0.2, 0.2, 0.2, 0.2],
      filename: `beneficio_por_tipo_linea_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Delay mayor para asegurar reflow con nuevos tamaños
    setTimeout(() => {
      html2pdf().set(opt).from(pdfRef.current).save()
        .then(() => {
          // Restaurar estilos
          originals.forEach((prev, el) => {
            Object.keys(prev).forEach(k => { el.style[k] = prev[k] ?? ''; });
          });
          setExportingPdf(false);
          if (scrollBtn) scrollBtn.style.display = '';
        })
        .catch(() => {
          originals.forEach((prev, el) => {
            Object.keys(prev).forEach(k => { el.style[k] = prev[k] ?? ''; });
          });
          setExportingPdf(false);
          if (scrollBtn) scrollBtn.style.display = '';
        });
    }, 1000); // timeout aumentado a 1000ms para probar
  };

  const suggested = getSuggestedConfig(form.typeId, form.widthCm ? Number(form.widthCm) : 0, form.heightCm ? Number(form.heightCm) : 0);

  return (
    // Añadida clase 'beneficio-report' para aplicar CSS de impresión localizada
    <div className="dashboard-container beneficio-report">
      <Navigation />
      <h2 className="title">Beneficio en Cotizaciones por Tipo de Línea</h2>
      <div className="reporte-cotizaciones-root reporte-cotizaciones-toolbar">
        <div className="reporte-cotizaciones-toolbar reporte-cotizaciones-filtros " style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <label>
              Tipo de línea:
              <select value={form.typeId} onChange={e => handleChange('typeId', e.target.value)}>
                <option value="">Seleccione tipo</option>
                {safeArray(openingTypes).map(t => <option key={t.id} value={t.id}>{t.name || t.type}</option>)}
              </select>
            </label>
            <label>
              Ancho (cm):
              <input type="number" min={10} max={2000} value={form.widthCm} onChange={e => handleChange('widthCm', e.target.value)} />
            </label>
            <label>
              Alto (cm):
              <input type="number" min={10} max={2000} value={form.heightCm} onChange={e => handleChange('heightCm', e.target.value)} />
            </label>
            <label>
              Tratamiento:
              <select value={form.treatmentId} onChange={e => handleChange('treatmentId', e.target.value)}>
                <option value="">Seleccione tratamiento</option>
                {safeArray(treatments).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label>
              Vidrio:
              <select value={form.glassTypeId} onChange={e => handleChange('glassTypeId', e.target.value)}>
                <option value="">Seleccione vidrio</option>
                {safeArray(glassTypes).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </label>
            <label>
              Paneles ancho:
              <input type="number" min={1} value={form.numPanelsWidth ?? (suggested?.num_panels_width || 1)} onChange={e => handleChange('numPanelsWidth', e.target.value)} />
            </label>
            <label>
              Paneles alto:
              <input type="number" min={1} value={form.numPanelsHeight ?? (suggested?.num_panels_height || 1)} onChange={e => handleChange('numPanelsHeight', e.target.value)} />
            </label>
            <label>
              Cantidad aberturas:
              <input type="number" min={1} value={form.quantity} onChange={e => handleChange('quantity', e.target.value)} />
            </label>
            <button className="botton-Report" onClick={handleCalculate} disabled={loading}>
              {loading ? 'Calculando...' : 'Calcular cotización'}
            </button>
            <button className="reporte-cotizaciones-btn-pdf" onClick={handleDescargarPDF} disabled={!calcResult}>
              Guardar PDF
            </button>
          </div>
        </div>

        <div className="reporte-cotizaciones-a4">
          {/* Overlay spinner para exportación PDF (no se imprime) */}
          {exportingPdf && (
            <div className="pdf-export-overlay">
              <ReactLoading type="spin" color="#fff" height={64} width={64} />
              <div style={{ marginTop: 12, color: '#fff', fontWeight: 700 }}>Generando PDF...</div>
            </div>
          )}
          <div className="reporte-cotizaciones-pdf" ref={pdfRef}>
            <header className="reporte-cotizaciones-header">
              <img src={logoAnodal} alt="logo" className="reporte-cotizaciones-logo" />
              <h1 className="reporte-cotizaciones-title">Beneficio por Tipo de Línea</h1>
              <div />
            </header>

            <main className="reporte-cotizaciones-main">
              <div style={{ marginBottom: 12 }}>
                <strong>Precios usados:</strong> Aluminio {formatMoney(alumPrice)} por kg · Mano de obra {formatMoney(labourPrice)} por unidad
              </div>

              {!calcResult ? (
                <div style={{ color: '#888', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Complete los campos y presione "Calcular cotización" para ver el desglose.
                </div>
              ) : (
                <section>
                  <h3>Resumen de cálculo (cantidad: {calcResult.quantity})</h3>

                  {/* Vista previa */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ width: 300 }}>
                      <div style={{ background: '#0b0b0b', padding: 8, borderRadius: 6 }}>
                        <svg width="100%" height={140} viewBox={`0 0 ${Number(form.widthCm || 120)} ${Number(form.heightCm || 80)}`} preserveAspectRatio="xMidYMid meet">
                          <rect x="0" y="0" width={Number(form.widthCm || 120)} height={Number(form.heightCm || 80)} fill="#f7f9fb" stroke="#1976d2" strokeWidth={0.3} rx={4} />
                          {/* líneas de panel */}
                          {Array.from({ length: Math.max(0, calcResult.numW - 1) }).map((_, i) => (
                            <line key={`v-${i}`} x1={((i + 1) * Number(form.widthCm || 120) / calcResult.numW)} y1={0} x2={((i + 1) * Number(form.widthCm || 120) / calcResult.numW)} y2={Number(form.heightCm || 80)} stroke="#2c2727" strokeWidth={0.7} />
                          ))}
                          {Array.from({ length: Math.max(0, calcResult.numH - 1) }).map((_, i) => (
                            <line key={`h-${i}`} x1={0} y1={((i + 1) * Number(form.heightCm || 80) / calcResult.numH)} x2={Number(form.widthCm || 120)} y2={((i + 1) * Number(form.heightCm || 80) / calcResult.numH)} stroke="#2c2727" strokeWidth={0.7} />
                          ))}
                        </svg>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <div><strong>Tipo:</strong> {openingTypes.find(t => String(t.id) === String(form.typeId))?.name || '-'}</div>
                        <div><strong>Paneles:</strong> {calcResult.numW} × {calcResult.numH} = {calcResult.totalPanels}</div>
                        <div><strong>Tamaño panel:</strong> {(calcResult.anchoPanelMM/10).toFixed(1)} x {(calcResult.altoPanelMM/10).toFixed(1)} cm</div>
                      </div>
                    </div>

                    {/* Desglose paso a paso muy visible */}
                    <div style={{ flex: 1 }}>
                      <div style={{ background: '#fffbe6', padding: 12, borderRadius: 6, border: '1px solid #f0d38a' }}>
                        <h4 style={{ margin: '0 0 8px 0' }}>Desglose visible y acumulativo</h4>
                        <ol style={{ paddingLeft: 18, margin: 0 }}>
                          {calcResult.pasos.map((p, idx) => (
                            <li key={idx} style={{ marginBottom: 8 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                                <div style={{ fontSize: 15 }}>{p.label}</div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: 16, fontWeight: 700 }}>{formatMoney(p.amount)}</div>
                                  {p.acumulado !== undefined && <div style={{ fontSize: 12, color: '#666' }}>Acumulado: {formatMoney(p.acumulado)}</div>}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ol>
                        <div style={{ marginTop: 12, borderTop: '1px dashed #ddd', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 16, fontWeight: 800 }}>TOTAL FINAL</div>
                          <div style={{ fontSize: 20, color: '#1976d2', fontWeight: 900 }}>{formatMoney(calcResult.total)}</div>
                        </div>
                        {/* Bloque de beneficio visible */}
                        <div style={{ marginTop: 12, background: '#e8f7ef', padding: 12, borderRadius: 6, border: '1px solid #b8e6c9' }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#1b5e20' }}>Beneficio obtenido</div>
                          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div>Mano de obra: <b>{formatMoney(calcResult.costoManoObra)}</b></div>
                              <div>Costo fabricación (10%): <b>{formatMoney(calcResult.costoFabricacion)}</b></div>
                              <div>Costo administrativo (5%): <b>{formatMoney(calcResult.costoAdministrativo)}</b></div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 20, fontWeight: 900, color: '#1b5e20' }}>{formatMoney(calcResult.beneficio)}</div>
                              <div style={{ fontSize: 12, color: '#2f6f3f' }}>({calcResult.beneficioPorcSobreSubtotal.toFixed(1)}% sobre subtotal)</div>
                            </div>
                          </div>
                        </div>
                        <div style={{ marginTop: 8, fontSize: 12, color: '#444' }}>
                          <div>Incluye: Mano de obra desde precios BD, Costo fabricación 10%, Costo administrativo 5%.</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detalle numérico en tabla simplificada */}
                  <div style={{ marginTop: 6 }}>
                    <table className="reporte-cotizaciones-tabla" style={{ width: '100%', maxWidth: 900 }}>
                      <thead>
                        <tr>
                          <th>Componente</th>
                          <th style={{ textAlign: 'right' }}>Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td>Aluminio</td><td style={{ textAlign: 'right' }}>{formatMoney(calcResult.costoAluminio)}</td></tr>
                        <tr><td>Tratamiento</td><td style={{ textAlign: 'right' }}>{formatMoney(calcResult.costoTratamiento)}</td></tr>
                        <tr><td>Vidrio</td><td style={{ textAlign: 'right' }}>{formatMoney(calcResult.costoVidrio)}</td></tr>
                        <tr><td>Mano de obra</td><td style={{ textAlign: 'right' }}>{formatMoney(calcResult.costoManoObra)}</td></tr>
                        <tr><td><strong>Subtotal</strong></td><td style={{ textAlign: 'right' }}><strong>{formatMoney(calcResult.subtotal)}</strong></td></tr>
                        <tr><td>Costo fabricación (10%)</td><td style={{ textAlign: 'right' }}>{formatMoney(calcResult.costoFabricacion)}</td></tr>
                        <tr><td>Costo administrativo (5%)</td><td style={{ textAlign: 'right' }}>{formatMoney(calcResult.costoAdministrativo)}</td></tr>
                        <tr><td><strong>TOTAL</strong></td><td style={{ textAlign: 'right', fontSize: 18, color: '#1976d2' }}><strong>{formatMoney(calcResult.total)}</strong></td></tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </main>

            <footer className="reporte-cotizaciones-footer" style={{ marginTop: 12 }}>
              <div className="reporte-cotizaciones-direccion">
                <span>Avenida Japón 1292 / Córdoba / Argentina</span>
                <br />
                Solo para uso interno de la empresa Anodal S.A.
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

export default BeneficioEnCotizaciocionesPorTipoDeLinea;
