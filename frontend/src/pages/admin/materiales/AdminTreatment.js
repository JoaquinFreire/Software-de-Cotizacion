import React, { useState } from "react";
import axios from "axios";
import ReactLoading from "react-loading";
import { toast, ToastContainer } from "react-toastify";
import { safeArray } from "../../../utils/safeArray";
import Navigation from "../../../components/Navigation";
import Footer from "../../../components/Footer";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "";

export default function AdminTreatment() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ name: "", pricePercentage: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [viewingAll, setViewingAll] = useState(false);
    const [deletingIds, setDeletingIds] = useState({});
    const [modalSubmitting, setModalSubmitting] = useState(false);

    const fetchResults = async (searchQuery = "") => {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        if (!token) { setIsLoading(false); setResults([]); return []; }
        try {
            const url = `${API_URL}/api/alum-treatments/search?name=${encodeURIComponent(searchQuery)}`;
            const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = safeArray(response.data);
            setResults(normalizeItems(data));
            return data;
        } catch (error) {
            console.error("Error fetching Treatment:", error);
            setResults([]);
            return [];
        } finally { setIsLoading(false); }
    };

    const fetchAll = async () => {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        if (!token) { setIsLoading(false); setResults([]); return []; }
        try {
            const url = `${API_URL}/api/alum-treatments`;
            const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = safeArray(response.data);
            setViewingAll(true);
            setResults(normalizeItems(data));
            return data;
        } catch (error) { console.error("[fetchAll] Error fetching all treatments:", error); setResults([]); return []; } finally { setIsLoading(false); }
    };

    const handleSearch = async (e) => { e?.preventDefault(); setViewingAll(false); await fetchResults(query); };

    const openCreateModal = () => { setSelected(null); setForm({ name: "", pricePercentage: 0 }); setShowModal(true); };
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
            if (viewingAll) setResults(prev => { const next = [...(prev || []), newItem]; next.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es")); return next; });
            else await fetchResults(query);
        } catch (err) { console.error(err); toast.error("Error al crear tratamiento."); } finally { setModalSubmitting(false); }
    };

    const handleUpdate = async () => {
        if (!selected) return;
        setModalSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_URL}/api/alum-treatments/${selected.id}`, { name: form.name, pricePercentage: form.pricePercentage }, { headers: { Authorization: `Bearer ${token}` } });
            setResults(prev => (prev || []).map(r => ((r.id ?? r.name) === (selected.id ?? selected.name) ? { ...r, name: form.name, pricePercentage: form.pricePercentage } : r)));
            toast.success("Tratamiento actualizado correctamente.");
            closeModal();
        } catch (err) { console.error(err); toast.error("Error al actualizar tratamiento."); } finally { setModalSubmitting(false); }
    };

    const handleDelete = async (t) => {
        const key = t.id ?? t.name ?? Math.random().toString(36).slice(2);
        setDeletingIds(prev => ({ ...prev, [key]: true }));
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/api/alum-treatments/${t.id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (viewingAll) setResults(prev => (prev || []).filter(r => (r.id ?? r.name) !== (t.id ?? t.name)));
            else await fetchResults(query);
            toast.success("Tratamiento eliminado correctamente.");
        } catch (err) { console.error(err); toast.error("Error al eliminar tratamiento."); } finally { setDeletingIds(prev => ({ ...prev, [key]: false })); }
    };

    const handleSelect = (t) => { setSelected(t); setForm({ name: t.name ?? "", pricePercentage: t.pricePercentage ?? 0 }); setShowModal(true); };
    const handleChange = (e) => { const { name, value } = e.target; setForm(f => ({ ...f, [name]: name === "pricePercentage" ? Number(value) : value })); };

    const normalizeItems = (items) => {
        if (!items || !Array.isArray(items)) return [];
        return items.map(it => {
            if (!it) return it;
            if (it.id !== undefined && it.id !== null) return it;
            if (it._id) it.id = it._id;
            if (typeof it.id === "string" && /^[0-9]+$/.test(it.id)) it.id = Number(it.id);
            return it;
        });
    };

    return (
        <div className="dashboard-container">
            <Navigation />
            <ToastContainer autoClose={4000} theme="dark" position="bottom-right" />
            <div className="admin-materials-content">
                <div style={{ marginTop: 8 }}>
                    <div style={{ marginTop: 2 }}>
                        <Link to="/admin/materiales" className="btn update" style={{ display: "inline-block" }}>← Volver</Link>
                    </div>
                    <div className="admin-materials-header"><h3>Tratamientos de Aluminio</h3></div>

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
                            <div className="col-actions">Acciones</div>
                        </div>
                        <div className="results-body">
                            {isLoading ? (
                                <div style={{ padding: 28, display: "flex", justifyContent: "center" }}><ReactLoading type="spin" color="#26b7cd" height={36} width={36} /></div>
                            ) : results.length === 0 ? (
                                <div className="no-results">Sin resultados</div>
                            ) : results.map((t, i) => {
                                const itemKey = `${t.id ?? t.name ?? "t"}-${i}`;
                                const deleteKey = t.id ?? t.name ?? itemKey;
                                const isDeleting = !!deletingIds[deleteKey];
                                return (
                                    <div key={itemKey} className="results-row">
                                        <div className="col name">{t.name}</div>
                                        <div className="col percent">{t.pricePercentage}%</div>
                                        <div className="col-actions">
                                            <button className="btn update" onClick={() => handleSelect(t)}>Actualizar</button>
                                            <button className="btn delete" onClick={() => handleDelete(t)} disabled={isDeleting}>{isDeleting ? <ReactLoading type="spin" color="#fcd1d1" height={14} width={14} /> : "Eliminar"}</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {showModal && (
                        <div className="modal-overlay" onClick={closeModal}>
                            <div className="modal" onClick={(e) => e.stopPropagation()}>
                                <h3>{selected ? "Actualizar tratamiento" : "Crear tratamiento"}</h3>
                                <div className="modal-form">
                                    <label>Nombre<input name="name" value={form.name} onChange={handleChange} /></label>
                                    <label>Porcentaje agregado<input name="pricePercentage" type="number" value={form.pricePercentage} onChange={handleChange} /></label>
                                    <div className="modal-actions">
                                        <button onClick={selected ? handleUpdate : handleCreate} className="btn primary" disabled={modalSubmitting}>{modalSubmitting ? <ReactLoading type="spin" color="#fff" height={14} width={14} /> : (selected ? "Actualizar" : "Crear")}</button>
                                        <button onClick={closeModal} className="btn">Cancelar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}
