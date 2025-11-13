using AutoMapper;
using Domain.Entities;
using Application.DTOs.CustomerDTOs.GetCustomer;
using Application.DTOs.CustomerAgentDTOs.GetCustomerAgent;

namespace Application.Mapping.CustomerProfile
{
    public class GetCustomerProfile : Profile
    {
        public GetCustomerProfile()
        {
            // Asume que existe el CreateMap<CustomerAgent, GetCustomerAgentDTO> (ya definido).
            CreateMap<Customer, GetCustomerDTO>()
                .ForMember(dest => dest.agents, opt => opt.MapFrom(src => src.Agents));
        }
    }
}
