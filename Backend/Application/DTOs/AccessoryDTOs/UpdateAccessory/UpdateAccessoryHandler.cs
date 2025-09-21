using MediatR;
using AutoMapper;
using Application.Services;

namespace Application.DTOs.AccessoryDTOs.UpdateAccessory
{
    public class UpdateAccessoryHandler : IRequestHandler<UpdateAccessoryCommand, bool>
    {
        private readonly AccessoryServices _services;
        private readonly IMapper _mapper;

        public UpdateAccessoryHandler(AccessoryServices services, IMapper mapper)
        {
            _services = services;
            _mapper = mapper;
        }

        public async Task<bool> Handle(UpdateAccessoryCommand request, CancellationToken cancellationToken)
        {
            var existing = await _services.GetByIdAsync(request.id);
            if (existing == null) throw new KeyNotFoundException($"Accessory with ID {request.id} not found.");

            _mapper.Map(request.updateAccessoryDTO, existing);
            await _services.UpdateAsync(existing);
            return true;
        }
    }
}
