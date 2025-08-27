using MediatR;

namespace Application.DTOs.UserInvitationDTOs.CreateUserInvitation
{
    public class CreateUserInvitationCommand : IRequest<string>
    {
        public int UserId { get; set; }
    }
}
