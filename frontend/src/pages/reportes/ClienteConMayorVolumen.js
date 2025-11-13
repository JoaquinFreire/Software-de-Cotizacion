import React, { useEffect, useState } from "react";
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { TrendingUp, Filter, ChevronDown, ChevronUp, Download, RefreshCw } from 'lucide-react';
import '../../styles/DashboardEficienciaOperativa.css';
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || '';
const FALLBACK_ENDPOINT = `${API_BASE}/api/reportes/cliente-mayor-volumen`;
const PORTFOLIO_ENDPOINT = `${API_BASE}/api/portfolio/quoter-client-portfolio`;
const BUDGETS_ENDPOINT = `${API_BASE}/api/Mongo/GetAllBudgetsWithComplements`;

function formatDateInput(date) {
    const d = new Date(date);
    return d.toISOString().slice(0, 10);
}

function formatMoney(n) {
    return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toCSV(rows) {
    if (!rows || rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
    const lines = [headers.join(",")];
    for (const r of rows) {
        const vals = headers.map(h => {
            const v = r[h] == null ? "" : String(r[h]).replace(/"/g, '""');
            return `"${v}"`;
        });
        lines.push(vals.join(","));
    }
    return lines.join("\n");
}

// Función SEGURA para extraer cliente - EVITA RECURSIÓN
function extractClientFromBudget(budget) {
    if (!budget) {
        return { id: 'unknown', name: 'Sin cliente' };
    }

    // Estrategia simple y directa - sin recursión
    let customer = null;

    // Buscar en niveles específicos sin profundizar
    if (budget.Budget && budget.Budget.customer) {
        customer = budget.Budget.customer;
    } else if (budget.Budget && budget.Budget.Customer) {
        customer = budget.Budget.Customer;
    } else if (budget.customer) {
        customer = budget.customer;
    } else if (budget.Customer) {
        customer = budget.Customer;
    }

    if (customer && typeof customer === 'object') {
        const name = (customer.name || customer.nombre || customer.firstName || customer.first_name || '').trim();
        const lastname = (customer.lastname || customer.lastName || customer.last_name || customer.apellido || '').trim();
        const dni = (customer.dni || customer.Dni || customer.DNI || customer.DNICliente || '').toString().trim();
        const mail = (customer.mail || customer.email || customer.Email || '').trim();
        const id = customer.id || customer.ClientId || customer.clientId || dni;

        const fullName = `${name || ''}${name && lastname ? ' ' : ''}${lastname || ''}`.trim() ||
            (mail || dni || id || 'Cliente desconocido');

        return {
            id: id || fullName,
            name: fullName,
            dni,
            mail
        };
    }

    // Fallback: usar ID del presupuesto
    const budgetId = budget.Budget?.budgetId || budget.budgetId || budget.BudgetId || budget.Id || budget.id;
    return {
        id: budgetId ? `budget-${budgetId}` : 'unknown',
        name: budgetId ? `Presupuesto ${budgetId}` : 'Sin cliente'
    };
}

// Función SEGURA para extraer total
function extractTotalFromBudget(b) {
    // Campos directos primero
    const directFields = [
        b?.Budget?.TotalPrice, b?.Budget?.Total, b?.Budget?.TotalAmount,
        b?.TotalPrice, b?.Total, b?.TotalAmount, b?.TotalMonto, b?.TotalPriceUsd
    ];

    for (const value of directFields) {
        if (value !== undefined && value !== null && value !== '') {
            const num = Number(String(value).replace(/[^0-9.-]+/g, ''));
            if (!isNaN(num)) return num;
        }
    }

    // Sumar productos si existen (sin recursión)
    const products = b?.Budget?.Products || b?.Products || b?.products || [];
    if (Array.isArray(products) && products.length > 0) {
        let sum = 0;
        for (const product of products) {
            const price = product?.price ?? product?.Price ?? product?.PricePerUnit ?? 0;
            const qty = product?.Quantity ?? product?.quantity ?? product?.QuantityUnits ?? 1;
            const priceNum = Number(String(price).replace(/[^0-9.-]+/g, '')) || 0;
            const qtyNum = Number(String(qty).replace(/[^0-9.-]+/g, '')) || 0;
            sum += priceNum * (qtyNum || 1);
        }
        if (sum > 0) return sum;
    }

    return 0;
}

export default function ClienteConMayorVolumen() {
    const today = new Date();
    const defaultTo = formatDateInput(today);
    const defaultFrom = formatDateInput(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 90));

    const [desde, setDesde] = useState(defaultFrom);
    const [hasta, setHasta] = useState(defaultTo);
    const [quoters, setQuoters] = useState([]);
    const [selectedQuoter, setSelectedQuoter] = useState('');
    const [sortBy, setSortBy] = useState('activity_desc');
    const [topN, setTopN] = useState(10); // Aumentado para mostrar más clientes
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filtersVisible, setFiltersVisible] = useState(false);
    const [error, setError] = useState(null);

    // Estados para control de acceso
    const [userRole, setUserRole] = useState(null);
    const [roleLoading, setRoleLoading] = useState(true);
    const requiredRoles = ['quotator', 'coordinator']; // Todos los roles pueden ver este reporte

    const navigate = useNavigate();

    // Verificación de rol
    useEffect(() => {
        const checkUserRole = () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/");
                return;
            }

            try {
                // Decodificar el JWT directamente - INSTANTÁNEO
                const payload = JSON.parse(atob(token.split('.')[1]));
                const role = payload?.role?.toLowerCase() ||
                    payload?.Role?.toLowerCase() ||
                    payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']?.toLowerCase();

                if (role) {
                    setUserRole(role);
                    setRoleLoading(false);
                    return; // ¡No hace falta llamar a la API!
                }
            } catch (error) {
                console.debug('No se pudo decodificar JWT');
            }

            // Fallback: llamar a la API solo si falla el JWT
            const fetchUserRoleFromAPI = async () => {
                try {
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const role = data?.user?.role?.toLowerCase();
                        setUserRole(role);
                    }
                } catch (error) {
                    console.error('Error verificando rol:', error);
                }
                setRoleLoading(false);
            };

            fetchUserRoleFromAPI();
        };

        checkUserRole();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    }

    useEffect(() => {
        fetchQuoters();
    }, []);

    async function fetchQuoters() {
        try {
            const url = `${API_BASE || ''}/api/users/active`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('No se pudo cargar lista de cotizadores');
            const json = await res.json();
            const arr = json && json.$values ? json.$values : (Array.isArray(json) ? json : []);
            setQuoters(arr.map(u => ({
                id: u.id ?? u.UserId ?? u.Id,
                name: `${u.name ?? u.UserName ?? u.Name ?? ''}`.trim() || (u.mail ?? u.UserEmail ?? 'Sin nombre')
            })).filter(u => u.id != null));
        } catch (err) {
            console.error('No se pudo cargar cotizadores:', err);
            setQuoters([]);
        }
    }

    async function fetchReport() {
        // PREVENIR MÚLTIPLES LLAMADAS
        if (loading) return;

        setLoading(true);
        setError(null);
        setData([]);
        setSummary(null);

        try {
            // PRIMERO: Intentar endpoint principal de portfolio
            const params = new URLSearchParams();
            if (selectedQuoter) params.append('quoterId', selectedQuoter);
            params.append('from', desde);
            params.append('to', hasta);
            params.append('sortBy', sortBy);
            params.append('topN', 1000); // Pedir muchos datos

            const url = `${PORTFOLIO_ENDPOINT}?${params.toString()}`;
            const res = await fetch(url);

            if (res.ok) {
                const json = await res.json();
                const clients = (json.Clients && Array.isArray(json.Clients)) ? json.Clients : (Array.isArray(json) ? json : []);

                if (clients.length > 0) {
                    const normalized = clients.map((c, i) => ({
                        clienteId: c.ClientId ?? c.clientId ?? c.Id ?? `c${i}`,
                        clienteNombre: c.ClientName ?? c.clientName ?? c.Client ?? c.Name ?? 'Sin nombre',
                        mail: c.ClientEmail ?? c.clientEmail ?? c.Email ?? c.Mail ?? '',
                        totalCotizaciones: Number(c.TotalQuotations ?? c.totalQuotations ?? c.TotalQuotations ?? 0),
                        totalMonto: Number(c.TotalRevenue ?? c.totalRevenue ?? c.TotalMonto ?? 0),
                        promedioMonto: Number(c.AverageQuotationValue ?? c.AverageQuotationValue ?? c.averageQuotationValue ?? 0),
                    }));

                    // Aplicar ordenamiento
                    if (sortBy === 'activity_desc') normalized.sort((a, b) => b.totalCotizaciones - a.totalCotizaciones);
                    else if (sortBy === 'revenue_desc') normalized.sort((a, b) => b.totalMonto - a.totalMonto);
                    else if (sortBy === 'avg_desc') normalized.sort((a, b) => b.promedioMonto - a.promedioMonto);

                    setData(normalized);
                    if (json.Summary) setSummary(json.Summary);
                    setLoading(false);
                    return;
                }
            }
        } catch (err) {
            console.warn('Fallo endpoint cartera:', err);
        }

        try {
            // SEGUNDO: Intentar con budgets como fallback
            const params2 = new URLSearchParams();
            params2.append('from', desde);
            params2.append('to', hasta);
            const url2 = `${BUDGETS_ENDPOINT}?${params2.toString()}`;
            const res2 = await fetch(url2);

            if (res2.ok) {
                const json2 = await res2.json();
                const arr = (json2 && json2.$values && Array.isArray(json2.$values)) ? json2.$values : (Array.isArray(json2) ? json2 : []);

                console.log(`Procesando ${arr.length} budgets...`);

                const clientMap = {};

                // Procesar cada budget de forma SEGURA
                for (let i = 0; i < arr.length; i++) {
                    const budget = arr[i];
                    try {
                        const client = extractClientFromBudget(budget);
                        const total = extractTotalFromBudget(budget);
                        const key = (client.dni || client.mail || client.id || client.name || `unknown_${i}`).toString();

                        if (!clientMap[key]) {
                            clientMap[key] = {
                                clienteId: client.id ?? key,
                                clienteNombre: client.name ?? `Cliente ${key}`,
                                mail: client.mail ?? '',
                                totalCotizaciones: 0,
                                totalMonto: 0
                            };
                        }

                        clientMap[key].totalCotizaciones += 1;
                        clientMap[key].totalMonto += Number(total || 0);
                    } catch (err) {
                        console.warn(`Error procesando budget ${i}:`, err);
                        // Continuar con el siguiente budget
                    }
                }

                const normalized = Object.values(clientMap).map(x => ({
                    ...x,
                    promedioMonto: x.totalCotizaciones ? x.totalMonto / x.totalCotizaciones : 0
                }));

                // Aplicar ordenamiento
                if (sortBy === 'activity_desc') normalized.sort((a, b) => b.totalCotizaciones - a.totalCotizaciones);
                else if (sortBy === 'revenue_desc') normalized.sort((a, b) => b.totalMonto - a.totalMonto);
                else if (sortBy === 'avg_desc') normalized.sort((a, b) => b.promedioMonto - a.promedioMonto);

                setData(normalized);
                setLoading(false);
                return;
            }
        } catch (err) {
            console.error('Error con budgets:', err);
        }

        try {
            // TERCERO: Fallback clásico
            const params3 = new URLSearchParams();
            params3.append('desde', desde);
            params3.append('hasta', hasta);
            if (selectedQuoter) params3.append('quoterId', selectedQuoter);
            params3.append('sortBy', sortBy);
            params3.append('topN', 1000);

            const url3 = `${FALLBACK_ENDPOINT}?${params3.toString()}`;
            const res3 = await fetch(url3);

            if (res3.ok) {
                const json3 = await res3.json();
                const normalized = (json3 || []).map((r, i) => ({
                    clienteId: r.clienteId ?? r.ClientId ?? r.clientId ?? r.id ?? `c${i}`,
                    clienteNombre: r.clienteNombre ?? r.ClientName ?? r.clientName ?? r.nombre ?? r.Name ?? "Sin nombre",
                    mail: r.mail ?? r.email ?? r.Email ?? r.ClientEmail ?? '',
                    totalCotizaciones: Number(r.totalCotizaciones ?? r.TotalQuotations ?? r.count ?? 0),
                    totalMonto: Number(r.totalMonto ?? r.TotalMonto ?? r.totalRevenue ?? 0),
                    promedioMonto: r.totalCotizaciones ? (Number(r.totalMonto ?? r.TotalMonto ?? r.totalRevenue ?? 0) / Number(r.totalCotizaciones || 1)) : 0
                }));

                if (sortBy === 'activity_desc') normalized.sort((a, b) => b.totalCotizaciones - a.totalCotizaciones);
                else if (sortBy === 'revenue_desc') normalized.sort((a, b) => b.totalMonto - a.totalMonto);
                else if (sortBy === 'avg_desc') normalized.sort((a, b) => b.promedioMonto - a.promedioMonto);

                setData(normalized);
            } else {
                throw new Error('Error en fallback');
            }
        } catch (err) {
            console.error('No se pudo obtener el reporte:', err);
            setError('No se pudo obtener el reporte. Verifica la conexión o la disponibilidad del servicio.');

            // Datos de ejemplo para testing
            const ejemplo = Array.from({ length: 15 }, (_, i) => ({
                clienteId: `${i + 1}`,
                clienteNombre: `Cliente Ejemplo ${i + 1}`,
                mail: `cliente${i + 1}@ejemplo.com`,
                totalCotizaciones: Math.floor(Math.random() * 20) + 1,
                totalMonto: Math.floor(Math.random() * 50000) + 5000,
                promedioMonto: Math.floor(Math.random() * 5000) + 1000
            }));

            if (sortBy === 'activity_desc') ejemplo.sort((a, b) => b.totalCotizaciones - a.totalCotizaciones);
            else if (sortBy === 'revenue_desc') ejemplo.sort((a, b) => b.totalMonto - a.totalMonto);
            else if (sortBy === 'avg_desc') ejemplo.sort((a, b) => b.promedioMonto - a.promedioMonto);

            setData(ejemplo);
        } finally {
            setLoading(false);
        }
    }

    function downloadCSV() {
        const rows = data.map(d => ({
            clienteId: d.clienteId,
            clienteNombre: d.clienteNombre,
            mail: d.mail,
            totalCotizaciones: d.totalCotizaciones,
            totalMonto: d.totalMonto,
            promedioMonto: Number(d.promedioMonto).toFixed(2),
        }));
        const csv = toCSV(rows);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const quoterLabel = selectedQuoter ? `_quoter_${selectedQuoter}` : '';
        a.href = url;
        a.download = `clientes_mayor_volumen_${desde}_a_${hasta}${quoterLabel}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // KPI derived
    const totalClients = data.length;
    const totalQuotations = data.reduce((s, c) => s + (Number(c.totalCotizaciones) || 0), 0);
    const totalRevenue = data.reduce((s, c) => s + (Number(c.totalMonto) || 0), 0);
    const avgPerClient = totalClients ? totalRevenue / totalClients : 0;

    // Loading mientras verifica rol
    if (roleLoading) {
        return (
            <div className="dashboard-container">
                <Navigation onLogout={handleLogout} />
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '50vh',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p>Verificando acceso...</p>
                </div>
                <Footer />
            </div>
        );
    }

    // Usuario no autorizado
    if (userRole && !requiredRoles.includes(userRole)) {
        return (
            <div className="dashboard-container">
                <Navigation onLogout={handleLogout} />
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '60vh',
                    flexDirection: 'column',
                    textAlign: 'center',
                    padding: '2rem'
                }}>
                    <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Acceso Denegado</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        No tiene permisos para ver este recurso.
                    </p>
                    <p style={{ marginBottom: '2rem', color: '#6b7280' }}>
                        Este reporte está disponible para cotizadores, coordinadores y gerentes.
                    </p>
                    <button
                        onClick={() => navigate('/reportes')}
                        style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Volver a Reportes
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            <div className="dashboard-main-wrapper">
                <div className="dashboard-content-container">
                    <div className="dashboard-header">
                        <div className="header-title">
                            <TrendingUp size={32} />
                            <div>
                                <h1>Clientes con Mayor Volumen de Cotizaciones</h1>
                                <p>Análisis de cartera por cotizador / período</p>
                            </div>
                        </div>
                        <div className="header-actions">
                            <button className="btn-primary" onClick={fetchReport} disabled={loading}>
                                <RefreshCw size={16} /> {loading ? 'Cargando...' : 'Generar'}
                            </button>
                        </div>
                    </div>

                    <div className="filters-accordion" style={{ marginBottom: 12 }}>
                        <div className="filters-header-toggle" onClick={() => setFiltersVisible(!filtersVisible)}>
                            <div className="filters-toggle-left">
                                <Filter size={18} />
                                <span>Filtros</span>
                            </div>
                            <div className="filters-toggle-right">
                                {filtersVisible ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </div>

                        {filtersVisible && (
                            <div className="filters-content-expanded" style={{ marginTop: 8 }}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <label>Desde: <input type="date" value={desde} onChange={e => setDesde(e.target.value)} /></label>
                                    <label>Hasta: <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} /></label>
                                    <label>
                                        Cotizador:
                                        <select value={selectedQuoter} onChange={e => setSelectedQuoter(e.target.value)} style={{ marginLeft: 6 }}>
                                            <option value="">Todos</option>
                                            {quoters.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        Orden:
                                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ marginLeft: 6 }}>
                                            <option value="activity_desc">Cotizaciones (desc)</option>
                                            <option value="revenue_desc">Total Monto (desc)</option>
                                            <option value="avg_desc">Promedio por cotización (desc)</option>
                                        </select>
                                    </label>
                                    <label>
                                        Mostrar
                                        <input
                                            type="number"
                                            min={1}
                                            max={500}
                                            value={topN}
                                            onChange={e => setTopN(Math.max(1, Number(e.target.value) || 1))}
                                            style={{ width: 80, marginLeft: 6, marginRight: 6 }}
                                        />
                                        clientes
                                    </label>
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                        <button onClick={fetchReport} className="btn-primary" disabled={loading}>
                                            <RefreshCw size={14} /> Actualizar
                                        </button>
                                        <button onClick={downloadCSV} className="btn-primary" disabled={data.length === 0}>
                                            <Download size={14} /> Exportar Excel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* KPI CARDS */}
                    <div style={{ marginBottom: 16 }}>
                        <div className="kpi-grid" style={{ marginBottom: 12 }}>
                            <div className="kpi-card">
                                <div className="kpi-icon" style={{ background: '#2196f3' }}>
                                    <TrendingUp size={20} />
                                </div>
                                <div className="kpi-content">
                                    <div className="kpi-value">{summary?.TotalClients ?? totalClients}</div>
                                    <div className="kpi-label">Total Clientes</div>
                                </div>
                            </div>

                            <div className="kpi-card">
                                <div className="kpi-icon" style={{ background: '#4caf50' }}>
                                    <TrendingUp size={20} />
                                </div>
                                <div className="kpi-content">
                                    <div className="kpi-value">{summary?.TotalPortfolioValue ? `$${formatMoney(summary.TotalPortfolioValue)}` : `$${formatMoney(totalRevenue)}`}</div>
                                    <div className="kpi-label">Total Monto</div>
                                </div>
                            </div>

                            <div className="kpi-card">
                                <div className="kpi-icon" style={{ background: '#ff9800' }}>
                                    <RefreshCw size={20} />
                                </div>
                                <div className="kpi-content">
                                    <div className="kpi-value">{summary?.AverageClientValue ? `$${formatMoney(summary.AverageClientValue)}` : `$${formatMoney(avgPerClient)}`}</div>
                                    <div className="kpi-label">Promedio por cliente</div>
                                </div>
                            </div>

                            <div className="kpi-card">
                                <div className="kpi-icon" style={{ background: '#f44336' }}>
                                    <TrendingUp size={20} />
                                </div>
                                <div className="kpi-content">
                                    <div className="kpi-value">{totalQuotations}</div>
                                    <div className="kpi-label">Total Cotizaciones</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TABLA */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ fontWeight: 700 }}>
                                Clientes {topN < data.length ? `(Top ${topN} de ${data.length})` : `(${data.length} clientes)`}
                            </div>
                            {data.length > 0 && (
                                <div style={{ fontSize: '0.9em', color: '#666' }}>
                                    Mostrando {Math.min(topN, data.length)} de {data.length} clientes
                                </div>
                            )}
                        </div>

                        <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden', maxHeight: '600px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#3b3c3dff', position: 'sticky', top: 0 }}>
                                    <tr>
                                        <th style={{ padding: 12, borderBottom: '1px solid #e0e0e0' }}>Cliente</th>
                                        <th style={{ padding: 12, borderBottom: '1px solid #e0e0e0' }}>Legajo</th>
                                        <th style={{ padding: 12, borderBottom: '1px solid #e0e0e0' }}>Contacto</th>
                                        <th style={{ padding: 12, borderBottom: '1px solid #e0e0e0' }}>Cotizaciones</th>
                                        <th style={{ padding: 12, borderBottom: '1px solid #e0e0e0' }}>Total</th>
                                        <th style={{ padding: 12, borderBottom: '1px solid #e0e0e0' }}>Promedio</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: 24, textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                    <RefreshCw size={16} className="spinner" />
                                                    Cargando clientes...
                                                </div>
                                            </td>
                                        </tr>
                                    ) : data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: 24, textAlign: 'center' }}>
                                                No hay datos para mostrar. Haz clic en "Generar" para cargar los clientes.
                                            </td>
                                        </tr>
                                    ) : (
                                        data.slice(0, topN).map((c, index) => (
                                            <tr key={c.clienteId} style={{ background: index % 2 === 0 ? '#5f5f5fff' : '#707272ff' }}>
                                                <td style={{ padding: 12, textAlign: 'Center', borderBottom: '1px solid #f0f0f0' }}>{c.clienteNombre}</td>
                                                <td style={{ padding: 12, textAlign: 'Center', borderBottom: '1px solid #f0f0f0' }}>{c.clienteId}</td>
                                                <td style={{ padding: 12, textAlign: 'Center', borderBottom: '1px solid #f0f0f0' }}>{c.mail}</td>
                                                <td style={{ padding: 12, textAlign: 'Center', borderBottom: '1px solid #f0f0f0' }}>{c.totalCotizaciones}</td>
                                                <td style={{ padding: 12, textAlign: 'Center', borderBottom: '1px solid #f0f0f0' }}>${formatMoney(c.totalMonto)}</td>
                                                <td style={{ padding: 12, textAlign: 'Center', borderBottom: '1px solid #f0f0f0' }}>${formatMoney(c.promedioMonto)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            color: 'darkorange',
                            marginTop: 12,
                            padding: 12,
                            background: '#fff3e0',
                            border: '1px solid #ffb74d',
                            borderRadius: 4
                        }}>
                            {error}
                        </div>
                    )}

                </div>
            </div>
            <Footer />
        </div>
    );
}