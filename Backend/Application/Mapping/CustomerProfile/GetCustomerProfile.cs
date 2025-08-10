using Application.DTOs.CustomerDTOs.GetCustomer;
using AutoMapper;
using Domain.Entities;

namespace Application.Mapping.CustomerProfile
{
    public class GetCustomerProfile : Profile
    {
        public GetCustomerProfile()
        {
            // Mapeo Customer a GetCustomerDTO
            CreateMap<Customer, GetCustomerDTO>()
                .ForMember(dest => dest.agent, opt => opt.MapFrom(src => src.agent));
            // Mapeo CustomerAgent a GetCustomerAgentDTO
            CreateMap<CustomerAgent, GetCustomerAgentDTO>();
        }
    }
}
