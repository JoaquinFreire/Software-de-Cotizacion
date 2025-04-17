import React from "react";
import { useNavigate } from "react-router-dom";
import ConfirmationModal from "./ConfirmationModal";
import "../styles/quotationList.css"; // Importar los estilos
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

const QuotationList = ({ quotations, onDelete, onStatusChange, showModal, setShowModal, setQuotationToDelete, successMessage, onDeleteSuccess }) => {
  const navigate = useNavigate();

  const handleShowModal = (id) => {
    setQuotationToDelete(id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setQuotationToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    await onDelete();
    onDeleteSuccess(); // Llamar a la función de éxito después de eliminar
  };

  return (
    <div className="quote-container">
      {successMessage && <div className="success-message">{successMessage}</div>}
      {quotations.map((quotation) => (
        <div key={quotation.Id} className="quote-card">
          <div className="quote-details">
            <p><b><u>Nombre</u>:  </b>{quotation.Customer.name} {quotation.Customer.lastname}</p>
            <p><b><u>Fecha</u>:  </b>{new Date(quotation.CreationDate).toLocaleDateString()}</p>
            <p><b><u>Estado</u>:  </b>{quotation.Status}</p>
            <p><b><u>Teléfono</u>:  </b>{quotation.Customer.tel}</p>
            <p><b><u>Correo</u>:  </b>{quotation.Customer.mail}</p>
          </div>
          <div className="quote-actions">
            <button className="go-button" onClick={() => navigate(`/quotation/${quotation.Id}`)}>Ver Detalles</button>
            <button className="update-button" onClick={() => navigate(`/update-quotation/${quotation.Id}`)}>Actualizar</button>
            <button className="delete-button" onClick={() => handleShowModal(quotation.Id)}>Eliminar</button>
            <select className="status-select" value={quotation.Status} onChange={(e) => onStatusChange(quotation.Id, e.target.value)}>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobados</option>
              <option value="rejected">Rechazado</option>
              <option value="finished">Finalizado</option>
            </select>
          </div>
        </div>
      ))}
      <ConfirmationModal
        show={showModal}
        onClose={handleCloseModal}
        onConfirm={handleDeleteConfirm} // Usar la nueva función de confirmación
      />
    </div>
  );
};

export default QuotationList;