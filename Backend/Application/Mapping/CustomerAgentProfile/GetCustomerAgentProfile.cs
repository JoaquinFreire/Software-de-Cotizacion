using AutoMapper;
using Domain.Entities;
using Application.DTOs.CustomerAgentDTOs.GetCustomerAgent;

namespace Application.Mapping.CustomerAgentProfile
{
    public class GetCustomerAgentProfile : Profile
    {
        public GetCustomerAgentProfile()
        {
            CreateMap<CustomerAgent, GetCustomerAgentDTO>();
        }

    }
}
