using MediatR;

namespace Application.DTOs.ComplementDoorDTOs.CreateComplementDoor
{
    public class CreateComplementDoorCommand : IRequest<string>
    {
        public CreateComplementDoorDTO ComplementDoor { get; set; }
    }
}
