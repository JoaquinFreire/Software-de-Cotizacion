import React, { useEffect, useState } from "react";
import axios from "axios";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import "../../styles/adminPrices.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReactLoading from "react-loading";
import { safeArray } from "../../utils/safeArray";

const API_URL = process.env.REACT_APP_API_URL || "";

export default function AdminPrices() {
	const [prices, setPrices] = useState([]);
	const [loading, setLoading] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [form, setForm] = useState({ name: "", price: 0, reference: "" });
	const [submitting, setSubmitting] = useState(false);
	const [deletingIds, setDeletingIds] = useState({});

	// Helper: convierte distintos formatos de id en Number o null
	const getId = (p) => {
		if (p == null) return null;
		const cand = p.id ?? p.Id ?? p._id ?? p.ID ?? p.reference ?? null;
		if (cand == null) return null;
		if (typeof cand === "number") return cand;
		if (typeof cand === "string") {
			const n = Number(cand);
			if (!Number.isNaN(n)) return n;
			// si es un objeto JSON dentro de string, intenta parsearlo
			try {
				const parsed = JSON.parse(cand);
				return getId({ id: parsed });
			} catch { /* ignore */ }
		}
		if (typeof cand === "object") {
			// casos en que id viene como { id: 3 } o similar
			return getId(cand);
		}
		return null;
	};

	// Normaliza una lista de items, forzando campo id y tipos
	const normalizeItems = (items) => {
		if (!items) return [];
		const arr = Array.isArray(items) ? items : safeArray(items);
		return arr.map(it => {
			if (!it || typeof it !== "object") return it;
			const id = getId(it);
			const copy = { ...it, id: id ?? undefined };
			// convertir price a número si viene como string
			if (copy.price !== undefined && typeof copy.price === "string") {
				const n = Number(copy.price);
				copy.price = Number.isNaN(n) ? copy.price : n;
			}
			return copy;
		});
	};

	useEffect(() => {
		fetchPrices();
	}, []);

	const fetchPrices = async () => {
		setLoading(true);
		const token = localStorage.getItem("token");
		try {
			const resp = await axios.get(`${API_URL}/api/prices`, { headers: { Authorization: `Bearer ${token}` } });
			// Normalizar posibles formas: array directo, { prices: [...] }, { result: [...] }, o un objeto único
			let data = resp.data;
			if (data && Array.isArray(data)) {
				setPrices(normalizeItems(data));
			} else if (data && Array.isArray(data.prices)) {
				setPrices(normalizeItems(data.prices));
			} else if (data && Array.isArray(data.result)) {
				setPrices(normalizeItems(data.result));
			} else if (data && typeof data === "object" && (data.id || data._id || data.reference)) {
				setPrices(normalizeItems([data]));
			} else {
				// intentar extraer array con safeArray como fallback
				setPrices(normalizeItems(safeArray(data)));
			}
		} catch (err) {
			console.error("Error fetching prices:", err?.response?.data ?? err);
			toast.error("Error al cargar precios.");
			setPrices([]);
		} finally {
			setLoading(false);
		}
	};

	const openCreate = () => {
		setEditing(null);
		setForm({ name: "", price: 0, reference: "" });
		setModalOpen(true);
	};
	const openEdit = (p) => {
		setEditing(p);
		setForm({ name: p.name || "", price: p.price || 0, reference: p.reference || "" });
		setModalOpen(true);
	};
	const closeModal = () => {
		setModalOpen(false);
		setEditing(null);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm(f => ({ ...f, [name]: name === "price" ? Number(value) : value }));
	};

	const handleSubmit = async (e) => {
		e?.preventDefault();
		setSubmitting(true);
		const token = localStorage.getItem("token");
		try {
			if (editing) {
				// actualizar en backend y también en estado local para evitar recargar la lista
				const id = getId(editing);
				if (!id) throw new Error("ID inválido para actualizar");
				await axios.put(`${API_URL}/api/prices/${id}`, form, { headers: { Authorization: `Bearer ${token}` } });
				// actualizar localmente
				setPrices(prev => (prev || []).map(p => ((p.id ?? p.reference) === (editing.id ?? editing.reference) ? { ...p, ...form, id: p.id } : p)));
				toast.success("Precio actualizado correctamente.");
				closeModal();
			} else {
				// creación: mantener recarga para asegurar formato/ids consistentes
				await axios.post(`${API_URL}/api/prices`, form, { headers: { Authorization: `Bearer ${token}` } });
				await fetchPrices();
				toast.success("Precio creado correctamente.");
				closeModal();
			}
		} catch (err) {
			console.error("Error saving price:", err?.response?.data ?? err);
			toast.error("Error al guardar precio. " + (err?.response?.data?.message ?? ""));
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async (p) => {
		const id = getId(p);
		const key = id ?? p.reference ?? Math.random().toString(36).slice(2);
		setDeletingIds(prev => ({ ...prev, [key]: true }));
		const token = localStorage.getItem("token");
		try {
			if (!id) throw new Error("ID inválido para eliminar");
			await axios.delete(`${API_URL}/api/prices/${id}`, { headers: { Authorization: `Bearer ${token}` } });
			// eliminar localmente sin recargar
			setPrices(prev => (prev || []).filter(x => (x.id ?? x.reference) !== (id ?? p.reference)));
			toast.success("Precio eliminado correctamente.");
		} catch (err) {
			console.error("Error deleting price:", err?.response?.data ?? err);
			toast.error("Error al eliminar precio. " + (err?.response?.data?.message ?? ""));
		} finally {
			setDeletingIds(prev => ({ ...prev, [key]: false }));
		}
	};

	// normalizar para el render
	const list = Array.isArray(prices) ? prices : [];

	return (
		<div className="dashboard-container">
			<Navigation />
			<ToastContainer autoClose={4000} theme="dark" position="bottom-right" />
			<div className="admin-prices-wrapper">
				<div className="admin-prices-header">
					<h2>Administrar Precios</h2>
					<button className="btn primary create-price" onClick={openCreate}>Crear Precio</button>
				</div>

				{loading ? (
					<div className="loader-center"><ReactLoading type="spin" color="#26b7cd" height={60} width={60} /></div>
				) : (
					<>
						<div className="prices-table">
							<div className="prices-header">
								<div className="col name">Nombre</div>
								<div className="col price">Precio</div>
								<div className="col ref">Referencia</div>
								<div className="col actions">Acciones</div>
							</div>

							<div className="prices-body">
								{list.length === 0 ? (
									<div className="no-results">No hay precios</div>
								) : (
									list.map((p, i) => {
										const key = `${p.id ?? p.reference ?? i}`;
										const deleting = !!deletingIds[p.id ?? p.reference ?? key];
										return (
											<div key={key} className="prices-row">
												<div className="col name">{p.name}</div>
												<div className="col price">{p.price?.toString?.() ?? p.price}</div>
												<div className="col ref">{p.reference ?? "-"}</div>
												<div className="col actions">
													<button className="btn update" onClick={() => openEdit(p)}>Actualizar</button>
													<button className="btn delete" onClick={() => handleDelete(p)} disabled={deleting}>{deleting ? <ReactLoading type="spin" color="#fcd1d1" height={14} width={14} /> : "Eliminar"}</button>
												</div>
											</div>
										);
									})
								)}
 							</div>
 						</div>
 					</>
 				)}
 			</div>

 			{/* Modal create / update */}
			{modalOpen && (
				<div className="modal-overlay" onClick={closeModal}>
					<div className="modal" onClick={e => e.stopPropagation()}>
						<h3>{editing ? "Actualizar Precio" : "Crear Precio"}</h3>
						<form className="modal-form" onSubmit={handleSubmit}>
							<label>Nombre
								<input name="name" value={form.name} onChange={handleChange} required />
							</label>
							<label>Precio
								<input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} required />
							</label>
							<label>Referencia
								<input name="reference" value={form.reference} onChange={handleChange} />
							</label>
							<div className="modal-actions">
								<button type="submit" className="btn primary" disabled={submitting}>{submitting ? "Guardando..." : (editing ? "Actualizar" : "Crear")}</button>
								<button type="button" className="btn" onClick={closeModal}>Cancelar</button>
							</div>
						</form>
					</div>
				</div>
			)}

			<Footer />
		</div>
	);
}

