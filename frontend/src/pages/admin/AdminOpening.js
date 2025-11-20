import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import "../../styles/adminOpeninig.css";
import axios from "axios";
import ReactLoading from 'react-loading';
import ConfirmationModal from "../../components/ConfirmationModal";

 

import { safeArray } from "../../utils/safeArray";

const API_URL = process.env.REACT_APP_API_URL;

const AdminOpening = () => {
    // --- HOOKS: declarar todos los hooks primero para respetar las reglas de Hooks ---
    const [openings, setOpenings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    // Modal and form state (moved up)
    const [showModal, setShowModal] = useState(false);
    const [editingOpening, setEditingOpening] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        weight: "",
        predefined_size: "",
        description: ""
    });
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [imageFile, setImageFile] = useState(null);

    const navigate = useNavigate();
        const handleLogout = () => {
                localStorage.removeItem("token");
                navigate("/");
        }
    // helper para decodificar payload JWT (base64url)
    const decodeJwtPayload = (token) => {
        try {
            const parts = token.split('.');
            if (parts.length < 2) return null;
            const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const json = decodeURIComponent(atob(payload).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            return JSON.parse(json);
        } catch (e) { return null; }
    };

    // --- HOOKS (ya declarados más arriba) y useEffect deben ejecutarse siempre ---
     // Tamaños en KB (ajustables)
     const MIN_IMAGE_KB = 5;      // 5 KB mínimo
     const MAX_IMAGE_KB = 5120;   // 5 MB máximo
     const RECOMMENDED_KB = 200;  // recomendación visual ~200 KB (Cloudinary comprimirá a ~125 KB)
 
    useEffect(() => {
        fetchOpenings();
    }, []);
 
     const fetchOpenings = async () => {
         const token = localStorage.getItem("token");
         if (!token) {
             navigate("/");
             return;
         }
         try {
             const resp = await axios.get(`${API_URL}/api/opening-types`, {
                 headers: { Authorization: `Bearer ${token}` },
             });
             setOpenings(safeArray(resp.data));
         } catch (err) {
             console.error("Error fetching current opening:", err);
             navigate("/");
         }
         setIsLoading(false);
     };

    // --- comprobación SÍNCRONA del rol (moverla después de declarar todos los Hooks para respetar Rules of Hooks) ---
    const _token = localStorage.getItem("token");
    if (!_token) return <Navigate to="/" replace />;
    const _payload = decodeJwtPayload(_token);
    if (!_payload) return <Navigate to="/" replace />;
    let _role = _payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || _payload["role"] || _payload["role_name"] || _payload["roles"] || _payload["userRole"] || _payload["roleName"] || "";
    if (typeof _role === "object") _role = _role.role_name || _role.name || "";
    _role = String(_role || "").toLowerCase();
    if (_role !== "coordinator" && _role !== "manager") return <Navigate to="/" replace />;
 
     const handleDelete = async (id) => {
         const token = localStorage.getItem("token");
         setDeletingId(id);
         try {
             await axios.delete(
                 `${API_URL}/api/opening-types/${id}`,
                 {
                     headers: { Authorization: `Bearer ${token}` },
                 }
             );
             setOpenings(prev => prev.filter(opening => opening.id !== id));
         } catch (error) {
             console.error("Error deleting opening:", error);
         }
         setDeletingId(null);
         setShowDeleteModal(false);
         setPendingDeleteId(null);
     };

     const openDeleteModal = (id) => {
         setPendingDeleteId(id);
         setShowDeleteModal(true);
     };

     const closeDeleteModal = () => {
         setShowDeleteModal(false);
         setPendingDeleteId(null);
     };

     const handleOpenModal = (opening = null) => {
         setEditingOpening(opening);
         setValidationErrors({});
         setImageFile(null);
         setFormData(
             opening
                 ? {
                     name: opening.name || "",
                     weight: opening.weight || "",
                     predefined_size: opening.predefined_size || "",
                     description: opening.description || "" // <-- setear description al editar
                 }
                 : {
                     name: "",
                     weight: "",
                     predefined_size: "",
                     description: "" // <-- nuevo campo al crear
                 }
         );
         setShowModal(true);
     };

     const handleCloseModal = () => {
         setShowModal(false);
         setEditingOpening(null);
     };

     const handleInputChange = (e) => {
         const { name, value } = e.target;
         setFormData({ ...formData, [name]: value });
     };

     const handleFileChange = (e) => {
         const file = e.target.files?.[0] || null;
         setImageFile(file);

         if (file) {
             const kb = Math.round(file.size / 1024);
             if (kb < MIN_IMAGE_KB) {
                 setValidationErrors({ general: `La imagen es demasiado pequeña (${kb} KB). Mínimo ${MIN_IMAGE_KB} KB.` });
                 return;
             }
             if (kb > MAX_IMAGE_KB) {
                 setValidationErrors({ general: `La imagen es demasiado grande (${kb} KB). Máximo ${MAX_IMAGE_KB} KB.` });
                 return;
             }

             // Si pasa validación quitar errores anteriores
             setValidationErrors({});
         } else {
             setValidationErrors({});
         }
     };

     const handleSubmit = async (e) => {
         e.preventDefault();
         setValidationErrors({});
         const token = localStorage.getItem("token");

         // bloquear si hay error de validación
         if (validationErrors.general) {
             return;
         }

         setLoading(true);
         try {
             const formDataToSend = new FormData();
             formDataToSend.append("name", formData.name);
             formDataToSend.append("weight", formData.weight);
             formDataToSend.append("predefined_size", formData.predefined_size);
             formDataToSend.append("description", formData.description); // <-- enviar description
             if (imageFile) {
                 formDataToSend.append("image", imageFile);
             }

             if (editingOpening) {
                 await axios.put(`${API_URL}/api/opening-types/${editingOpening.id}`, formDataToSend, {
                     headers: { Authorization: `Bearer ${token}` },
                 });
             } else {
                 await axios.post(`${API_URL}/api/opening-types`, formDataToSend, {
                     headers: { Authorization: `Bearer ${token}` },
                 });
             }
             await fetchOpenings();
             handleCloseModal();
         } catch (error) {
             // si el backend devuelve un mensaje, mostralo
             const backendMsg = error?.response?.data?.message;
             setValidationErrors({
                 general: backendMsg || (editingOpening ? "Error al actualizar la abertura." : "Error al crear la abertura.")
             });
             console.error("Error saving opening:", error);
         }
         setLoading(false);
     };

     return (
         <div className="dashboard-container">
             <Navigation onLogout={handleLogout} />
             <div className="admin-opening">
                 <div className="admin-opening-header">
                 <h2 className="materials-title">Gestionar Aberturas</h2>
                 <p className="materials-subtitle">Aquí puedes crear, actualizar y eliminar tipos de aberturas para las ventanas.</p>
                 </div>
                 
                 <button
                     className="create-opeinig-button"
                     onClick={() => handleOpenModal(null)}
                 >
                     Crear Nueva Abertura
                 </button>
                 {isLoading ? (
                     <div className="admin-opening-loading">
                         <ReactLoading type="spin" color="#007bff" height={40} width={40} />
                     </div>
                 ) : (
                     <div className="openings-list">
                         {safeArray(openings).length === 0 ? (
                             <p className="no-openings">No hay aberturas registradas.</p>
                         ) : (
                             // Agrupar en filas de 4
                             Array.from({ length: Math.ceil(openings.length / 4) }).map((_, rowIdx) => (
                                 <div className="openings-row" key={rowIdx}>
                                     {openings.slice(rowIdx * 4, rowIdx * 4 + 4).map((   opening) => (
                                         <div className='AdminOpeningCard' key={opening.id}>
                                             <div className="opening-info">
                                                 <h3 className="opening-name">{opening.name}</h3>
                                                 <p className="opening-weight"><strong>Peso:</strong> {opening.weight}</p>
                                                 <p className="opening-size"><strong>Medida Predefinadia:</strong> {opening.predefined_size}</p>
                                                 {opening.description && <p className="opening-desc">{opening.description}</p>}
                                             </div>
                                             <div className="opening-actions">
                                                 <button className="update-button" onClick={() => handleOpenModal(opening)}>
                                                     Actualizar
                                                 </button>
                                                 <button
                                                     className="delete-button"
                                                     onClick={() => openDeleteModal(opening.id)}
                                                     disabled={deletingId === opening.id}
                                                 >
                                                     Eliminar
                                                 </button>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             ))
                         )}
                     </div>
                 )}

                 {/* Modal para actualizar abertura */}
                 {showModal && (
                     <div className="modal modal-opening" onClick={handleCloseModal}>
                         <div className="modal-content modal-opening-form" onClick={e => e.stopPropagation()}>
                             <h3 className="modal-title">
                                 {editingOpening ? "Actualizar Abertura" : "Crear Nueva Abertura"}
                             </h3>
                             <form onSubmit={handleSubmit} noValidate>
                                 {validationErrors.general && (
                                     <div className="validation-error">{validationErrors.general}</div>
                                 )}
                                 <label className="modal-label">
                                     Nombre:
                                     <input
                                         type="text"
                                         name="name"
                                         value={formData.name}
                                         onChange={handleInputChange}
                                         required
                                         className="modal-input"
                                     />
                                 </label>
                                 <label className="modal-label">
                                     Peso:
                                     <input
                                         type="text"
                                         name="weight"
                                         value={formData.weight}
                                         onChange={handleInputChange}
                                         required
                                         className="modal-input"
                                     />
                                 </label>
                                 <label className="modal-label">
                                     Medida:
                                     <input
                                         type="text"
                                         name="predefined_size"
                                         value={formData.predefined_size}
                                         onChange={handleInputChange}
                                         required
                                         className="modal-input"
                                     />
                                 </label>
                                 <label className="modal-label">
                                     Descripción:
                                     <textarea
                                         name="description"
                                         value={formData.description}
                                         onChange={handleInputChange}
                                         required
                                         className="modal-input modal-input-textarea"
                                     />
                                 </label>

                                 

                                 <label className="modal-label">
                                     Imagen (recomendado &lt; {RECOMMENDED_KB} KB, máximo {MAX_IMAGE_KB / 1024} MB):
                                     <input
                                         type="file"
                                         accept="image/*"
                                         onChange={handleFileChange}
                                         className="modal-input"
                                     />
                                 </label>

                                 <div className="modal-actions">
                                     <button
                                         type="submit"
                                         className="modal-submit-btn"
                                         disabled={loading}
                                     >
                                         {loading
                                             ? "Guardando..."
                                             : editingOpening
                                                 ? "Actualizar"
                                                 : "Crear"                                                }
                                     </button>
                                     <button type="button" onClick={handleCloseModal} className="modal-cancel-btn">
                                         Cancelar
                                     </button>
                                 </div>
                             </form>
                         </div>
                     </div>
                 )}

                 {/* Modal de confirmación de eliminación */}
                 <ConfirmationModal
                     show={showDeleteModal}
                     onClose={closeDeleteModal}
                     onConfirm={() => handleDelete(pendingDeleteId)}
                 />

                 <Footer />
             </div>
         </div>
     );
 };

 export default AdminOpening;