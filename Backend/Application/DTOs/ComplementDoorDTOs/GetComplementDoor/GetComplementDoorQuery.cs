using MediatR;

namespace Application.DTOs.ComplementDoorDTOs.GetComplementDoor
{
    public record GetComplementDoorQuery(int id) : IRequest<GetComplementDoorDTO>
    {
    }
}
