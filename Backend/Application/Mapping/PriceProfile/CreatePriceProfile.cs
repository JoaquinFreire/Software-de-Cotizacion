using Domain.Entities;
using Application.DTOs.PriceDTOs.CreatePrice;
using AutoMapper;

namespace Application.Mapping.PriceProfile
{
    public class CreatePriceProfile : Profile
    {
        public CreatePriceProfile()
        {
            CreateMap<CreatePriceDTO, Price>();
        }
    }
}
