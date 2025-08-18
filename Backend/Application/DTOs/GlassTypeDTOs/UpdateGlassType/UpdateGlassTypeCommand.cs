using MediatR;

namespace Application.DTOs.GlassTypeDTOs.UpdateGlassType
{
    public class UpdateGlassTypeCommand : IRequest<Unit>
    {
        public required int id { get; set; }
        public required UpdateGlassTypeDTO glassType { get; set; }
    }
}
