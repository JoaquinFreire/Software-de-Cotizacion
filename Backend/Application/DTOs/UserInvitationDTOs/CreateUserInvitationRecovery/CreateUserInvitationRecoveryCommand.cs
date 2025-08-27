using MediatR;
using Application.DTOs.UserInvitationDTOs.CreateUserInvitation;

namespace Application.DTOs.UserInvitationDTOs.CreateUserInvitationRecovery
{
    public record CreateUserInvitationRecoveryCommand(CreateUserInvitationDTO Invitation) : IRequest<Unit>;
}
