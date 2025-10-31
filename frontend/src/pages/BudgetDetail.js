import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
// import emailjs from 'emailjs-com'; // ✅ Importar EmailJS
import logoAnodal from '../images/logo_secundario.webp';
import miniLogo from '../images/logo_secundario.webp';
import ReactLoading from 'react-loading';
import Navbar from '../components/Navigation';
import { safeArray } from '../utils/safeArray';
import '../styles/BudgetDetail.css';
import Qrcode from '../images/qr-code.png';
// Reemplazar import de react-pdf por pdfmake
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { ToastContainer, toast, Slide } from 'react-toastify';
// Asignación robusta de vfs para distintas formas de exportación del paquete
pdfMake.vfs = (
  (pdfFonts && (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs)) ||
  (pdfFonts && pdfFonts.vfs) ||
  (pdfFonts && pdfFonts.default && pdfFonts.default.vfs) ||
  pdfMake.vfs
);

// ✅ Configuración de EmailJS con tus credenciales
// const EMAILJS_CONFIG = {
//   serviceId: 'service_ngu8koc',
//   templateId: 'template_39aty7d',
//   userId: 'QxYqfCz3uNXncaqvW'
// };

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5187";

const BudgetDetail = () => {
  const { id } = useParams();
  const [budget, setBudget] = useState(null);
  const [sanitizedBudget, setSanitizedBudget] = useState(null);
  const [versions, setVersions] = useState([]); // <-- lista de versiones (raw o saneadas)
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [mailLoading, setMailLoading] = useState(false);
  const [whatsAppLoading, setWhatsAppLoading] = useState(false);

  // Helper: parsea/normaliza números que pueden venir como string con comas/puntos/extraneous chars
  const safeNumber = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) return null;
      return v;
    }
    try {
      let s = String(v).trim();
      // reemplazar comas por punto
      s = s.replace(/,/g, '.');
      // eliminar caracteres que no sean dígitos, punto o signo menos
      s = s.replace(/[^\d\.\-]/g, '');
      // si hay más de un punto, dejar solo el first-rightmost sensible: 
      // estrategia: keep first '.' and remove subsequent dots
      const parts = s.split('.');
      if (parts.length > 2) {
        s = parts.shift() + '.' + parts.join(''); // primera parte + '.' + resto concatenado
      }
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    } catch (err) {
      return null;
    }
  };

  // deepSanitize: extrae solo los campos necesarios y usa safeArray para Products (no elimina $values)
  const deepSanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    try {
      // helper to safely read nested values with fallback names
      const read = (o, keys = []) => {
        for (const k of keys) {
          if (!o) break;
          if (o[k] !== undefined) return o[k];
        }
        return undefined;
      };

      const products = safeArray(obj.Products).map(p => ({
        OpeningType: p?.OpeningType ? { name: p.OpeningType.name } : null,
        Quantity: safeNumber(p?.Quantity ?? p?.quantity ?? 0) ?? 0,
        width: (() => { const n = safeNumber(p?.width ?? p?.Width); return n !== null ? n : (p?.width ?? p?.Width ?? '-'); })(),
        height: (() => { const n = safeNumber(p?.height ?? p?.Height); return n !== null ? n : (p?.height ?? p?.Height ?? '-'); })(),
        GlassType: p?.GlassType ? { name: p.GlassType.name } : null,
        AlumTreatment: p?.AlumTreatment ? { name: p.AlumTreatment.name } : null,
        price: safeNumber(p?.price ?? p?.Price) ?? null
      }));

      // NORMALIZAR COMPLEMENTOS: support .Complement / .complement and .$values
      const rawComplementsArray = safeArray(obj.Complement || obj.complement || obj.Complements);
      const complements = [];
      rawComplementsArray.forEach(c => {
        // ComplementDoor
        safeArray(c.ComplementDoor).forEach(d => {
          complements.push({
            type: 'Door',
            name: d?.Name ?? d?.name ?? '',
            quantity: safeNumber(d?.Quantity ?? d?.quantity) ?? 1,
            unitPrice: safeNumber(d?.UnitPrice ?? d?.Price ?? d?.price) ?? 0,
            totalPrice: safeNumber(d?.Price ?? d?.price) ?? 0,
            details: `Puerta ${ (safeNumber(d?.Width ?? d?.width) !== null) ? (safeNumber(d?.Width ?? d?.width) + 'x' + (safeNumber(d?.Height ?? d?.height) ?? '')) : (d?.Width ?? d?.width ?? '') }`
          });
        });
        // ComplementPartition
        safeArray(c.ComplementPartition).forEach(p => {
          complements.push({
            type: 'Partition',
            name: p?.Name ?? p?.name ?? '',
            quantity: safeNumber(p?.Quantity ?? p?.quantity) ?? 1,
            unitPrice: safeNumber(p?.UnitPrice ?? p?.Price ?? p?.price) ?? 0,
            totalPrice: safeNumber(p?.Price ?? p?.price) ?? 0,
            details: `Alto: ${ (safeNumber(p?.Height ?? p?.height) !== null) ? (safeNumber(p?.Height ?? p?.height) + ' cm') : (p?.Height ?? p?.height ?? '') } ${p?.Simple === false ? '(Complejo)' : ''}`
          });
        });
        // ComplementRailing
        safeArray(c.ComplementRailing).forEach(r => {
          complements.push({
            type: 'Railing',
            name: r?.Name ?? r?.name ?? '',
            quantity: safeNumber(r?.Quantity ?? r?.quantity) ?? 1,
            unitPrice: safeNumber(r?.UnitPrice ?? r?.Price ?? r?.price) ?? 0,
            totalPrice: safeNumber(r?.Price ?? r?.price) ?? 0,
            details: r?.AlumTreatment?.name ? `Tratamiento: ${r.AlumTreatment.name}` : ''
          });
        });

        // Si el elemento complement tiene 'price' agregado como total del grupo
        if (c?.price && (!c.ComplementDoor && !c.ComplementPartition && !c.ComplementRailing)) {
          complements.push({
            type: 'ComplementGroup',
            name: 'Varios',
            quantity: 1,
            unitPrice: safeNumber(c.price) ?? 0,
            totalPrice: safeNumber(c.price) ?? 0,
            details: ''
          });
        }
      });

      return {
        budgetId: read(obj, ['budgetId', 'BudgetId']),
        version: read(obj, ['version']),
        creationDate: read(obj, ['creationDate']),
        status: read(obj, ['status']),
        ExpirationDate: read(obj, ['ExpirationDate', 'EndDate']),
        DollarReference: safeNumber(read(obj, ['DollarReference'])) ?? read(obj, ['DollarReference']),
        LabourReference: safeNumber(read(obj, ['LabourReference'])) ?? read(obj, ['LabourReference']),
        Total: safeNumber(read(obj, ['Total'])) ?? read(obj, ['Total']),
        Comment: read(obj, ['Comment']) || '',
        user: obj.user ? {
          name: obj.user.name,
          lastName: obj.user.lastName ?? obj.user.lastname,
          mail: obj.user.mail ?? obj.user.email
        } : null,
        customer: obj.customer ? {
          name: obj.customer.name,
          lastname: obj.customer.lastname,
          mail: obj.customer.mail,
          tel: obj.customer.tel,
          address: obj.customer.address
        } : null,
        agent: obj.agent ? {
          name: obj.agent.name,
          mail: obj.agent.mail
        } : null,
        workPlace: obj.workPlace ? {
          name: obj.workPlace.name,
          address: obj.workPlace.address ?? obj.workPlace.location
        } : null,
        Products: products,
        Complement: complements
      };
    } catch (err) {
      console.error('deepSanitize fallback error:', err);
      return {
        budgetId: obj?.budgetId,
        creationDate: obj?.creationDate,
        status: obj?.status,
        Total: safeNumber(obj?.Total) ?? obj?.Total,
        Comment: obj?.Comment || '',
        Products: [],
        Complement: []
      };
    }
  };

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/Mongo/GetBudgetVersions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched versions:', res.data);

        // Soportar respuesta directa array o objeto con $values (serialización de .NET)
        const rawList = Array.isArray(res.data)
          ? res.data
          : (res.data && Array.isArray(res.data.$values) ? res.data.$values : []);

        setVersions(rawList);

        // Seleccionar la primera (última versión) por defecto
        const first = rawList[0] ?? null;
        if (first) {
          setBudget(first); // para funciones que usan 'budget' (ej. WhatsApp)
          setSanitizedBudget(deepSanitize(first));
          setSelectedVersionIndex(0);
        } else {
          setBudget(null);
          setSanitizedBudget(null);
        }
      } catch (error) {
        console.error('Error fetching budget versions:', error);
        setBudget(null);
        setSanitizedBudget(null);
        setVersions([]);
      }
      setLoading(false);
    };
    fetchVersions();
  }, [id]);

  // Handler cuando el usuario cambia la versión seleccionada
  const handleVersionChange = (e) => {
    const idx = parseInt(e.target.value, 10);
    if (isNaN(idx) || !versions[idx]) return;
    const selected = versions[idx];
    setSelectedVersionIndex(idx);
    setBudget(selected);
    setSanitizedBudget(deepSanitize(selected));
  };

  const show = (val) => val !== undefined && val !== null && val !== "" ? val : "No especificado";

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

  // ✅ Helper para convertir blob a base64 (necesario para EmailJS)
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Nuevo: convertir imagen URL -> dataURL (base64) opcional (si quieres incluir logos)
  const urlToDataUrl = async (url) => {
    if (!url) return null;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const mime = blob.type;

      // Si es webp, pdfMake suele rechazarlo: convertir a PNG usando createImageBitmap/canvas
      if (mime === 'image/webp') {
        try {
          // preferir createImageBitmap si está disponible
          if (window.createImageBitmap) {
            const bitmap = await createImageBitmap(blob);
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(bitmap, 0, 0);
            return canvas.toDataURL('image/png');
          } else {
            // fallback clásico: Image + canvas
            const objectUrl = URL.createObjectURL(blob);
            const img = new Image();
            img.src = objectUrl;
            await new Promise((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = reject;
            });
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(objectUrl);
            return canvas.toDataURL('image/png');
          }
        } catch (convErr) {
          console.warn('No se pudo convertir webp a png', convErr);
          return null;
        }
      }

      // Otros formatos: devolver dataURL directo
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('No se pudo convertir imagen a dataURL', url, e);
      return null;
    }
  };

  // Construye la definición de pdfmake a partir de la cotización saneada
  const buildDocDefinition = async (bgt) => {
    const logoData = await urlToDataUrl(logoAnodal).catch(() => null);
    const qrData = await urlToDataUrl(Qrcode).catch(() => null);
    // ✅ REDUCIR calidad de imágenes
    const optimizedLogoData = logoData ? await compressImage(logoData, 0.5) : null;
    const optimizedQrData = qrData ? await compressImage(qrData, 0.3) : null;

    const productsTableBody = [
      [
        { text: 'PRODUCTO', style: 'tableHeader', fillColor: '#2c3e50' },
        { text: 'CANT.', style: 'tableHeader', fillColor: '#2c3e50' },
        { text: 'DIMENSIONES', style: 'tableHeader', fillColor: '#2c3e50' },
        { text: 'VIDRIO', style: 'tableHeader', fillColor: '#2c3e50' },
        { text: 'TRATAMIENTO', style: 'tableHeader', fillColor: '#2c3e50' },
        { text: 'PRECIO/U', style: 'tableHeader', fillColor: '#2c3e50' }
      ]
    ];

    (bgt.Products || []).forEach(p => {
      productsTableBody.push([
        { text: p?.OpeningType?.name || '-', style: 'tableText' },
        { text: String(p?.Quantity ?? '-'), style: 'tableText', alignment: 'center' },
        { text: (p?.width ?? '-') + 'x' + (p?.height ?? '-') + ' cm', style: 'tableText', alignment: 'center' },
        { text: p?.GlassType?.name || '-', style: 'tableText' },
        { text: p?.AlumTreatment?.name || '-', style: 'tableText' },
        { text: p?.price ? `$${p.price}` : '-', style: 'tableText', alignment: 'right' }
      ]);
    });

    // --- NUEVA TABLA: Complementos (si existen) ---
    const complementsTableBody = [
      [
        { text: 'TIPO', style: 'tableHeader', fillColor: '#2c3e50' },
        { text: 'DESCRIPCIÓN', style: 'tableHeader', fillColor: '#2c3e50' },
        { text: 'CANT.', style: 'tableHeader', fillColor: '#2c3e50' },
        { text: 'DETALLES', style: 'tableHeader', fillColor: '#2c3e50' },
        { text: 'PRECIO/U', style: 'tableHeader', fillColor: '#2c3e50' },
        { text: 'TOTAL', style: 'tableHeader', fillColor: '#2c3e50' }
      ]
    ];

    (bgt.Complement || []).forEach(c => {
      complementsTableBody.push([
        { text: c?.type || '-', style: 'tableText' },
        { text: c?.name || '-', style: 'tableText' },
        { text: String(c?.quantity ?? '-'), style: 'tableText', alignment: 'center' },
        { text: c?.details || '-', style: 'tableText' },
        { text: c?.unitPrice ? `$${Number(c.unitPrice).toFixed(2)}` : '-', style: 'tableText', alignment: 'right' },
        { text: c?.totalPrice ? `$${Number(c.totalPrice).toFixed(2)}` : '-', style: 'tableText', alignment: 'right' }
      ]);
    });

    const commentText = (bgt.Comment || '').toString();

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 80, 40, 60], // ✅ Reducir márgenes
      compress: true, // ✅ Comprimir PDF
      pageMargins: [40, 100, 40, 60], // Aumenté el margen superior para el header
      header: function (currentPage, pageCount) {
        return {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    // Primera fila: Logo + Título + Info empresa
                    {
                      columns: [
                        // Logo más pequeño y mejor posicionado
                        (logoData && typeof logoData === 'string' && logoData.startsWith('data:')) ?
                          {
                            image: logoData,
                            width: 60,
                            margin: [0, 0, 0, 0],
                            alignment: 'left'
                          } :
                          { text: '', width: 60 },
                        // Título centrado
                        {
                          stack: [
                            { text: 'COTIZACIÓN', style: 'documentTitle', alignment: 'center' },
                            { text: `Página ${currentPage} de ${pageCount}`, style: 'pageNumber', alignment: 'center' }
                          ],
                          alignment: 'center',
                          width: '*'
                        },
                        // Información de la empresa más compacta
                        {
                          stack: [
                            { text: 'ANODAL S.A.', style: 'companyName', alignment: 'right' },
                            { text: 'Av. Japón 1292 Córdoba', style: 'companyInfo', alignment: 'right' },
                            { text: 'info@anodal.com.ar', style: 'companyInfo', alignment: 'right' },
                            { text: '0351 4995870', style: 'companyInfo', alignment: 'right' }
                          ],
                          width: 120,
                          alignment: 'right'
                        }
                      ],
                      margin: [0, 0, 0, 5]
                    },
                    // Línea separadora
                    {
                      canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#3498db' }],
                      margin: [0, 5, 0, 0]
                    }
                  ]
                }
              ]
            ]
          },
          layout: 'noBorders',
          margin: [40, 20, 40, 10] // Reducir margen del header
        };
      },
      footer: function (currentPage, pageCount) {
        return {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#bdc3c7' }],
                  margin: [0, 0, 0, 5]
                }
              ],
              [
                {
                  columns: [
                    (logoData && typeof logoData === 'string' && logoData.startsWith('data:')) ?
                      { image: logoData, width: 25, margin: [0, 5, 0, 0] } :
                      { text: '' },
                    {
                      text: 'Avenida Japón 1292 / Córdoba / Argentina - Solo para uso interno de la empresa Anodal S.A.',
                      style: 'footerText',
                      alignment: 'center',
                      margin: [10, 5, 0, 0]
                    }
                  ]
                }
              ]
            ]
          },
          layout: 'noBorders',
          margin: [40, 10, 40, 20]
        };
      },
      content: [
        // Número de cotización y fechas - AHORA ESTE CONTENIDO ESTÁ DEBAJO DEL HEADER
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  columns: [
                    {
                      text: `COTIZACIÓN N°: ${bgt.budgetId || '-'}`,
                      style: 'budgetNumber'
                    },
                    {
                      stack: [
                        { text: `Fecha: ${bgt.creationDate ? new Date(bgt.creationDate).toLocaleDateString() : '-'}`, style: 'dateText', alignment: 'right' },
                        { text: `Válido hasta: ${bgt.ExpirationDate ? new Date(bgt.ExpirationDate).toLocaleDateString() : '-'}`, style: 'dateText', alignment: 'right' }
                      ]
                    }
                  ]
                }
              ]
            ]
          },
          layout: 'noBorders',
          margin: [0, 10, 0, 15] // Reducir margen superior aquí también
        },

        // Información de contacto en tarjetas - MÁS COMPACTA
        {
          columns: [
            {
              stack: [
                { text: 'CLIENTE', style: 'sectionTitle' },
                {
                  table: {
                    widths: ['*'],
                    body: [
                      [{ text: `Nombre: ${bgt.customer?.name || '-'} ${bgt.customer?.lastname || ''}`, style: 'infoText' }],
                      [{ text: `Correo: ${bgt.customer?.mail || '-'}`, style: 'infoText' }],
                      [{ text: `Tel: ${bgt.customer?.tel || '-'}`, style: 'infoText' }],
                      [{ text: `Dirección: ${bgt.customer?.address || '-'}`, style: 'infoText' }]
                    ]
                  },
                  layout: {
                    defaultBorder: false,
                    fillColor: '#ecf0f1'
                  },
                  margin: [0, 2, 0, 0] // Reducir margen
                }
              ],
              width: '33%'
            },
            {
              stack: [
                { text: 'LUGAR DE TRABAJO', style: 'sectionTitle' },
                {
                  table: {
                    widths: ['*'],
                    body: [
                      [{ text: `Nombre: ${bgt.workPlace?.name || '-'}`, style: 'infoText' }],
                      [{ text: `Dirección: ${bgt.workPlace?.address || '-'}`, style: 'infoText' }]
                    ]
                  },
                  layout: {
                    defaultBorder: false,
                    fillColor: '#ecf0f1'
                  },
                  margin: [0, 2, 0, 0]
                }
              ],
              width: '33%'
            },
            {
              stack: [
                { text: 'VENDEDOR', style: 'sectionTitle' },
                {
                  table: {
                    widths: ['*'],
                    body: [
                      [{ text: `Nombre: ${bgt.user?.name || '-'} ${bgt.user?.lastName || ''}`, style: 'infoText' }],
                      [{ text: `Mail: ${bgt.user?.mail || '-'}`, style: 'infoText' }]
                    ]
                  },
                  layout: {
                    defaultBorder: false,
                    fillColor: '#ecf0f1'
                  },
                  margin: [0, 2, 0, 0]
                }
              ],
              width: '33%'
            }
          ],
          columnGap: 8, // Reducir espacio entre columnas
          margin: [0, 0, 0, 15] // Reducir margen inferior
        },

        // Resto del contenido se mantiene igual...
        { text: 'ABERTURAS', style: 'sectionTitle', margin: [0, 0, 0, 8] },
        {
          table: {
            headerRows: 1,
            widths: ['*', 40, 80, 80, 80, 60],
            body: productsTableBody
          },
          layout: {
            fillColor: function (rowIndex) {
              return (rowIndex % 2 === 0) ? '#f8f9fa' : null;
            }
          }
        },

        // <-- INSERTA AQUÍ la sección de complementos si existen -->
        ...((bgt.Complement && bgt.Complement.length > 0) ? [
          { text: '\n' },
          { text: 'COMPLEMENTOS', style: 'sectionTitle', margin: [0, 8, 0, 8] },
          {
            table: {
              headerRows: 1,
              widths: [70, '*', 40, 120, 70, 70], // usar números (no strings) para evitar parseos extraños
              body: complementsTableBody
            },
            layout: {
              fillColor: function (rowIndex) {
                return (rowIndex % 2 === 0) ? '#f8f9fa' : null;
              }
            },
            margin: [0, 0, 0, 12]
          }
        ] : []),

        // Totales
        {
          table: {
            widths: ['*', 200],
            body: [
              [
                { text: '', border: [false, false, false, false] },
                {
                  stack: [
                    {
                      table: {
                        widths: ['*'],
                        body: [
                          [{ text: `Dólar Referencia: $${bgt.DollarReference ?? '-'}`, style: 'referenceText', border: [false, false, false, false] }],
                          [{ text: `Mano de Obra: $${bgt.LabourReference ?? '-'}`, style: 'referenceText', border: [false, false, false, false] }],
                          [{ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 1, lineColor: '#7f8c8d' }], border: [false, false, false, false] }],
                          [{ text: `TOTAL: $${bgt.Total ?? '-'}`, style: 'totalText', border: [false, false, false, false] }]
                        ]
                      },
                      layout: 'noBorders',
                      margin: [0, 5, 0, 0]
                    }
                  ],
                  alignment: 'right'
                }
              ]
            ]
          },
          layout: 'noBorders',
          margin: [0, 10, 0, 15]
        },

        // Observaciones
        {
          stack: [
            { text: 'OBSERVACIONES', style: 'sectionTitle', margin: [0, 0, 0, 5] },
            {
              table: {
                widths: ['*'],
                body: [
                  [
                    {
                      text: commentText || 'Sin observaciones',
                      style: 'commentText',
                      fillColor: '#f8f9fa'
                    }
                  ]
                ]
              },
              layout: {
                defaultBorder: false
              }
            }
          ]
        },

        // Encuesta de satisfacción
        {
          stack: [
            { text: '\n' },
            {
              table: {
                widths: ['*'],
                body: [
                  [
                    {
                      stack: [
                        { text: 'ENCUESTA DE SATISFACCIÓN', style: 'surveyTitle' },
                        { text: 'Tu opinión es muy importante para nosotros. Escanea el código QR para acceder a la encuesta y contarnos tu experiencia.', style: 'surveyText', margin: [0, 5, 0, 8] },
                        (qrData && typeof qrData === 'string' && qrData.startsWith('data:')) ?
                          { image: qrData, width: 70, alignment: 'center', margin: [0, 0, 0, 5] } :
                          { text: '' },
                        { text: '¡Gracias por elegirnos!', style: 'surveyThanks', alignment: 'center' }
                      ],
                      alignment: 'center',
                      fillColor: '#ecf0f1'
                    }
                  ]
                ]
              },
              layout: {
                defaultBorder: false
              }
            }
          ]
        }
      ],
      styles: {
        documentTitle: {
          fontSize: 18, // Reducido
          bold: true,
          color: '#2c3e50',
          margin: [0, 2, 0, 0] // Menos margen
        },
        companyName: {
          fontSize: 9, // Reducido
          bold: true,
          color: '#2c3e50',
          margin: [0, 0, 0, 0]
        },
        companyInfo: {
          fontSize: 7, // Reducido
          color: '#7f8c8d',
          margin: [0, 0, 0, 0]
        },
        pageNumber: {
          fontSize: 8,
          color: '#7f8c8d',
          margin: [0, 2, 0, 0]
        },
        budgetNumber: {
          fontSize: 12, // Reducido
          bold: true,
          color: '#2c3e50'
        },
        dateText: {
          fontSize: 9, // Reducido
          color: '#7f8c8d'
        },
        sectionTitle: {
          fontSize: 10, // Reducido
          bold: true,
          color: '#ffffff',
          background: '#3498db',
          padding: [4, 8], // Reducido
          margin: [0, 0, 0, 2]
        },
        tableHeader: {
          fontSize: 8, // Reducido
          bold: true,
          color: '#ffffff',
          alignment: 'center'
        },
        tableText: {
          fontSize: 8, // Reducido
          color: '#2c3e50'
        },
        infoText: {
          fontSize: 8, // Reducido
          color: '#2c3e50',
          padding: [4, 4] // Reducido
        },
        referenceText: {
          fontSize: 9,
          color: '#7f8c8d',
          alignment: 'right'
        },
        totalText: {
          fontSize: 12, // Reducido ligeramente
          bold: true,
          color: '#2c3e50',
          alignment: 'right',
          margin: [0, 3, 0, 0]
        },
        commentText: {
          fontSize: 9,
          color: '#2c3e50',
          padding: [8, 8]
        },
        surveyTitle: {
          fontSize: 12, // Reducido
          bold: true,
          color: '#2c3e50',
          alignment: 'center'
        },
        surveyText: {
          fontSize: 9,
          color: '#2c3e50',
          alignment: 'center'
        },
        surveyThanks: {
          fontSize: 9,
          bold: true,
          color: '#27ae60',
          margin: [0, 3, 0, 0]
        },
        footerText: {
          fontSize: 7, // Reducido
          color: '#7f8c8d'
        }
      },
      defaultStyle: {
        fontSize: 9, // Reducido globalmente
        color: '#2c3e50'
      }
    };

    return docDefinition;
  };
  // ✅ Función para comprimir imágenes
  const compressImage = (dataUrl, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width * quality;
        canvas.height = img.height * quality;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // ✅ Usar JPEG en lugar de PNG
      };
      img.onerror = () => resolve(dataUrl); // Fallback
    });
  };

  // Obtener Blob desde docDefinition (pdfMake usa callback)
  const getPdfBlob = async (bgt) => {
    try {
      const docDef = await buildDocDefinition(bgt);
      return await new Promise((resolve, reject) => {
        const pdfDocGenerator = pdfMake.createPdf(docDef);
        pdfDocGenerator.getBlob((blob) => {
          resolve(blob);
        }, (err) => reject(err));
      });
    } catch (err) {
      console.error('Error generando blob pdfmake', err);
      return null;
    }
  };

  // Preview automático: crear URL del blob cuando llega sanitizedBudget
  const [previewUrl, setPreviewUrl] = useState(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!sanitizedBudget) return;
      try {
        const blob = await getPdfBlob(sanitizedBudget);
        if (!mounted) return;
        if (blob) {
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        }
      } catch (e) {
        console.error('Error generando preview', e);
      }
    })();
    return () => {
      mounted = false;
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sanitizedBudget]);

  // Actualizar handler de descarga para usar pdfmake (descarga directa o con blob)
  const handleDescargarPDF = async () => {
    if (!sanitizedBudget) return;
    setPdfLoading(true);
    try {
      const docDef = await buildDocDefinition(sanitizedBudget);
      // descarga directa con pdfMake
      pdfMake.createPdf(docDef).download(`detalle_cotizacion_${show(sanitizedBudget.budgetId)}.pdf`);
    } catch (err) {
      console.error('Error al descargar PDF', err);
      alert('No se pudo generar el PDF');
    }
    setPdfLoading(false);
  };

  // Enviar email: intenta varios endpoints y devuelve diagnóstico útil si falla
  const handleEnviarEmailJS = async () => {
    if (!sanitizedBudget) return;
    setMailLoading(true);

    // Generar PDF blob primero
    let pdfBlob = null;
    try {
      pdfBlob = await getPdfBlob(sanitizedBudget);
      if (!pdfBlob) {
        alert("No se pudo generar el PDF");
        setMailLoading(false);
        return;
      }
    } catch (err) {
      console.error('Error generando PDF para envío:', err);
      alert("No se pudo generar el PDF");
      setMailLoading(false);
      return;
    }

    // Intentar enviar desde el servidor
    try {
      const formData = new FormData();
      formData.append("file", pdfBlob, `cotizacion_${sanitizedBudget.budgetId}.pdf`);
      formData.append("to", sanitizedBudget.customer?.mail || "");
      formData.append("budgetId", sanitizedBudget.budgetId || "");

      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL.replace(/\/$/, '')}/api/public/send`, formData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        validateStatus: () => true
      });

      if (res.status >= 200 && res.status < 300 && res.data && res.data.sent) {
        toast.success("Correo enviado correctamente.");
        setMailLoading(false);
        return;
      }

      // Si el servidor dice que SMTP no está configurado, usar fallback: subir y devolver link
      const serverError = res.data && (res.data.error || res.data.detail) ? (res.data.error || res.data.detail) : null;
      if (serverError && String(serverError).toLowerCase().includes("smtp not configured")) {
        try {
          // subir para obtener link público
          const uploadForm = new FormData();
          uploadForm.append("file", pdfBlob, `cotizacion_${sanitizedBudget.budgetId}.pdf`);
          uploadForm.append("budgetId", sanitizedBudget.budgetId || "");
          const upRes = await axios.post(`${API_URL.replace(/\/$/, '')}/api/public/upload`, uploadForm, {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            },
            validateStatus: () => true
          });
          if (upRes.status >= 200 && upRes.data && upRes.data.url) {
            const url = upRes.data.url;
            // copiar al portapapeles si está disponible
            try {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
              }
            } catch (clipErr) {
              console.warn("No se pudo copiar al portapapeles", clipErr);
            }
            alert(`El servidor no tiene SMTP configurado. Se subió la cotización y se copió el link al portapapeles:\n\n${url}\n\nPegalo en tu cliente de correo para enviar al cliente.`);
            setMailLoading(false);
            return;
          } else {
            console.warn("Upload fallback failed", upRes.status, upRes.data);
            alert("El servidor no pudo enviar el correo y no se pudo generar el link público. Contactá al administrador.");
          }
        } catch (upErr) {
          console.error("Error en upload fallback:", upErr);
          alert("El servidor no pudo enviar el correo y falló el intento de generar link público.");
        }
      } else {
        const msg = serverError || 'No se pudo enviar la cotización desde el servidor.';
        alert(`Error al enviar: ${msg}`);
      }
    } catch (err) {
      console.error('Error uploading/sending to server', err);
      alert('Ocurrió un error al comunicarse con el servidor para enviar el correo.');
    }

    setMailLoading(false);
  };

  const handleEnviarWhatsApp = async () => {
    setWhatsAppLoading(true);
    try {
      if (!sanitizedBudget) {
        alert("No hay cotización para enviar.");
        setWhatsAppLoading(false);
        return;
      }

      // Generar PDF blob
      const pdfBlob = await getPdfBlob(sanitizedBudget);
      if (!pdfBlob) {
        alert("No se pudo generar el PDF para enviar por WhatsApp.");
        setWhatsAppLoading(false);
        return;
      }

      // Intentar subir al endpoint público para obtener link único
      let publicUrl = null;
      try {
        const formData = new FormData();
        formData.append("file", pdfBlob, `cotizacion_${sanitizedBudget.budgetId}.pdf`);
        formData.append("budgetId", sanitizedBudget.budgetId || "");
        const token = localStorage.getItem("token");
        const upRes = await axios.post(`${API_URL.replace(/\/$/, '')}/api/public/upload`, formData, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          validateStatus: () => true
        });
        if (upRes.status >= 200 && upRes.data && upRes.data.url) {
          publicUrl = upRes.data.url;
        }
      } catch (uerr) {
        console.warn("Upload to public failed, will fallback to blob URL", uerr);
      }

      // Fallback: crear URL temporal desde Blob si no hay publicUrl
      let tempBlobUrl = null;
      if (!publicUrl) {
        tempBlobUrl = URL.createObjectURL(pdfBlob);
        publicUrl = tempBlobUrl;
      }

      // Normalizar teléfono: eliminar no-dígitos y anteponer '549' si parece local
      let phoneRaw = (budget?.customer?.tel || "").toString();
      let phone = phoneRaw.replace(/\D/g, "");
      if (!phone) phone = "5493510000000"; // fallback si no hay teléfono
      // Si la longitud es <=10 (número local sin código), anteponer 549
      if (phone.length <= 10) phone = "549" + phone;

      const message = `Hola ${sanitizedBudget.customer?.name || ''},\nTe comparto tu cotización: ${publicUrl}`;
      // Usar WhatsApp Web para escritorio; wa.me abre app/web según dispositivo
      const waUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");

      // Si usamos blob temporal, no revocar inmediatamente (el usuario lo abrirá). Programamos revocación ligera.
      if (tempBlobUrl) {
        setTimeout(() => URL.revokeObjectURL(tempBlobUrl), 5 * 60 * 1000); // revocar en 5 minutos
      }
    } catch (err) {
      console.error("Error preparando WhatsApp:", err);
      alert("Ocurrió un error al preparar el mensaje de WhatsApp.");
    } finally {
      setWhatsAppLoading(false);
    }
  };

  // Nuevo helper: traduce estados en inglés a español para el dropdown
  const translateStatus = (s) => {
    if (!s) return '';
    const key = String(s).toLowerCase();
    switch (key) {
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      case 'finished': return 'Finalizado';
      case 'approved': return 'Aprobado';
      default: return s; // deja el original si no se mapea
    }
  };

  return (
    <>
      <Navbar />
      <div className="content-bottom">
        <ToastContainer autoClose={4000} theme="dark" transition={Slide} position="bottom-right" />

        {/* Contenedor único que agrupa botones y select para evitar que se desplacen */}
        <div className="controls-wrapper">
          <div className="button-group">
            <button
              className="reporte-cotizaciones-btn-pdf btn-with-spinner"
              onClick={handleDescargarPDF}
              disabled={pdfLoading || !sanitizedBudget}
            >
              {pdfLoading ? <ReactLoading type="spin" color="#fff" height={24} width={24} /> : "Descargar PDF"}
            </button>

            <button
              className="reporte-cotizaciones-btn-email btn-with-spinner"
              onClick={handleEnviarEmailJS}
              disabled={mailLoading || !budget}
            >
              {mailLoading ? <ReactLoading type="spin" color="#fff" height={24} width={24} /> : "Enviar por Email"}
            </button>

            <button
              className="reporte-cotizaciones-btn-whatsapp btn-with-spinner"
              onClick={handleEnviarWhatsApp}
              disabled={whatsAppLoading || !budget}
            >
              {whatsAppLoading ? <ReactLoading type="spin" color="#fff" height={24} width={24} /> : "Enviar por WhatsApp"}
            </button>
          </div>

          <div className="version-select">
            <label className="version-label">Versión</label>
            <select
              value={selectedVersionIndex}
              onChange={handleVersionChange}
              disabled={loading || versions.length === 0}
              className="version-select-input"
            >
              {versions.map((v, idx) => {
                const ver = v?.version ?? v?.Version ?? `#${idx + 1}`;
                const cd = v?.creationDate ?? v?.CreationDate ?? v?.file_date ?? null;
                const rawStatus = v?.status ?? v?.Status ?? '';
                const status = translateStatus(rawStatus);
                const labelDate = cd ? ` - ${new Date(cd).toLocaleDateString()}` : '';
                return <option key={idx} value={idx}>{`v${ver || '?'} ${status ? `(${status})` : ''}${labelDate}`}</option>;
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="pdf-background">
        {loading ? (
          <ReactLoading type="spin" color="#1976d2" height={80} width={80} />
        ) : budget ? (
          <div className="pdf-container">
            {/* Preview via iframe generado por pdfmake blob */}
            {previewUrl ? (
              <iframe title="preview-pdf" src={previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} />
            ) : (
              <div>Generando vista previa...</div>
            )}
          </div>
        ) : (
          <div>No se encontró la cotización.</div>
        )}
      </div>
    </>
  );
};

export default BudgetDetail;