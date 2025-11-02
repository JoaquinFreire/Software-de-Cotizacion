import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import html2pdf from 'html2pdf.js';
import ReactLoading from 'react-loading';
import logoAnodal from '../../images/logo_secundario.webp';
import '../../styles/reportes.css';
import '../../styles/reporteindividual.css';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import ScrollToTopButton from '../../components/ScrollToTopButton';
import { useNavigate } from 'react-router-dom'; // <-- agregado

const API_URL = process.env.REACT_APP_API_URL;

const formatFecha = (fecha) => {
  if (!fecha) return '';
  const [datePart] = fecha.split('T');
  const [y, m, d] = datePart.split('-');
  return `${d}-${m}-${y.slice(2)}`;
};

// REEMPLAZO: getComplementNames más robusto (maneja $values y distintos nombres de propiedad)
const normalizeArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (val.$values && Array.isArray(val.$values)) return val.$values;
  // a veces viene como objeto único
  return [val];
};

const extractName = (item) => {
  if (!item) return null;
  return item.name ?? item.Name ?? item.Nombre ?? item.Title ?? null;
};

const extractNamesFromSection = (section) => {
  const arr = normalizeArray(section);
  const out = [];
  arr.forEach(it => {
    if (!it) return;
    if (it.$values && Array.isArray(it.$values)) {
      it.$values.forEach(inner => {
        const n = extractName(inner);
        if (n) out.push(n);
      });
    } else {
      const n = extractName(it);
      if (n) out.push(n);
    }
  });
  return out;
};

const pickSection = (obj, keys) => {
  if (!obj) return null;
  for (const k of keys) {
    if (obj[k]) return obj[k];
  }
  return null;
};

const getComplementNames = (complement) => {
  if (!complement) return [];
  const items = Array.isArray(complement) ? complement : (complement.$values && Array.isArray(complement.$values) ? complement.$values : [complement]);
  const names = [];
  items.forEach(c => {
    if (!c) return;
    const door = pickSection(c, ['ComplementDoor','complementDoor','ComplementDoorItems','ComplementDoors']);
    const railing = pickSection(c, ['ComplementRailing','complementRailing','ComplementRailingItems','ComplementRailings']);
    const partition = pickSection(c, ['ComplementPartition','complementPartition','ComplementPartitionItems','ComplementPartitions']);
    names.push(...extractNamesFromSection(door));
    names.push(...extractNamesFromSection(railing));
    names.push(...extractNamesFromSection(partition));
    // además algunos objetos pueden contener directamente Name en el propio c
    const direct = extractName(c);
    if (direct) names.push(direct);
  });
  return names;
};

// REEMPLAZO: utilidades para rango con formato date (yyyy-MM-dd), similar a ReporteEstadoCotizaciones
const getDefaultDates = () => {
  const year = new Date().getFullYear();
  return {
    desde: `${year}-01-01`,
    hasta: `${year}-12-31`
  };
};
const parseDateString = (s) => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d) ? null : d;
};

