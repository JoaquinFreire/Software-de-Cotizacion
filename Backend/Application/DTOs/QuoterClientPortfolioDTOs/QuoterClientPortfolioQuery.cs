using MediatR;

namespace Application.DTOs.QuoterClientPortfolioDTOs
{
    public class QuoterClientPortfolioQuery : IRequest<QuoterClientPortfolioDTO>
    {
        public int QuoterId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? SortBy { get; set; } // "revenue", "activity", "conversion"
        public string? ClientStatus { get; set; } // "active", "inactive", "at-risk"
    }
}