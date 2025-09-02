using AutoMapper;
using Domain.Entities;
using Application.DTOs.CustomerDTOs.CreateCustomer;

namespace Application.Mapping.CustomerProfile
{
    public class CreateCustomerProfile : Profile
    {
        public CreateCustomerProfile()
        {
            // Mapeo CreateCustomerDTO a Customer
            CreateMap<CreateCustomerDTO, Customer>();
        }
    }
}
