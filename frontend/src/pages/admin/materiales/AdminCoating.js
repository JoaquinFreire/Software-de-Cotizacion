import React, { useState } from "react";
import axios from "axios";
import ReactLoading from "react-loading";
import { toast, ToastContainer } from "react-toastify";
import { safeArray } from "../../../utils/safeArray";
import Navigation from "../../../components/Navigation";
import { useNavigate } from "react-router-dom";
import Footer from "../../../components/Footer";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import ConfirmationModal from "../../../components/ConfirmationModal";
const API_URL = process.env.REACT_APP_API_URL || "";

export default function AdminCoating() {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState([]);
	const [selected, setSelected] = useState(null);
	const [form, setForm] = useState({ name: "", price: 0, description: "" });
	const [isLoading, setIsLoading] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [viewingAll, setViewingAll] = useState(false);
	const [deletingIds, setDeletingIds] = useState({});
	// Confirm delete modal
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [pendingDeleteItem, setPendingDeleteItem] = useState(null);
	const [modalSubmitting, setModalSubmitting] = useState(false);

	const navigate = useNavigate();
	const handleLogout = () => {
		localStorage.removeItem("token");
		navigate("/");
	}

	const normalizeItems = (items) => {
		if (!items || !Array.isArray(items)) return [];
		return items.map(it => {
			if (!it) return it;
			if (it.id === undefined && it._id) it.id = it._id;
			if (typeof it.id === "string" && /^[0-9]+$/.test(it.id)) it.id = Number(it.id);
			// garantizar description disponible
			if (it.description === undefined) it.description = it.description ?? it.desc ?? "";
			return it;
		});
	};

	const fetchResults = async (searchQuery = "") => {
		setIsLoading(true);
		const token = localStorage.getItem("token");
		if (!token) { setIsLoading(false); setResults([]); return []; }
		try {
			const url = `${API_URL}/api/coating/search?name=${encodeURIComponent(searchQuery)}`;
			const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
			const data = safeArray(resp.data);
			setResults(normalizeItems(data));
			return data;
		} catch (err) { console.error("Error fetching Coating:", err); setResults([]); return []; } finally { setIsLoading(false); }
	};

	const fetchAll = async () => {
		setIsLoading(true);
		const token = localStorage.getItem("token");
		if (!token) { setIsLoading(false); setResults([]); return []; }
		try {
			const url = `${API_URL}/api/coating`;
			const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
			const data = safeArray(resp.data);
			setViewingAll(true);
			setResults(normalizeItems(data));
			return data;
		} catch (err) { console.error("[fetchAllCoatings] Error:", err); setResults([]); return []; } finally { setIsLoading(false); }
	};

	const handleSearch = async (e) => { e?.preventDefault(); setViewingAll(false); await fetchResults(query); };

	const openCreateModal = () => { setSelected(null); setForm({ name: "", price: 0, description: "" }); setShowModal(true); };
	const closeModal = () => setShowModal(false);

	const handleCreate = async () => {
		setModalSubmitting(true);
		try {
			const token = localStorage.getItem("token");
			// enviar description junto a name y price
			const payload = { name: form.name, price: form.price, description: form.description };
			const resp = await axios.post(`${API_URL}/api/coating`, payload, { headers: { Authorization: `Bearer ${token}` } });
			toast.success("Revestimiento creado correctamente.");
			closeModal();
			const createdId = resp?.data?.result ?? resp?.data?.id ?? resp?.data?.coatingId ?? null;
			const newItem = { id: createdId ?? undefined, name: form.name, price: form.price, description: form.description };
			if (viewingAll) setResults(prev => { const next = [...(prev || []), newItem]; next.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))); return next; });
			else await fetchResults(query);
		} catch (err) { console.error(err); toast.error("Error al crear revestimiento."); } finally { setModalSubmitting(false); }
	};

	const handleUpdate = async () => {
		if (!selected) return;
		setModalSubmitting(true);
		try {
			const token = localStorage.getItem("token");
			const payload = { name: form.name, price: form.price, description: form.description };
			await axios.put(`${API_URL}/api/coating/${selected.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
			setResults(prev => (prev || []).map(r => ((r.id ?? r.name) === (selected.id ?? selected.name) ? { ...r, name: form.name, price: form.price, description: form.description } : r)));
			toast.success("Revestimiento actualizado correctamente.");
			closeModal();
		} catch (err) { console.error(err); toast.error("Error al actualizar revestimiento."); } finally { setModalSubmitting(false); }
	};

	const handleDelete = async (t) => {
		const key = t.id ?? t.name ?? Math.random().toString(36).slice(2);
		setDeletingIds(prev => ({ ...prev, [key]: true }));
		try {
			const token = localStorage.getItem("token");
			await axios.delete(`${API_URL}/api/coating/${t.id}`, { headers: { Authorization: `Bearer ${token}` } });
			if (viewingAll) setResults(prev => (prev || []).filter(r => (r.id ?? r.name) !== (t.id ?? t.name)));
			else await fetchResults(query);
			toast.success("Revestimiento eliminado correctamente.");
		} catch (err) { console.error(err); toast.error("Error al eliminar revestimiento."); } finally { setDeletingIds(prev => ({ ...prev, [key]: false })); }
	};

	// Confirm delete modal handlers
	const openDeleteModal = (item) => { setPendingDeleteItem(item); setShowDeleteModal(true); };
	const closeDeleteModal = () => { setShowDeleteModal(false); setPendingDeleteItem(null); };
	const confirmDelete = async () => {
		if (!pendingDeleteItem) return;
		await handleDelete(pendingDeleteItem);
		closeDeleteModal();
	};

	return (
		<div className="dashboard-container">
			<Navigation onLogout={handleLogout} />
			<ToastContainer autoClose={4000} theme="dark" position="bottom-right" />
			<div className="admin-materials-content">
				<div style={{ marginTop: 8 }}>
					<div style={{ marginTop: 2 }}>
						<Link to="/admin/materiales" className="btn update" style={{ display: "inline-block" }}>← Volver</Link>
					</div>
					<div className="admin-materials-header">
						<h3 className="materials-title">Revestimientos</h3></div>

					<form className="search-form" onSubmit={handleSearch}>
						<input type="text" placeholder="Buscar revestimiento..." value={query} onChange={(e) => setQuery(e.target.value)} disabled={isLoading} />
						<div className="search-actions">
							<button type="submit" disabled={isLoading}>{isLoading ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "🔍"}</button>
							<button type="button" onClick={openCreateModal} disabled={isLoading}>Cargar revestimiento</button>
							<button type="button" className="btn show-all" onClick={fetchAll} disabled={isLoading}>{isLoading ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "Mostrar todos"}</button>
						</div>
					</form>

					<div className="results-table">
						<div className="results-header">
							<div className="col name">Nombre</div>
							<div className="col desc">Descripción</div>
							<div className="col percent">Precio</div>
							<div className="col actions">Acciones</div>
						</div>
						<div className="results-body">
							{isLoading ? <div style={{ padding: 28, display: "flex", justifyContent: "center" }}><ReactLoading type="spin" color="#26b7cd" height={36} width={36} /></div>
								: results.length === 0 ? <div className="no-results">Sin resultados</div>
									: results.map((t, i) => {
										const itemKey = `${t.id ?? t.name ?? "c"}-${i}`;
										const deleteKey = t.id ?? t.name ?? itemKey;
										const isDeleting = !!deletingIds[deleteKey];
										return (
											<div key={itemKey} className="results-row">
												<div className="col name">{t.name}</div>
												<div className="col desc" style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.description}>{t.description || '—'}</div>
												<div className="col percent">{t.price}</div>
												<div className="col actions">
													<button
														className="btn update"
														onClick={() => {
															setSelected(t);
															setForm({ name: t.name, price: t.price, description: t.description ?? '' });
															setShowModal(true);
														}}
													>
														Actualizar
													</button>
													<button className="btn delete" onClick={() => openDeleteModal(t)} disabled={isDeleting}>{isDeleting ? <ReactLoading type="spin" color="#fcd1d1" height={14} width={14} /> : "Eliminar"}</button>
												</div>
											</div>
										);
									})}
						</div>
					</div>

					{showModal && (
						<div className="modal-overlay" onClick={closeModal}>
							<div className="modal" onClick={e => e.stopPropagation()}>
								<h3>{selected ? "Actualizar revestimiento" : "Crear revestimiento"}</h3>
								<div className="modal-form">
									<label>Nombre<input name="name" value={form.name} onChange={e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))} /></label>
									<label>Precio<input name="price" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, [e.target.name]: Number(e.target.value) }))} /></label>
									<label>Descripción<textarea name="description" value={form.description} onChange={e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))} /></label>
									<div className="modal-actions">
										<button onClick={selected ? handleUpdate : handleCreate} className="btn primary" disabled={modalSubmitting}>{modalSubmitting ? <ReactLoading type="spin" color="#fff" height={14} width={14} /> : (selected ? "Actualizar" : "Crear")}</button>
										<button onClick={closeModal} className="btn">Cancelar</button>
									</div>
								</div>
							</div>
						</div>
					)}
					<ConfirmationModal show={showDeleteModal} onClose={closeDeleteModal} onConfirm={confirmDelete} />
				</div>
			</div>
			<Footer />
		</div >
	);
}
