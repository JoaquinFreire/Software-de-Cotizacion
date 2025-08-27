
namespace Application.DTOs.UserInvitationDTOs.CreateUserInvitation
{
    public class CreateUserInvitationDTO
    {
        public required int user_id { get; set; }
        public required string token { get; set; }
        public DateTime expires_at { get; set; }
        public required bool used { get; set; }
    }
}
