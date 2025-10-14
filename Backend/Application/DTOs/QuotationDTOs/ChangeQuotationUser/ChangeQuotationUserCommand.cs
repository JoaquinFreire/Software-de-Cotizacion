using MediatR;

namespace Application.DTOs.QuotationDTOs.ChangeQuotationUser
{
    public class ChangeQuotationUserCommand() : IRequest<bool>
    {
        public int id { get; set; }
        public int UserId { get; set; }
    }
}
