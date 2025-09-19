using MediatR;
using Domain.Entities;
using Application.Services;
using AutoMapper;

namespace Application.DTOs.AccessoryDTOs.CreateAccessory
{
    public class CreateAccessoryHandler : IRequestHandler<CreateAccessoryCommand, Unit>
    {
        private readonly AccessoryServices _accessoryService;
        private readonly IMapper _mapper;

        public CreateAccessoryHandler(AccessoryServices accessoryService, IMapper mapper)
        {
            _mapper = mapper;
            _accessoryService = accessoryService;
        }

        public async Task<Unit> Handle(CreateAccessoryCommand request, CancellationToken cancellationToken)
        {
            var Accesory = _mapper.Map<Accesory>(request.createAccessoryDTO);
            await _accessoryService.AddAsync(Accesory);
            return Unit.Value;
        }
    }
}