using MediatR;

namespace Application.DTOs.AccessoryDTOs.CreateAccessory
{
    public class CreateAccessoryCommand : IRequest<string>
    {
        public CreateAccessoryDTO createAccessoryDTO { get; set; }
    }
}