using MediatR;

namespace Application.DTOs.CoatingDTOs.UpdateCoating
{
    public class UpdateCoatingCommand : IRequest<Unit>
    {
        public int id { get; set; }
        public UpdateCoatingDTO updateCoatingDTO { get; set; }

        public UpdateCoatingCommand(int id, UpdateCoatingDTO updateCoatingDTO)
        {
            this.id = id;
            this.updateCoatingDTO = updateCoatingDTO;
        }
    }
    
}