const ReporteConsumoComplementos = () => {
	const [loading, setLoading] = useState(false);
	const [budgets, setBudgets] = useState([]);
	const [complementCounts, setComplementCounts] = useState({});
	const [generar, setGenerar] = useState(false);

	const defaultDates = getDefaultDates();
	const [fechaDesde, setFechaDesde] = useState(defaultDates.desde);
	const [fechaHasta, setFechaHasta] = useState(defaultDates.hasta);

	const pdfRef = useRef();
	const navigate = useNavigate();
				const handleLogout = () => {
					localStorage.removeItem("token");
					navigate("/");}
	// nuevo: fila seleccionada (id compuesto)
	const [selectedBudgetKey, setSelectedBudgetKey] = useState(null);

	// validación simple (desde <= hasta)
	const invalidRange = (() => {
		const d = parseDateString(fechaDesde);
		const h = parseDateString(fechaHasta);
		if (!d || !h) return true;
		return d.getTime() > h.getTime();
	})();

	// Nueva función fetchData con logs y manejo de $values
	const fetchData = async (fromStr, toStr) => {
		setLoading(true);
		try {
			const token = localStorage.getItem('token');
			console.log('[ReporteConsumoComplementos] fetchData called', { from: fromStr, to: toStr, tokenPresent: !!token });
			const url = `${API_URL}/api/Mongo/GetAllBudgetsWithComplements?from=${encodeURIComponent(fromStr)}&to=${encodeURIComponent(toStr)}`;
			console.log('[ReporteConsumoComplementos] Request URL:', url);
			const res = await axios.get(url, {
				headers: { Authorization: `Bearer ${token}` }
			});
			console.log('[ReporteConsumoComplementos] Response status:', res.status);
			// Normalizar respuesta: array directo o objeto con $values
			let data = [];
			if (Array.isArray(res.data)) data = res.data;
			else if (res.data && Array.isArray(res.data.$values)) data = res.data.$values;
			else if (res.data && Array.isArray(res.data.values)) data = res.data.values;
			else if (res.data && typeof res.data === 'object') {
				// intentar detectar estructura anidada con $values dentro de una propiedad
				const possible = Object.values(res.data).find(v => Array.isArray(v));
				data = Array.isArray(possible) ? possible : [];
			}
			console.log('[ReporteConsumoComplementos] items received:', data.length);
			setBudgets(data);

			// Contar complementos con la función robusta
			const counts = {};
			data.forEach(b => {
				const names = getComplementNames(b.Complement || b.complement || b.Complements || b.Complemento);
				names.forEach(name => {
					counts[name] = (counts[name] || 0) + 1;
				});
			});
			console.table(counts);
			setComplementCounts(counts);
		} catch (err) {
			console.error('[ReporteConsumoComplementos] Error fetching budgets with complements:', err, err?.response?.data);
			alert('Error al obtener cotizaciones con complementos. Ver consola para más detalles.');
			setBudgets([]);
			setComplementCounts({});
		} finally {
			setLoading(false);
		}
	};

	const handleGenerarReporte = () => {
		if (!fechaDesde || !fechaHasta || invalidRange) {
			alert('Rango inválido: Verifique las fechas Desde/Hasta.');
			return;
		}
		setGenerar(true);
		console.log('[ReporteConsumoComplementos] Generar reporte ->', { fechaDesde, fechaHasta });
		fetchData(fechaDesde, fechaHasta);
	};

	const handleImprimir = () => window.print();

	const handleDescargarPDF = () => {
		if (!pdfRef.current) return;
		const scrollBtn = document.querySelector('.scroll-to-top-btn');
		if (scrollBtn) scrollBtn.style.display = 'none';
		const opt = {
			margin: [0.2, 0.2, 0.2, 0.2],
			filename: `reporte_consumo_complementos.pdf`,
			image: { type: 'jpeg', quality: 0.98 },
			html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
			jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
			pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
		};
		setTimeout(() => {
			html2pdf().set(opt).from(pdfRef.current).save().then(() => {
				if (scrollBtn) scrollBtn.style.display = '';
			});
		}, 100);
	};

	// Datos para el gráfico
	const complementNames = Object.keys(complementCounts);
	const complementValues = complementNames.map(name => complementCounts[name]);
	const maxUsed = complementNames.length
		? complementNames[complementValues.indexOf(Math.max(...complementValues))]
		: null;

	const chartData = {
		labels: complementNames,
		datasets: [{
			label: 'Cantidad de usos',
			data: complementValues,
			backgroundColor: '#36A2EB',
			borderColor: '#222',
			borderWidth: 2,
		}]
	};

	// Mejoras en opciones del gráfico
	const chartOptions = {
		plugins: {
			datalabels: {
				color: '#222',
				font: { weight: 'bold', size: 12 }, // tamaño menor
				anchor: 'end',
				align: 'right',
				formatter: (value) => value,
			},
			legend: { display: false }
		},
		indexAxis: 'y',
		responsive: true,
		maintainAspectRatio: false, // permitir controlar altura
		layout: { padding: { top: 8, bottom: 8, left: 8, right: 8 } },
		scales: {
			x: { beginAtZero: true, precision: 0, grid: { display: true } },
			y: {
				ticks: { autoSkip: false, maxRotation: 0, minRotation: 0 },
				grid: { display: false }
			}
		}
	};

	// Handler para seleccionar fila (no navega, solo selección)
	const handleRowSelect = (key) => {
		setSelectedBudgetKey(prev => prev === key ? null : key);
	};

	// Handler para abrir cotización (navegar)
	const handleOpenQuotation = (b) => {
		const qId = b.budgetId || b._id || b.id || null;
		if (qId) {
			navigate(`/quotation/${qId}`);
		} else {
			alert('No se encontró ID de cotización para abrir.');
		}
	};

	return (
		<div className="dashboard-container">
      <Navigation onLogout={handleLogout} />
			<h2 className="title">Reporte de Consumo de Complementos</h2>
			<div className="reporte-cotizaciones-root">
				<div className="reporte-cotizaciones-toolbar">
					{/* Agregar filtros de rango y acciones (ahora type="date" igual que Estado Cotizaciones) */}
					<div className="reporte-cotizaciones-filtros" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
						<label>
							Desde:
							<input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
						</label>
						<label>
							Hasta:
							<input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
						</label>

						<button className="botton-Report" onClick={handleGenerarReporte} disabled={loading || generar || invalidRange}>
							{loading ? 'Cargando...' : 'Generar Reporte'}
						</button>

						<button
							className="reporte-cotizaciones-btn-pdf"
							onClick={handleDescargarPDF}
							disabled={!generar}
						>
							Guardar PDF
						</button>

						<button className="botton-Report reporte-cotizaciones-btn-print" onClick={handleImprimir} disabled={!generar}>
							Imprimir
						</button>
					</div>
				</div>

				<div className="reporte-cotizaciones-a4">
					<div className="reporte-cotizaciones-pdf" ref={pdfRef}>
						<header className="reporte-cotizaciones-header">
							<img src={logoAnodal} alt="Logo Anodal" className="reporte-cotizaciones-logo" />
							<h1 className="reporte-cotizaciones-title">Reporte de Consumo de Complementos</h1>
							<div className="reporte-cotizaciones-logo-placeholder" />
						</header>
						{loading && generar ? (
							<div style={{
								display: 'flex', flexDirection: 'column', alignItems: 'center',
								justifyContent: 'center', minHeight: 500
							}}>
								<ReactLoading type="spin" color="#1976d2" height={80} width={80} />
								<div style={{ marginTop: 24, fontSize: 18, color: '#1976d2' }}>Cargando reporte...</div>
							</div>
						) : !generar ? (
							<div style={{
								display: 'flex', flexDirection: 'column', alignItems: 'center',
								justifyContent: 'center', minHeight: 500, color: '#888', fontSize: 20
							}}>
								<span>El reporte aún no fue generado.</span>
								<span style={{ fontSize: 16, marginTop: 8 }}>Presione <b>Generar Reporte</b> para ver el consumo de complementos.</span>
							</div>
						) : (
							<main className="reporte-cotizaciones-main">
								<div className="reporte-cotizaciones-info">
									<div>
										<strong>Fecha y Hora:</strong> {new Date().toLocaleString()}
									</div>
									<div>
										<strong>Destinatario:</strong> {window.localStorage.getItem('usuario') || 'Usuario'}
									</div>
								</div>
								{/* Gráfico de barras */}
								<section style={{ margin: '30px 0 10px 0' }}>
									<h3 style={{ marginBottom: 10 }}>Complementos más usados</h3>
									{complementNames.length === 0 ? (
										<div>No hay complementos registrados en las cotizaciones.</div>
									) : (
										<div style={{ maxWidth: 900, margin: '0 auto', height: 420 }}>
											<Bar
												data={chartData}
												options={chartOptions}
												// no pasar height/width directo, usamos contenedor y maintainAspectRatio:false
											/>
										</div>
									)}
									{maxUsed && (
										<div style={{ marginTop: 16 }}>
											<strong>Complemento más usado:</strong> {maxUsed} ({complementCounts[maxUsed]} usos)
										</div>
									)}
								</section>
								{/* Tabla de cotizaciones con complementos */}
								<section style={{ marginTop: 30 }}>
									<h3 style={{ marginBottom: 10 }}>Cotizaciones con Complementos</h3>
									{budgets.length === 0 ? (
										<div>No hay cotizaciones con complementos.</div>
									) : (
										<div className="tabla-cotizaciones-responsive">
											<table className="reporte-cotizaciones-tabla tabla-ajustada">
												<thead>
													<tr>
														<th>ID</th>
														<th>Cliente</th>
														<th>Fecha Creación</th>
														<th>Complementos</th>
														<th>Acción</th> {/* nueva columna de acción */}
													</tr>
												</thead>
												<tbody>
													{budgets.map((b, idx) => {
														const complementos = getComplementNames(b.Complement || b.complement || b.Complemento);
														if (complementos.length === 0) return null;
														// key único: preferir id real + índice
														const key = `${b.budgetId || b._id || 'noid'}-${idx}`;
														const isSelected = selectedBudgetKey === key;
														const qId = b.budgetId || b._id || b.id || '';
														return (
															<tr
																key={key}
																onClick={() => handleRowSelect(key)}
																className={isSelected ? 'selected-row' : ''}
																style={{ background: isSelected ? '#e8f0ff' : undefined, cursor: qId ? 'pointer' : 'default' }}
															>
																<td>{qId}</td>
																<td>
																	{b.customer?.name || b.customer?.lastname ? `${b.customer?.name || ''} ${b.customer?.lastname || ''}` : ''}
																</td>
																<td>{b.creationDate ? formatFecha(b.creationDate) : (b.creationDateString ? formatFecha(b.creationDateString) : '')}</td>
																<td>{complementos.join(', ')}</td>
																<td style={{ whiteSpace: 'nowrap' }}>
																	<button
																		className="botton-Report"
																		onClick={(e) => { e.stopPropagation(); handleOpenQuotation(b); }}
																		disabled={!qId}
																		title={qId ? 'Abrir cotización' : 'Sin ID'}
																	>
																		Abrir
																	</button>
																</td>
															</tr>
														);
													})}
												</tbody>
											</table>
										</div>
									)}
								</section>
							</main>
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
				<ScrollToTopButton />
			</div>
			<Footer />
		</div>
	);
};

export default ReporteConsumoComplementos;