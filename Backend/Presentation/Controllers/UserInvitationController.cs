using Application.DTOs.UserInvitationDTOs.CreateUserInvitation;
using Application.DTOs.UserInvitationDTOs.CreateUserInvitationRecovery;
using Application.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;
[ApiController]
[Route("api/user-invitations")]
[Authorize]
public class UserInvitationController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly UserInvitationServices _invitationServices;
    private readonly UserServices _services;
    public UserInvitationController(UserInvitationServices invitationServices, UserServices services, IMediator mediator)
    {
            _invitationServices = invitationServices;
            _mediator = mediator;
            _services = services;
    }

    public class InviteRequest { public int userId { get; set; } }

    [HttpPost("invite")]
    public async Task<IActionResult> Invite([FromBody] InviteRequest req)
    {
        var token = await _mediator.Send(new CreateUserInvitationCommand { UserId = req.userId });
        return Ok(new { token });
    }

    // POST: api/user-invitations/set-password
    [HttpPost("set-password")]
    public async Task<IActionResult> SetPassword([FromBody] SetPasswordRequest req)
    {
        var invitation = await _invitationServices.GetByTokenAsync(req.Token);
        if (invitation == null || invitation.used || invitation.expires_at < DateTime.UtcNow)
            return BadRequest("Token inválido o expirado.");

        var user = await _services.GetByIdAsync(invitation.user_id);
        if (user == null) return NotFound();

        user.password_hash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        await _services.UpdateAsync(user);
        await _invitationServices.MarkAsUsedAsync(invitation.id);

        return Ok("Contraseña actualizada.");
    }

    // POST: api/user-invitations/recover
    [HttpPost("recover")]
    public async Task<IActionResult> Recover([FromBody] RecoverRequest req, [FromServices] IMailServices mailService)
    {
        var user = await _services.GetByDniAsync(req.Dni);
        if (user == null || string.IsNullOrEmpty(user.mail))
            return Ok(new { error = "DNI no encontrado" });

        var token = Guid.NewGuid().ToString();
        var invitation = new CreateUserInvitationDTO
        {
            user_id = user.id,
            token = token,
            expires_at = DateTime.UtcNow.AddHours(24),
            used = false
        };

        await _mediator.Send(new CreateUserInvitationRecoveryCommand(invitation));

        try
        {
            await mailService.SendRecoveryMail(user.mail, token);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error enviando mail de recuperación: " + ex.Message);
        }

        var maskedMail = MaskEmail(user.mail);
        return Ok(new { maskedMail });
    }

    private string MaskEmail(string email)
    {
        var atIdx = email.IndexOf('@');
        if (atIdx <= 2) return email;
        var visible = email.Substring(0, 3);
        var rest = email.Substring(atIdx - 1);
        return visible + "*****" + rest;
    }

    public class SetPasswordRequest
    {
        public required string Token { get; set; }
        public required string NewPassword { get; set; }
    }

    public class RecoverRequest
    {
        public required string Dni { get; set; }
    }
}
