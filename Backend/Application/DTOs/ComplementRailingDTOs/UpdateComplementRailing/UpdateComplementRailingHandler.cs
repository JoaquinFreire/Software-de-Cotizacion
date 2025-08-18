using MediatR;
using AutoMapper;
using Application.Services;
using Domain.Entities;


namespace Application.DTOs.ComplementRailingDTOs.UpdateComplementRailing
{
    public class UpdateComplementRailingHandler : IRequestHandler<UpdateComplementRailingCommand, Unit>
    {
        private readonly ComplementRailingServices _services;
        private readonly IMapper _mapper;
        public UpdateComplementRailingHandler(ComplementRailingServices services, IMapper mapper)
        {
            _services = services;
            _mapper = mapper;
        }
        public async Task<Unit> Handle(UpdateComplementRailingCommand request, CancellationToken cancellationToken)
        {
            var complementRailing = _mapper.Map<UpdateComplementRailingDTO, ComplementRailing>(request.Railing);
            complementRailing.id = request.Id; // Ensure the ID is set for the update
            await _services.UpdateAsync(complementRailing);
            return Unit.Value;
        }
    }
}
