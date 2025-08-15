using MediatR;
using AutoMapper;
using Application.Services;

namespace Application.DTOs.ComplementDoorDTOs.GetComplementDoor
{
    public class GetComplementDoorHandler : IRequestHandler<GetComplementDoorQuery, GetComplementDoorDTO>
    {
        private readonly IMapper _mapper;
        private readonly ComplementDoorServices _services;
        public GetComplementDoorHandler(IMapper mapper, ComplementDoorServices services)
        {
            _mapper = mapper;
            _services = services;
        }
        public async Task<GetComplementDoorDTO> Handle(GetComplementDoorQuery request, CancellationToken cancellationToken)
        {
            var complementDoor = await _services.GetByIdAsync(request.id);
            if (complementDoor == null) throw new KeyNotFoundException($"Complement door with ID {request.id} not found.");
            return _mapper.Map<GetComplementDoorDTO>(complementDoor);
        }
    }
}
