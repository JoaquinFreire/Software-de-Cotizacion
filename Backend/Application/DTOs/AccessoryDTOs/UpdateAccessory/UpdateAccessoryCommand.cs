using MediatR;

namespace Application.DTOs.AccessoryDTOs.UpdateAccessory
{
    public class UpdateAccessoryCommand : IRequest<bool>
    {
        public int id { get; set; }
        public UpdateAccessoryDTO updateAccessoryDTO { get; set; }

        // Constructor parameterless para permitir object-initializer en controllers
        public UpdateAccessoryCommand() { }

        // Constructor opcional con parámetros (comodidad)
        public UpdateAccessoryCommand(int id, UpdateAccessoryDTO dto) { this.id = id; this.updateAccessoryDTO = dto; }
    }
}
