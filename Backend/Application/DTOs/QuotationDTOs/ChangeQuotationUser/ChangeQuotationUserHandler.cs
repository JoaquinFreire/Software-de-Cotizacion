using Domain.Entities;
using MediatR;
using AutoMapper;
using Application.Services;

namespace Application.DTOs.QuotationDTOs.ChangeQuotationUser
{
    public class ChangeQuotationUserHandler : IRequestHandler<ChangeQuotationUserCommand, bool>
    {
        private readonly QuotationServices _quotationServices;
        private readonly IMapper _mapper;
        public ChangeQuotationUserHandler(QuotationServices quotationServices, IMapper mapper)
        {
            _quotationServices = quotationServices;
            _mapper = mapper;
        }
        public async Task<bool> Handle(ChangeQuotationUserCommand request, CancellationToken cancellationToken)
        {
            var quotation = await _quotationServices.GetByIdAsync(request.id);
            if (quotation == null) return false;
            await _quotationServices.UpdateUserAsync(request.id, request.UserId);
            return true;
        }
    }
}
