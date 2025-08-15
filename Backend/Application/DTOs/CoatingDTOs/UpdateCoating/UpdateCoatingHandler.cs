using MediatR;
using AutoMapper;
using Application.Services;

namespace Application.DTOs.CoatingDTOs.UpdateCoating
{
    public class UpdateCoatingHandler : IRequestHandler<UpdateCoatingCommand, Unit>
    {
        private readonly IMapper _mapper;
        private readonly CoatingServices _services;
        public UpdateCoatingHandler(IMapper mapper, CoatingServices services)
        {
            _mapper = mapper;
            _services = services;
        }
        public async Task<Unit> Handle(UpdateCoatingCommand request, CancellationToken cancellationToken)
        {
            var coating = _services.GetByIdAsync(request.id).Result;
            if (coating == null) throw new Exception("No se encontro el revestimiento");
            _mapper.Map(request.updateCoatingDTO, coating);
            await _services.UpdateAsync(coating);
            return Unit.Value;
        }
    }
}
