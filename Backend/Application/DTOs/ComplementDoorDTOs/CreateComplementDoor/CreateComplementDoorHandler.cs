using Application.Services;
using AutoMapper;
using MediatR;
using Domain.Entities;

namespace Application.DTOs.ComplementDoorDTOs.CreateComplementDoor
{
    public class CreateComplementDoorHandler : IRequestHandler<CreateComplementDoorCommand, string>
    {
        private readonly IMapper _mapper;
        private readonly ComplementDoorServices _services;
        public CreateComplementDoorHandler(IMapper mapper, ComplementDoorServices services)
        {
            _mapper = mapper;
            _services = services;
        }
        public async Task<string> Handle(CreateComplementDoorCommand request, CancellationToken cancellationToken)
        {
            var complementDoor = _mapper.Map<ComplementDoor>(request.ComplementDoor);
            await _services.AddAsync(complementDoor);
            return complementDoor.id.ToString();
        }
    }

}
