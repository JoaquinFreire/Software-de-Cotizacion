using MediatR;


namespace Application.DTOs.UserDTOs.GetUser
{
    public class GetUserQuery : IRequest<GetUserDTO>
    {
        public int id { get; set; }
    }
}
