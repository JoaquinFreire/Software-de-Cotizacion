import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import "../../styles/adminMaterials.css";
import { safeArray } from "../../utils/safeArray";
import ReactLoading from "react-loading";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const API_URL = process.env.REACT_APP_API_URL || "";

const AdminMaterials = () => {
	// Tratamientos (existente)
	const [query, setQuery] = useState("");
	const [results, setResults] = useState([]);
	const [selected, setSelected] = useState(null);
	const [form, setForm] = useState({ name: "", pricePercentage: 0 });
	const [isLoading, setIsLoading] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [viewingAll, setViewingAll] = useState(false);
	const [deletingIds, setDeletingIds] = useState({});
	const [modalSubmitting, setModalSubmitting] = useState(false);

	// Revestimientos (nuevo)
	const [queryCoating, setQueryCoating] = useState("");
	const [resultsCoating, setResultsCoating] = useState([]);
	const [selectedCoating, setSelectedCoating] = useState(null);
	const [formCoating, setFormCoating] = useState({ name: "", price: 0 });
	const [isLoadingCoating, setIsLoadingCoating] = useState(false);
	const [showModalCoating, setShowModalCoating] = useState(false);
	const [viewingAllCoating, setViewingAllCoating] = useState(false);
	const [deletingIdsCoating, setDeletingIdsCoating] = useState({});
	const [modalSubmittingCoating, setModalSubmittingCoating] = useState(false);

	// Complementos - Puerta (nuevo)
	const [queryDoor, setQueryDoor] = useState("");
	const [resultsDoor, setResultsDoor] = useState([]);
	const [selectedDoor, setSelectedDoor] = useState(null);
	const [formDoor, setFormDoor] = useState({ name: "", price: 0, Material: "" });
	const [isLoadingDoor, setIsLoadingDoor] = useState(false);
	const [showModalDoor, setShowModalDoor] = useState(false);
	const [viewingAllDoor, setViewingAllDoor] = useState(false);
	const [deletingIdsDoor, setDeletingIdsDoor] = useState({});
	const [modalSubmittingDoor, setModalSubmittingDoor] = useState(false);

	const navigate = useNavigate();

	useEffect(() => {
		fetchCurrentUser();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const fetchCurrentUser = async () => {
		const token = localStorage.getItem("token");
		if (!token) {
			navigate("/");
			return;
		}
		try {
			const resp = await axios.get(`${API_URL}/api/auth/me`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const role = resp.data?.user?.role;
			const allowed = role === "coordinator" || role === "manager";
			if (!allowed) {
				console.warn("No tiene permisos para ver AdminMaterials, redirigiendo.");
				navigate("/");
				return;
			}
		} catch (err) {
			console.error("Error fetching current user:", String(err));
			localStorage.removeItem("token");
			navigate("/");
		}
	};

	// ---------- Tratamientos (existing) ----------
	const fetchResults = async (searchQuery = "") => {
		setIsLoading(true);
		const token = localStorage.getItem("token");
		if (!token) {
			console.warn("[fetchResults] no token found, redirecting to login");
			navigate("/");
			setIsLoading(false);
			setResults([]);
			return [];
		}
		try {
			const url = `${API_URL}/api/alum-treatments/search?name=${encodeURIComponent(searchQuery)}`;
			const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
			const data = safeArray(response.data);
			setResults(data);
			return data;
		} catch (error) {
			console.error("Error fetching Treatment:", String(error?.response?.data ?? error));
			setResults([]);
			return [];
		} finally {
			setIsLoading(false);
		}
	};

	const fetchAll = async () => {
		setIsLoading(true);
		const token = localStorage.getItem("token");
		if (!token) {
			navigate("/");
			setIsLoading(false);
			setResults([]);
			return [];
		}
		try {
			const url = `${API_URL}/api/alum-treatments`;
			const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
			const data = safeArray(response.data);
			setViewingAll(true);
			setResults(data);
			return data;
		} catch (error) {
			console.error("[fetchAll] Error fetching all treatments:", String(error));
			setResults([]);
			return [];
		} finally {
			setIsLoading(false);
		}
	};

	const handleSearch = async (e) => {
		e?.preventDefault();
		setViewingAll(false);
		const r = await fetchResults(query);
		setResults(r);
	};

	const openCreateModal = () => {
		setSelected(null);
		setForm({ name: "", pricePercentage: 0 });
		setShowModal(true);
	};
	const closeModal = () => setShowModal(false);

	const handleCreate = async () => {
		setModalSubmitting(true);
		try {
			const token = localStorage.getItem("token");
			const resp = await axios.post(`${API_URL}/api/alum-treatments`, form, { headers: { Authorization: `Bearer ${token}` } });
			toast.success("Tratamiento creado correctamente.");
			closeModal();
			const createdId = resp?.data?.result ?? resp?.data?.id ?? null;
			const newItem = { id: createdId ?? undefined, name: form.name, pricePercentage: form.pricePercentage };
			if (viewingAll) {
				setResults((prev) => {
					const next = [...(prev || []), newItem];
					next.sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""), "es", { sensitivity: "base" }));
					return next;
				});
			} else {
				await fetchResults(query);
			}
		} catch (err) {
			console.error(err?.message ?? String(err));
			toast.error("Error al crear tratamiento.");
		} finally {
			setModalSubmitting(false);
		}
	};

	const handleUpdateModal = async () => {
		if (!selected) return;
		setModalSubmitting(true);
		try {
			const token = localStorage.getItem("token");
			await axios.put(`${API_URL}/api/alum-treatments/${selected.id}`, { name: form.name, pricePercentage: form.pricePercentage }, { headers: { Authorization: `Bearer ${token}` } });
			setResults((prev) => (prev || []).map((r) => ((r.id ?? r.name) === (selected.id ?? selected.name) ? { ...r, name: form.name, pricePercentage: form.pricePercentage } : r)));
			toast.success("Tratamiento actualizado correctamente.");
			closeModal();
		} catch (err) {
			console.error(err?.message ?? String(err));
			toast.error("Error al actualizar tratamiento.");
		} finally {
			setModalSubmitting(false);
		}
	};

	const setDeleting = (key, value) => setDeletingIds((prev) => ({ ...prev, [key]: value }));

	const handleDelete = async (t) => {
		const key = t.id ?? t.name ?? Math.random().toString(36).slice(2);
		setDeleting(key, true);
		try {
			const token = localStorage.getItem("token");
			await axios.delete(`${API_URL}/api/alum-treatments/${t.id}`, { headers: { Authorization: `Bearer ${token}` } });
			if (viewingAll) setResults((prev) => (prev || []).filter((r) => (r.id ?? r.name) !== (t.id ?? t.name)));
			else await fetchResults(query);
			toast.success("Tratamiento eliminado correctamente.");
		} catch (err) {
			console.error(err?.message ?? String(err));
			toast.error("Error al eliminar tratamiento.");
		} finally {
			setDeleting(key, false);
		}
	};

	const handleSelect = (t) => {
		setSelected(t);
		setForm({ name: t.name ?? "", pricePercentage: t.pricePercentage ?? 0 });
		setShowModal(true);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((f) => ({ ...f, [name]: name === "pricePercentage" ? Number(value) : value }));
	};

	// ---------- Revestimientos (coating) ----------
	const fetchCoatingResults = async (searchQuery = "") => {
		setIsLoadingCoating(true);
		const token = localStorage.getItem("token");
		if (!token) {
			navigate("/");
			setIsLoadingCoating(false);
			setResultsCoating([]);
			return [];
		}
		try {
			const url = `${API_URL}/api/coating/search?name=${encodeURIComponent(searchQuery)}`;
			const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
			const data = safeArray(response.data);
			setResultsCoating(data);
			return data;
		} catch (error) {
			console.error("Error fetching Coating:", String(error?.response?.data ?? error));
			setResultsCoating([]);
			return [];
		} finally {
			setIsLoadingCoating(false);
		}
	};

	const fetchAllCoatings = async () => {
		setIsLoadingCoating(true);
		const token = localStorage.getItem("token");
		if (!token) {
			navigate("/");
			setIsLoadingCoating(false);
			setResultsCoating([]);
			return [];
		}
		try {
			const url = `${API_URL}/api/coating`;
			const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
			const data = safeArray(response.data);
			setViewingAllCoating(true);
			setResultsCoating(data);
			return data;
		} catch (error) {
			console.error("[fetchAllCoatings] Error:", String(error));
			setResultsCoating([]);
			return [];
		} finally {
			setIsLoadingCoating(false);
		}
	};

	const handleSearchCoating = async (e) => {
		e?.preventDefault();
		setViewingAllCoating(false);
		const r = await fetchCoatingResults(queryCoating);
		setResultsCoating(r);
	};

	const openCreateModalCoating = () => {
		setSelectedCoating(null);
		setFormCoating({ name: "", price: 0 });
		setShowModalCoating(true);
	};
	const closeModalCoating = () => setShowModalCoating(false);

	const handleCreateCoating = async () => {
		setModalSubmittingCoating(true);
		try {
			const token = localStorage.getItem("token");
			const resp = await axios.post(`${API_URL}/api/coating`, formCoating, { headers: { Authorization: `Bearer ${token}` } });
			toast.success("Revestimiento creado correctamente.");
			closeModalCoating();
			const createdId = resp?.data?.result ?? resp?.data?.id ?? null;
			const newItem = { id: createdId ?? undefined, name: formCoating.name, price: formCoating.price };
			if (viewingAllCoating) {
				setResultsCoating((prev) => {
					const next = [...(prev || []), newItem];
					next.sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""), "es", { sensitivity: "base" }));
					return next;
				});
			} else {
				await fetchCoatingResults(queryCoating);
			}
		} catch (err) {
			console.error(err?.message ?? String(err));
			toast.error("Error al crear revestimiento.");
		} finally {
			setModalSubmittingCoating(false);
		}
	};

	const handleUpdateModalCoating = async () => {
		if (!selectedCoating) return;
		setModalSubmittingCoating(true);
		try {
			const token = localStorage.getItem("token");
			await axios.put(`${API_URL}/api/coating/${selectedCoating.id}`, { name: formCoating.name, price: formCoating.price }, { headers: { Authorization: `Bearer ${token}` } });
			setResultsCoating((prev) => (prev || []).map((r) => ((r.id ?? r.name) === (selectedCoating.id ?? selectedCoating.name) ? { ...r, name: formCoating.name, price: formCoating.price } : r)));
			toast.success("Revestimiento actualizado correctamente.");
			closeModalCoating();
		} catch (err) {
			console.error(err?.message ?? String(err));
			toast.error("Error al actualizar revestimiento.");
		} finally {
			setModalSubmittingCoating(false);
		}
	};

	const setDeletingCoating = (key, value) => setDeletingIdsCoating((prev) => ({ ...prev, [key]: value }));

	const handleDeleteCoating = async (t) => {
		const key = t.id ?? t.name ?? Math.random().toString(36).slice(2);
		setDeletingCoating(key, true);
		try {
			const token = localStorage.getItem("token");
			await axios.delete(`${API_URL}/api/coating/${t.id}`, { headers: { Authorization: `Bearer ${token}` } });
			if (viewingAllCoating) setResultsCoating((prev) => (prev || []).filter((r) => (r.id ?? r.name) !== (t.id ?? t.name)));
			else await fetchCoatingResults(queryCoating);
			toast.success("Revestimiento eliminado correctamente.");
		} catch (err) {
			console.error(err?.message ?? String(err));
			toast.error("Error al eliminar revestimiento.");
		} finally {
			setDeletingCoating(key, false);
		}
	};

	const handleSelectCoating = (t) => {
		setSelectedCoating(t);
		setFormCoating({ name: t.name ?? "", price: t.price ?? 0 });
		setShowModalCoating(true);
	};

	const handleChangeCoating = (e) => {
		const { name, value } = e.target;
		setFormCoating((f) => ({ ...f, [name]: name === "price" ? Number(value) : value }));
	};

	// ---------- Complementos Puerta (nuevo) ----------
	const fetchDoorResults = async (searchQuery = "") => {
		setIsLoadingDoor(true);
		const token = localStorage.getItem("token");
		if (!token) {
			navigate("/");
			setIsLoadingDoor(false);
			setResultsDoor([]);
			return [];
		}
		try {
			const url = `${API_URL}/api/door/search?name=${encodeURIComponent(searchQuery)}`;
			const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
			const data = safeArray(resp.data);
			setResultsDoor(data);
			return data;
		} catch (err) {
			console.error("Error fetching Door:", String(err?.response?.data ?? err));
			setResultsDoor([]);
			return [];
		} finally {
			setIsLoadingDoor(false);
		}
	};

	const fetchAllDoors = async () => {
		setIsLoadingDoor(true);
		const token = localStorage.getItem("token");
		if (!token) {
			navigate("/");
			setIsLoadingDoor(false);
			setResultsDoor([]);
			return [];
		}
		try {
			const url = `${API_URL}/api/door`;
			const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
			const data = safeArray(resp.data);
			setViewingAllDoor(true);
			setResultsDoor(data);
			return data;
		} catch (err) {
			console.error("[fetchAllDoors] Error:", String(err));
			setResultsDoor([]);
			return [];
		} finally {
			setIsLoadingDoor(false);
		}
	};

	const handleSearchDoor = async (e) => {
		e?.preventDefault();
		setViewingAllDoor(false);
		const r = await fetchDoorResults(queryDoor);
		setResultsDoor(r);
	};

	const openCreateModalDoor = () => {
		setSelectedDoor(null);
		setFormDoor({ name: "", price: 0, Material: "" });
		setShowModalDoor(true);
	};
	const closeModalDoor = () => setShowModalDoor(false);

	const handleCreateDoor = async () => {
		setModalSubmittingDoor(true);
		try {
			const token = localStorage.getItem("token");
			const resp = await axios.post(`${API_URL}/api/door`, formDoor, { headers: { Authorization: `Bearer ${token}` } });
			toast.success("Complemento puerta creado correctamente.");
			closeModalDoor();
			const createdId = resp?.data?.result ?? resp?.data?.id ?? null;
			const newItem = { id: createdId ?? undefined, name: formDoor.name, price: formDoor.price, Material: formDoor.Material };
			if (viewingAllDoor) {
				setResultsDoor(prev => {
					const next = [...(prev || []), newItem];
					next.sort((a,b) => String(a.name ?? "").localeCompare(String(b.name ?? ""), "es", { sensitivity: "base" }));
					return next;
				});
			} else {
				await fetchDoorResults(queryDoor);
			}
		} catch (err) {
			console.error(err?.message ?? String(err));
			toast.error("Error al crear complemento de puerta.");
		} finally {
			setModalSubmittingDoor(false);
		}
	};

	const handleUpdateModalDoor = async () => {
		if (!selectedDoor) return;
		setModalSubmittingDoor(true);
		try {
			const token = localStorage.getItem("token");
			await axios.put(`${API_URL}/api/door/${selectedDoor.id}`, { name: formDoor.name, price: formDoor.price, Material: formDoor.Material }, { headers: { Authorization: `Bearer ${token}` } });
			setResultsDoor(prev => (prev || []).map(r => ((r.id ?? r.name) === (selectedDoor.id ?? selectedDoor.name) ? { ...r, name: formDoor.name, price: formDoor.price, Material: formDoor.Material } : r)));
			toast.success("Complemento puerta actualizado correctamente.");
			closeModalDoor();
		} catch (err) {
			console.error(err?.message ?? String(err));
			toast.error("Error al actualizar complemento de puerta.");
		} finally {
			setModalSubmittingDoor(false);
		}
	};

	const setDeletingDoor = (key, value) => setDeletingIdsDoor(prev => ({ ...prev, [key]: value }));

	const handleDeleteDoor = async (t) => {
		const key = t.id ?? t.name ?? Math.random().toString(36).slice(2);
		setDeletingDoor(key, true);
		try {
			const token = localStorage.getItem("token");
			await axios.delete(`${API_URL}/api/door/${t.id}`, { headers: { Authorization: `Bearer ${token}` } });
			if (viewingAllDoor) setResultsDoor(prev => (prev || []).filter(r => (r.id ?? r.name) !== (t.id ?? t.name)));
			else await fetchDoorResults(queryDoor);
			toast.success("Complemento puerta eliminado correctamente.");
		} catch (err) {
			console.error(err?.message ?? String(err));
			toast.error("Error al eliminar complemento de puerta.");
		} finally {
			setDeletingDoor(key, false);
		}
	};

	const handleSelectDoor = (t) => {
		setSelectedDoor(t);
		setFormDoor({ name: t.name ?? "", price: t.price ?? 0, Material: t.Material ?? "" });
		setShowModalDoor(true);
	};

	const handleChangeDoor = (e) => {
		const { name, value } = e.target;
		setFormDoor(f => ({ ...f, [name]: name === "price" ? Number(value) : value }));
	};

	// ---------- Render ----------
	return (
		<div className="dashboard-container">
			<ToastContainer autoClose={4000} theme="dark" transition={Slide} position="bottom-right" />
			<Navigation />
			<div className="admin-materials-header">
				<h2>Administrar Materiales</h2>
				<h3>Tratamientos de Aluminio</h3>
			</div>

			<div className="admin-materials-content">
				{/* Tratamientos */}
				<form className="search-form" onSubmit={handleSearch}>
					<input type="text" placeholder="Buscar por nombre..." value={query} onChange={(e) => setQuery(e.target.value)} disabled={isLoading} />
					<div className="search-actions">
						<button type="submit" disabled={isLoading}>{isLoading ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "🔍"}</button>
						<button type="button" onClick={openCreateModal} disabled={isLoading}>Cargar tratamiento</button>
						<button type="button" className="btn show-all" onClick={fetchAll} disabled={isLoading}>{isLoading ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "Mostrar todos"}</button>
					</div>
				</form>

				<div className="results-table">
					<div className="results-header">
						<div className="col name">Nombre</div>
						<div className="col percent">Porcentaje agregado</div>
						<div className="col actions">Acciones</div>
					</div>
					<div className="results-body">
						{isLoading ? (
							<div style={{ padding: 28, display: "flex", justifyContent: "center" }}><ReactLoading type="spin" color="#26b7cd" height={36} width={36} /></div>
						) : results.length === 0 ? (
							<div className="no-results">Sin resultados</div>
						) : (
							results.map((t, i) => {
								const itemKey = `${t.id ?? t.name ?? "t"}-${i}`;
								const deleteKey = t.id ?? t.name ?? itemKey;
								const isDeleting = !!deletingIds[deleteKey];
								return (
									<div key={itemKey} className="results-row">
										<div className="col name">{t.name}</div>
										<div className="col percent">{t.pricePercentage}%</div>
										<div className="col actions">
											<button className="btn update" onClick={() => handleSelect(t)}>Actualizar</button>
											<button className="btn delete" onClick={() => handleDelete(t)} disabled={isDeleting}>
												{isDeleting ? <ReactLoading type="spin" color="#fcd1d1" height={14} width={14} /> : "Eliminar"}
											</button>
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>

				{/* Revestimientos */}
				<div style={{ marginTop: 28 }}>
					<div className="admin-materials-header"><h3>Revestimientos</h3></div>

					<form className="search-form" onSubmit={handleSearchCoating}>
						<input type="text" placeholder="Buscar revestimiento..." value={queryCoating} onChange={(e) => setQueryCoating(e.target.value)} disabled={isLoadingCoating} />
						<div className="search-actions">
							<button type="submit" disabled={isLoadingCoating}>{isLoadingCoating ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "🔍"}</button>
							<button type="button" onClick={openCreateModalCoating} disabled={isLoadingCoating}>Cargar revestimiento</button>
							<button type="button" className="btn show-all" onClick={fetchAllCoatings} disabled={isLoadingCoating}>{isLoadingCoating ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "Mostrar todos"}</button>
						</div>
					</form>

					<div className="results-table">
						<div className="results-header">
							<div className="col name">Nombre</div>
							<div className="col percent">Precio</div>
							<div className="col actions">Acciones</div>
						</div>
						<div className="results-body">
							{isLoadingCoating ? (
								<div style={{ padding: 28, display: "flex", justifyContent: "center" }}><ReactLoading type="spin" color="#26b7cd" height={36} width={36} /></div>
							) : resultsCoating.length === 0 ? (
								<div className="no-results">Sin resultados</div>
							) : (
								resultsCoating.map((t, i) => {
									const itemKey = `${t.id ?? t.name ?? "c"}-${i}`;
									const deleteKey = t.id ?? t.name ?? itemKey;
									const isDeleting = !!deletingIdsCoating[deleteKey];
									return (
										<div key={itemKey} className="results-row">
											<div className="col name">{t.name}</div>
											<div className="col percent">{t.price}</div>
											<div className="col actions">
												<button className="btn update" onClick={() => handleSelectCoating(t)}>Actualizar</button>
												<button className="btn delete" onClick={() => handleDeleteCoating(t)} disabled={isDeleting}>
													{isDeleting ? <ReactLoading type="spin" color="#fcd1d1" height={14} width={14} /> : "Eliminar"}
												</button>
											</div>
										</div>
									);
								})
							)}
						</div>
					</div>
				</div>

				{/* Complementos - Puerta */}
				<div style={{ marginTop: 28 }}>
					<div className="admin-materials-header"><h3>Complementos - Puerta</h3></div>

					<form className="search-form" onSubmit={handleSearchDoor}>
						<input type="text" placeholder="Buscar complemento..." value={queryDoor} onChange={(e) => setQueryDoor(e.target.value)} disabled={isLoadingDoor} />
						<div className="search-actions">
							<button type="submit" disabled={isLoadingDoor}>{isLoadingDoor ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "🔍"}</button>
							<button type="button" onClick={openCreateModalDoor} disabled={isLoadingDoor}>Cargar complemento</button>
							<button type="button" className="btn show-all" onClick={fetchAllDoors} disabled={isLoadingDoor}>{isLoadingDoor ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "Mostrar todos"}</button>
						</div>
					</form>

					<div className="results-table">
						<div className="results-header">
							<div className="col name">Nombre</div>
							<div className="col percent">Precio</div>
							<div className="col percent">Material</div>
							<div className="col actions">Acciones</div>
						</div>
						<div className="results-body">
							{isLoadingDoor ? (
								<div style={{ padding: 28, display: "flex", justifyContent: "center" }}><ReactLoading type="spin" color="#26b7cd" height={36} width={36} /></div>
							) : resultsDoor.length === 0 ? (
								<div className="no-results">Sin resultados</div>
							) : (
								resultsDoor.map((t, i) => {
									const itemKey = `${t.id ?? t.name ?? "d"}-${i}`;
									const deleteKey = t.id ?? t.name ?? itemKey;
									const isDeleting = !!deletingIdsDoor[deleteKey];
									return (
										<div key={itemKey} className="results-row">
											<div className="col name">{t.name}</div>
											<div className="col percent">{t.price}</div>
											<div className="col percent">{t.Material}</div>
											<div className="col actions">
												<button className="btn update" onClick={() => handleSelectDoor(t)}>Actualizar</button>
												<button className="btn delete" onClick={() => handleDeleteDoor(t)} disabled={isDeleting}>
													{isDeleting ? <ReactLoading type="spin" color="#fcd1d1" height={14} width={14} /> : "Eliminar"}
												</button>
											</div>
										</div>
									);
								})
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Modal para tratamientos */}
			{showModal && (
				<div className="modal-overlay" onClick={closeModal}>
					<div className="modal" onClick={(e) => e.stopPropagation()}>
						<h3>{selected ? "Actualizar tratamiento" : "Crear tratamiento"}</h3>
						<div className="modal-form">
							<label>
								Nombre
								<input name="name" value={form.name} onChange={handleChange} />
							</label>
							<label>
								Porcentaje agregado
								<input name="pricePercentage" type="number" value={form.pricePercentage} onChange={handleChange} />
							</label>
							<div className="modal-actions">
								<button onClick={selected ? handleUpdateModal : handleCreate} className="btn primary" disabled={modalSubmitting}>
									{modalSubmitting ? <ReactLoading type="spin" color="#fff" height={14} width={14} /> : (selected ? "Actualizar" : "Crear")}
								</button>
								<button onClick={closeModal} className="btn">Cancelar</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Modal para revestimientos */}
			{showModalCoating && (
				<div className="modal-overlay" onClick={closeModalCoating}>
					<div className="modal" onClick={(e) => e.stopPropagation()}>
						<h3>{selectedCoating ? "Actualizar revestimiento" : "Crear revestimiento"}</h3>
						<div className="modal-form">
							<label>
								Nombre
								<input name="name" value={formCoating.name} onChange={handleChangeCoating} />
							</label>
							<label>
								Precio
								<input name="price" type="number" value={formCoating.price} onChange={handleChangeCoating} />
							</label>
							<div className="modal-actions">
								<button onClick={selectedCoating ? handleUpdateModalCoating : handleCreateCoating} className="btn primary" disabled={modalSubmittingCoating}>
									{modalSubmittingCoating ? <ReactLoading type="spin" color="#fff" height={14} width={14} /> : (selectedCoating ? "Actualizar" : "Crear")}
								</button>
								<button onClick={closeModalCoating} className="btn">Cancelar</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Modal para Complementos Puerta */}
			{showModalDoor && (
				<div className="modal-overlay" onClick={closeModalDoor}>
					<div className="modal" onClick={(e) => e.stopPropagation()}>
						<h3>{selectedDoor ? "Actualizar complemento - Puerta" : "Crear complemento - Puerta"}</h3>
						<div className="modal-form">
							<label>
								Nombre
								<input name="name" value={formDoor.name} onChange={handleChangeDoor} />
							</label>
							<label>
								Precio
								<input name="price" type="number" value={formDoor.price} onChange={handleChangeDoor} />
							</label>
							<label>
								Material
								<input name="Material" value={formDoor.Material} onChange={handleChangeDoor} />
							</label>
							<div className="modal-actions">
								<button onClick={selectedDoor ? handleUpdateModalDoor : handleCreateDoor} className="btn primary" disabled={modalSubmittingDoor}>
									{modalSubmittingDoor ? <ReactLoading type="spin" color="#fff" height={14} width={14} /> : (selectedDoor ? "Actualizar" : "Crear")}
								</button>
								<button onClick={closeModalDoor} className="btn">Cancelar</button>
							</div>
						</div>
					</div>
				</div>
			)}

			<Footer />
		</div>
	);
};

export default AdminMaterials;