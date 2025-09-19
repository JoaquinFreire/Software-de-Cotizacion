using MediatR;


namespace Application.DTOs.AccessoryDTOs.CreateAccessory
{
    public class CreateAccessoryCommand : IRequest<Unit>
    {
        public required CreateAccessoryDTO createAccessoryDTO { get; set; }
        
    }
}