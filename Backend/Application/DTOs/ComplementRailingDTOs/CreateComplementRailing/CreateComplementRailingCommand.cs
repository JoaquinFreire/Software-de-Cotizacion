using MediatR;

namespace Application.DTOs.ComplementRailingDTOs.CreateComplementRailing
{
    public class CreateComplementRailingCommand : IRequest<Unit>
    {
        public required CreateComplementRailingDTO Railing { get; set; }
    }
}
