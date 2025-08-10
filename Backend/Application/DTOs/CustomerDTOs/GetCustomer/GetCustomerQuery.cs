using MediatR;

namespace Application.DTOs.CustomerDTOs.GetCustomer
{
    public record GetCustomerQuery(string CustomerDNI) : IRequest<GetCustomerDTO>;
}
