using MediatR;

namespace Application.DTOs.QuotationDTOs.UpdateQuotation
{
    public class UpdateQuotationForNewVersionCommand : IRequest<bool>
    {
        public int QuotationId { get; set; }
        public decimal? NewTotalPrice { get; set; }

        public UpdateQuotationForNewVersionCommand(int quotationId, decimal? newTotalPrice = null)
        {
            QuotationId = quotationId;
            NewTotalPrice = newTotalPrice;
        }
    }
}
