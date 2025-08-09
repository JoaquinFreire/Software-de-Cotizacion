using MediatR;

namespace Application.DTOs.CustomerDTOs.CreateCustomer
{
    public class CreateCustomerCommand : IRequest<string>
    {
        public required CreateCustomerDTO createCustomerDTO { get; set; }
    }
}
