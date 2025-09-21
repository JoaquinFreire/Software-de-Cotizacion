using MediatR;

namespace Application.DTOs.GlassTypeDTOs.UpdateGlassType
{
    public class UpdateGlassTypeCommand : IRequest<bool>
    {
        public int id { get; set; }
        public UpdateGlassTypeDTO glassType { get; set; }
    }
}
