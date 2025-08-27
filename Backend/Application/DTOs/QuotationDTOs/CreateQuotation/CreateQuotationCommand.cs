using MediatR;
using Application.DTOs.CustomerDTOs.CreateCustomer;
using Application.DTOs.UserDTOs.CreateUser;

namespace Application.DTOs.QuotationDTOs.CreateQuotation
{
    public class CreateQuotationCommand : IRequest<Unit>
    {
        public CreateCustomerDTO? customerDTO { get; set; }
        public CreateUserDTO? userDTO { get; set; }
        public required CreateQuotationDTO quotationDTO { get; set; }
    }
}
