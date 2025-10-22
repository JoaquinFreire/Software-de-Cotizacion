import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import logoAnodal from '../images/logo_secundario.webp';
import miniLogo from '../images/logo_secundario.webp';
import Qrcode from '../images/qr-code.png';
import { safeArray } from '../utils/safeArray';

// estilos para el PDF
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 20,
    backgroundColor: '#ffffff',
    color: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  logo: { width: 90, height: 60 },
  title: { fontSize: 18, fontWeight: 'bold' },
  companyInfo: { fontSize: 9, textAlign: 'right' },
  separator: { borderBottomWidth: 1, borderBottomColor: '#cccccc', marginVertical: 6 },
  mainData: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  sectionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  section: { width: '33%', fontSize: 9 },
  table: { width: '100%', borderWidth: 1, borderColor: '#ddd', marginBottom: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 4 },
  th: { fontSize: 9, fontWeight: 'bold' },
  td: { fontSize: 9 },
  totals: { marginTop: 6, textAlign: 'right' },
  totalBig: { fontSize: 14, fontWeight: 'bold', marginTop: 4 },
  comments: { marginTop: 6, fontSize: 9 },
  footer: { marginTop: 6, fontSize: 8, textAlign: 'center', borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 6 },
  qr: { width: 80, height: 80, marginTop: 6, alignSelf: 'center' },
  surveyBox: { borderWidth: 1, borderColor: '#26b7cd', borderRadius: 4, padding: 6, marginTop: 6 }
});

const show = (val) => val !== undefined && val !== null && val !== "" ? String(val) : "No especificado";

// simple helper para insertar saltos como antes (se mantiene lógica simple aquí)
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
      const before = out.slice(0, idx);
      if (!before.endsWith('\n\n') && before !== '') {
        out = before + '\n\n' + out.slice(idx);
        lower = out.toLowerCase();
        start = idx + 2 + phrase.length;
      } else {
        start = idx + phrase.length;
      }
    }
  }
  out = out.replace(/\n{3,}/g, '\n\n');
  return out;
};

const BudgetPDF = ({ budget }) => {
  // Si no hay budget, mostrar documento vacío
  if (!budget) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>No hay datos de cotización disponibles</Text>
        </Page>
      </Document>
    );
  }

  const commentRaw = budget?.Comment ?? '';
  const formatted = insertParagraphsBefore(commentRaw);
  const paragraphs = formatted.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src={logoAnodal} style={styles.logo} />
          <Text style={styles.title}>Cotización</Text>
          <View style={{ width: 140 }}>
            <Text style={styles.companyInfo}>Anodal S.A.</Text>
            <Text style={styles.companyInfo}>Av. Japón 1292 Córdoba</Text>
            <Text style={styles.companyInfo}>info@anodal.com.ar</Text>
            <Text style={styles.companyInfo}>0351 4995870</Text>
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.mainData}>
          <Text style={{ fontSize: 11, fontWeight: 'bold' }}>Cotización N°: {show(budget?.budgetId)}</Text>
          <View>
            <Text>Fecha: {budget?.creationDate ? new Date(budget.creationDate).toLocaleDateString() : '-'}</Text>
            <Text>Válido hasta: {budget?.ExpirationDate ? new Date(budget.ExpirationDate).toLocaleDateString() : '-'}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.sectionsRow}>
          <View style={styles.section}>
            <Text style={{ fontWeight: 'bold' }}>Cliente</Text>
            <Text>Nombre: {show(budget?.customer?.name)} {show(budget?.customer?.lastname)}</Text>
            <Text>Correo: {show(budget?.customer?.mail)}</Text>
            <Text>Tel: {show(budget?.customer?.tel)}</Text>
            <Text>Dirección: {show(budget?.customer?.address)}</Text>
          </View>
          <View style={styles.section}>
            <Text style={{ fontWeight: 'bold' }}>Lugar de Trabajo</Text>
            <Text>Nombre: {show(budget?.workPlace?.name)}</Text>
            <Text>Dirección: {show(budget?.workPlace?.address)}</Text>
          </View>
          <View style={styles.section}>
            <Text style={{ fontWeight: 'bold' }}>Vendedor</Text>
            <Text>Nombre: {show(budget?.user?.name)} {show(budget?.user?.lastName)}</Text>
            <Text>Mail: {show(budget?.user?.mail)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>Abertura</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, { backgroundColor: '#f0f0f0' }]}>
              <Text style={[styles.th, { width: '30%' }]}>Producto</Text>
              <Text style={[styles.th, { width: '10%' }]}>Cant.</Text>
              <Text style={[styles.th, { width: '20%' }]}>Dimensiones</Text>
              <Text style={[styles.th, { width: '15%' }]}>Vidrio</Text>
              <Text style={[styles.th, { width: '15%' }]}>Tratamiento</Text>
              <Text style={[styles.th, { width: '10%' }]}>Precio/u</Text>
            </View>
            {safeArray(budget.Products).map((p, i) => (
              <View style={styles.tableRow} key={i}>
                <Text style={[styles.td, { width: '30%' }]}>{p.OpeningType?.name || '-'}</Text>
                <Text style={[styles.td, { width: '10%' }]}>{p.Quantity}</Text>
                <Text style={[styles.td, { width: '20%' }]}>{p.width}x{p.height} cm</Text>
                <Text style={[styles.td, { width: '15%' }]}>{p.GlassType?.name || '-'}</Text>
                <Text style={[styles.td, { width: '15%' }]}>{p.AlumTreatment?.name || '-'}</Text>
                <Text style={[styles.td, { width: '10%' }]}>{p.price ? `$${p.price}` : '-'}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totales */}
        <View style={styles.totals}>
          <Text>Dólar Ref: ${show(budget?.DollarReference)}</Text>
          <Text>Mano de Obra: ${show(budget?.LabourReference)}</Text>
          <Text style={styles.totalBig}>Total: ${show(budget?.Total)}</Text>
        </View>

        {/* Observaciones */}
        <View style={styles.comments}>
          <Text style={{ fontWeight: 'bold' }}>Observaciones:</Text>
          {paragraphs.length === 0 ? (
            <Text>{show(commentRaw)}</Text>
          ) : (
            paragraphs.map((p, i) => <Text key={i} style={{ marginTop: 4 }}>{p}</Text>)
          )}
        </View>

        {/* Encuesta */}
        <View style={styles.surveyBox}>
          <Text style={{ color: '#26b7cd', fontSize: 11, fontWeight: 'bold' }}>Encuesta de Satisfacción</Text>
          <Text>Nos gustaría conocer tu opinión sobre nuestro servicio. Por favor, completa la encuesta:</Text>
          <Image src={Qrcode} style={styles.qr} />
          <Text style={{ fontSize: 8, textAlign: 'center' }}>Escanea el código QR para acceder a la encuesta</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Image src={miniLogo} style={{ width: 30, height: 18, marginBottom: 4 }} />
          <Text>Avenida Japón 1292 / Córdoba / Argentina</Text>
          <Text>Solo para uso interno de la empresa Anodal S.A.</Text>
        </View>

      </Page>
    </Document>
  );
};

export default BudgetPDF;