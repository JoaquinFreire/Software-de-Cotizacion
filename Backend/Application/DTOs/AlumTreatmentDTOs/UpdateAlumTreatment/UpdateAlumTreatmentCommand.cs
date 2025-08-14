using MediatR;

namespace Application.DTOs.AlumTreatmentDTOs.UpdateAlumTreatment
{
    public class UpdateAlumTreatmentCommand : IRequest<bool>
    {
        public int id { get; set; }
        public UpdateAlumTreatmentDTO updateAlumTreatmentDTO { get; set; }
        public UpdateAlumTreatmentCommand(int id, UpdateAlumTreatmentDTO updateAlumTreatmentDTO)
        {
            this.id = id;
            this.updateAlumTreatmentDTO = updateAlumTreatmentDTO;
        }
    }
}
