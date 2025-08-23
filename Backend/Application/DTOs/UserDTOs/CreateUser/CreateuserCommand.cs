using MediatR;
namespace Application.DTOs.UserDTOs.CreateUser;

public class CreateuserCommand : IRequest<Unit>
{
    public required CreateUserDTO User { get; set; } // DTO para crear un usuario
}

