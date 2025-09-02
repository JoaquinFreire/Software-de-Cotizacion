using AutoMapper;
using Domain.Entities;
using Application.DTOs.CustomerAgentDTOs.CreateCustomerAgent;

namespace Application.Mapping.CustomerAgentProfile
{
    public class CreateCustomerAgentProfile : Profile
    {
        public CreateCustomerAgentProfile()
        {
            CreateMap<CreateCustomerAgentDTO, CustomerAgent>();
        }
    }
}
