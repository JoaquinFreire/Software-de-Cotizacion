using MediatR;

namespace Application.DTOs.CustomerDTOs.UpdateCustomer
{
    public class UpdateCustomerCommand : IRequest<bool>
    {
        public string Dni { get; set; }
        public UpdateCustomerDTO UpdateCustomerDTO { get; set; }
        public UpdateCustomerCommand(string dni, UpdateCustomerDTO updateCustomerDTO)
        {
            Dni = dni;
            UpdateCustomerDTO = updateCustomerDTO;
        }
    }
}
