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
                .ForMember(d => d.agent, o => o.MapFrom(s => s.agent)); // <-- Asegura el mapeo del agente
            // Mapeo CreateCustomerAgentDTO a CustomerAgent
            CreateMap<CreateCustomerAgentDTO, CustomerAgent>();
        }

    }
}
