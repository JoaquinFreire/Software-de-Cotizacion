import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import html2pdf from 'html2pdf.js';
import ReactLoading from 'react-loading';
import logoAnodal from '../../images/logo_secundario.webp';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import '../../styles/reportes.css';
import '../../styles/reporteindividual.css';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT5uVdkf1MHTdCmOK3Lp3A03vrPmKp3H7qyRsbIYRfz8-yNpXlcjtrOIrrL_vS5EZUdH62iF-UL4XB-/pub?output=csv';

// NEW: backend base URL (usado para obtener asignaciones de cotizaciones)
const API_URL = process.env.REACT_APP_API_URL || '';

// Preguntas agrupadas por sectores
const preguntasPorSector = {
  "Atención y servicio": {
    "¿Cómo calificaría la amabilidad y predisposición del personal que lo atendió?": ["1", "2", "3", "4", "5"],
    "¿Qué tan clara y comprensible le resultó la información brindada durante la atención?": ["1", "2", "3", "4", "5"],
    "¿Cómo evaluaría el tiempo de respuesta desde su consulta hasta recibir la cotización?": ["1", "2", "3", "4", "5"],
    "¿Sintió que el personal comprendió correctamente sus necesidades?": ["1", "2", "3", "4", "5"],
  },
  "Producto y cotización": {
    "¿La cotización que recibió fue clara, completa y fácil de entender?": ["1", "2", "3", "4", "5"],
    "¿Cómo considera la relación entre el precio y la calidad de los productos cotizados?": ["1", "2", "3", "4", "5"],
    "¿El diseño, variedad y opciones disponibles se ajustaron a sus necesidades?": ["Sí", "No", "Podria Mejorar"],
  },
  "Tiempos y comunicación": {
    "¿Recibió la cotización en el plazo estimado?": ["Sí", "No"],
    "¿Le resultó fácil comunicarse con el área de ventas o cotizaciones?": ["Sí", "No"],
    "¿Por que medio le gustaría recibir las cotizaciones?": ["Correo Electrónico", "WhatsApp", "Teléfono"],
  },
  "Experiencia global": {
    "En general, ¿cómo calificaría su experiencia al solicitar una cotización con nuestra empresa?": ["1", "2", "3", "4", "5"],
    "¿Qué tan probable es que recomiende nuestra empresa a otras personas?": ["Sí", "No", "Tal vez"],
    "¿Considera que volvería a solicitar una cotización en el futuro?": ["Sí", "No", "Tal vez"]
  }
};

const getDefaultDates = () => {
  const year = new Date().getFullYear();
  return {
    desde: `${year}-01-01`,
    hasta: `${year}-12-31`
  };
};

