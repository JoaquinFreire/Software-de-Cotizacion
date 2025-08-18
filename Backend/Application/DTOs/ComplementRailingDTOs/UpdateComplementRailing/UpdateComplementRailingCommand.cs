using MediatR;

namespace Application.DTOs.ComplementRailingDTOs.UpdateComplementRailing
{
    public class UpdateComplementRailingCommand : IRequest<Unit>
    {
        public required int Id { get; set; }
        public required UpdateComplementRailingDTO Railing { get; set; }
    }
}
