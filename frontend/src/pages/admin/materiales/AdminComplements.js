import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import ReactLoading from "react-loading";
import { toast, ToastContainer } from "react-toastify";
import { safeArray } from "../../../utils/safeArray";
import Navigation from "../../../components/Navigation";
import Footer from "../../../components/Footer";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import ConfirmationModal from "../../../components/ConfirmationModal";
const API_URL = process.env.REACT_APP_API_URL || "";

// Función mejorada que maneja diferentes formatos de respuesta
const normalizeCreatedItem = (resp, formData = {}, source = "") => {
	// resp can be axios response or plain object/number
	const raw = resp?.data ?? resp;
	// unwrap common wrappers
	const unwrap = (d) => {
		if (!d) return d;
		if (typeof d === "object") {
			if (d.result) return d.result;
			if (d.data) return d.data;
			if (d.item) return d.item;
		}
		return d;
	};
	const payload = unwrap(raw);

	if (payload === undefined || payload === null) return null;

	// primitive id (number or numeric string)
	if (typeof payload === "number" || (typeof payload === "string" && /^[0-9]+$/.test(payload))) {
		return {
			id: Number(payload),
			name: formData.name ?? "",
			price: formData.price ?? 0,
			Material: formData.Material ?? undefined
		};
	}

	// object payload
	if (typeof payload === "object") {
		const idRaw = payload.id ?? payload._id ?? payload.Id ?? payload.ID ?? payload.partitionId ?? payload.railingId ?? payload.doorId;
		const id = (typeof idRaw === "string" && /^[0-9]+$/.test(idRaw)) ? Number(idRaw) : idRaw;
		return {
			id: id ?? undefined,
			name: payload.name ?? formData.name ?? "",
			price: payload.price ?? formData.price ?? 0,
			Material: payload.Material ?? formData.Material ?? undefined
		};
	}

	return null;
};

