import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoAnodal from '../images/logo_secundario.webp';
import ReactLoading from 'react-loading';
import Navigation from '../components/Navigation';
import { safeArray } from '../utils/safeArray';
import '../styles/BudgetDetail.css';
import Qrcode from '../images/qr-code.png';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// asignar vfs de pdfMake de forma robusta
pdfMake.vfs = (
  (pdfFonts && (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs)) ||
  (pdfFonts && pdfFonts.vfs) ||
  (pdfFonts && pdfFonts.default && pdfFonts.default.vfs) ||
  pdfMake.vfs
);

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5187";

const BudgetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [budget, setBudget] = useState(null);
  const [sanitizedBudget, setSanitizedBudget] = useState(null);
  const [versions, setVersions] = useState([]);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [mailLoading, setMailLoading] = useState(false);
  const [whatsAppLoading, setWhatsAppLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [useFallbackView, setUseFallbackView] = useState(false);

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/"); };

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      
      // Detectar específicamente Chrome móvil que tiene problemas con PDF en iframes
      const isChromeMobile = /Chrome/.test(navigator.userAgent) && mobile;
      setUseFallbackView(isChromeMobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const safeNumber = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    try {
      let s = String(v).trim();
      s = s.replace(/,/g, '.');
      s = s.replace(/[^\d\.\-]/g, '');
      const parts = s.split('.');
      if (parts.length > 2) s = parts.shift() + '.' + parts.join('');
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    } catch (err) {
      return null;
    }
  };

  const deepSanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    try {
      const safeRead = (o, keys=[]) => {
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

      const rawComplementsArray = safeArray(obj.Complement || obj.complement || obj.Complements);
      const complements = [];
      rawComplementsArray.forEach(c => {
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
        budgetId: safeRead(obj, ['budgetId','BudgetId']),
        version: safeRead(obj, ['version']),
        creationDate: safeRead(obj, ['creationDate']),
        status: safeRead(obj, ['status']),
        ExpirationDate: safeRead(obj, ['ExpirationDate','EndDate']),
        DollarReference: safeNumber(safeRead(obj, ['DollarReference'])) ?? safeRead(obj, ['DollarReference']),
        LabourReference: safeNumber(safeRead(obj, ['LabourReference'])) ?? safeRead(obj, ['LabourReference']),
        Total: safeNumber(safeRead(obj, ['Total'])) ?? safeRead(obj, ['Total']),
        Comment: safeRead(obj, ['Comment']) || '',
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
        agent: obj.agent ? { name: obj.agent.name, mail: obj.agent.mail } : null,
        workPlace: obj.workPlace ? { name: obj.workPlace.name, address: obj.workPlace.address ?? obj.workPlace.location } : null,
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
          headers: { Authorization: `Bearer ${token}` }
        });
        const rawList = Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.$values) ? res.data.$values : []);
        setVersions(rawList);
        const first = rawList[0] ?? null;
        if (first) {
          setBudget(first);
          setSanitizedBudget(deepSanitize(first));
          setSelectedVersionIndex(0);
        } else { setBudget(null); setSanitizedBudget(null); }
      } catch (error) {
        console.error('Error fetching budget versions:', error);
        setBudget(null); setSanitizedBudget(null); setVersions([]);
      }
      setLoading(false);
    };
    fetchVersions();
  }, [id]);

  const handleVersionChange = (e) => {
    const idx = parseInt(e.target.value, 10);
    if (isNaN(idx) || !versions[idx]) return;
    const selected = versions[idx];
    setSelectedVersionIndex(idx);
    setBudget(selected);
    setSanitizedBudget(deepSanitize(selected));
  };

  const show = (val) => (val !== undefined && val !== null && val !== "" ? val : "No especificado");

  const insertParagraphsBefore = (text) => {
    if (!text) return text || '';
    const phrases = ["Validez de la cotización","Todo pedido queda sujeto","Los precios presupuestados se","Fuerza mayor Anodal no será responsable","Solicitudes de cambios del cliente","Impuestos Los precios cotizados"].map(p => p.toLowerCase());
    let out = String(text);
    let lower = out.toLowerCase();
    for (const phrase of phrases) {
      let start = 0;
      while (true) {
        const idx = lower.indexOf(phrase, start);
        if (idx === -1) break;
        const before = out.slice(0, idx);
        if (!before.endsWith('\n\n') && before !== '') {
          out = before + '\n\n' + out.slice(idx);
          lower = out.toLowerCase();
          start = idx + 2 + phrase.length;
        } else start = idx + phrase.length;
      }
    }
    out = out.replace(/\n{3,}/g, '\n\n');
    return out;
  };

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const urlToDataUrl = async (url) => {
    if (!url) return null;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const mime = blob.type;
      if (mime === 'image/webp') {
        try {
          if (window.createImageBitmap) {
            const bitmap = await createImageBitmap(blob);
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(bitmap, 0, 0);
            return canvas.toDataURL('image/png');
          } else {
            const objectUrl = URL.createObjectURL(blob);
            const img = new Image();
            img.src = objectUrl;
            await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
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

  const compressImage = (dataUrl, quality = 0.7) => new Promise((resolve) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * quality));
      canvas.height = Math.max(1, Math.round(img.height * quality));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(dataUrl);
  });

  const buildDocDefinition = async (bgt) => {
    const logoData = await urlToDataUrl(logoAnodal).catch(() => null);
    const qrData = await urlToDataUrl(Qrcode).catch(() => null);
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
      pageMargins: [40, 100, 40, 60],
      compress: true,
      header: (currentPage, pageCount) => ({
        table: {
          widths: ['*'],
          body: [[{
            stack: [
              {
                columns: [
                  optimizedLogoData ? { image: optimizedLogoData, width: 60, alignment: 'left' } : { text: '', width: 60 },
                  { stack: [ { text: 'COTIZACIÓN', style: 'documentTitle', alignment: 'center' }, { text: `Página ${currentPage} de ${pageCount}`, style: 'pageNumber', alignment: 'center' } ], width: '*' },
                  { stack: [ { text: 'ANODAL S.A.', style: 'companyName', alignment: 'right' }, { text: 'Av. Japón 1292 Córdoba', style: 'companyInfo', alignment: 'right' }, { text: 'info@anodal.com.ar', style: 'companyInfo', alignment: 'right' } ], width: 120 }
                ],
                margin: [0, 0, 0, 5]
              },
              { canvas: [{ type: 'line', x1:0,y1:0,x2:515,y2:0,lineWidth:1,lineColor:'#3498db' }], margin:[0,5,0,0] }
            ]
          }]]
        },
        layout: 'noBorders',
        margin: [40,20,40,10]
      }),
      footer: (currentPage, pageCount) => ({
        table: { widths: ['*'], body: [ [ { canvas: [{ type:'line', x1:0,y1:0,x2:515,y2:0,lineWidth:1,lineColor:'#bdc3c7' }], margin:[0,0,0,5] } ], [ { columns: [ optimizedLogoData ? { image: optimizedLogoData, width:25 } : { text: '' }, { text: 'Avenida Japón 1292 / Córdoba / Argentina - Solo para uso interno de la empresa Anodal S.A.', style:'footerText', alignment:'center' } ] } ] ] },
        layout: 'noBorders',
        margin: [40,10,40,20]
      }),
      content: [
        { table:{ widths:['*'], body:[[ { columns: [ { text: `COTIZACIÓN N°: ${bgt.budgetId || '-'}`, style:'budgetNumber' }, { stack: [ { text: `Fecha: ${bgt.creationDate ? new Date(bgt.creationDate).toLocaleDateString() : '-'}`, style:'dateText', alignment:'right' }, { text: `Válido hasta: ${bgt.ExpirationDate ? new Date(bgt.ExpirationDate).toLocaleDateString() : '-'}`, style:'dateText', alignment:'right' } ] } ] }]] }, layout:'noBorders', margin:[0,10,0,15] },
        { columns: [
          { stack: [ { text:'CLIENTE', style:'sectionTitle' }, { table: { widths:['*'], body: [ [ { text: `Nombre: ${bgt.customer?.name || '-'} ${bgt.customer?.lastname || ''}`, style:'infoText' } ], [ { text: `Correo: ${bgt.customer?.mail || '-'}`, style:'infoText' } ], [ { text: `Tel: ${bgt.customer?.tel || '-'}`, style:'infoText' } ], [ { text: `Dirección: ${bgt.customer?.address || '-'}`, style:'infoText' } ] ] }, layout:{ defaultBorder:false, fillColor:'#ecf0f1' }, margin:[0,2,0,0] } ], width:'33%' },
          { stack: [ { text:'LUGAR DE TRABAJO', style:'sectionTitle' }, { table:{ widths:['*'], body: [ [ { text: `Nombre: ${bgt.workPlace?.name || '-'}`, style:'infoText' } ], [ { text: `Dirección: ${bgt.workPlace?.address || '-'}`, style:'infoText' } ] ] }, layout:{ defaultBorder:false, fillColor:'#ecf0f1' }, margin:[0,2,0,0] } ], width:'33%' },
          { stack: [ { text:'VENDEDOR', style:'sectionTitle' }, { table:{ widths:['*'], body: [ [ { text: `Nombre: ${bgt.user?.name || '-'} ${bgt.user?.lastName || ''}`, style:'infoText' } ], [ { text: `Mail: ${bgt.user?.mail || '-'}`, style:'infoText' } ] ] }, layout:{ defaultBorder:false, fillColor:'#ecf0f1' }, margin:[0,2,0,0] } ], width:'33%' }
        ], columnGap:8, margin:[0,0,0,15] },
        { text: 'ABERTURAS', style:'sectionTitle', margin:[0,0,0,8] },
        { table: { headerRows:1, widths:['*',40,80,80,80,60], body: productsTableBody }, layout: { fillColor: (rowIndex) => (rowIndex % 2 === 0) ? '#f8f9fa' : null } },
        ...((bgt.Complement && bgt.Complement.length > 0) ? [
          { text: '\n' },
          { text: 'COMPLEMENTOS', style:'sectionTitle', margin: [0,8,0,8] },
          { table: { headerRows:1, widths:[70,'*',40,120,70,70], body: complementsTableBody }, layout:{ fillColor: (rowIndex)=> (rowIndex%2===0)?'#f8f9fa':null }, margin:[0,0,0,12] }
        ] : []),
        { table: { widths: ['*', 200], body: [
          [
            { text: '', border: [false, false, false, false] },
            {
              stack: [
                {
                  table: {
                    widths: ['*'],
                    body: [
                      [ { text: 'Dólar Referencia: $' + (bgt.DollarReference ?? '-'), style: 'referenceText', border: [false, false, false, false] } ],
                      [ { text: 'Mano de Obra: $' + (bgt.LabourReference ?? '-'), style: 'referenceText', border: [false, false, false, false] } ],
                      [ { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 1, lineColor: '#7f8c8d' } ], border: [false, false, false, false] } ],
                      [ { text: 'TOTAL: $' + (bgt.Total ?? '-'), style: 'totalText', border: [false, false, false, false] } ]
                    ]
                  },
                  layout: 'noBorders',
                  margin: [0, 5, 0, 0]
                }
              ],
              alignment: 'right'
            }
          ]
        ] }, layout: 'noBorders', margin: [0, 10, 0, 15] },
        { stack: [ { text:'OBSERVACIONES', style:'sectionTitle', margin:[0,0,0,5] }, { table:{ widths:['*'], body:[[ { text: commentText || 'Sin observaciones', style:'commentText', fillColor:'#f8f9fa' } ]] }, layout:{ defaultBorder:false } } ] },
        { stack: [ { text: '\n' }, { table:{ widths:['*'], body:[ [ { stack: [ { text:'ENCUESTA DE SATISFACCIÓN', style:'surveyTitle' }, { text: 'Tu opinión es muy importante para nosotros. Escanea el código QR para acceder a la encuesta.', style:'surveyText', margin:[0,5,0,8] }, optimizedQrData ? { image: optimizedQrData, width:70, alignment:'center', margin:[0,0,0,5] } : { text:'' }, { text: '¡Gracias por elegirnos!', style:'surveyThanks', alignment:'center' } ], alignment:'center', fillColor:'#ecf0f1' } ] ] }, layout:{ defaultBorder:false } } ] }
      ],
      styles: {
        documentTitle: { fontSize: 18, bold: true, color: '#2c3e50' },
        companyName: { fontSize: 9, bold: true, color: '#2c3e50' },
        companyInfo: { fontSize: 7, color: '#7f8c8d' },
        pageNumber: { fontSize: 8, color: '#7f8c8d' },
        budgetNumber: { fontSize: 12, bold: true, color: '#2c3e50' },
        dateText: { fontSize: 9, color: '#7f8c8d' },
        sectionTitle: { fontSize: 10, bold: true, color: '#ffffff', background: '#3498db', padding: [4,8], margin:[0,0,0,2] },
        tableHeader: { fontSize: 8, bold: true, color: '#ffffff', alignment: 'center' },
        tableText: { fontSize: 8, color: '#2c3e50' },
        infoText: { fontSize: 8, color: '#2c3e50' },
        referenceText: { fontSize: 9, color: '#7f8c8d', alignment: 'right' },
        totalText: { fontSize: 12, bold: true, color: '#2c3e50', alignment: 'right' },
        commentText: { fontSize: 9, color: '#2c3e50' },
        surveyTitle: { fontSize: 12, bold: true, color: '#2c3e50', alignment: 'center' },
        surveyText: { fontSize: 9, color: '#2c3e50', alignment: 'center' },
        surveyThanks: { fontSize: 9, bold: true, color: '#27ae60' },
        footerText: { fontSize: 7, color: '#7f8c8d' }
      },
      defaultStyle: { fontSize: 9, color: '#2c3e50' }
    };

    return docDefinition;
  };

  const getPdfBlob = async (bgt) => {
    try {
      const docDef = await buildDocDefinition(bgt);
      return await new Promise((resolve, reject) => {
        const pdfDocGenerator = pdfMake.createPdf(docDef);
        pdfDocGenerator.getBlob((blob) => resolve(blob), (err) => reject(err));
      });
    } catch (err) {
      console.error('Error generando blob pdfmake', err);
      return null;
    }
  };

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
          setPdfBlob(blob);
        }
      } catch (e) { console.error('Error generando preview', e); }
    })();
    return () => {
      mounted = false;
      if (previewUrl) { 
        URL.revokeObjectURL(previewUrl); 
        setPreviewUrl(null);
      }
      if (pdfBlob) {
        setPdfBlob(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sanitizedBudget]);

  const handleDescargarPDF = async () => {
    if (!sanitizedBudget) return;
    setPdfLoading(true);
    try {
      const docDef = await buildDocDefinition(sanitizedBudget);
      pdfMake.createPdf(docDef).download(`detalle_cotizacion_${show(sanitizedBudget.budgetId)}.pdf`);
    } catch (err) {
      console.error('Error al descargar PDF', err);
      alert('No se pudo generar el PDF');
    }
    setPdfLoading(false);
  };

  const handleEnviarEmailJS = async () => {
    if (!sanitizedBudget) return;
    setMailLoading(true);

    let pdfBlob = null;
    try {
      pdfBlob = await getPdfBlob(sanitizedBudget);
      if (!pdfBlob) { alert("No se pudo generar el PDF"); setMailLoading(false); return; }
    } catch (err) {
      console.error('Error generando PDF para envío:', err);
      alert("No se pudo generar el PDF"); setMailLoading(false); return;
    }

    try {
      const formData = new FormData();
      formData.append("file", pdfBlob, `cotizacion_${sanitizedBudget.budgetId}.pdf`);
      formData.append("to", sanitizedBudget.customer?.mail || "");
      formData.append("budgetId", sanitizedBudget.budgetId || "");

      const token = localStorage.getItem("token");
      const fetchRes = await fetch(`${API_URL.replace(/\/$/, '')}/api/public/send`, {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData
      });
      const resData = await fetchRes.clone().json().catch(() => null);
      if (fetchRes.ok && resData && resData.sent) { toast.success("Correo enviado correctamente."); setMailLoading(false); return; }
      const res = { status: fetchRes.status, data: resData };

      const serverError = res.data && (res.data.error || res.data.detail) ? (res.data.error || res.data.detail) : null;
      if (serverError && String(serverError).toLowerCase().includes("smtp not configured")) {
        try {
          const uploadForm = new FormData();
          uploadForm.append("file", pdfBlob, `cotizacion_${sanitizedBudget.budgetId}.pdf`);
          uploadForm.append("budgetId", sanitizedBudget.budgetId || "");
          const token2 = localStorage.getItem("token");
          const upFetch = await fetch(`${API_URL.replace(/\/$/, '')}/api/public/upload`, {
            method: "POST",
            headers: { ...(token2 ? { Authorization: `Bearer ${token2}` } : {}) },
            body: uploadForm
          });
          const upRes = { status: upFetch.status, data: await upFetch.clone().json().catch(() => null) };
          if (upRes.status >= 200 && upRes.data && upRes.data.url) {
            const url = upRes.data.url;
            try { if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(url); } catch (clipErr) { console.warn("No se pudo copiar al portapapeles", clipErr); }
            alert(`El servidor no tiene SMTP configurado. Se subió la cotización y se copió el link al portapapeles:\n\n${url}\n\nPegalo en tu cliente de correo para enviar al cliente.`);
            setMailLoading(false); return;
          } else {
            console.warn("Upload fallback failed", upRes.status, upRes.data);
            alert("El servidor no pudo enviar el correo y no se pudo generar el link público. Contactá al Coordinador.");
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
      if (!sanitizedBudget) { alert("No hay cotización para enviar."); setWhatsAppLoading(false); return; }
      const pdfBlob = await getPdfBlob(sanitizedBudget);
      if (!pdfBlob) { alert("No se pudo generar el PDF para enviar por WhatsApp."); setWhatsAppLoading(false); return; }

      let publicUrl = null;
      try {
        const formData = new FormData();
        formData.append("file", pdfBlob, `cotizacion_${sanitizedBudget.budgetId}.pdf`);
        formData.append("budgetId", sanitizedBudget.budgetId || "");
        const token = localStorage.getItem("token");
        const upFetch = await fetch(`${API_URL.replace(/\/$/, '')}/api/public/upload`, {
          method: "POST",
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: formData
        });
        const upData = await upFetch.clone().json().catch(() => null);
        if (upFetch.ok && upData && upData.url) publicUrl = upData.url;
      } catch (uerr) { console.warn("Upload to public failed, will fallback to blob URL", uerr); }

      let tempBlobUrl = null;
      if (!publicUrl) { tempBlobUrl = URL.createObjectURL(pdfBlob); publicUrl = tempBlobUrl; }

      let phoneRaw = (budget?.customer?.tel || "").toString();
      let phone = phoneRaw.replace(/\D/g, "");
      if (!phone) phone = "5493510000000";
      if (phone.length <= 10) phone = "549" + phone;

      const message = `Hola ${sanitizedBudget.customer?.name || ''},\nTe comparto tu cotización: ${publicUrl}`;
      const waUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");

      if (tempBlobUrl) setTimeout(() => URL.revokeObjectURL(tempBlobUrl), 5 * 60 * 1000);
    } catch (err) {
      console.error("Error preparando WhatsApp:", err);
      alert("Ocurrió un error al preparar el mensaje de WhatsApp.");
    } finally { setWhatsAppLoading(false); }
  };

  const translateStatus = (s) => {
    if (!s) return '';
    const key = String(s).toLowerCase();
    switch (key) {
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      case 'finished': return 'Finalizado';
      case 'approved': return 'Aprobado';
      default: return s;
    }
  };

  // Función para forzar la descarga en dispositivos móviles
  const handleForceDownload = () => {
    if (previewUrl) {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = `cotizacion_${show(sanitizedBudget?.budgetId)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Función para abrir en nueva pestaña
  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  return (
    <div className="dashboard-container">
      <Navigation onLogout={handleLogout} />
      <div className="content-bottom">
        <ToastContainer autoClose={4000} theme="dark" transition={Slide} position="bottom-right" />
        <div className="controls-wrapper">
          <div className="button-group">
            <button className="reporte-cotizaciones-btn-pdf btn-with-spinner" onClick={handleDescargarPDF} disabled={pdfLoading || !sanitizedBudget}>
              {pdfLoading ? <ReactLoading type="spin" color="#fff" height={24} width={24} /> : "Descargar PDF"}
            </button>
            <button className="reporte-cotizaciones-btn-email btn-with-spinner" onClick={handleEnviarEmailJS} disabled={mailLoading || !budget}>
              {mailLoading ? <ReactLoading type="spin" color="#fff" height={24} width={24} /> : "Enviar por Email"}
            </button>
            <button className="reporte-cotizaciones-btn-whatsapp btn-with-spinner" onClick={handleEnviarWhatsApp} disabled={whatsAppLoading || !budget}>
              {whatsAppLoading ? <ReactLoading type="spin" color="#fff" height={24} width={24} /> : "Enviar por WhatsApp"}
            </button>
          </div>
          <div className="version-select">
            <label className="version-label">Versión</label>
            <select value={selectedVersionIndex} onChange={handleVersionChange} disabled={loading || versions.length === 0} className="version-select-input">
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
            {previewUrl ? (
              useFallbackView ? (
                // Vista para Chrome móvil y navegadores problemáticos
                <div className="pdf-mobile-fallback">
                  <div className="pdf-mobile-card">
                    <div className="pdf-mobile-icon">📄</div>
                    <h3>PDF Generado Correctamente</h3>
                    <p>Tu cotización está lista para ver o descargar</p>
                    
                    <div className="pdf-mobile-buttons">
                      <button 
                        className="pdf-mobile-btn primary"
                        onClick={handleOpenInNewTab}
                      >
                        Ver PDF
                      </button>
                      <button 
                        className="pdf-mobile-btn secondary"
                        onClick={handleForceDownload}
                      >
                        Descargar
                      </button>
                    </div>
                    
                    <div className="pdf-mobile-info">
                      <small>
                        <strong>Nota:</strong> Algunos navegadores móviles no muestran PDFs correctamente.
                      </small>
                    </div>
                  </div>
                </div>
              ) : (
                // Vista normal para desktop y navegadores compatibles
                <iframe 
                  title="preview-pdf" 
                  src={previewUrl} 
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  onError={() => setUseFallbackView(true)}
                />
              )
            ) : <div>Generando vista previa...</div>}
          </div>
        ) : <div>No se encontró la cotización.</div>}
      </div>
    </div>
  );
};

export default BudgetDetail;