// Normalización de strings
function normalizeKey(str) {
  if (!str && str !== '') return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Identificar columna de marca temporal
function findTemporalHeader(headers = []) {
  const candidates = ['marca temporal', 'timestamp', 'fecha', 'fecha y hora', 'fecha/hora', 'time', 'marca de tiempo'];
  for (const h of headers) {
    const nh = normalizeKey(h);
    if (candidates.some(c => nh.includes(normalizeKey(c)))) return h;
  }
  for (const h of headers) {
    const nh = normalizeKey(h);
    if (nh.includes('marca') || nh.includes('time')) return h;
  }
  return null;
}

// Parseo de fecha mejorado
function parseFecha(fechaStr) {
  if (!fechaStr) return null;
  const s = String(fechaStr).trim();
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length >= 3) {
      const d = parts[0];
      const m = parts[1];
      const yAndRest = parts.slice(2).join('/');
      const y = yAndRest.split(' ')[0];
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  const dt = new Date(s);
  if (!isNaN(dt.getTime())) {
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }
  return null;
}

// Función para formatear fecha para display
function formatFechaParaDisplay(fechaStr) {
  try {
    if (fechaStr.includes('/')) {
      const [datePart, timePart] = fechaStr.split(' ');
      const [d, m, y] = datePart.split('/');
      const fecha = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}${timePart ? 'T' + timePart : ''}`);
      
      const ahora = new Date();
      const ayer = new Date(ahora);
      ayer.setDate(ahora.getDate() - 1);
      
      if (fecha.toDateString() === ahora.toDateString()) {
        return `Hoy ${timePart || ''}`;
      } else if (fecha.toDateString() === ayer.toDateString()) {
        return `Ayer ${timePart || ''}`;
      } else {
        return fecha.toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } else {
      return fechaStr;
    }
  } catch (error) {
    return fechaStr;
  }
}

// Función para calcular promedios por sector y detalles de respuestas
function calcularPromediosYDetallesPorSector(data) {
  const headers = (data && data.length) ? Object.keys(data[0]) : [];
  const normalizedHeaderMap = {};
  headers.forEach(h => normalizedHeaderMap[normalizeKey(h)] = h);

  const resultados = {};

  Object.entries(preguntasPorSector).forEach(([sector, preguntas]) => {
    const detallesPreguntas = {};
    let totalRespuestasSector = 0;

    Object.entries(preguntas).forEach(([pregunta, opciones]) => {
      const normalizedPregunta = normalizeKey(pregunta);
      const matchingHeader = normalizedHeaderMap[normalizedPregunta] || null;

      // mapa de opciones normalizadas -> opción original
      const opcionesMap = {};
      opciones.forEach(op => opcionesMap[normalizeKey(op)] = op);

      // inicializar conteo de respuestas para esta pregunta
      const conteoRespuestas = {};
      opciones.forEach(op => { conteoRespuestas[op] = 0; });

      let suma = 0;
      let count = 0;

      data.forEach(row => {
        let respuestaRaw;
        if (matchingHeader) {
          respuestaRaw = row[matchingHeader];
        } else {
          // buscar encabezado que contenga o sea contenido por la pregunta (normalizado)
          const foundHeader = headers.find(h => {
            const nh = normalizeKey(h);
            return nh.includes(normalizedPregunta) || normalizedPregunta.includes(nh);
          });
          if (foundHeader) respuestaRaw = row[foundHeader];
        }

        if (respuestaRaw == null || String(respuestaRaw).trim() === '') return;

        // normalizar respuesta para mapeo
        const respuestaStr = String(respuestaRaw).trim();
        const respuestaNorm = normalizeKey(respuestaStr).replace(/,/g, '.'); // convierte comas a puntos

        // intentar mapear a opción definida
        const mappedOption = opcionesMap[respuestaNorm];
        if (mappedOption) {
          conteoRespuestas[mappedOption] = (conteoRespuestas[mappedOption] || 0) + 1;
        } else {
          // si es número en escala 1-5, o string numérico, parsearlo
          const posibleNumero = parseFloat(respuestaNorm);
          if (!isNaN(posibleNumero)) {
            // si las opciones son 1..5 considerarlo como respuesta válida y mapear al bucket exacto si existe
            const rounded = Math.round(posibleNumero).toString();
            if (conteoRespuestas.hasOwnProperty(rounded)) {
              conteoRespuestas[rounded] = (conteoRespuestas[rounded] || 0) + 1;
            }
          }
        }

        // Para cálculos numéricos: escala 1-5
        if (opciones.includes("1") && opciones.includes("5")) {
          // intentar parsear número
          const v = parseFloat(respuestaNorm);
          if (!isNaN(v) && v >= 1 && v <= 5) {
            suma += v;
            count++;
          } else {
            // si respuesta es texto que mapea a una opción numérica (ej "cuatro" no manejado aquí), se ignora
          }
        } else {
          // Para preguntas tipo Sí/No/Podría/Tal vez -> asignar valores
          const rn = respuestaNorm;
          let valorNumerico = null;
          if (rn.includes('si') || rn.includes('sí')) valorNumerico = 5;
          else if (rn.includes('podria') || rn.includes('podría') || rn.includes('tal vez')) valorNumerico = 3;
          else if (rn.includes('no')) valorNumerico = 1;

          if (valorNumerico !== null) {
            suma += valorNumerico;
            count++;
          }
        }
      });

      // total respuestas contabilizadas por conteoRespuestas:
      const totalRespuestasPregunta = Object.values(conteoRespuestas).reduce((a, b) => a + b, 0);

      detallesPreguntas[pregunta] = {
        conteo: conteoRespuestas,
        totalRespuestas: totalRespuestasPregunta,
        promedio: count > 0 ? suma / count : 0
      };

      totalRespuestasSector += totalRespuestasPregunta;
    });

    // Calcular promedio del sector (promedio de promedios de preguntas con peso igual)
    const promediosPreguntas = Object.values(detallesPreguntas)
      .filter(detalle => detalle.promedio > 0)
      .map(detalle => detalle.promedio);

    const promedioSector = promediosPreguntas.length > 0
      ? promediosPreguntas.reduce((a, b) => a + b, 0) / promediosPreguntas.length
      : 0;

    resultados[sector] = {
      promedio: promedioSector,
      totalRespuestas: totalRespuestasSector,
      cantidadPreguntas: Object.keys(preguntas).length,
      detallesPreguntas: detallesPreguntas
    };
  });

  return resultados;
}

// Función mejorada para extraer reseñas individuales del CSV
function extraerReseñasIndividuales(data, quotationMap = {}) {
  if (!data || data.length === 0) return [];

  const headers = Object.keys(data[0] || {});
  const normalizedHeaderMap = {};
  headers.forEach(h => normalizedHeaderMap[normalizeKey(h)] = h);

  const reseñas = data.map((row, index) => {
    // campos posibles (sin depender del texto exacto)
    const camposCotizacion = ["Número de cotización", "Cotización", "ID", "Número", "Código", "Referencia"];
    const camposAgente = ["Agente", "Cotizador", "Usuario", "Personal", "Atendido por", "Vendedor"];
    const camposComentario = [
      "Comentarios", "Feedback", "Observaciones", "Comentario",
      "Comentarios adicionales", "¿Algún comentario o sugerencia adicional?",
      "Comentarios y sugerencias"
    ];
    const camposFecha = ["Marca temporal", "Fecha", "Timestamp", "Fecha y hora"];

    // helper: buscar valor en row por lista de posibles cabeceras (normalizado)
    const buscarCampo = (posibles) => {
      for (const c of posibles) {
        const nh = normalizeKey(c);
        // buscar exacto normalizado en el header map
        if (normalizedHeaderMap[nh]) {
          const val = row[normalizedHeaderMap[nh]];
          if (val && String(val).trim() !== '') return String(val).trim();
        } else {
          // buscar header que incluya la clave normalizada
          const found = headers.find(h => normalizeKey(h).includes(nh) || nh.includes(normalizeKey(h)));
          if (found && row[found] && String(row[found]).trim() !== '') return String(row[found]).trim();
        }
      }
      return null;
    };

    // numero de cotizacion
    let numeroCotizacion = buscarCampo(camposCotizacion) || `SCE-${1267 - index}`;

    // buscar en el mapa de cotizaciones (normalizar a dígitos para encontrar coincidencias)
    const possibleId = String(numeroCotizacion).replace(/[^\d]/g, '');
    let asignacion = null;
    if (possibleId && quotationMap[possibleId]) {
      asignacion = quotationMap[possibleId];
    } else if (quotationMap[numeroCotizacion]) {
      asignacion = quotationMap[numeroCotizacion];
    }

    // agente (priorizar la asignación encontrada)
    let agente = buscarCampo(camposAgente) || "Agente no especificado";
    let agenteId = null;
    if (asignacion) {
      agente = asignacion.Assignee || asignacion.AssigneeName || agente;
      agenteId = asignacion.AssigneeId || asignacion.AssigneeId;
    }

    // comentario
    let comentario = buscarCampo(camposComentario) || "Sin comentarios";

    // fecha
    let fechaRaw = buscarCampo(camposFecha) || "";
    const fecha = fechaRaw ? formatFechaParaDisplay(fechaRaw) : "Fecha no disponible";

    // Calcular rating promedio basado en todas las respuestas numéricas y mapeos Sí/No
    const ratings = [];
    Object.values(preguntasPorSector).forEach(sector => {
      Object.keys(sector).forEach(pregunta => {
        const normalizedPregunta = normalizeKey(pregunta);
        const header = normalizedHeaderMap[normalizedPregunta] || headers.find(h => {
          const nh = normalizeKey(h);
          return nh.includes(normalizedPregunta) || normalizedPregunta.includes(nh);
        });

        if (!header) return;

        const respuestaRaw = row[header];
        if (!respuestaRaw) return;
        const rStr = String(respuestaRaw).trim().replace(/,/g, '.');
        const num = parseFloat(rStr);
        if (!isNaN(num) && num >= 1 && num <= 5) {
          ratings.push(num);
          return;
        }
        const rn = normalizeKey(rStr);
        if (rn.includes('si') || rn.includes('sí')) ratings.push(5);
        else if (rn.includes('podria') || rn.includes('podría') || rn.includes('tal vez')) ratings.push(3);
        else if (rn.includes('no')) ratings.push(1);
      });
    });

    const ratingPromedio = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 5;

    return {
      fecha,
      agente,
      agenteId,
      comentario,
      numeroCotizacion,
      rating: ratingPromedio,
      datosOriginales: row
    };
  });

  // Filtrar reseñas con comentarios reales
  return reseñas.filter(reseña =>
    reseña.comentario !== "Sin comentarios" &&
    reseña.comentario.trim() !== '' &&
    reseña.comentario.length > 5
  );
}

// NEW: obtener mapa de asignaciones QuotationId -> objeto de asignación desde backend
async function fetchQuotationAssignments() {
  if (!API_URL) return {};
  try {
    const res = await fetch(`${API_URL}/api/OED/dashboard-unified?timeRange=365d`);
    if (!res.ok) return {};
    const data = await res.json();
    const extractArray = (obj) => {
      if (!obj) return [];
      if (obj.$values && Array.isArray(obj.$values)) return obj.$values;
      if (Array.isArray(obj)) return obj;
      return [];
    };
    const problematic = extractArray(data.ProblematicQuotations);
    const map = {};
    problematic.forEach(q => {
      const idKey = q.QuotationId != null ? String(q.QuotationId) : null;
      if (idKey) map[idKey] = q;
    });
    return map;
  } catch (err) {
    console.error('Error fetching quotation assignments:', err);
    return {};
  }
}

// NEW: calcular puntuaciones agregadas por cotizador a partir de las reseñas
function computeUserScores(reviews = []) {
  const map = {}; // key: agente (nombre o id), value: {sum, count, avg}
  reviews.forEach(r => {
    const key = r.agenteId ? `id_${r.agenteId}` : `name_${r.agente}`;
    if (!map[key]) map[key] = { name: r.agente || 'Sin responsable', sum: 0, count: 0 };
    map[key].sum += r.rating;
    map[key].count += 1;
  });
  // convertir a array ordenada por promedio descendente
  const res = Object.values(map).map(item => ({
    name: item.name,
    avg: item.count > 0 ? item.sum / item.count : 0,
    count: item.count
  })).sort((a, b) => b.avg - b.avg);
  return res;
}

// Componente StarRating
const StarRating = ({ rating, size = 20, showNumber = true }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <div style={{ display: 'flex' }}>
        {[...Array(fullStars)].map((_, i) => (
          <svg key={`full-${i}`} width={size} height={size} viewBox="0 0 24 24" fill="#ffc107" stroke="#ffc107">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        ))}
        {hasHalfStar && (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="#ffc107" stroke="#ffc107">
            <path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4V6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/>
          </svg>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <svg key={`empty-${i}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ddd">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        ))}
      </div>
      {showNumber && (
        <span style={{ marginLeft: '8px', fontWeight: 'bold', color: '#666' }}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

// Componente ReviewCard
const ReviewCard = ({ review, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      marginBottom: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <StarRating rating={review.rating} size={16} />
            <span style={{ fontWeight: '600', color: '#333' }}>{review.agente}</span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            {review.fecha} • {review.numeroCotizacion}
          </div>
        </div>
      </div>
      <div style={{ color: '#444', lineHeight: '1.5' }}>
        {expanded ? review.comentario : `${review.comentario.slice(0, 150)}${review.comentario.length > 150 ? '...' : ''}`}
        {review.comentario.length > 150 && (
          <button 
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none',
              border: 'none',
              color: '#1976d2',
              cursor: 'pointer',
              marginLeft: '4px',
              fontWeight: '600'
            }}
          >
            {expanded ? 'Ver menos' : 'Ver más'}
          </button>
        )}
      </div>
    </div>
  );
};

// Componente DetallesModal
const DetallesModal = ({ sector, datos, onClose }) => {
  if (!sector || !datos) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#1976d2' }}>{sector}</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <strong>Promedio del sector:</strong> {datos.promedio.toFixed(1)}/5
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <strong>Total de respuestas:</strong> {datos.totalRespuestas}
        </div>

        <h3 style={{ color: '#333', marginBottom: '16px' }}>Detalles por pregunta:</h3>
        
        {Object.entries(datos.detallesPreguntas || {}).map(([pregunta, detalle]) => (
          <div key={pregunta} style={{ 
            marginBottom: '20px', 
            padding: '16px', 
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#333' }}>
              {pregunta}
            </h4>
            <div style={{ marginBottom: '8px' }}>
              <strong>Promedio:</strong> {detalle.promedio.toFixed(1)}/5
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Total respuestas:</strong> {detalle.totalRespuestas}
            </div>
            <div>
              <strong>Distribución:</strong>
              <div style={{ marginTop: '8px' }}>
                {Object.entries(detalle.conteo || {}).map(([opcion, count]) => (
                  <div key={opcion} style={{ 
                    display: 'flex', 
                    gap: '8px',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span>{opcion}:</span>
                    <span style={{ fontWeight: '600' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function AnalisisSatisfaccionCliente() {
  const defaultDates = getDefaultDates();
  const [fechaDesde, setFechaDesde] = useState(defaultDates.desde);
  const [fechaHasta, setFechaHasta] = useState(defaultDates.hasta);
  const [loading, setLoading] = useState(false);
  const [respuestas, setRespuestas] = useState([]);
  const [promediosSectores, setPromediosSectores] = useState({});
  const [reseñasIndividuales, setReseñasIndividuales] = useState([]);
  const [puntuacionesPorUsuario, setPuntuacionesPorUsuario] = useState([]); // NEW
  const [generar, setGenerar] = useState(false);
  const [sectorSeleccionado, setSectorSeleccionado] = useState(null);
  const pdfRef = useRef();

  const fetchCSV = async () => {
    setLoading(true);
    try {
      const res = await fetch(CSV_URL);
      const text = await res.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const rows = results.data || [];
          const headers = rows.length ? Object.keys(rows[0]) : [];
          const temporalHeader = findTemporalHeader(headers);

          const desde = new Date(fechaDesde);
          const hasta = new Date(fechaHasta);
          const filtradas = rows.filter(row => {
            const marcaRaw = temporalHeader ? row[temporalHeader] : (row['Marca temporal'] || row['Timestamp'] || Object.values(row)[0]);
            const fechaStr = parseFecha(marcaRaw);
            if (!fechaStr) return false;
            const fecha = new Date(fechaStr);
            return fecha >= desde && fecha <= hasta;
          });

          // NEW: obtener mapa de asignaciones y luego extraer reseñas con esa info
          const quotationMap = await fetchQuotationAssignments();
          const reviews = extraerReseñasIndividuales(filtradas, quotationMap);
          const userScores = computeUserScores(reviews);

          setRespuestas(filtradas);
          setPromediosSectores(calcularPromediosYDetallesPorSector(filtradas));
          setReseñasIndividuales(reviews);
          setPuntuacionesPorUsuario(userScores); // NEW
          setLoading(false);
        }
      });
    } catch (err) {
      console.error('Error fetching CSV:', err);
      setRespuestas([]);
      setPromediosSectores({});
      setReseñasIndividuales([]);
      setPuntuacionesPorUsuario([]); // NEW
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

  // Calcular rating promedio general
  const calcularRatingPromedioGeneral = () => {
    // Calcular promedio ponderado por pregunta (promedioPregunta * totalRespuestasPregunta)
    let sumaPonderada = 0;
    let totalRespuestas = 0;

    Object.values(promediosSectores).forEach(sector => {
      const detalles = sector.detallesPreguntas || {};
      Object.values(detalles).forEach(det => {
        if (det && det.totalRespuestas > 0 && det.promedio > 0) {
          sumaPonderada += det.promedio * det.totalRespuestas;
          totalRespuestas += det.totalRespuestas;
        }
      });
    });

    if (totalRespuestas > 0) {
      return sumaPonderada / totalRespuestas;
    }

    // Fallback: promedio simple de sectores (si no hay detalle)
    const promedios = Object.values(promediosSectores)
      .filter(sector => sector.promedio > 0)
      .map(sector => sector.promedio);

    if (promedios.length === 0) return 0;
    return promedios.reduce((a, b) => a + b, 0) / promedios.length;
  };

  const ratingPromedioGeneral = calcularRatingPromedioGeneral();

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
            <button className="botton-Report" onClick={handleGenerarReporte} disabled={loading || !fechaDesde || !fechaHasta}>
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

            

            {loading && generar ? (
                          <div style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <ReactLoading type="spin" color="#1976d2" height={64} width={64} />
                            <div style={{ marginTop: 12, color: '#1976d2' }}>Cargando reporte...</div>
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
                <section className="reporte-cotizaciones-analisis" style={{ marginBottom: 24 }}>
              <div className="reporte-cotizaciones-analisis-bloque">
                <strong>Descripción del Reporte:</strong> Este informe muestra el análisis de las respuestas de satisfacción de los clientes agrupadas por categorías principales.
              </div>
            </section>

                {/* Sección de Rating Promedio General */}
                <section style={{ 
                  marginBottom: 40, 
                  backgroundColor: '#f8f9fa', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  <h2 style={{ color: '#1976d2', marginBottom: 20, textAlign: 'center' }}>
                    Valoración Media del Período
                  </h2>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '20px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#1976d2' }}>
                        {ratingPromedioGeneral.toFixed(1)}
                      </div>
                      <StarRating rating={ratingPromedioGeneral} size={32} />
                      <div style={{ color: '#666', marginTop: '8px' }}>
                        Valoración media general
                      </div>
                    </div>
                  </div>
                </section>

                {/* Sección de Calificaciones por Categoría */}
                <section style={{ marginBottom: 40 }}>
                  <h2 style={{ color: '#1976d2', marginBottom: 20, textAlign: 'center' }}>Calificaciones por Categoría</h2>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {Object.entries(promediosSectores).map(([sector, datos]) => (
                      <div 
                        key={sector} 
                        style={{
                          padding: '20px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '8px',
                          border: '1px solid #e0e0e0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => setSectorSeleccionado({ sector, datos })}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e3f2fd';
                          e.currentTarget.style.borderColor = '#1976d2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                          e.currentTarget.style.borderColor = '#e0e0e0';
                        }}
                      >
                        <div>
                          <h3 style={{ 
                            margin: '0 0 8px 0', 
                            fontSize: '1.2rem',
                            color: '#333',
                            fontWeight: '600'
                          }}>
                            {sector}
                          </h3>
                          <div style={{ color: '#666', fontSize: '0.9rem' }}>
                            {datos.cantidadPreguntas} preguntas • {datos.totalRespuestas} respuestas
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', minWidth: '120px' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2', marginBottom: '4px' }}>
                            {datos.promedio > 0 ? datos.promedio.toFixed(1) : 'N/A'}
                          </div>
                          <StarRating rating={datos.promedio} size={20} showNumber={false} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                

                {/* NEW: Sección Puntuaciones por Cotizador */}
                {puntuacionesPorUsuario && puntuacionesPorUsuario.length > 0 && (
                  <section style={{ marginBottom: 40 }}>
                    <h2 style={{ color: '#1976d2', marginBottom: 20 }}>Puntuación por Cotizador (según encuestas)</h2>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {puntuacionesPorUsuario.map((u, i) => (
                        <div key={i} style={{ padding: '12px', background: '#f8f9fa', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#333' }}>{u.name}</div>
                            <div style={{ color: '#666', fontSize: 13 }}>{u.count} reseña(s)</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <StarRating rating={u.avg} size={20} />
                            <div style={{ fontWeight: 'bold', color: '#1976d2' }}>{u.avg.toFixed(1)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section className="reporte-cotizaciones-analisis">
                  <div className="reporte-cotizaciones-analisis-bloque">
                    <strong>Observaciones:</strong>
                    <div>
                      {respuestas.length === 0
                        ? 'No hay respuestas registradas en el período.'
                        : `La valoración promedio de ${ratingPromedioGeneral.toFixed(1)} estrellas indica una experiencia ${
                            ratingPromedioGeneral >= 4.5 ? 'excelente' : 
                            ratingPromedioGeneral >= 4.0 ? 'muy positiva' : 
                            ratingPromedioGeneral >= 3.0 ? 'positiva' : 'regular'
                          }. Se recomienda ${ratingPromedioGeneral >= 4.0 ? 'mantener' : 'mejorar'} la calidad de atención en las áreas con menor puntuación.`}
                    </div>
                  </div>
                </section>
              </main>
            )}

            {/* Modal de detalles */}
            {sectorSeleccionado && (
              <DetallesModal 
                sector={sectorSeleccionado.sector}
                datos={sectorSeleccionado.datos}
                onClose={() => setSectorSeleccionado(null)}
              />
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
}

export default AnalisisSatisfaccionCliente;