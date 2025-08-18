using MediatR;

namespace Application.DTOs.OpeningTypeDTOs.UpdateOpeningType
{
    public class UpdateOpeningTypeCommand : IRequest<Unit>
    {
        public int id { get; set; }
        public required UpdateOpeningTypeDTO OpeningType { get; set; }
    }
}
