using AutoMapper;
using Domain.Entities;
using Application.DTOs.CustomerDTOs.UpdateCustomer;


namespace Application.Mapping.CustomerProfile
{
    public class UpdateCustomerProfile : Profile
    {
        public UpdateCustomerProfile() {
            CreateMap<UpdateCustomerDTO, Customer>().ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}
