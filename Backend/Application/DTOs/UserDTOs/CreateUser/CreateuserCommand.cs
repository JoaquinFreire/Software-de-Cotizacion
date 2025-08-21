using MediatR;
namespace Application.DTOs.UserDTOs.CreateUser;

public class CreateuserCommand : IRequest<int>
{
    public required CreateUserDTO User { get; set; } // DTO para crear un usuario
}

