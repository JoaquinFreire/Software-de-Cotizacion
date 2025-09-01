import { useNavigate } from "react-router-dom";
import ConfirmationModal from "./ConfirmationModal";
import "../styles/quotationList.css"; // Importar los estilos
import 'react-loading-skeleton/dist/skeleton.css'
import { safeArray } from "../utils/safeArray"; // agrega este import

const QuotationList = ({ quotations, onDelete, onStatusChange, showModal, setShowModal, setQuotationToDelete, onDeleteSuccess }) => {
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
      {safeArray(quotations).map((quotation) => (
        <div key={quotation.Id} className="quote-card">
          <div className="quote-details">
            <p><b><u>Cliente</u>:  </b>{quotation.Customer.name} {quotation.Customer.lastname}</p>
            <p><b><u>Creación</u>:  </b>{new Date(quotation.CreationDate).toLocaleDateString()}</p>
            <p><b><u>Estado</u>:  </b>{quotation.Status}</p>
            <p><b><u>Teléfono</u>:  </b>{quotation.Customer.tel}</p>
            <p><b><u>Correo</u>:  </b>{quotation.Customer.mail}</p>
          </div>
          <div className="quote-details">
            <p><b><u>Precio</u>:  </b>${quotation.TotalPrice}</p>
            <p><b><u>Lugar</u>:  </b>{quotation.WorkPlace.name}</p>
            <p><b><u>Dirección</u>:  </b>{quotation.WorkPlace.address}</p>
            <p><b><u>Entrega</u>:  </b> VER ESTO</p>
            <p><b><u>Vencimiento</u>:</b> VER ESTO</p>
          </div>
          <div className="quote-actions">
            <button className="go-button" onClick={() => navigate(`/quotation/${quotation.Id}`)}>Ver Detalles</button>
            <button className="update-button" onClick={() => navigate(`/update-quotation/${quotation.Id}`)}>Actualizar</button>
            <button className="delete-button" onClick={() => handleShowModal(quotation.Id)}>Eliminar</button>
            <select className="status-select" value={quotation.Status} onChange={(e) => onStatusChange(quotation.Id, e.target.value)}>
              <option className="dropdown" value="pending">Pendientes</option>
              <option className="dropdown"value="approved">Aprobados</option>
              <option className="dropdown"value="rejected">Rechazado</option>
              <option className="dropdown"value="finished">Finalizado</option>
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