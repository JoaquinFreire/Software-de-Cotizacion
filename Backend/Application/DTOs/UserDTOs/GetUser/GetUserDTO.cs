
namespace Application.DTOs.UserDTOs.GetUser
{
    public class GetUserDTO
    {
        public required int id { get; set; }
        public required string name { get; set; }
        public required string lastName { get; set; }
        public required string legajo { get; set; }
        public required string mail { get; set; }
        public required string role { get; set; }
    }
}
