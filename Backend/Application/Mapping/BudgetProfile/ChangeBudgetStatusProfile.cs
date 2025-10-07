using AutoMapper;
using Domain.Entities;
using Application.DTOs.BudgetDTOs.ChangeBudgetStatus;

namespace Application.Mapping.BudgetProfile
{
    public class ChangeBudgetStatusProfile : Profile
    {
        public ChangeBudgetStatusProfile()
        {
            CreateMap<Budget, ChangeBudgetStatusDTO>().ReverseMap();
            CreateMap<Budget, ChangeQuotationStatusDTO>().ReverseMap();
        }
    }
}
