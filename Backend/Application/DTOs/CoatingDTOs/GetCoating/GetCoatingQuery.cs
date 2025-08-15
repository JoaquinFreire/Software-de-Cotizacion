using MediatR;

namespace Application.DTOs.CoatingDTOs.GetCoating
{
    public record GetCoatingQuery(int id) : IRequest<GetCoatingDTO>
    {
        public int Id { get; init; } = id;
    }
}
