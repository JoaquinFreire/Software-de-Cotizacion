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
            CreateMap<CreateCustomerDTO, Customer>()
                .ForMember(d => d.Agents, o => o.MapFrom(s => s.agents)); // Nuevo: mapea la colección de agentes
            // Mapeo CreateCustomerAgentDTO a CustomerAgent
            CreateMap<CreateCustomerAgentDTO, CustomerAgent>();
        }
    }
}
