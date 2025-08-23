using MediatR;

namespace Application.DTOs.UserDTOs.UpdateUser
{
    public class UpdateUserCommand : IRequest<Unit>
    {
        public required int Id { get; set; }
        public required UpdateUserDTO userDTO { get; set; }
    }
}
