using MediatR;
using AutoMapper;
using Application.Services;
using Domain.Entities;

namespace Application.DTOs.ComplementDoorDTOs.UpdateComplementDoor
{
    public class UpdateComplementDoorHandler : IRequestHandler<UpdateComplementDoorCommand, int>
    {
        private readonly ComplementDoorServices _services;
        private readonly IMapper _mapper;
        public UpdateComplementDoorHandler(ComplementDoorServices services, IMapper mapper)
        {
            _services = services;
            _mapper = mapper;
        }
        public async Task<int> Handle(UpdateComplementDoorCommand request, CancellationToken cancellationToken)
        {
            var door = _services.GetByIdAsync(request.id).Result;
            if (door == null) throw new Exception("No se encontro la puerta");
            _mapper.Map(request.ComplementDoor, door);
            await _services.UpdateAsync(door);
            return door.id;
        }
    }
}
