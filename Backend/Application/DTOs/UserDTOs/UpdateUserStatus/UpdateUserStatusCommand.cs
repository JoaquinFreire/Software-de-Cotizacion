using MediatR;

namespace Application.DTOs.UserDTOs.UpdateUserStatus
{
    public class UpdateUserStatusCommand : IRequest<Unit>
    {
        public int Id { get; set; }
    }
}
