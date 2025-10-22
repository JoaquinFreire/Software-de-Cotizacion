import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
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
// Asignación robusta de vfs para distintas formas de exportación del paquete
pdfMake.vfs = (
  (pdfFonts && (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs)) ||
  (pdfFonts && pdfFonts.vfs) ||
  (pdfFonts && pdfFonts.default && pdfFonts.default.vfs) ||
  pdfMake.vfs
);

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5187";

const BudgetDetail = () => {
  const { id } = useParams();
  const [budget, setBudget] = useState(null);
  const [sanitizedBudget, setSanitizedBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [mailLoading, setMailLoading] = useState(false);
  const [whatsAppLoading, setWhatsAppLoading] = useState(false);

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
        Quantity: p?.Quantity ?? p?.quantity ?? 0,
        width: p?.width ?? p?.Width ?? '-',
        height: p?.height ?? p?.Height ?? '-',
        GlassType: p?.GlassType ? { name: p.GlassType.name } : null,
        AlumTreatment: p?.AlumTreatment ? { name: p.AlumTreatment.name } : null,
        price: p?.price ?? p?.Price ?? null
      }));

      return {
        budgetId: read(obj, ['budgetId', 'BudgetId']),
        version: read(obj, ['version']),
        creationDate: read(obj, ['creationDate']),
        status: read(obj, ['status']),
        ExpirationDate: read(obj, ['ExpirationDate', 'EndDate']),
        DollarReference: read(obj, ['DollarReference']),
        LabourReference: read(obj, ['LabourReference']),
        Total: read(obj, ['Total']),
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
        Products: products
      };
    } catch (err) {
      console.error('deepSanitize fallback error:', err);
      return {
        budgetId: obj?.budgetId,
        creationDate: obj?.creationDate,
        status: obj?.status,
        Total: obj?.Total,
        Comment: obj?.Comment || '',
        Products: []
      };
    }
  };

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/Mongo/GetBudgetByBudgetId/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('📊 Datos originales:', res.data);

        // Sanitizar inmediatamente
        const cleaned = deepSanitize(res.data);
        console.log('🧹 Datos sanitizados:', cleaned);

        setBudget(res.data);
        setSanitizedBudget(cleaned);

      } catch (error) {
        console.error('Error fetching budget:', error);
        setBudget(null);
        setSanitizedBudget(null);
      }
      setLoading(false);
    };
    fetchBudget();
  }, [id]);

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

    const commentText = (bgt.Comment || '').toString();

    const docDefinition = {
      pageSize: 'A4',
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

  const handleEnviarEmail = async () => {
    if (!sanitizedBudget) return;
    setMailLoading(true);
    try {
      const blob = await getPdfBlob(sanitizedBudget);
      if (!blob) {
        alert("No se pudo generar el PDF para enviar");
        setMailLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append("file", blob, `cotizacion_${sanitizedBudget.budgetId}.pdf`);
      formData.append("to", sanitizedBudget.customer?.mail || "cliente@ejemplo.com");

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
    const pdfLink = `${API_URL}/files/cotizacion_${budget?.budgetId}.pdf`;
    const phone = budget?.customer?.tel || "5493510000000";
    const mensaje = `Hola ${budget?.customer?.name || ''}, aquí tienes tu cotización:\n${pdfLink}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`, "_blank");
    setWhatsAppLoading(false);
  };

  return (
    <>
      <Navbar />
      <div className="content-bottom">
        <div className="only-screen">
          <button className="reporte-cotizaciones-btn-pdf" onClick={handleDescargarPDF} disabled={pdfLoading || !budget}>
            {pdfLoading ? <ReactLoading type="spin" color="#fff" height={24} width={24} /> : "Descargar PDF"}
          </button>
        </div>
        <div className="only-screen">
          <button className="reporte-cotizaciones-btn-email" onClick={handleEnviarEmail} disabled={mailLoading || !budget}>
            {mailLoading ? <ReactLoading type="spin" color="#fff" height={24} width={24} /> : "Enviar por Email"}
          </button>
        </div>
        <div className="only-screen">
          <button className="reporte-cotizaciones-btn-whatsapp" onClick={handleEnviarWhatsApp} disabled={whatsAppLoading || !budget}>
            {whatsAppLoading ? <ReactLoading type="spin" color="#fff" height={24} width={24} /> : "Enviar por WhatsApp"}
          </button>
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