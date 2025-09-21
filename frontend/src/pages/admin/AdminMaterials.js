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

	// ----------------- Añadir estados para Partition y Railing -----------------
	const [queryPartition, setQueryPartition] = useState("");
	const [resultsPartition, setResultsPartition] = useState([]);
	const [selectedPartition, setSelectedPartition] = useState(null);
	const [formPartition, setFormPartition] = useState({ name: "", price: 0 });
	const [isLoadingPartition, setIsLoadingPartition] = useState(false);
	const [showModalPartition, setShowModalPartition] = useState(false);
	const [viewingAllPartition, setViewingAllPartition] = useState(false);
	const [deletingIdsPartition, setDeletingIdsPartition] = useState({});
	const [modalSubmittingPartition, setModalSubmittingPartition] = useState(false);

	const [queryRailing, setQueryRailing] = useState("");
	const [resultsRailing, setResultsRailing] = useState([]);
	const [selectedRailing, setSelectedRailing] = useState(null);
	const [formRailing, setFormRailing] = useState({ name: "", price: 0 });
	const [isLoadingRailing, setIsLoadingRailing] = useState(false);
	const [showModalRailing, setShowModalRailing] = useState(false);
	const [viewingAllRailing, setViewingAllRailing] = useState(false);
	const [deletingIdsRailing, setDeletingIdsRailing] = useState({});
	const [modalSubmittingRailing, setModalSubmittingRailing] = useState(false);

	// ----------------- Glass Type (Tipos de Vidrio) state -----------------
	const [queryGlass, setQueryGlass] = useState("");
	const [resultsGlass, setResultsGlass] = useState([]);
	const [selectedGlass, setSelectedGlass] = useState(null);
	const [formGlass, setFormGlass] = useState({ name: "", price: 0 });
	const [isLoadingGlass, setIsLoadingGlass] = useState(false);
	const [showModalGlass, setShowModalGlass] = useState(false);
	const [viewingAllGlass, setViewingAllGlass] = useState(false);
	const [deletingIdsGlass, setDeletingIdsGlass] = useState({});
	const [modalSubmittingGlass, setModalSubmittingGlass] = useState(false);

	// ----------------- Accessories (Accesorios) state -----------------
	const [queryAccessory, setQueryAccessory] = useState("");
	const [resultsAccessory, setResultsAccessory] = useState([]);
	const [selectedAccessory, setSelectedAccessory] = useState(null);
	const [formAccessory, setFormAccessory] = useState({ name: "", price: 0 });
	const [isLoadingAccessory, setIsLoadingAccessory] = useState(false);
	const [showModalAccessory, setShowModalAccessory] = useState(false);
	const [viewingAllAccessory, setViewingAllAccessory] = useState(false);
	const [deletingIdsAccessory, setDeletingIdsAccessory] = useState({});
	const [modalSubmittingAccessory, setModalSubmittingAccessory] = useState(false);

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
			setResults(normalizeItems(data));
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
			setResults(normalizeItems(data));
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
			setResultsCoating(normalizeItems(data));
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
			setResultsCoating(normalizeItems(data));
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
			setResultsDoor(normalizeItems(data));
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
			setResultsDoor(normalizeItems(data));
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
					next.sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""), "es", { sensitivity: "base" }));
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

	// ----------------- Partition: fetch/search/all/create/update/delete -----------------
	const fetchPartitionResults = async (searchQuery = "") => {
		setIsLoadingPartition(true);
		const token = localStorage.getItem("token");
		if (!token) { navigate("/"); setIsLoadingPartition(false); setResultsPartition([]); return []; }
		try {
			const url = `${API_URL}/api/partition/search?name=${encodeURIComponent(searchQuery)}`;
			const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
			const data = safeArray(resp.data);
			setResultsPartition(normalizeItems(data));
			return data;
		} catch (err) {
			console.error("Error fetching Partition:", err);
			setResultsPartition([]);
			return [];
		} finally { setIsLoadingPartition(false); }
	};

	const fetchAllPartitions = async () => {
		setIsLoadingPartition(true);
		const token = localStorage.getItem("token");
		if (!token) { navigate("/"); setIsLoadingPartition(false); setResultsPartition([]); return []; }
		try {
			const url = `${API_URL}/api/partition`;
			const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
			const data = safeArray(resp.data);
			setViewingAllPartition(true);
			setResultsPartition(normalizeItems(data));
			return data;
		} catch (err) {
			console.error("[fetchAllPartitions] Error:", err);
			setResultsPartition([]);
			return [];
		} finally { setIsLoadingPartition(false); }
	};

	const handleSearchPartition = async (e) => {
		e?.preventDefault();
		setViewingAllPartition(false);
		const r = await fetchPartitionResults(queryPartition);
		setResultsPartition(r);
	};

	const openCreateModalPartition = () => { setSelectedPartition(null); setFormPartition({ name: "", price: 0 }); setShowModalPartition(true); };
	const closeModalPartition = () => setShowModalPartition(false);

	const handleCreatePartition = async () => {
		setModalSubmittingPartition(true);
		try {
			const token = localStorage.getItem("token");
			const resp = await axios.post(`${API_URL}/api/partition`, formPartition, { headers: { Authorization: `Bearer ${token}` } });
			toast.success("Partición creada correctamente.");
			closeModalPartition();
			const createdId = resp?.data?.result ?? resp?.data?.id ?? null;
			const newItem = { id: createdId ?? undefined, name: formPartition.name, price: formPartition.price };
			if (viewingAllPartition) {
				setResultsPartition(prev => { const next = [...(prev || []), newItem]; next.sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""), "es", { sensitivity: "base" })); return next; });
			} else { await fetchPartitionResults(queryPartition); }
		} catch (err) { console.error(err); toast.error("Error al crear partición."); } finally { setModalSubmittingPartition(false); }
	};

	const handleUpdateModalPartition = async () => {
		if (!selectedPartition) return;
		setModalSubmittingPartition(true);
		try {
			const token = localStorage.getItem("token");
			await axios.put(`${API_URL}/api/partition/${selectedPartition.id}`, { name: formPartition.name, price: formPartition.price }, { headers: { Authorization: `Bearer ${token}` } });
			setResultsPartition(prev => (prev || []).map(r => ((r.id ?? r.name) === (selectedPartition.id ?? selectedPartition.name) ? { ...r, name: formPartition.name, price: formPartition.price } : r)));
			toast.success("Partición actualizada correctamente.");
			closeModalPartition();
		} catch (err) { console.error(err); toast.error("Error al actualizar partición."); } finally { setModalSubmittingPartition(false); }
	};

	const setDeletingPartition = (k, v) => setDeletingIdsPartition(prev => ({ ...prev, [k]: v }));

	const handleDeletePartition = async (t) => {
		const key = t.id ?? t.name ?? Math.random().toString(36).slice(2);
		setDeletingPartition(key, true);
		try {
			const token = localStorage.getItem("token");
			await axios.delete(`${API_URL}/api/partition/${t.id}`, { headers: { Authorization: `Bearer ${token}` } });
			if (viewingAllPartition) setResultsPartition(prev => (prev || []).filter(r => (r.id ?? r.name) !== (t.id ?? t.name)));
			else await fetchPartitionResults(queryPartition);
			toast.success("Partición eliminada correctamente.");
		} catch (err) { console.error(err); toast.error("Error al eliminar partición."); } finally { setDeletingPartition(key, false); }
	};

	const handleSelectPartition = (t) => { setSelectedPartition(t); setFormPartition({ name: t.name ?? "", price: t.price ?? 0 }); setShowModalPartition(true); };
	const handleChangePartition = (e) => { const { name, value } = e.target; setFormPartition(f => ({ ...f, [name]: name === "price" ? Number(value) : value })); };

	// ----------------- Railing: fetch/search/all/create/update/delete -----------------
	const fetchRailingResults = async (searchQuery = "") => {
		setIsLoadingRailing(true);
		const token = localStorage.getItem("token");
		if (!token) { navigate("/"); setIsLoadingRailing(false); setResultsRailing([]); return []; }
		try {
			const url = `${API_URL}/api/railing/search?name=${encodeURIComponent(searchQuery)}`;
			const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
			const data = safeArray(resp.data);
			setResultsRailing(normalizeItems(data));
			return data;
		} catch (err) { console.error("Error fetching Railing:", err); setResultsRailing([]); return []; } finally { setIsLoadingRailing(false); }
	};

	const fetchAllRailings = async () => {
		setIsLoadingRailing(true);
		const token = localStorage.getItem("token");
		if (!token) { navigate("/"); setIsLoadingRailing(false); setResultsRailing([]); return []; }
		try {
			const url = `${API_URL}/api/railing`;
			const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
			const data = safeArray(resp.data);
			setViewingAllRailing(true);
			setResultsRailing(normalizeItems(data));
			return data;
		} catch (err) { console.error("[fetchAllRailings] Error:", err); setResultsRailing([]); return []; } finally { setIsLoadingRailing(false); }
	};

	const handleSearchRailing = async (e) => { e?.preventDefault(); setViewingAllRailing(false); const r = await fetchRailingResults(queryRailing); setResultsRailing(r); };

	const openCreateModalRailing = () => { setSelectedRailing(null); setFormRailing({ name: "", price: 0 }); setShowModalRailing(true); };
	const closeModalRailing = () => setShowModalRailing(false);

	const handleCreateRailing = async () => {
		setModalSubmittingRailing(true);
		try {
			const token = localStorage.getItem("token");
			const resp = await axios.post(`${API_URL}/api/railing`, formRailing, { headers: { Authorization: `Bearer ${token}` } });
			toast.success("Baranda creada correctamente.");
			closeModalRailing();
			const createdId = resp?.data?.result ?? resp?.data?.id ?? null;
			const newItem = { id: createdId ?? undefined, name: formRailing.name, price: formRailing.price };
			if (viewingAllRailing) setResultsRailing(prev => { const next = [...(prev || []), newItem]; next.sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""), "es", { sensitivity: "base" })); return next; });
			else await fetchRailingResults(queryRailing);
		} catch (err) { console.error(err); toast.error("Error al crear baranda."); } finally { setModalSubmittingRailing(false); }
	};

	const handleUpdateModalRailing = async () => {
		if (!selectedRailing) return;
		setModalSubmittingRailing(true);
		try {
			const token = localStorage.getItem("token");
			await axios.put(`${API_URL}/api/railing/${selectedRailing.id}`, { name: formRailing.name, price: formRailing.price }, { headers: { Authorization: `Bearer ${token}` } });
			setResultsRailing(prev => (prev || []).map(r => ((r.id ?? r.name) === (selectedRailing.id ?? selectedRailing.name) ? { ...r, name: formRailing.name, price: formRailing.price } : r)));
			toast.success("Baranda actualizada correctamente.");
			closeModalRailing();
		} catch (err) { console.error(err); toast.error("Error al actualizar baranda."); } finally { setModalSubmittingRailing(false); }
	};

	const setDeletingRailing = (k, v) => setDeletingIdsRailing(prev => ({ ...prev, [k]: v }));

	const handleDeleteRailing = async (t) => {
		const key = t.id ?? t.name ?? Math.random().toString(36).slice(2);
		setDeletingRailing(key, true);
		try {
			const token = localStorage.getItem("token");
			await axios.delete(`${API_URL}/api/railing/${t.id}`, { headers: { Authorization: `Bearer ${token}` } });
			if (viewingAllRailing) setResultsRailing(prev => (prev || []).filter(r => (r.id ?? r.name) !== (t.id ?? t.name)));
			else await fetchRailingResults(queryRailing);
			toast.success("Baranda eliminada correctamente.");
		} catch (err) { console.error(err); toast.error("Error al eliminar baranda."); } finally { setDeletingRailing(key, false); }
	};

	const handleSelectRailing = (t) => { setSelectedRailing(t); setFormRailing({ name: t.name ?? "", price: t.price ?? 0 }); setShowModalRailing(true); };
	const handleChangeRailing = (e) => { const { name, value } = e.target; setFormRailing(f => ({ ...f, [name]: name === "price" ? Number(value) : value })); };

	// ----------------- Glass Type functions -----------------
	const fetchGlassResults = async (searchQuery = "") => {
		setIsLoadingGlass(true);
		const token = localStorage.getItem("token");
		if (!token) { navigate("/"); setIsLoadingGlass(false); setResultsGlass([]); return []; }
		try {
			const url = `${API_URL}/api/glass-types/search?name=${encodeURIComponent(searchQuery)}`;
			const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
			const data = safeArray(resp.data);
			setResultsGlass(normalizeItems(data));
			return data;
		} catch (err) { console.error("Error fetching GlassType:", err); setResultsGlass([]); return []; } finally { setIsLoadingGlass(false); }
	};

	const fetchAllGlass = async () => {
		setIsLoadingGlass(true);
		const token = localStorage.getItem("token");
		if (!token) { navigate("/"); setIsLoadingGlass(false); setResultsGlass([]); return []; }
		try {
			const url = `${API_URL}/api/glass-types`;
			const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
			const data = safeArray(resp.data);
			setViewingAllGlass(true);
			setResultsGlass(normalizeItems(data));
			return data;
		} catch (err) { console.error("[fetchAllGlass] Error:", err); setResultsGlass([]); return []; } finally { setIsLoadingGlass(false); }
	};

	const handleSearchGlass = async (e) => { e?.preventDefault(); setViewingAllGlass(false); const r = await fetchGlassResults(queryGlass); setResultsGlass(r); };

	const openCreateModalGlass = () => { setSelectedGlass(null); setFormGlass({ name: "", price: 0 }); setShowModalGlass(true); };
	const closeModalGlass = () => setShowModalGlass(false);

	const handleCreateGlass = async () => {
		setModalSubmittingGlass(true);
		try {
			const token = localStorage.getItem("token");
			const resp = await axios.post(`${API_URL}/api/glass-types`, formGlass, { headers: { Authorization: `Bearer ${token}` } });
			// intentar extraer id de varias formas
			let createdId = resp?.data?.result ?? resp?.data?.id ?? resp?.data?.glassTypeId ?? resp?.data ?? null;
			if (typeof createdId === "object" && createdId !== null) createdId = createdId.id ?? createdId._id ?? null;
			if (typeof createdId === "string" && /^[0-9]+$/.test(createdId)) createdId = Number(createdId);

			const newItem = { id: createdId ?? undefined, name: formGlass.name, price: formGlass.price };
			toast.success("Tipo de vidrio creado correctamente.");
			// cerrar y limpiar formulario/selección
			closeModalGlass();
			setSelectedGlass(null);
			setFormGlass({ name: "", price: 0 });

			// Si estamos en "mostrar todos" actualizamos en memoria (más fluido)
			if (viewingAllGlass) {
				setResultsGlass((prev) => {
					const next = [...(prev || []), newItem];
					next.sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""), "es", { sensitivity: "base" }));
					return next;
				});
			} else {
				// si hay un filtro activo, refetch para consistencia
				await fetchGlassResults(queryGlass);
			}
		} catch (err) {
			console.error(err);
			toast.error("Error al crear tipo de vidrio.");
		} finally {
			setModalSubmittingGlass(false);
		}
	};

	const handleUpdateModalGlass = async () => {
		if (!selectedGlass) return;
		setModalSubmittingGlass(true);
		try {
			const token = localStorage.getItem("token");
			await axios.put(`${API_URL}/api/glass-types/${selectedGlass.id}`, { name: formGlass.name, price: formGlass.price }, { headers: { Authorization: `Bearer ${token}` } });
			// Actualizar en memoria (sin refetch) para UX inmediato como en los otros módulos
			setResultsGlass((prev) => (prev || []).map((r) => ((r.id ?? r.name) === (selectedGlass.id ?? selectedGlass.name) ? { ...r, name: formGlass.name, price: formGlass.price } : r)));
			toast.success("Tipo de vidrio actualizado correctamente.");
			// cerrar y limpiar selección
			closeModalGlass();
			setSelectedGlass(null);
		} catch (err) {
			console.error(err);
			toast.error("Error al actualizar tipo de vidrio.");
		} finally {
			setModalSubmittingGlass(false);
		}
	};

	const setDeletingGlass = (k, v) => setDeletingIdsGlass(prev => ({ ...prev, [k]: v }));

	const handleDeleteGlass = async (t) => {
		const key = t.id ?? t.name ?? Math.random().toString(36).slice(2);
		setDeletingGlass(key, true);
		try {
			const token = localStorage.getItem("token");
			await axios.delete(`${API_URL}/api/glass-types/${t.id}`, { headers: { Authorization: `Bearer ${token}` } });
			if (viewingAllGlass) setResultsGlass(prev => (prev || []).filter(r => (r.id ?? r.name) !== (t.id ?? t.name)));
			else await fetchGlassResults(queryGlass);
			toast.success("Tipo de vidrio eliminado correctamente.");
		} catch (err) { console.error(err); toast.error("Error al eliminar tipo de vidrio."); } finally { setDeletingGlass(key, false); }
	};

	const handleSelectGlass = (t) => { setSelectedGlass(t); setFormGlass({ name: t.name ?? "", price: t.price ?? 0 }); setShowModalGlass(true); };
	const handleChangeGlass = (e) => { const { name, value } = e.target; setFormGlass(f => ({ ...f, [name]: name === "price" ? Number(value) : value })); };

	// ----------------- Accessories functions -----------------
	const fetchAccessoryResults = async (searchQuery = "") => {
		setIsLoadingAccessory(true);
		const token = localStorage.getItem("token");
		if (!token) { navigate("/"); setIsLoadingAccessory(false); setResultsAccessory([]); return []; }
		try {
			const url = `${API_URL}/api/accessories/search?name=${encodeURIComponent(searchQuery)}`;
			const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
			const data = safeArray(resp.data);
			setResultsAccessory(normalizeItems(data));
			return data;
		} catch (err) { console.error("Error fetching Accessory:", err); setResultsAccessory([]); return []; } finally { setIsLoadingAccessory(false); }
	};

	const fetchAllAccessories = async () => {
		setIsLoadingAccessory(true);
		const token = localStorage.getItem("token");
		if (!token) { navigate("/"); setIsLoadingAccessory(false); setResultsAccessory([]); return []; }
		try {
			const url = `${API_URL}/api/accessories`;
			const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
			const data = safeArray(resp.data);
			setViewingAllAccessory(true);
			setResultsAccessory(normalizeItems(data));
			return data;
		} catch (err) { console.error("[fetchAllAccessories] Error:", err); setResultsAccessory([]); return []; } finally { setIsLoadingAccessory(false); }
	};

	const handleSearchAccessory = async (e) => { e?.preventDefault(); setViewingAllAccessory(false); const r = await fetchAccessoryResults(queryAccessory); setResultsAccessory(r); };

	const openCreateModalAccessory = () => { setSelectedAccessory(null); setFormAccessory({ name: "", price: 0 }); setShowModalAccessory(true); };
	const closeModalAccessory = () => setShowModalAccessory(false);

	const handleCreateAccessory = async () => {
		setModalSubmittingAccessory(true);
		try {
			const token = localStorage.getItem("token");
			const resp = await axios.post(`${API_URL}/api/accessories`, formAccessory, { headers: { Authorization: `Bearer ${token}` } });
			let createdId = resp?.data ?? resp?.data?.result ?? resp?.data?.id ?? null;
			if (typeof createdId === "object" && createdId !== null) createdId = createdId.id ?? createdId._id ?? null;
			if (typeof createdId === "string" && /^[0-9]+$/.test(createdId)) createdId = Number(createdId);
			const newItem = { id: createdId ?? undefined, name: formAccessory.name, price: formAccessory.price };
			toast.success("Accesorio creado correctamente.");
			closeModalAccessory();
			setSelectedAccessory(null);
			setFormAccessory({ name: "", price: 0 });
			if (viewingAllAccessory) {
				setResultsAccessory(prev => {
					const next = [...(prev||[]), newItem];
					next.sort((a,b)=>String(a.name??"").localeCompare(String(b.name??""),"es",{sensitivity:"base"}));
					return next;
				});
			} else await fetchAccessoryResults(queryAccessory);
		} catch (err) { console.error(err); toast.error("Error al crear accesorio."); } finally { setModalSubmittingAccessory(false); }
	};

	const handleUpdateAccessory = async () => {
		if (!selectedAccessory) return;
		setModalSubmittingAccessory(true);
		try {
			const token = localStorage.getItem("token");
			await axios.put(`${API_URL}/api/accessories/${selectedAccessory.id}`, { name: formAccessory.name, price: formAccessory.price }, { headers: { Authorization: `Bearer ${token}` } });
			setResultsAccessory(prev => (prev||[]).map(r => ((r.id ?? r.name) === (selectedAccessory.id ?? selectedAccessory.name) ? { ...r, name: formAccessory.name, price: formAccessory.price } : r)));
			toast.success("Accesorio actualizado correctamente.");
			closeModalAccessory();
			setSelectedAccessory(null);
		} catch (err) { console.error(err); toast.error("Error al actualizar accesorio."); } finally { setModalSubmittingAccessory(false); }
	};

	const setDeletingAccessory = (k,v) => setDeletingIdsAccessory(prev=>({...prev,[k]:v}));

	const handleDeleteAccessory = async (t) => {
		const key = t.id ?? t.name ?? Math.random().toString(36).slice(2);
		setDeletingAccessory(key, true);
		try {
			const token = localStorage.getItem("token");
			await axios.delete(`${API_URL}/api/accessories/${t.id}`, { headers: { Authorization: `Bearer ${token}` } });
			if (viewingAllAccessory) setResultsAccessory(prev => (prev||[]).filter(r => (r.id ?? r.name) !== (t.id ?? t.name)));
			else await fetchAccessoryResults(queryAccessory);
			toast.success("Accesorio eliminado correctamente.");
		} catch (err) { console.error(err); toast.error("Error al eliminar accesorio."); } finally { setDeletingAccessory(key, false); }
	};

	const handleSelectAccessory = (t) => { setSelectedAccessory(t); setFormAccessory({ name: t.name ?? "", price: t.price ?? 0 }); setShowModalAccessory(true); };
	const handleChangeAccessory = (e) => { const { name, value } = e.target; setFormAccessory(f => ({ ...f, [name]: name === "price" ? Number(value) : value })); };

	// Normaliza items para garantizar que exista una propiedad 'id' usable
	const normalizeItems = (items) => {
		if (!items || !Array.isArray(items)) return [];
		return items.map((it) => {
			if (!it) return it;
			// ya tiene id
			if (it.id !== undefined && it.id !== null) return it;
			// posibles variantes devueltas por el backend
			if (it._id !== undefined && it._id !== null) it.id = it._id;
			else if (it.Id !== undefined && it.Id !== null) it.id = it.Id;
			else if (it.$id !== undefined && it.$id !== null) it.id = it.$id;
			else if (typeof it.id === "object" && it.id?.$oid) it.id = it.id.$oid;
			// si id es string numérico, convertir a Number cuando sea apropiado
			if (typeof it.id === "string" && /^[0-9]+$/.test(it.id)) it.id = Number(it.id);
			return it;
		});
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

				{/* Complementos - Partition */}
				<div style={{ marginTop: 28 }}>
					<div className="admin-materials-header"><h3>Complementos - Tabique</h3></div>

					<form className="search-form" onSubmit={handleSearchPartition}>
						<input type="text" placeholder="Buscar tabique..." value={queryPartition} onChange={(e) => setQueryPartition(e.target.value)} disabled={isLoadingPartition} />
						<div className="search-actions">
							<button type="submit" disabled={isLoadingPartition}>{isLoadingPartition ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "🔍"}</button>
							<button type="button" onClick={openCreateModalPartition} disabled={isLoadingPartition}>Cargar partición</button>
							<button type="button" className="btn show-all" onClick={fetchAllPartitions} disabled={isLoadingPartition}>{isLoadingPartition ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "Mostrar todos"}</button>
						</div>
					</form>

					<div className="results-table">
						<div className="results-header">
							<div className="col name">Nombre</div>
							<div className="col percent">Precio</div>
							<div className="col actions">Acciones</div>
						</div>
						<div className="results-body">
							{isLoadingPartition ? (
								<div style={{ padding: 28, display: "flex", justifyContent: "center" }}><ReactLoading type="spin" color="#26b7cd" height={36} width={36} /></div>
							) : resultsPartition.length === 0 ? (
								<div className="no-results">Sin resultados</div>
							) : (
								resultsPartition.map((t, i) => {
									const itemKey = `${t.id ?? t.name ?? "p"}-${i}`;
									const deleteKey = t.id ?? t.name ?? itemKey;
									const isDeleting = !!deletingIdsPartition[deleteKey];
									return (
										<div key={itemKey} className="results-row">
											<div className="col name">{t.name}</div>
											<div className="col percent">{t.price}</div>
											<div className="col actions">
												<button className="btn update" onClick={() => handleSelectPartition(t)}>Actualizar</button>
												<button className="btn delete" onClick={() => handleDeletePartition(t)} disabled={isDeleting}>
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

				{/* Complementos - Railing */}
				<div style={{ marginTop: 28 }}>
					<div className="admin-materials-header"><h3>Complementos - Baranda</h3></div>

					<form className="search-form" onSubmit={handleSearchRailing}>
						<input type="text" placeholder="Buscar baranda..." value={queryRailing} onChange={(e) => setQueryRailing(e.target.value)} disabled={isLoadingRailing} />
						<div className="search-actions">
							<button type="submit" disabled={isLoadingRailing}>{isLoadingRailing ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "🔍"}</button>
							<button type="button" onClick={openCreateModalRailing} disabled={isLoadingRailing}>Cargar baranda</button>
							<button type="button" className="btn show-all" onClick={fetchAllRailings} disabled={isLoadingRailing}>{isLoadingRailing ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "Mostrar todos"}</button>
						</div>
					</form>

					<div className="results-table">
						<div className="results-header">
							<div className="col name">Nombre</div>
							<div className="col percent">Precio</div>
							<div className="col actions">Acciones</div>
						</div>
						<div className="results-body">
							{isLoadingRailing ? (
								<div style={{ padding: 28, display: "flex", justifyContent: "center" }}><ReactLoading type="spin" color="#26b7cd" height={36} width={36} /></div>
							) : resultsRailing.length === 0 ? (
								<div className="no-results">Sin resultados</div>
							) : (
								resultsRailing.map((t, i) => {
									const itemKey = `${t.id ?? t.name ?? "r"}-${i}`;
									const deleteKey = t.id ?? t.name ?? itemKey;
									const isDeleting = !!deletingIdsRailing[deleteKey];
									return (
										<div key={itemKey} className="results-row">
											<div className="col name">{t.name}</div>
											<div className="col percent">{t.price}</div>
											<div className="col actions">
												<button className="btn update" onClick={() => handleSelectRailing(t)}>Actualizar</button>
												<button className="btn delete" onClick={() => handleDeleteRailing(t)} disabled={isDeleting}>
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

				{/* Complementos - Glass Types */}
				<div style={{ marginTop: 28 }}>
					<div className="admin-materials-header"><h3>Tipos de Vidrio</h3></div>

					<form className="search-form" onSubmit={handleSearchGlass}>
						<input type="text" placeholder="Buscar tipo de vidrio..." value={queryGlass} onChange={(e) => setQueryGlass(e.target.value)} disabled={isLoadingGlass} />
						<div className="search-actions">
							<button type="submit" disabled={isLoadingGlass}>{isLoadingGlass ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "🔍"}</button>
							<button type="button" onClick={openCreateModalGlass} disabled={isLoadingGlass}>Cargar tipo</button>
							<button type="button" className="btn show-all" onClick={fetchAllGlass} disabled={isLoadingGlass}>{isLoadingGlass ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "Mostrar todos"}</button>
						</div>
					</form>

					<div className="results-table">
						<div className="results-header">
							<div className="col name">Nombre</div>
							<div className="col percent">Precio</div>
							<div className="col actions">Acciones</div>
						</div>
						<div className="results-body">
							{isLoadingGlass ? (
								<div style={{ padding: 28, display: "flex", justifyContent: "center" }}><ReactLoading type="spin" color="#26b7cd" height={36} width={36} /></div>
							) : resultsGlass.length === 0 ? (
								<div className="no-results">Sin resultados</div>
							) : (
								resultsGlass.map((t, i) => {
									const itemKey = `${t.id ?? t.name ?? "g"}-${i}`;
									const deleteKey = t.id ?? t.name ?? itemKey;
									const isDeleting = !!deletingIdsGlass[deleteKey];
									return (
										<div key={itemKey} className="results-row">
											<div className="col name">{t.name}</div>
											<div className="col percent">{t.price}</div>
											<div className="col actions">
												<button className="btn update" onClick={() => handleSelectGlass(t)}>Actualizar</button>
												<button className="btn delete" onClick={() => handleDeleteGlass(t)} disabled={isDeleting}>
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

				{/* Accesorios */}
				<div style={{ marginTop: 28 }}>
					<div className="admin-materials-header"><h3>Accesorios</h3></div>

					<form className="search-form" onSubmit={handleSearchAccessory}>
						<input type="text" placeholder="Buscar accesorio..." value={queryAccessory} onChange={(e) => setQueryAccessory(e.target.value)} disabled={isLoadingAccessory} />
						<div className="search-actions">
							<button type="submit" disabled={isLoadingAccessory}>{isLoadingAccessory ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "🔍"}</button>
							<button type="button" onClick={openCreateModalAccessory} disabled={isLoadingAccessory}>Cargar accesorio</button>
							<button type="button" className="btn show-all" onClick={fetchAllAccessories} disabled={isLoadingAccessory}>{isLoadingAccessory ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "Mostrar todos"}</button>
						</div>
					</form>

					<div className="results-table">
						<div className="results-header">
							<div className="col name">Nombre</div>
							<div className="col percent">Precio</div>
							<div className="col actions">Acciones</div>
						</div>
						<div className="results-body">
							{isLoadingAccessory ? (
								<div style={{ padding: 28, display: "flex", justifyContent: "center" }}><ReactLoading type="spin" color="#26b7cd" height={36} width={36} /></div>
							) : resultsAccessory.length === 0 ? (
								<div className="no-results">Sin resultados</div>
							) : (
								resultsAccessory.map((t, i) => {
									const itemKey = `${t.id ?? t.name ?? "a"}-${i}`;
									const deleteKey = t.id ?? t.name ?? itemKey;
									const isDeleting = !!deletingIdsAccessory[deleteKey];
									return (
										<div key={itemKey} className="results-row">
											<div className="col name">{t.name}</div>
											<div className="col percent">{t.price}</div>
											<div className="col actions">
												<button className="btn update" onClick={() => handleSelectAccessory(t)}>Actualizar</button>
												<button className="btn delete" onClick={() => handleDeleteAccessory(t)} disabled={isDeleting}>
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

				{/* Modal para Complementos Partition */}
				{showModalPartition && (
					<div className="modal-overlay" onClick={closeModalPartition}>
						<div className="modal" onClick={(e) => e.stopPropagation()}>
							<h3>{selectedPartition ? "Actualizar complemento - Partition" : "Crear complemento - Partition"}</h3>
							<div className="modal-form">
								<label>
									Nombre
									<input name="name" value={formPartition.name} onChange={handleChangePartition} />
								</label>
								<label>
									Precio
									<input name="price" type="number" value={formPartition.price} onChange={handleChangePartition} />
								</label>
								<div className="modal-actions">
									<button onClick={selectedPartition ? handleUpdateModalPartition : handleCreatePartition} className="btn primary" disabled={modalSubmittingPartition}>
										{modalSubmittingPartition ? <ReactLoading type="spin" color="#fff" height={14} width={14} /> : (selectedPartition ? "Actualizar" : "Crear")}
									</button>
									<button onClick={closeModalPartition} className="btn">Cancelar</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Modal para Complementos Railing */}
				{showModalRailing && (
					<div className="modal-overlay" onClick={closeModalRailing}>
						<div className="modal" onClick={(e) => e.stopPropagation()}>
							<h3>{selectedRailing ? "Actualizar complemento - Railing" : "Crear complemento - Railing"}</h3>
							<div className="modal-form">
								<label>
									Nombre
									<input name="name" value={formRailing.name} onChange={handleChangeRailing} />
								</label>
								<label>
									Precio
									<input name="price" type="number" value={formRailing.price} onChange={handleChangeRailing} />
								</label>
								<div className="modal-actions">
									<button onClick={selectedRailing ? handleUpdateModalRailing : handleCreateRailing} className="btn primary" disabled={modalSubmittingRailing}>
										{modalSubmittingRailing ? <ReactLoading type="spin" color="#fff" height={14} width={14} /> : (selectedRailing ? "Actualizar" : "Crear")}
									</button>
									<button onClick={closeModalRailing} className="btn">Cancelar</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Modal para Tipos de Vidrio */}
				{showModalGlass && (
					<div className="modal-overlay" onClick={closeModalGlass}>
						<div className="modal" onClick={(e) => e.stopPropagation()}>
							<h3>{selectedGlass ? "Actualizar tipo de vidrio" : "Crear tipo de vidrio"}</h3>
							<div className="modal-form">
								<label>
									Nombre
									<input name="name" value={formGlass.name} onChange={handleChangeGlass} />
								</label>
								<label>
									Precio
									<input name="price" type="number" value={formGlass.price} onChange={handleChangeGlass} />
								</label>
								<div className="modal-actions">
									<button onClick={selectedGlass ? handleUpdateModalGlass : handleCreateGlass} className="btn primary" disabled={modalSubmittingGlass}>
										{modalSubmittingGlass ? <ReactLoading type="spin" color="#fff" height={14} width={14} /> : (selectedGlass ? "Actualizar" : "Crear")}
									</button>
									<button onClick={closeModalGlass} className="btn">Cancelar</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Modal para Accesorios */}
				{showModalAccessory && (
					<div className="modal-overlay" onClick={closeModalAccessory}>
						<div className="modal" onClick={(e) => e.stopPropagation()}>
							<h3>{selectedAccessory ? "Actualizar accesorio" : "Crear accesorio"}</h3>
							<div className="modal-form">
								<label>
									Nombre
									<input name="name" value={formAccessory.name} onChange={handleChangeAccessory} />
								</label>
								<label>
									Precio
									<input name="price" type="number" value={formAccessory.price} onChange={handleChangeAccessory} />
								</label>
								<div className="modal-actions">
									<button onClick={selectedAccessory ? handleUpdateAccessory : handleCreateAccessory} className="btn primary" disabled={modalSubmittingAccessory}>
										{modalSubmittingAccessory ? <ReactLoading type="spin" color="#fff" height={14} width={14} /> : (selectedAccessory ? "Actualizar" : "Crear")}
									</button>
									<button onClick={closeModalAccessory} className="btn">Cancelar</button>
								</div>
							</div>
						</div>
					</div>
				)}

			</div>
			<Footer />
		</div>
	);
};

export default AdminMaterials;