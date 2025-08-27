using Application.Services;
using AutoMapper;
using Domain.Entities;
using Domain.Repositories;
using MediatR;

namespace Application.DTOs.UserInvitationDTOs.CreateUserInvitationRecovery
{
    public class CreateUserInvitationHandler : IRequestHandler<CreateUserInvitationRecoveryCommand, Unit>
    {
        private readonly UserInvitationServices _services;
        private readonly IMapper _mapper;
        public CreateUserInvitationHandler(UserInvitationServices services, IMapper mapper)
        {
            _services = services;
            _mapper = mapper;
        }
        public async Task<Unit> Handle(CreateUserInvitationRecoveryCommand request, CancellationToken cancellationToken)
        {
            var invitation = _mapper.Map<UserInvitation>(request.Invitation);
            await _services.AddAsync(invitation);
            return Unit.Value;
        }
    }
}
