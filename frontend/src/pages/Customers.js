import React, { useEffect, useContext, useState, useRef } from 'react';
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import "../styles/clientes.css";
import { useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';
import { CustomerContext } from "../context/customerContext";
import { safeArray } from "../utils/safeArray";
import ReactLoading from "react-loading";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Customers = () => {
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const {
    customers, page, total, loading, PAGE_SIZE,
    goToCustomerPage, switchToCustomers,
    createCustomer, updateCustomer, fetchCustomerByDni, fetchCustomers
  } = useContext(CustomerContext);

  const [searchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchDni, setSearchDni] = useState("");
  const [searchResult, setSearchResult] = useState(undefined);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formData, setFormData] = useState({
    name: "", lastname: "", dni: "", tel: "", mail: "", address: ""
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [contactMenu, setContactMenu] = useState({ visible: false, cliente: null, x: 0, y: 0 });
  const contactMenuRef = useRef(null);
  const [viewQuotesMenu, setViewQuotesMenu] = useState({ visible: false, cliente: null, x: 0, y: 0 });
  const viewQuotesMenuRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    switchToCustomers();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  useEffect(() => {
    if (!customers) {
      setFilteredCustomers([]);
      return;
    }
    const arr = safeArray(customers);
    setFilteredCustomers(
      arr.filter((cliente) =>
        `${cliente.name} ${cliente.lastname}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [customers, searchTerm]);

  const openCreateForm = () => {
    setFormMode("create");
    setFormData({ name: "", lastname: "", dni: "", tel: "", mail: "", address: "" });
    setShowForm(true);
  };

  const handleUpdate = (cliente) => {
    const c = cliente || {};
    setFormMode("update");
    setFormData({
      name: c.name ?? "",
      lastname: c.lastname ?? "",
      dni: c.dni ?? "",
      tel: c.tel ?? "",
      mail: c.mail ?? "",
      address: c.address ?? ""
    });
    setShowForm(true);
  };

  const handleDetails = (id) => {
    navigate(`/customers/${id}/detalle`);
  };

  const navigateToHistorialWithFilter = (cliente, status) => {
    if (!cliente) return;
    const dni = cliente.dni ?? cliente.DNI ?? cliente.id ?? "";
    navigate("/historial", { state: { customerDni: dni, status: status ?? "" } });
    closeViewQuotesMenu();
  };

  const openViewQuotesMenu = (cliente, event) => {
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;
    setViewQuotesMenu({ visible: true, cliente, x, y });
  };

  const handleAgent = (cliente, event) => {
    if (event && typeof event.stopPropagation === "function") event.stopPropagation();
    openViewQuotesMenu(cliente, event);
  };

  const handleCreate = () => {
    openCreateForm();
  };

  const handleContact = (cliente, event) => {
    if (event && typeof event.stopPropagation === "function") event.stopPropagation();
    openContactMenu(cliente, event);
  };

  const openContactMenu = (cliente, event) => {
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;
    setContactMenu({ visible: true, cliente, x, y });
  };

  const closeContactMenu = () => setContactMenu({ visible: false, cliente: null, x: 0, y: 0 });
  const closeViewQuotesMenu = () => setViewQuotesMenu({ visible: false, cliente: null, x: 0, y: 0 });

  const contactByMail = (cliente) => {
    if (!cliente?.mail) return;
    window.open(`mailto:${cliente.mail}`, "_blank");
    closeContactMenu();
  };

  const contactByWhatsapp = (cliente) => {
    if (!cliente?.tel) return;
    let tel = String(cliente.tel || "");
    tel = tel.replace(/\s+/g, "");
    const plus = tel.startsWith("+") ? "+" : "";
    tel = plus + tel.replace(/\D/g, "");
    const waNumber = tel.replace(/^\+/, "");
    if (!/^\d+$/.test(waNumber)) {
      toast.error("Número inválido para WhatsApp.");
      closeContactMenu();
      return;
    }
    window.open(`https://wa.me/${waNumber}`, "_blank");
    closeContactMenu();
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    try {
      if (formMode === "create") {
        const payload = {
          name: formData.name,
          lastname: formData.lastname,
          dni: formData.dni,
          tel: formData.tel,
          mail: formData.mail,
          address: formData.address
        };
        const res = await createCustomer(payload);
        if (res.success) {
          toast.success(res.data?.Message ?? "Cliente creado correctamente.");
          setShowForm(false);
          setSearchResult(undefined);
        } else {
          toast.error("Error al crear cliente: " + (typeof res.error === "string" ? res.error : JSON.stringify(res.error)));
        }
      } else {
        const payload = {
          tel: formData.tel,
          mail: formData.mail,
          address: formData.address
        };
        const dni = formData.dni;
        const res = await updateCustomer(dni, payload);
        if (res.success) {
          toast.success(res.data?.Message ?? "Cliente actualizado correctamente.");
          setShowForm(false);
          setSearchResult(undefined);
        } else {
          toast.error("Error al actualizar cliente: " + (typeof res.error === "string" ? res.error : JSON.stringify(res.error)));
        }
      }
    } catch (err) {
      toast.error("Error inesperado: " + (err?.message || String(err)));
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleSearchDni = async (e) => {
    e && e.preventDefault();
    if (!searchDni || searchDni.trim() === "") {
      setSearchResult(undefined);
      await fetchCustomers(1);
      return;
    }
    const res = await fetchCustomerByDni(searchDni.trim());
    setSearchResult(res);
  };

  return (
    <div className="dashboard-container">
      <Navigation onLogout={handleLogout} />
      <ToastContainer position="bottom-right" autoClose={3000} />

      <div className="materials-header">
        <h2 className="materials-title">Gestión de Clientes</h2>
        <p className="materials-subtitle">
          Administre y consulte la información de los clientes, realizando búsquedas rápidas y manteniendo sus datos actualizados
        </p>
      </div>

      <div className="clientes-header">
        <form className="search-container" onSubmit={handleSearchDni}>
          <div className="search-input-wrapper">
            <i className="search-icon">🔍</i>
            <input
              className="search-input"
              type="text"
              placeholder="Buscar por DNI..."
              value={searchDni}
              onChange={(e) => setSearchDni(e.target.value)}
            />
          </div>
          <div className="search-buttons">
            <button className="btn-search" type="submit">Buscar</button>
            <button className="btn-clear" type="button" onClick={async () => { setSearchDni(""); setSearchResult(undefined); await fetchCustomers(1); }}>
              Limpiar
            </button>
          </div>
        </form>
        <div className="clientes-btn-container">
          <button className="btn-nuevo-cliente" onClick={handleCreate}>
            <i className="btn-icon">+</i>
            Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="clientes-list-container">
        {loading ? (
          <div className="clientes-list">
            {[...Array(PAGE_SIZE)].map((_, i) => (
              <div className="cliente-card skeleton" key={i}>
                <Skeleton height={30} width="60%" />
                <Skeleton height={20} width="40%" />
                <Skeleton height={20} width="50%" />
                <div className="cliente-actions">
                  <Skeleton width={90} height={28} />
                  <Skeleton width={90} height={28} />
                  <Skeleton width={90} height={28} />
                  <Skeleton width={90} height={28} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="clientes-list">
            {typeof searchResult !== "undefined" ? (
              searchResult === null ? (
                <div className="no-clientes">
                  <i className="no-data-icon">👤</i>
                  <p>No se encontró cliente con DNI {searchDni}</p>
                </div>
              ) : (
                <div className="cliente-card" key={searchResult.id ?? searchResult.dni}>
                  <div className="cliente-avatar">
                    {searchResult.name?.charAt(0)}{searchResult.lastname?.charAt(0)}
                  </div>
                  <div className="cliente-info">
                    <div className="cliente-nombre">
                      <strong>{searchResult.name} {searchResult.lastname}</strong>
                      <span className="cliente-dni-tag">DNI: {searchResult.dni}</span>
                    </div>
                    <div className="cliente-datos">
                      <div className="data-item">
                        <i className="data-icon">📱</i>
                        <span>{searchResult.tel || 'No especificado'}</span>
                      </div>
                      <div className="data-item">
                        <i className="data-icon">📧</i>
                        <span>{searchResult.mail || 'No especificado'}</span>
                      </div>
                      <div className="data-item">
                        <i className="data-icon">📍</i>
                        <span>{searchResult.address || 'No especificado'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="cliente-actions">
                    <button className="btn-action btn-detalle" onClick={() => handleDetails(searchResult.id)}>
                      <i className="action-icon">👁️</i>
                      <span>Detalles</span>
                    </button>
                    <button className="btn-action btn-actualizar" onClick={() => handleUpdate(searchResult)}>
                      <i className="action-icon">✏️</i>
                      <span>Actualizar</span>
                    </button>
                    <button className="btn-action btn-agente" onClick={(e) => handleAgent(searchResult, e)}>
                      <i className="action-icon">📊</i>
                      <span>Cotizaciones</span>
                    </button>
                    <button className="btn-action btn-contactar" onClick={(e) => handleContact(searchResult, e)}>
                      <i className="action-icon">💬</i>
                      <span>Contactar</span>
                    </button>
                  </div>
                </div>
              )
            ) : (
              (!filteredCustomers || filteredCustomers.length === 0) ? (
                <div className="no-clientes">
                  <i className="no-data-icon">👥</i>
                  <p>No hay clientes para mostrar</p>
                </div>
              ) : (
                safeArray(filteredCustomers).map((cliente) => (
                  <div className="cliente-card" key={cliente.id}>
                    <div className="cliente-avatar">
                      {cliente.name?.charAt(0)}{cliente.lastname?.charAt(0)}
                    </div>
                    <div className="cliente-info">
                      <div className="cliente-nombre">
                        <strong>{cliente.name} {cliente.lastname}</strong>
                        <span className="cliente-dni-tag">DNI: {cliente.dni}</span>
                      </div>
                      <div className="cliente-datos">
                        <div className="data-item">
                          <i className="data-icon">📱</i>
                          <span>{cliente.tel || 'No especificado'}</span>
                        </div>
                        <div className="data-item">
                          <i className="data-icon">📧</i>
                          <span>{cliente.mail || 'No especificado'}</span>
                        </div>
                        <div className="data-item">
                          <i className="data-icon">📍</i>
                          <span>{cliente.address || 'No especificado'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="cliente-actions">
                      <button className="btn-action btn-detalle" onClick={() => handleDetails(cliente.id)}>
                        <span>Detalles</span>
                      </button>
                      <button className="btn-action btn-actualizar" onClick={() => handleUpdate(cliente)}>
                        <span>Actualizar</span>
                      </button>
                      <button className="btn-action btn-agente" onClick={(e) => handleAgent(cliente, e)}>
                        <span>Cotizaciones</span>
                      </button>
                      <button className="btn-action btn-contactar" onClick={(e) => handleContact(cliente, e)}>
                        <span>Contactar</span>
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>

      <div className="pagination-nav">
        <button
          onClick={() => goToCustomerPage(page - 1)}
          disabled={page <= 1}
          className="pagination-btn"
        >
          <i>←</i> Anterior
        </button>
        <span className="pagination-info">
          Página {page} de {Math.max(1, Math.ceil(total / PAGE_SIZE))}
        </span>
        <button
          onClick={() => goToCustomerPage(page + 1)}
          disabled={page >= Math.ceil(total / PAGE_SIZE)}
          className="pagination-btn"
        >
          Siguiente <i>→</i>
        </button>
      </div>

      {/* Contact Menu */}
      {contactMenu.visible && (
        <div
          className="menu-overlay"
          onClick={closeContactMenu}
        >
          <div
            className="modern-menu contact-menu"
            ref={contactMenuRef}
            style={{
              left: Math.min(contactMenu.x, window.innerWidth - 280),
              top: Math.min(contactMenu.y, window.innerHeight - 180)
            }}
          >
            <div className="menu-header">
              <i className="menu-icon">💬</i>
              <div className="menu-title">
                <div className="menu-title-main">Contactar a</div>
                <div className="menu-title-sub">{contactMenu.cliente?.name} {contactMenu.cliente?.lastname}</div>
              </div>
            </div>
            <div className="menu-actions">
              <button className="menu-btn btn-mail" onClick={() => contactByMail(contactMenu.cliente)}>

                <span>Enviar mail</span>
              </button>
              <button className="menu-btn btn-wsp" onClick={() => contactByWhatsapp(contactMenu.cliente)}>
                <span>Enviar WhatsApp</span>
              </button>
              <button className="menu-btn btn-cancel" onClick={closeContactMenu}>
                <i className="btn-menu-icon">✕</i>
                <span>Cerrar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Quotes Menu */}
      {viewQuotesMenu.visible && (
        <div
          className="menu-overlay"
          onClick={closeViewQuotesMenu}
        >
          <div
            className="modern-menu quotes-menu"
            ref={viewQuotesMenuRef}
            style={{
              left: Math.min(viewQuotesMenu.x, window.innerWidth - 300),
              top: Math.min(viewQuotesMenu.y, window.innerHeight - 320)
            }}
          >
            <div className="menu-header">
              <i className="menu-icon">📊</i>
              <div className="menu-title">
                <div className="menu-title-main">Cotizaciones de</div>
                <div className="menu-title-sub">{viewQuotesMenu.cliente?.name} {viewQuotesMenu.cliente?.lastname}</div>
              </div>
            </div>
            <div className="menu-actions">
              <button className="menu-btn btn-all" onClick={() => navigateToHistorialWithFilter(viewQuotesMenu.cliente, "")}>
                <i className="btn-menu-icon">📋</i>
                <span>Todas las cotizaciones</span>
              </button>
              <button className="menu-btn btn-pending" onClick={() => navigateToHistorialWithFilter(viewQuotesMenu.cliente, "pending")}>
                <i className="btn-menu-icon">⏳</i>
                <span>Pendientes</span>
              </button>
              <button className="menu-btn btn-approved" onClick={() => navigateToHistorialWithFilter(viewQuotesMenu.cliente, "approved")}>
                <i className="btn-menu-icon">✅</i>
                <span>Aprobadas</span>
              </button>
              <button className="menu-btn btn-rejected" onClick={() => navigateToHistorialWithFilter(viewQuotesMenu.cliente, "rejected")}>
                <i className="btn-menu-icon">❌</i>
                <span>Rechazadas</span>
              </button>
              <button className="menu-btn btn-finished" onClick={() => navigateToHistorialWithFilter(viewQuotesMenu.cliente, "finished")}>
                <i className="btn-menu-icon">🏁</i>
                <span>Finalizadas</span>
              </button>
              <button className="menu-btn btn-cancel" onClick={closeViewQuotesMenu}>
                <i className="btn-menu-icon">✕</i>
                <span>Cerrar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modern-modal">
            <div className="modal-header">
              <h3>{formMode === "create" ? "Crear Cliente" : "Actualizar Cliente"}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={submitForm} className="client-form">
              <div className="form-grid">
                {formMode === "create" ? (
                  <>
                    <div className="form-group">
                      <label>Nombre</label>
                      <input placeholder="Ingrese el nombre" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Apellido</label>
                      <input placeholder="Ingrese el apellido" value={formData.lastname} onChange={(e) => setFormData({ ...formData, lastname: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>DNI</label>
                      <input placeholder="Ingrese el DNI" value={formData.dni} onChange={(e) => setFormData({ ...formData, dni: e.target.value })} required />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group readonly">
                      <label>Nombre</label>
                      <div className="readonly-value">{formData.name}</div>
                    </div>
                    <div className="form-group readonly">
                      <label>Apellido</label>
                      <div className="readonly-value">{formData.lastname}</div>
                    </div>
                    <div className="form-group readonly">
                      <label>DNI</label>
                      <div className="readonly-value">{formData.dni}</div>
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>Teléfono</label>
                  <input placeholder="Ingrese el teléfono" value={formData.tel} onChange={(e) => setFormData({ ...formData, tel: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" placeholder="Ingrese el email" value={formData.mail} onChange={(e) => setFormData({ ...formData, mail: e.target.value })} required />
                </div>
                <div className="form-group full-width">
                  <label>Dirección</label>
                  <input placeholder="Ingrese la dirección" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
                </div>
              </div>

              <div className="modal-actions">
                <button className='modal-btn modal-cancel-btn' type="button" onClick={() => setShowForm(false)} disabled={modalSubmitting}>
                  Cancelar
                </button>
                <button className='modal-btn modal-submit-btn' type="submit" disabled={modalSubmitting}>
                  {modalSubmitting ?
                    <div  style={{ display: 'flex', alignItems: 'center'}}>
                      <ReactLoading type="spin" color="#26b7cd" height={20} width={20} />
                    </div> : (formMode === "create" ? "Crear Cliente" : "Actualizar Cliente")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Customers;