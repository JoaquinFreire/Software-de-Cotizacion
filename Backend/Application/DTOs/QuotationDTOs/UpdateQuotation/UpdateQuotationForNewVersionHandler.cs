using Application.Services;
using MediatR;

namespace Application.DTOs.QuotationDTOs.UpdateQuotation
{
    public class UpdateQuotationForNewVersionHandler : IRequestHandler<UpdateQuotationForNewVersionCommand, bool>
    {
        private readonly QuotationServices _quotationServices;

        public UpdateQuotationForNewVersionHandler(QuotationServices quotationServices)
        {
            _quotationServices = quotationServices;
        }

        public async Task<bool> Handle(UpdateQuotationForNewVersionCommand request, CancellationToken cancellationToken)
        {
            var quotation = await _quotationServices.GetByIdAsync(request.QuotationId);
            if (quotation == null)
                return false;

            // Actualizar last_edit y opcionalmente el precio
            quotation.LastEdit = DateTime.UtcNow;
            if (request.NewTotalPrice.HasValue)
            {
                quotation.TotalPrice = request.NewTotalPrice.Value;
            }

            await _quotationServices.UpdateAsync(quotation);
            return true;
        }
    }
}
