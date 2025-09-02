using AutoMapper;
using Domain.Entities;
using Application.DTOs.CustomerAgentDTOs.UpdateCustomerAgent;

namespace Application.Mapping.CustomerAgentProfile
{
    internal class UpdateCustomerAgentProfile : Profile
    {
        public UpdateCustomerAgentProfile()
        {
            CreateMap<UpdateCustomerAgentDTO, CustomerAgent>().ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}
