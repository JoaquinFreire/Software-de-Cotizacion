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
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]); // <-- main results state
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ name: "", pricePercentage: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [viewingAll, setViewingAll] = useState(false); // <-- track if user is viewing "Mostrar todos"
    const [deletingIds, setDeletingIds] = useState({}); // track delete spinner per item
    const [modalSubmitting, setModalSubmitting] = useState(false); // spinner for modal primary button
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
            setCurrentUserRole(role);
            const allowed = role === "coordinator" || role === "manager";
            if (allowed) {
                console.log("Permisos verificados, cargando tratamientos.");
            } else {
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

        console.log(`[fetchResults] searching for "${searchQuery}"`);
        try {
            const url = `${API_URL}/api/alum-treatments/search?name=${encodeURIComponent(searchQuery)}`;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Normalizar respuesta: puede ser un objeto individual o un array
            const raw = response.data;
            let items = [];
            if (Array.isArray(raw)) items = raw;
            else if (raw && typeof raw === "object" && (raw.name || raw.$id)) items = [raw];
            else if (raw && raw.$values && Array.isArray(raw.$values)) items = raw.$values;
            else items = [];

            // ordenar alfabéticamente por nombre (case-insensitive)
            items.sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""), "es", { sensitivity: "base" }));

            const data = safeArray(items);
            setResults(data);
            return data;
        } catch (error) {
            const status = error?.response?.status;
            const respData = error?.response?.data;
            console.error("Error fetching Treatment:", status, respData ?? String(error));
            setResults([]);
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    // Obtener todos los tratamientos y mostrarlos ordenados
    const fetchAll = async () => {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("[fetchAll] no token found, redirecting to login");
            navigate("/");
            setIsLoading(false);
            setResults([]);
            return [];
        }
        try {
            const url = `${API_URL}/api/alum-treatments`;
            const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
            const raw = response.data;
        
            const data = safeArray(raw);
            console.log(`[fetchAll] fetched ${data.length} items`);
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

    // handleSearch delega a fetchResults (mantenerlo como handler del form)
    const handleSearch = async (e) => {
        e?.preventDefault();
        console.log(`[handleSearch] invoked query="${query}"`);
        setViewingAll(false);
        const r = await fetchResults(query);
        console.log(`[handleSearch] fetched ${r.length} items`);
        setResults(r);
    };

    // Modal controls
    const openCreateModal = () => {
        setSelected(null); // ensure create mode
        setForm({ name: "", pricePercentage: 0 });
        setShowModal(true);
    };
    const closeModal = () => {
        setShowModal(false);
    };

    const handleCreate = async () => {
        setModalSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const resp = await axios.post(`${API_URL}/api/alum-treatments`, form, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Tratamiento creado correctamente.");
            closeModal();
            // si estamos en 'Mostrar todos' agregamos en memoria
            const createdId = resp?.data?.result ?? resp?.data?.id ?? null;
            const newItem = {
                id: createdId ? (isNaN(Number(createdId)) ? createdId : Number(createdId)) : undefined,
                name: form.name,
                pricePercentage: form.pricePercentage,
            };
            if (viewingAll) {
                setResults((prev) => {
                    const next = [...(prev || []), newItem];
                    next.sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""), "es", { sensitivity: "base" }));
                    return next;
                });
            } else {
                // si no mostramos todos, refrescamos la búsqueda actual
                await fetchResults(query);
            }
        } catch (err) {
            console.error(err?.message ?? String(err));
            toast.error("Error al crear tratamiento.");
        } finally {
            setModalSubmitting(false);
        }
    };

    const handleUpdate = async (t) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_URL}/api/alum-treatments/${t.id}`, { name: t.name, pricePercentage: t.pricePercentage }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Tratamiento actualizado correctamente.");
            await fetchResults(query);
        } catch (err) {
            console.error(err?.message ?? String(err));
            toast.error("Error al actualizar tratamiento.");
        }
    };

    // Actualizar desde modal (usa selected + form), actualiza en memoria sin recargar la vista completa
    const handleUpdateModal = async () => {
        if (!selected) return;
        setModalSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_URL}/api/alum-treatments/${selected.id}`, { name: form.name, pricePercentage: form.pricePercentage }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // actualizar en memoria
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
            await axios.delete(`${API_URL}/api/alum-treatments/${t.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Si el usuario está viendo "Mostrar todos", eliminar localmente sin recargar.
            if (viewingAll) {
                setResults((prev) => (prev || []).filter((r) => (r.id ?? r.name) !== (t.id ?? t.name)));
            } else {
                await fetchResults(query);
            }
            toast.success("Tratamiento eliminado correctamente.");
        } catch (err) {
            console.error(err?.message ?? String(err));
            toast.error("Error al eliminar tratamiento.");
        } finally {
            setDeleting(key, false);
        }
    };

    const handleSelect = (t) => {
        // abrir modal en modo edición con datos completos
        setSelected(t);
        setForm({ name: t.name ?? "", pricePercentage: t.pricePercentage ?? 0 });
        setShowModal(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: name === "pricePercentage" ? Number(value) : value }));
    };

    return (
        <div className="dashboard-container">
            <ToastContainer autoClose={4000} theme="dark" transition={Slide} position="bottom-right"  />
            <Navigation />
            <div className="admin-materials-header">
                <h2>Administrar Materiales</h2>
                <h3>Tratamientos de Aluminio</h3>
            </div>

            <div className="admin-materials-content">
                <form className="search-form" onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={isLoading}
                    />
                    <div className="search-actions">
                        <button type="submit" disabled={isLoading}>
                            {isLoading ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "🔍"}
                        </button>
                        <button type="button" onClick={openCreateModal} disabled={isLoading}>Cargar tratamiento</button>
                        <button type="button" className="btn show-all" onClick={fetchAll} disabled={isLoading}>
                            {isLoading ? <ReactLoading type="spin" color="#fff" height={18} width={18} /> : "Mostrar todos"}
                        </button>
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
                            <div style={{ padding: 28, display: "flex", justifyContent: "center" }}>
                                <ReactLoading type="spin" color="#26b7cd" height={36} width={36} />
                            </div>
                        ) : results.length === 0 ? (
                            <div className="no-results">Sin resultados</div>
                        ) : (
                            results.map((t, i) => {
                                const itemKey = `${t.id ?? t.name ?? 't'}-${i}`;
                                const deleteKey = t.id ?? t.name ?? itemKey;
                                const isDeleting = !!deletingIds[deleteKey];
                                return (
                                    <div key={itemKey} className="results-row">
                                        <div className="col name">{t.name}</div>
                                        <div className="col percent">{t.pricePercentage}%</div>
                                        <div className="col actions">
                                            <button className="btn update" onClick={() => handleSelect(t)}>Actualizar</button>
                                            <button
                                                className="btn delete"
                                                onClick={() => handleDelete(t)}
                                                disabled={isDeleting}
                                            >
                                                {isDeleting ? (
                                                    <ReactLoading type="spin" color="#fcd1d1" height={14} width={14} />
                                                ) : (
                                                    "Eliminar"
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                         )}
                    </div>
                </div>
            </div>

            {/* Modal para crear/editar tratamiento */}
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
                                <button
                                    onClick={selected ? handleUpdateModal : handleCreate}
                                    className="btn primary"
                                    disabled={modalSubmitting}
                                >
                                    {modalSubmitting ? <ReactLoading type="spin" color="#fff" height={14} width={14} /> : (selected ? "Actualizar" : "Crear")}
                                </button>
                                <button onClick={closeModal} className="btn">Cancelar</button>
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