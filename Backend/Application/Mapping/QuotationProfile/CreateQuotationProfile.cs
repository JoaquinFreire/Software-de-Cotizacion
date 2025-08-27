using Domain.Entities;
using Application.DTOs.QuotationDTOs.CreateQuotation;
using AutoMapper;

namespace Application.Mapping.QuotationProfile
{
    public class CreateQuotationProfile : Profile
    {
        public CreateQuotationProfile()
        {
            CreateMap<CreateQuotationDTO, Quotation>();
        }
    }
}
