using MediatR;

namespace Application.DTOs.UserDTOs.CreateUser
{
    public class CreateUserCommand : IRequest<Unit>
    {
        public required CreateUserDTO userDTO { get; set; }

    }
}
