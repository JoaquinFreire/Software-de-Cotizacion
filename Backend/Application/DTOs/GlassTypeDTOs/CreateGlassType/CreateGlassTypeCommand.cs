using MediatR;

namespace Application.DTOs.GlassTypeDTOs.CreateGlassType
{
    public class CreateGlassTypeCommand : IRequest<string>
    {
        public CreateGlassTypeDTO GlassType { get; set; }
    }
}