export default function AdminComplements() {
	// helper para decodificar payload JWT (base64url)
	const decodeJwtPayload = (token) => {
		try {
			const parts = token.split('.');
			if (parts.length < 2) return null;
			const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
			const json = decodeURIComponent(
				atob(payload)
					.split('')
					.map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
					.join('')
			);
			return JSON.parse(json);
		} catch (e) {
			return null;
		}
	};

	// --- HOOKS: siempre declarados primero (moved here to avoid conditional hooks) ---
	const navigate = useNavigate();
	// Door
	const [queryDoor, setQueryDoor] = useState("");
	const [resultsDoor, setResultsDoor] = useState([]);
	const [selectedDoor, setSelectedDoor] = useState(null);
	const [formDoor, setFormDoor] = useState({ name: "", price: 0, Material: "" });
	const [isLoadingDoor, setIsLoadingDoor] = useState(false);
	const [viewingAllDoor, setViewingAllDoor] = useState(false);
	const [deletingIdsDoor, setDeletingIdsDoor] = useState({});
	const [modalSubmittingDoor, setModalSubmittingDoor] = useState(false);
	const [showModalDoor, setShowModalDoor] = useState(false);

	// Partition
	const [queryPartition, setQueryPartition] = useState("");
	const [resultsPartition, setResultsPartition] = useState([]);
	const [selectedPartition, setSelectedPartition] = useState(null);
	const [formPartition, setFormPartition] = useState({ name: "", price: 0 });
	const [isLoadingPartition, setIsLoadingPartition] = useState(false);
	const [viewingAllPartition, setViewingAllPartition] = useState(false);
	const [deletingIdsPartition, setDeletingIdsPartition] = useState({});
	const [modalSubmittingPartition, setModalSubmittingPartition] = useState(false);
	const [showModalPartition, setShowModalPartition] = useState(false);

	// Railing
	const [queryRailing, setQueryRailing] = useState("");
	const [resultsRailing, setResultsRailing] = useState([]);
	const [selectedRailing, setSelectedRailing] = useState(null);
	const [formRailing, setFormRailing] = useState({ name: "", price: 0 });
	const [isLoadingRailing, setIsLoadingRailing] = useState(false);
	const [viewingAllRailing, setViewingAllRailing] = useState(false);
	const [deletingIdsRailing, setDeletingIdsRailing] = useState({});
	const [modalSubmittingRailing, setModalSubmittingRailing] = useState(false);
	const [showModalRailing, setShowModalRailing] = useState(false);

	// Modals / delete confirmation
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [pendingDeleteSource, setPendingDeleteSource] = useState(null);
	const [pendingDeleteItem, setPendingDeleteItem] = useState(null);

	// --- comprobación SÍNCRONA después de declarar hooks para evitar el flash y errores de Rules of Hooks ---
	const _token = localStorage.getItem("token");
	if (!_token) return <Navigate to="/" replace />;
	const _payload = decodeJwtPayload(_token);
	if (!_payload) return <Navigate to="/" replace />;
	let _role = _payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || _payload["role"] || _payload["role_name"] || _payload["roles"] || _payload["userRole"] || _payload["roleName"] || "";
	if (typeof _role === "object") _role = _role.role_name || _role.name || "";
	_role = String(_role || "").toLowerCase();
	if (_role !== "coordinator" && _role !== "manager") return <Navigate to="/" replace />;

    const normalizeItems = (items) => { 
        if (!items || !Array.isArray(items)) return []; 
        return items.map(it => { 
            if (!it) return it; 
            // Buscar ID en diferentes formatos
            if (it.id === undefined) {
                if (it._id) it.id = it._id;
                else if (it.Id) it.id = it.Id;
                else if (it.ID) it.id = it.ID;
                else if (it.partitionId) it.id = it.partitionId;
                else if (it.doorId) it.id = it.doorId;
                else if (it.railingId) it.id = it.railingId;
            }
            if (typeof it.id === "string" && /^[0-9]+$/.test(it.id)) it.id = Number(it.id); 
            return it; 
        }); 
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    }

    const openDeleteModal = (source, item) => {
        const itemId = getItemId(item);
        if (!itemId) {
            toast.error("No se puede eliminar: elemento sin ID válido");
            console.error("Item sin ID:", item);
            return;
        }
        setPendingDeleteSource(source);
        setPendingDeleteItem(item);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setPendingDeleteSource(null);
        setPendingDeleteItem(null);
    };

    const confirmDelete = async () => {
        if (!pendingDeleteSource || !pendingDeleteItem) return;
        
        const itemId = getItemId(pendingDeleteItem);
        if (!itemId) {
            toast.error("Error: No se puede eliminar sin un ID válido");
            closeDeleteModal();
            return;
        }
        
        closeDeleteModal();
        if (pendingDeleteSource === "door") {
            await handleDeleteDoor(pendingDeleteItem);
        } else if (pendingDeleteSource === "partition") {
            await handleDeletePartition(pendingDeleteItem);
        } else if (pendingDeleteSource === "railing") {
            await handleDeleteRailing(pendingDeleteItem);
        }
    };

    // Función auxiliar para obtener ID de cualquier item
    const getItemId = (item) => {
        return item?.id || item?.Id || item?._id || item?.ID;
    };

    // Door functions - MEJORADAS
    const fetchDoorResults = async (searchQuery = "") => {
        setIsLoadingDoor(true);
        const token = localStorage.getItem("token");
        if (!token) { setIsLoadingDoor(false); setResultsDoor([]); return []; }
        try {
            const url = `${API_URL}/api/door/search?name=${encodeURIComponent(searchQuery)}`;
            const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = safeArray(resp.data);
            setResultsDoor(normalizeItems(data));
            return data;
        } catch (err) { console.error("Error fetching Door:", err); setResultsDoor([]); return []; } finally { setIsLoadingDoor(false); }
    };
    
    const fetchAllDoors = async () => {
        setIsLoadingDoor(true);
        const token = localStorage.getItem("token");
        if (!token) { setIsLoadingDoor(false); setResultsDoor([]); return []; }
        try {
            const url = `${API_URL}/api/door`;
            const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = safeArray(resp.data);
            setViewingAllDoor(true);
            setResultsDoor(normalizeItems(data));
            return data;
        } catch (err) { console.error("[fetchAllDoors] Error:", err); setResultsDoor([]); return []; } finally { setIsLoadingDoor(false); }
    };
    
    const handleSearchDoor = async (e) => { e?.preventDefault(); setViewingAllDoor(false); await fetchDoorResults(queryDoor); };
    
    const openCreateModalDoor = () => { setSelectedDoor(null); setFormDoor({ name: "", price: 0, Material: "" }); setShowModalDoor(true); };
    
    const closeModalDoor = () => setShowModalDoor(false);

    const handleCreateDoor = async () => {
        setModalSubmittingDoor(true);
        try {
            const token = localStorage.getItem("token");
            const resp = await axios.post(`${API_URL}/api/door`, formDoor, { headers: { Authorization: `Bearer ${token}` } });

            const created = normalizeCreatedItem(resp, formDoor, "door");

            toast.success("Complemento puerta creado correctamente.");
            if (created && created.id !== undefined) {
                if (viewingAllDoor) {
                    setResultsDoor(prev => { const next = [...(prev || []), created]; next.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))); return next; });
                } else {
                    await fetchDoorResults(queryDoor);
                }
            } else {
                // fallback: refresh from server to obtain authoritative item with id
                if (viewingAllDoor) await fetchAllDoors();
                else await fetchDoorResults(queryDoor);
            }
            setShowModalDoor(false);
        } catch (err) { console.error(err); toast.error("Error al crear complemento de puerta."); } finally { setModalSubmittingDoor(false); }
    };
    
    const handleUpdateDoor = async () => {
        if (!selectedDoor) return;
        
        const doorId = getItemId(selectedDoor);
        if (!doorId) {
            toast.error("Error: No se puede actualizar sin un ID válido");
            return;
        }
        
        setModalSubmittingDoor(true);
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_URL}/api/door/${doorId}`, { 
                name: formDoor.name, 
                price: formDoor.price, 
                Material: formDoor.Material 
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            setResultsDoor(prev => (prev || []).map(r => 
                (getItemId(r) === doorId ? { ...r, name: formDoor.name, price: formDoor.price, Material: formDoor.Material } : r)
            ));
            toast.success("Complemento puerta actualizado correctamente.");
            setShowModalDoor(false);
        } catch (err) { 
            console.error("Error updating door:", err); 
            toast.error("Error al actualizar complemento de puerta."); 
        } finally { 
            setModalSubmittingDoor(false); 
        }
    };
    
    const handleDeleteDoor = async (t) => {
        const itemId = getItemId(t);
        if (!itemId) {
            toast.error("Error: No se puede eliminar sin un ID válido");
            return;
        }
        
        const key = itemId;
        setDeletingIdsDoor(prev => ({ ...prev, [key]: true }));
        try {
            const token = localStorage.getItem("token");
            console.log("Eliminando door con ID:", itemId);
            await axios.delete(`${API_URL}/api/door/${itemId}`, { headers: { Authorization: `Bearer ${token}` } });
            
            if (viewingAllDoor) {
                setResultsDoor(prev => (prev || []).filter(r => getItemId(r) !== itemId));
            } else {
                await fetchDoorResults(queryDoor);
            }
            toast.success("Complemento puerta eliminado correctamente.");
        } catch (err) { 
            console.error("Error deleting door:", err); 
            if (err.response?.status === 400) {
                toast.error("Error: ID no válido. Recargue la página.");
            } else {
                toast.error("Error al eliminar complemento de puerta.");
            }
        } finally { 
            setDeletingIdsDoor(prev => ({ ...prev, [key]: false })); 
        }
    };

    const handleChangeDoor = (e) => {
        const { name, value } = e.target;
        setFormDoor(f => ({ ...f, [name]: name === "price" ? Number(value) : value }));
    };

    // Partition functions - MEJORADAS
    const fetchPartitionResults = async (searchQuery = "") => {
        setIsLoadingPartition(true);
        const token = localStorage.getItem("token");
        if (!token) { setIsLoadingPartition(false); setResultsPartition([]); return []; }
        try {
            const url = `${API_URL}/api/partition/search?name=${encodeURIComponent(searchQuery)}`;
            const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = safeArray(resp.data);
            setResultsPartition(normalizeItems(data));
            return data;
        } catch (err) { console.error("Error fetching Partition:", err); setResultsPartition([]); return []; } finally { setIsLoadingPartition(false); }
    };
    
    const fetchAllPartitions = async () => {
        setIsLoadingPartition(true);
        const token = localStorage.getItem("token");
        if (!token) { setIsLoadingPartition(false); setResultsPartition([]); return []; }
        try {
            const url = `${API_URL}/api/partition`;
            const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = safeArray(resp.data);
            setViewingAllPartition(true);
            setResultsPartition(normalizeItems(data));
            return data;
        } catch (err) { console.error("[fetchAllPartitions] Error:", err); setResultsPartition([]); return []; } finally { setIsLoadingPartition(false); }
    };
    
    const handleSearchPartition = async (e) => { e?.preventDefault(); setViewingAllPartition(false); await fetchPartitionResults(queryPartition); };
    
    const openCreateModalPartition = () => { setSelectedPartition(null); setFormPartition({ name: "", price: 0 }); setShowModalPartition(true); };
    
    const closeModalPartition = () => setShowModalPartition(false);

    const handleCreatePartition = async () => {
        setModalSubmittingPartition(true);
        try {
            const token = localStorage.getItem("token");
            const resp = await axios.post(`${API_URL}/api/partition`, formPartition, { headers: { Authorization: `Bearer ${token}` } });

            const created = normalizeCreatedItem(resp, formPartition, "partition");

            toast.success("Partición creada correctamente.");
            if (created && created.id !== undefined) {
                if (viewingAllPartition) {
                    setResultsPartition(prev => { const next = [...(prev || []), created]; next.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))); return next; });
                } else {
                    await fetchPartitionResults(queryPartition);
                }
            } else {
                // fallback: refresh from server so item shows with id (no error to user)
                if (viewingAllPartition) await fetchAllPartitions();
                else await fetchPartitionResults(queryPartition);
            }
            setShowModalPartition(false);
        } catch (err) { console.error(err); toast.error("Error al crear partición."); } finally { setModalSubmittingPartition(false); }
    };
    
    const handleUpdatePartition = async () => {
        if (!selectedPartition) return;
        
        const partitionId = getItemId(selectedPartition);
        if (!partitionId) {
            toast.error("Error: No se puede actualizar sin un ID válido");
            return;
        }
        
        setModalSubmittingPartition(true);
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_URL}/api/partition/${partitionId}`, { 
                name: formPartition.name, 
                price: formPartition.price 
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            setResultsPartition(prev => (prev || []).map(r => 
                (getItemId(r) === partitionId ? { ...r, name: formPartition.name, price: formPartition.price } : r)
            ));
            toast.success("Partición actualizada correctamente.");
            setShowModalPartition(false);
        } catch (err) { 
            console.error("Error updating partition:", err); 
            toast.error("Error al actualizar partición."); 
        } finally { 
            setModalSubmittingPartition(false); 
        }
    };
    
    const handleDeletePartition = async (t) => {
        const itemId = getItemId(t);
        if (!itemId) {
            toast.error("Error: No se puede eliminar sin un ID válido");
            return;
        }
        
        const key = itemId;
        setDeletingIdsPartition(prev => ({ ...prev, [key]: true }));
        try {
            const token = localStorage.getItem("token");
            console.log("Eliminando partition con ID:", itemId);
            await axios.delete(`${API_URL}/api/partition/${itemId}`, { headers: { Authorization: `Bearer ${token}` } });
            
            if (viewingAllPartition) {
                setResultsPartition(prev => (prev || []).filter(r => getItemId(r) !== itemId));
            } else {
                await fetchPartitionResults(queryPartition);
            }
            toast.success("Partición eliminada correctamente.");
        } catch (err) { 
            console.error("Error deleting partition:", err); 
            if (err.response?.status === 400) {
                toast.error("Error: ID no válido. Recargue la página.");
            } else {
                toast.error("Error al eliminar partición.");
            }
        } finally { 
            setDeletingIdsPartition(prev => ({ ...prev, [key]: false })); 
        }
    };

    const handleChangePartition = (e) => {
        const { name, value } = e.target;
        setFormPartition(f => ({ ...f, [name]: name === "price" ? Number(value) : value }));
    };

    // Railing functions - MEJORADAS
    const fetchRailingResults = async (searchQuery = "") => {
        setIsLoadingRailing(true);
        const token = localStorage.getItem("token");
        if (!token) { setIsLoadingRailing(false); setResultsRailing([]); return []; }
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
        if (!token) { setIsLoadingRailing(false); setResultsRailing([]); return []; }
        try {
            const url = `${API_URL}/api/railing`;
            const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = safeArray(resp.data);
            setViewingAllRailing(true);
            setResultsRailing(normalizeItems(data));
            return data;
        } catch (err) { console.error("[fetchAllRailings] Error:", err); setResultsRailing([]); return []; } finally { setIsLoadingRailing(false); }
    };
    
    const handleSearchRailing = async (e) => { e?.preventDefault(); setViewingAllRailing(false); await fetchRailingResults(queryRailing); };
    
    const openCreateModalRailing = () => { setSelectedRailing(null); setFormRailing({ name: "", price: 0 }); setShowModalRailing(true); };
    
    const closeModalRailing = () => setShowModalRailing(false);

    const handleCreateRailing = async () => {
        setModalSubmittingRailing(true);
        try {
            const token = localStorage.getItem("token");
            const resp = await axios.post(`${API_URL}/api/railing`, formRailing, { headers: { Authorization: `Bearer ${token}` } });

            const created = normalizeCreatedItem(resp, formRailing, "railing");

            toast.success("Baranda creada correctamente.");
            if (created && created.id !== undefined) {
                if (viewingAllRailing) {
                    setResultsRailing(prev => { const next = [...(prev || []), created]; next.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))); return next; });
                } else {
                    await fetchRailingResults(queryRailing);
                }
            } else {
                // fallback: refresh from server so item shows with id (no error to user)
                if (viewingAllRailing) await fetchAllRailings();
                else await fetchRailingResults(queryRailing);
            }
            setShowModalRailing(false);
        } catch (err) { console.error(err); toast.error("Error al crear baranda."); } finally { setModalSubmittingRailing(false); }
    };
    
    const handleUpdateRailing = async () => {
        if (!selectedRailing) return;
        
        const railingId = getItemId(selectedRailing);
        if (!railingId) {
            toast.error("Error: No se puede actualizar sin un ID válido");
            return;
        }
        
        setModalSubmittingRailing(true);
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_URL}/api/railing/${railingId}`, { 
                name: formRailing.name, 
                price: formRailing.price 
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            setResultsRailing(prev => (prev || []).map(r => 
                (getItemId(r) === railingId ? { ...r, name: formRailing.name, price: formRailing.price } : r)
            ));
            toast.success("Baranda actualizada correctamente.");
            setShowModalRailing(false);
        } catch (err) { 
            console.error("Error updating railing:", err); 
            toast.error("Error al actualizar baranda."); 
        } finally { 
            setModalSubmittingRailing(false); 
        }
    };
    
    const handleDeleteRailing = async (t) => {
        const itemId = getItemId(t);
        if (!itemId) {
            toast.error("Error: No se puede eliminar sin un ID válido");
            return;
        }
        
        const key = itemId;
        setDeletingIdsRailing(prev => ({ ...prev, [key]: true }));
        try {
            const token = localStorage.getItem("token");
            console.log("Eliminando railing con ID:", itemId);
            await axios.delete(`${API_URL}/api/railing/${itemId}`, { headers: { Authorization: `Bearer ${token}` } });
            
            if (viewingAllRailing) {
                setResultsRailing(prev => (prev || []).filter(r => getItemId(r) !== itemId));
            } else {
                await fetchRailingResults(queryRailing);
            }
            toast.success("Baranda eliminada correctamente.");
        } catch (err) { 
            console.error("Error deleting railing:", err); 
            if (err.response?.status === 400) {
                toast.error("Error: ID no válido. Recargue la página.");
            } else {
                toast.error("Error al eliminar baranda.");
            }
        } finally { 
            setDeletingIdsRailing(prev => ({ ...prev, [key]: false })); 
        }
    };

    const handleChangeRailing = (e) => {
        const { name, value } = e.target;
        setFormRailing(f => ({ ...f, [name]: name === "price" ? Number(value) : value }));
    };

    // El JSX permanece igual...
    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            <ToastContainer autoClose={4000} theme="dark" position="bottom-right" />
            <div className="admin-materials-content">
                <div style={{ marginTop: 8 }}>
                    <div style={{ marginTop: 2 }}>
                        <Link to="/gestion/materiales" className="btn update" style={{ display: "inline-block" }}>← Volver</Link>
                    </div>
                    <div className="admin-materials-header">
                        <h3 className="materials-title">Complementos - Puerta</h3>
                    </div>
                    <form className="search-form" onSubmit={handleSearchDoor}>
                        <input type="text" placeholder="Buscar complemento..." value={queryDoor} onChange={(e) => setQueryDoor(e.target.value)} disabled={isLoadingDoor} />
                        <div className="search-actions">
                            <button type="submit" disabled={isLoadingDoor}>{isLoadingDoor ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "🔍"}</button>
                            <button type="button" onClick={() => { openCreateModalDoor(); }} disabled={isLoadingDoor}>Cargar Puerta</button>
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
                            {isLoadingDoor ? <div style={{ padding: 28, display: "flex", justifyContent: "center" }}><ReactLoading type="spin" color="#26b7cd" height={36} width={36} /></div>
                                : resultsDoor.length === 0 ? <div className="no-results">Sin resultados</div>
                                    : resultsDoor.map((t, i) => {
                                        const itemId = t.id || t._id;
                                        const itemKey = `${itemId ?? t.name ?? "d"}-${i}`;
                                        const deleteKey = itemId ?? t.name ?? itemKey;
                                        const isDeleting = !!deletingIdsDoor[deleteKey];
                                        return (
                                            <div key={itemKey} className="results-row">
                                                <div className="col name">{t.name}</div>
                                                <div className="col percent">{t.price}</div>
                                                <div className="col percent">{t.Material}</div>
                                                <div className="col actions">
                                                    <button className="btn update" onClick={() => { setSelectedDoor(t); setFormDoor({ name: t.name || "", price: t.price || 0, Material: t.Material || "" }); setShowModalDoor(true); }}>Actualizar</button>
                                                    <button className="btn delete" onClick={() => openDeleteModal("door", t)} disabled={isDeleting}>{isDeleting ? <ReactLoading type="spin" color="#fcd1d1" height={14} width={14} /> : "Eliminar"}</button>
                                                </div>
                                            </div>
                                        );
                                    })
                            }
                        </div>
                    </div>
                </div>

                {/* Partition */}
                <div style={{ marginTop: 28 }}>
                    <div className="admin-materials-header">
                        <h3 className="materials-title">Complementos - Tabique</h3>
                    </div>
                    <form className="search-form" onSubmit={handleSearchPartition}>
                        <input type="text" placeholder="Buscar tabique..." value={queryPartition} onChange={(e) => setQueryPartition(e.target.value)} disabled={isLoadingPartition} />
                        <div className="search-actions">
                            <button type="submit" disabled={isLoadingPartition}>{isLoadingPartition ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "🔍"}</button>
                            <button type="button" onClick={() => openCreateModalPartition()} disabled={isLoadingPartition}>Cargar Tabique</button>
                            <button type="button" className="btn show-all" onClick={fetchAllPartitions} disabled={isLoadingPartition}>{isLoadingPartition ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "Mostrar todos"}</button>
                        </div>
                    </form>
                    <div className="results-table">
                        <div className="results-header"><div className="col name">Nombre</div><div className="col percent">Precio</div><div className="col actions">Acciones</div></div>
                        <div className="results-body">
                            {isLoadingPartition ? <div style={{ padding: 28, display: "flex", justifyContent: "center" }}><ReactLoading type="spin" color="#26b7cd" height={36} width={36} /></div>
                                : resultsPartition.length === 0 ? <div className="no-results">Sin resultados</div>
                                    : resultsPartition.map((t, i) => {
                                        const itemId = t.id || t._id;
                                        const itemKey = `${itemId ?? t.name ?? "p"}-${i}`;
                                        const deleteKey = itemId ?? t.name ?? itemKey;
                                        const isDeleting = !!deletingIdsPartition[deleteKey];
                                        return (
                                            <div key={itemKey} className="results-row">
                                                <div className="col name">{t.name}</div>
                                                <div className="col percent">{t.price}</div>
                                                <div className="col actions">
                                                    <button className="btn update" onClick={() => { setSelectedPartition(t); setFormPartition({ name: t.name || "", price: t.price || 0 }); setShowModalPartition(true); }}>Actualizar</button>
                                                    <button className="btn delete" onClick={() => openDeleteModal("partition", t)} disabled={isDeleting}>{isDeleting ? <ReactLoading type="spin" color="#fcd1d1" height={14} width={14} /> : "Eliminar"}</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                        </div>
                    </div>
                </div>

                {/* Railing */}
                <div style={{ marginTop: 28 }}>
                    <div className="admin-materials-header">
                        <h3 className="materials-title">Complementos - Baranda</h3>
                    </div>
                    <form className="search-form" onSubmit={handleSearchRailing}>
                        <input type="text" placeholder="Buscar baranda..." value={queryRailing} onChange={(e) => setQueryRailing(e.target.value)} disabled={isLoadingRailing} />
                        <div className="search-actions">
                            <button type="submit" disabled={isLoadingRailing}>{isLoadingRailing ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "🔍"}</button>
                            <button type="button" onClick={() => openCreateModalRailing()} disabled={isLoadingRailing}>Cargar Baranda</button>
                            <button type="button" className="btn show-all" onClick={fetchAllRailings} disabled={isLoadingRailing}>{isLoadingRailing ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "Mostrar todos"}</button>
                        </div>
                    </form>
                    <div className="results-table">
                        <div className="results-header"><div className="col name">Nombre</div><div className="col percent">Precio</div><div className="col actions">Acciones</div></div>
                        <div className="results-body">
                            {isLoadingRailing ? <div style={{ padding: 28, display: "flex", justifyContent: "center" }}><ReactLoading type="spin" color="#26b7cd" height={36} width={36} /></div>
                                : resultsRailing.length === 0 ? <div className="no-results">Sin resultados</div>
                                    : resultsRailing.map((t, i) => {
                                        const itemId = t.id || t._id;
                                        const itemKey = `${itemId ?? t.name ?? "r"}-${i}`;
                                        const deleteKey = itemId ?? t.name ?? itemKey;
                                        const isDeleting = !!deletingIdsRailing[deleteKey];
                                        return (
                                            <div key={itemKey} className="results-row">
                                                <div className="col name">{t.name}</div>
                                                <div className="col percent">{t.price}</div>
                                                <div className="col actions">
                                                    <button className="btn update" onClick={() => { setSelectedRailing(t); setFormRailing({ name: t.name || "", price: t.price || 0 }); setShowModalRailing(true); }}>Actualizar</button>
                                                    <button className="btn delete" onClick={() => openDeleteModal("railing", t)} disabled={isDeleting}>{isDeleting ? <ReactLoading type="spin" color="#fcd1d1" height={14} width={14} /> : "Eliminar"}</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
            
            {/* Modales: Door */}
            {showModalDoor && (
                <div className="modal-overlay" onClick={closeModalDoor}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{selectedDoor ? "Actualizar complemento - Puerta" : "Crear complemento - Puerta"}</h3>
                        <div className="modal-form">
                            <label>Nombre<input name="name" value={formDoor.name} onChange={handleChangeDoor} /></label>
                            <label>Precio<input name="price" type="number" value={formDoor.price} onChange={handleChangeDoor} /></label>
                            <label>Material<input name="Material" value={formDoor.Material} onChange={handleChangeDoor} /></label>
                            <div className="modal-actions">
                                <button onClick={selectedDoor ? handleUpdateDoor : handleCreateDoor} className="btn primary" disabled={modalSubmittingDoor}>{modalSubmittingDoor ? <ReactLoading type="spin" color="#fff" height={14} width={14} /> : (selectedDoor ? "Actualizar" : "Crear")}</button>
                                <button onClick={closeModalDoor} className="btn">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modales: Partition */}
            {showModalPartition && (
                <div className="modal-overlay" onClick={closeModalPartition}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{selectedPartition ? "Actualizar Tabique" : "Crear Tabique"}</h3>
                        <div className="modal-form">
                            <label>Nombre<input name="name" value={formPartition.name} onChange={handleChangePartition} /></label>
                            <label>Precio<input name="price" type="number" value={formPartition.price} onChange={handleChangePartition} /></label>
                            <div className="modal-actions">
                                <button onClick={selectedPartition ? handleUpdatePartition : handleCreatePartition} className="btn primary" disabled={modalSubmittingPartition}>{modalSubmittingPartition ? <ReactLoading type="spin" color="#fff" height={14} width={14} /> : (selectedPartition ? "Actualizar" : "Crear")}</button>
                                <button onClick={closeModalPartition} className="btn">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modales: Railing */}
            {showModalRailing && (
                <div className="modal-overlay" onClick={closeModalRailing}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{selectedRailing ? "Actualizar baranda" : "Crear baranda"}</h3>
                        <div className="modal-form">
                            <label>Nombre<input name="name" value={formRailing.name} onChange={handleChangeRailing} /></label>
                            <label>Precio<input name="price" type="number" value={formRailing.price} onChange={handleChangeRailing} /></label>
                            <div className="modal-actions">
                                <button onClick={selectedRailing ? handleUpdateRailing : handleCreateRailing} className="btn primary" disabled={modalSubmittingRailing}>{modalSubmittingRailing ? <ReactLoading type="spin" color="#fff" height={14} width={14} /> : (selectedRailing ? "Actualizar" : "Crear")}</button>
                                <button onClick={closeModalRailing} className="btn">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmationModal show={showDeleteModal} onClose={closeDeleteModal} onConfirm={confirmDelete} />
        </div>
    );
}