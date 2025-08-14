using Application.Services;
using Application.DTOs.AlumTreatmentDTOs.UpdateAlumTreatment;
using MediatR;
using AutoMapper;

namespace Application.DTOs.AlumTreatmentDTOs.UpdateAlumTreatment
{
    public class UpdateAlumTreatmentHandler : IRequestHandler<UpdateAlumTreatmentCommand, bool>
    {
        private readonly AlumTreatmentServices _services;
        private readonly IMapper _mapper;
        public UpdateAlumTreatmentHandler(AlumTreatmentServices services, IMapper mapper)
        {
            _services = services;
            _mapper = mapper;
        }
        public async Task<bool> Handle(UpdateAlumTreatmentCommand request, CancellationToken cancellationToken)
        {
            var alumTreatment = await _services.GetByIdAsync(request.id);
            if (alumTreatment == null)
            {
                throw new KeyNotFoundException($"Tratamiento con ID {request.id} no encontrado.");
            }
            _mapper.Map(request.updateAlumTreatmentDTO, alumTreatment);
            await _services.UpdateAsync(alumTreatment);
            return true;
        }
    }
}
