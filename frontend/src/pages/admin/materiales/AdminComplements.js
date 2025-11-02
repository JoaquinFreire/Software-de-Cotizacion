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
const API_URL = process.env.REACT_APP_API_URL || "";

export default function AdminComplements() {
    // Door
    const [queryDoor, setQueryDoor] = useState("");
    const [resultsDoor, setResultsDoor] = useState([]);
    const [selectedDoor, setSelectedDoor] = useState(null);
    const [formDoor, setFormDoor] = useState({ name: "", price: 0, Material: "" });
    const [isLoadingDoor, setIsLoadingDoor] = useState(false);
    const [viewingAllDoor, setViewingAllDoor] = useState(false);
    const [deletingIdsDoor, setDeletingIdsDoor] = useState({});
    const [modalSubmittingDoor, setModalSubmittingDoor] = useState(false);
    // modal visibility for Door
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
    // modal visibility for Partition
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
    // modal visibility for Railing
    const [showModalRailing, setShowModalRailing] = useState(false);

    const normalizeItems = (items) => { if (!items || !Array.isArray(items)) return []; return items.map(it => { if (!it) return it; if (it.id === undefined && it._id) it.id = it._id; if (typeof it.id === "string" && /^[0-9]+$/.test(it.id)) it.id = Number(it.id); return it; }); };

    const navigate = useNavigate();
	const handleLogout = () => {
			localStorage.removeItem("token");
			navigate("/");
	}
    // Door functions
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
            toast.success("Complemento puerta creado correctamente.");
            const createdId = resp?.data?.result ?? resp?.data?.id ?? null;
            const newItem = { id: createdId ?? undefined, name: formDoor.name, price: formDoor.price, Material: formDoor.Material };
            if (viewingAllDoor) setResultsDoor(prev => { const next = [...(prev || []), newItem]; next.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))); return next; });
            else await fetchDoorResults(queryDoor);
            // close modal after success
            setShowModalDoor(false);
        } catch (err) { console.error(err); toast.error("Error al crear complemento de puerta."); } finally { setModalSubmittingDoor(false); }
    };
    const handleUpdateDoor = async () => {
        if (!selectedDoor) return;
        setModalSubmittingDoor(true);
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_URL}/api/door/${selectedDoor.id}`, { name: formDoor.name, price: formDoor.price, Material: formDoor.Material }, { headers: { Authorization: `Bearer ${token}` } });
            setResultsDoor(prev => (prev || []).map(r => ((r.id ?? r.name) === (selectedDoor.id ?? selectedDoor.name) ? { ...r, name: formDoor.name, price: formDoor.price, Material: formDoor.Material } : r)));
            toast.success("Complemento puerta actualizado correctamente.");
            // close modal after success
            setShowModalDoor(false);
        } catch (err) { console.error(err); toast.error("Error al actualizar complemento de puerta."); } finally { setModalSubmittingDoor(false); }
    };
    const handleDeleteDoor = async (t) => {
        const key = t.id ?? t.name ?? Math.random().toString(36).slice(2);
        setDeletingIdsDoor(prev => ({ ...prev, [key]: true }));
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/api/door/${t.id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (viewingAllDoor) setResultsDoor(prev => (prev || []).filter(r => (r.id ?? r.name) !== (t.id ?? t.name)));
            else await fetchDoorResults(queryDoor);
            toast.success("Complemento puerta eliminado correctamente.");
        } catch (err) { console.error(err); toast.error("Error al eliminar complemento de puerta."); } finally { setDeletingIdsDoor(prev => ({ ...prev, [key]: false })); }
    };

    // handle input change for door
    const handleChangeDoor = (e) => {
        const { name, value } = e.target;
        setFormDoor(f => ({ ...f, [name]: name === "price" ? Number(value) : value }));
    };

    // Partition functions
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
            toast.success("Partición creada correctamente.");
            const createdId = resp?.data?.result ?? resp?.data?.id ?? null;
            const newItem = { id: createdId ?? undefined, name: formPartition.name, price: formPartition.price };
            if (viewingAllPartition) setResultsPartition(prev => { const next = [...(prev || []), newItem]; next.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))); return next; });
            else await fetchPartitionResults(queryPartition);
            setShowModalPartition(false);
        } catch (err) { console.error(err); toast.error("Error al crear partición."); } finally { setModalSubmittingPartition(false); }
    };
    const handleUpdatePartition = async () => {
        if (!selectedPartition) return;
        setModalSubmittingPartition(true);
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_URL}/api/partition/${selectedPartition.id}`, { name: formPartition.name, price: formPartition.price }, { headers: { Authorization: `Bearer ${token}` } });
            setResultsPartition(prev => (prev || []).map(r => ((r.id ?? r.name) === (selectedPartition.id ?? selectedPartition.name) ? { ...r, name: formPartition.name, price: formPartition.price } : r)));
            toast.success("Partición actualizada correctamente.");
            setShowModalPartition(false);
        } catch (err) { console.error(err); toast.error("Error al actualizar partición."); } finally { setModalSubmittingPartition(false); }
    };
    const handleDeletePartition = async (t) => {
        const key = t.id ?? t.name ?? Math.random().toString(36).slice(2);
        setDeletingIdsPartition(prev => ({ ...prev, [key]: true }));
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/api/partition/${t.id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (viewingAllPartition) setResultsPartition(prev => (prev || []).filter(r => (r.id ?? r.name) !== (t.id ?? t.name)));
            else await fetchPartitionResults(queryPartition);
            toast.success("Partición eliminada correctamente.");
        } catch (err) { console.error(err); toast.error("Error al eliminar partición."); } finally { setDeletingIdsPartition(prev => ({ ...prev, [key]: false })); }
    };

    // handle input change for partition
    const handleChangePartition = (e) => {
        const { name, value } = e.target;
        setFormPartition(f => ({ ...f, [name]: name === "price" ? Number(value) : value }));
    };

    // Railing functions
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
            toast.success("Baranda creada correctamente.");
            const createdId = resp?.data?.result ?? resp?.data?.id ?? null;
            const newItem = { id: createdId ?? undefined, name: formRailing.name, price: formRailing.price };
            if (viewingAllRailing) setResultsRailing(prev => { const next = [...(prev || []), newItem]; next.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))); return next; });
            else await fetchRailingResults(queryRailing);
            setShowModalRailing(false);
        } catch (err) { console.error(err); toast.error("Error al crear baranda."); } finally { setModalSubmittingRailing(false); }
    };
    const handleUpdateRailing = async () => {
        if (!selectedRailing) return;
        setModalSubmittingRailing(true);
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_URL}/api/railing/${selectedRailing.id}`, { name: formRailing.name, price: formRailing.price }, { headers: { Authorization: `Bearer ${token}` } });
            setResultsRailing(prev => (prev || []).map(r => ((r.id ?? r.name) === (selectedRailing.id ?? selectedRailing.name) ? { ...r, name: formRailing.name, price: formRailing.price } : r)));
            toast.success("Baranda actualizada correctamente.");
            setShowModalRailing(false);
        } catch (err) { console.error(err); toast.error("Error al actualizar baranda."); } finally { setModalSubmittingRailing(false); }
    };
    const handleDeleteRailing = async (t) => {
        const key = t.id ?? t.name ?? Math.random().toString(36).slice(2);
        setDeletingIdsRailing(prev => ({ ...prev, [key]: true }));
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/api/railing/${t.id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (viewingAllRailing) setResultsRailing(prev => (prev || []).filter(r => (r.id ?? r.name) !== (t.id ?? t.name)));
            else await fetchRailingResults(queryRailing);
            toast.success("Baranda eliminada correctamente.");
        } catch (err) { console.error(err); toast.error("Error al eliminar baranda."); } finally { setDeletingIdsRailing(prev => ({ ...prev, [key]: false })); }
    };

    // handle input change for railing
    const handleChangeRailing = (e) => {
        const { name, value } = e.target;
        setFormRailing(f => ({ ...f, [name]: name === "price" ? Number(value) : value }));
    };

    // The UI renders three small sections similar to the original AdminMaterials layout
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
                        <h3  className="materials-title">Complementos - Puerta</h3></div>
                    <form className="search-form" onSubmit={handleSearchDoor}>
                        <input type="text" placeholder="Buscar complemento..." value={queryDoor} onChange={(e) => setQueryDoor(e.target.value)} disabled={isLoadingDoor} />
                        <div className="search-actions">
                            <button type="submit" disabled={isLoadingDoor}>{isLoadingDoor ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "🔍"}</button>
                            <button type="button" onClick={() => { openCreateModalDoor(); }} disabled={isLoadingDoor}>Cargar complemento</button>
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
                                        const itemKey = `${t.id ?? t.name ?? "d"}-${i}`;
                                        const deleteKey = t.id ?? t.name ?? itemKey;
                                        const isDeleting = !!deletingIdsDoor[deleteKey];
                                        return (
                                            <div key={itemKey} className="results-row">
                                                <div className="col name">{t.name}</div>
                                                <div className="col percent">{t.price}</div>
                                                <div className="col percent">{t.Material}</div>
                                                <div className="col actions">
                                                    <button className="btn update" onClick={() => { setSelectedDoor(t); setFormDoor({ name: t.name || "", price: t.price || 0, Material: t.Material || "" }); setShowModalDoor(true); }}>Actualizar</button>
                                                    <button className="btn delete" onClick={() => handleDeleteDoor(t)} disabled={isDeleting}>{isDeleting ? <ReactLoading type="spin" color="#fcd1d1" height={14} width={14} /> : "Eliminar"}</button>
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
                        <h3  className="materials-title">Complementos - Tabique</h3></div>
                    <form className="search-form" onSubmit={handleSearchPartition}>
                        <input type="text" placeholder="Buscar tabique..." value={queryPartition} onChange={(e) => setQueryPartition(e.target.value)} disabled={isLoadingPartition} />
                        <div className="search-actions">
                            <button type="submit" disabled={isLoadingPartition}>{isLoadingPartition ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "🔍"}</button>
                            <button type="button" onClick={() => openCreateModalPartition()} disabled={isLoadingPartition}>Cargar partición</button>
                            <button type="button" className="btn show-all" onClick={fetchAllPartitions} disabled={isLoadingPartition}>{isLoadingPartition ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "Mostrar todos"}</button>
                        </div>
                    </form>
                    <div className="results-table">
                        <div className="results-header"><div className="col name">Nombre</div><div className="col percent">Precio</div><div className="col actions">Acciones</div></div>
                        <div className="results-body">
                            {isLoadingPartition ? <div style={{ padding: 28, display: "flex", justifyContent: "center" }}><ReactLoading type="spin" color="#26b7cd" height={36} width={36} /></div>
                                : resultsPartition.length === 0 ? <div className="no-results">Sin resultados</div>
                                    : resultsPartition.map((t, i) => {
                                        const itemKey = `${t.id ?? t.name ?? "p"}-${i}`;
                                        const deleteKey = t.id ?? t.name ?? itemKey;
                                        const isDeleting = !!deletingIdsPartition[deleteKey];
                                        return (
                                            <div key={itemKey} className="results-row">
                                                <div className="col name">{t.name}</div>
                                                <div className="col percent">{t.price}</div>
                                                <div className="col actions">
                                                    <button className="btn update" onClick={() => { setSelectedPartition(t); setFormPartition({ name: t.name || "", price: t.price || 0 }); setShowModalPartition(true); }}>Actualizar</button>
                                                    <button className="btn delete" onClick={() => handleDeletePartition(t)} disabled={isDeleting}>{isDeleting ? <ReactLoading type="spin" color="#fcd1d1" height={14} width={14} /> : "Eliminar"}</button>
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
                        <h3  className="materials-title">Complementos - Baranda</h3></div>
                    <form className="search-form" onSubmit={handleSearchRailing}>
                        <input type="text" placeholder="Buscar baranda..." value={queryRailing} onChange={(e) => setQueryRailing(e.target.value)} disabled={isLoadingRailing} />
                        <div className="search-actions">
                            <button type="submit" disabled={isLoadingRailing}>{isLoadingRailing ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "🔍"}</button>
                            <button type="button" onClick={() => openCreateModalRailing()} disabled={isLoadingRailing}>Cargar baranda</button>
                            <button type="button" className="btn show-all" onClick={fetchAllRailings} disabled={isLoadingRailing}>{isLoadingRailing ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "Mostrar todos"}</button>
                        </div>
                    </form>
                    <div className="results-table">
                        <div className="results-header"><div className="col name">Nombre</div><div className="col percent">Precio</div><div className="col actions">Acciones</div></div>
                        <div className="results-body">
                            {isLoadingRailing ? <div style={{ padding: 28, display: "flex", justifyContent: "center" }}><ReactLoading type="spin" color="#26b7cd" height={36} width={36} /></div>
                                : resultsRailing.length === 0 ? <div className="no-results">Sin resultados</div>
                                    : resultsRailing.map((t, i) => {
                                        const itemKey = `${t.id ?? t.name ?? "r"}-${i}`;
                                        const deleteKey = t.id ?? t.name ?? itemKey;
                                        const isDeleting = !!deletingIdsRailing[deleteKey];
                                        return (
                                            <div key={itemKey} className="results-row">
                                                <div className="col name">{t.name}</div>
                                                <div className="col percent">{t.price}</div>
                                                <div className="col actions">
                                                    <button className="btn update" onClick={() => { setSelectedRailing(t); setFormRailing({ name: t.name || "", price: t.price || 0 }); setShowModalRailing(true); }}>Actualizar</button>
                                                    <button className="btn delete" onClick={() => handleDeleteRailing(t)} disabled={isDeleting}>{isDeleting ? <ReactLoading type="spin" color="#fcd1d1" height={14} width={14} /> : "Eliminar"}</button>
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
                        <h3>{selectedPartition ? "Actualizar partición" : "Crear partición"}</h3>
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
        </div>
    );
}
