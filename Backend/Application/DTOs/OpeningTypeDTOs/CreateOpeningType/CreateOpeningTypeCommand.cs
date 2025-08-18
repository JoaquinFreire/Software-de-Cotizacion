using MediatR;

namespace Application.DTOs.OpeningTypeDTOs.CreateOpeningType
{
    public class CreateOpeningTypeCommand : IRequest<Unit>
    {
        public required CreateOpeningTypeDTO OpeningType { get; set; }
    }
}
