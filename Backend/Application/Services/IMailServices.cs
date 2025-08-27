
namespace Application.Services
{
    public interface IMailServices
    {
        Task SendInvitationMail(string toEmail, string token);
        Task SendRecoveryMail(string toEmail, string token);
    }
}
