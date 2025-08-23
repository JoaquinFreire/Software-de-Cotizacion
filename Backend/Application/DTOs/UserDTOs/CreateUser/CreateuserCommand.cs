using MediatR;

namespace Application.DTOs.UserDTOs.CreateUser
{
    public class CreateUserCommand : IRequest<Unit>
    {
        public required CreateUserDTO User { get; set; }

    }
}
