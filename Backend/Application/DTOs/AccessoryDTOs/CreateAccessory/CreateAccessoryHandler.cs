using MediatR;
using AutoMapper;
using Application.Services;
using Domain.Entities;

namespace Application.DTOs.AccessoryDTOs.CreateAccessory
{
    public class CreateAccessoryHandler : IRequestHandler<CreateAccessoryCommand, string>
    {
        private readonly IMapper _mapper;
        private readonly AccessoryServices _services;

        public CreateAccessoryHandler(IMapper mapper, AccessoryServices services)
        {
            _mapper = mapper;
            _services = services;
        }

        public async Task<string> Handle(CreateAccessoryCommand request, CancellationToken cancellationToken)
        {
            var entity = _mapper.Map<Accesory>(request.createAccessoryDTO);
            await _services.AddAsync(entity);
            return entity.id.ToString();
        }
    }
}