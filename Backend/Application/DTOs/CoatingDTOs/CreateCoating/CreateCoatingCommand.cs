using MediatR;

namespace Application.DTOs.CoatingDTOs.CreateCoating
{
    public class CreateCoatingCommand : IRequest<string>
    {
        public required CreateCoatingDTO Coating{get; set;}
    }
}
