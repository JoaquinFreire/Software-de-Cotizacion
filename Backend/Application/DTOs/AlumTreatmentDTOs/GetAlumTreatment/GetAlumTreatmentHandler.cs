using MediatR;
using AutoMapper;
using Application.DTOs.AlumTreatmentDTOs.GetAlumTreatment;
using Application.Services;

namespace Application.DTOs.AlumTreatmentDTOs.GetAlumTreatment
{
    public class GetAlumTreatmentHandler : IRequestHandler<GetAlumTreatmentQuery, GetAlumTreatmentDTO>
    {
        private readonly IMapper _mapper;
        private readonly AlumTreatmentServices _services;
        public GetAlumTreatmentHandler(IMapper mapper, AlumTreatmentServices services)
        {
            _mapper = mapper;
            _services = services;
        }
        public async Task<GetAlumTreatmentDTO> Handle(GetAlumTreatmentQuery request, CancellationToken cancellationToken)
        {
            var alumTreatment = await _services.GetByIdAsync(request.id).ContinueWith(task =>
            {
                if (task.Result == null)
                {
                    throw new KeyNotFoundException($"No AlumTreatment found with id: {request.id}");
                }
                return task.Result;
            });
            return _mapper.Map<GetAlumTreatmentDTO>(alumTreatment);
        }
    }

}
