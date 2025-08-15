using MediatR;

namespace Application.DTOs.ComplementDoorDTOs.UpdateComplementDoor
{
    public class UpdateComplementDoorCommand : IRequest<int>
    {
        public required int id { get; set; }
        public required UpdateComplementDoorDTO ComplementDoor { get; set; }
    }
}
