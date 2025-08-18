using MediatR;

namespace Application.DTOs.GlassTypeDTOs.CreateGlassType
{
    public class CreateGlassTypeCommand : IRequest<Unit>
    {
        public required CreateGlassTypeDTO GlassType { get; set; }
    }
}
