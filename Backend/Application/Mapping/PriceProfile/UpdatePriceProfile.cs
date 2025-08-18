using AutoMapper;
using Domain.Entities;
using Application.DTOs.PriceDTOs.UpdatePrice;

namespace Application.Mapping.PriceProfile
{
    public class UpdatePriceProfile : Profile
    {
        public UpdatePriceProfile()
        {
            CreateMap<UpdatePriceDTO, Price>().ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}
