using Microsoft.AspNetCore.Mvc;
using Domain.Repositories;
using Domain.Entities;
using System;
using System.Threading.Tasks;
using System.Net.Mail;
using System.Net;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace Presentation.Controllers;

[ApiController]
[Route("api/user-invitations")]
public class UserInvitationController : ControllerBase
{
    private readonly IUserInvitationRepository _invitationRepo;
    private readonly IUserRepository _userRepo;
    private readonly IConfiguration _config;
    public UserInvitationController(IUserInvitationRepository invitationRepo, IUserRepository userRepo, IConfiguration config)
    {
        _config = config;
        {
            _invitationRepo = invitationRepo;
            _userRepo = userRepo;
            _config = config;
        }
    }

    public class InviteRequest { public int userId { get; set; } }
    // POST: api/user-invitations/invite
    [HttpPost("invite")]
    public async Task<IActionResult> Invite([FromBody] InviteRequest req)
    {
        var user = await _userRepo.GetByIdAsync(req.userId);
        if (user == null || string.IsNullOrEmpty(user.mail))
            return BadRequest("Usuario no encontrado o sin email.");

        var token = Guid.NewGuid().ToString();
        var invitation = new UserInvitation
        {
            user_id = req.userId,
            token = token,
            expires_at = DateTime.UtcNow.AddHours(24),
            used = false
        };
        await _invitationRepo.AddAsync(invitation);

        try
        {
            await EnviarMailInvitacion(user.mail, token);
        }
        catch (Exception ex)
        {
            // Logueá el error en consola para ver el motivo real
            Console.WriteLine("Error enviando mail: " + ex.Message);
            return StatusCode(500, "Error enviando el mail: " + ex.Message);
        }

        return Ok(new { invitation.token });
    }

    // POST: api/user-invitations/set-password
    [HttpPost("set-password")]
    public async Task<IActionResult> SetPassword([FromBody] SetPasswordRequest req)
    {
        var invitation = await _invitationRepo.GetByTokenAsync(req.Token);
        if (invitation == null || invitation.used || invitation.expires_at < DateTime.UtcNow)
            return BadRequest("Token inválido o expirado.");

        var user = await _userRepo.GetByIdAsync(invitation.user_id);
        if (user == null) return NotFound();

        user.password_hash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        await _userRepo.UpdateAsync(user);
        await _invitationRepo.MarkAsUsedAsync(invitation.id);

        return Ok("Contraseña actualizada.");
    }
    private async Task EnviarMailInvitacion(string toEmail, string token)
    {
        var apiKey = _config["API_KEY"];
        var fromMail = _config["MAIL"];
        var host = _config["HOST"];

        var client = new SendGridClient(apiKey);
        var from = new EmailAddress(fromMail, "Mi App");
        var subject = "Invitación para crear contraseña";
        var to = new EmailAddress(toEmail);

        var link = $"{host}/crear-password?token={token}";

        var plainTextContent = $"Hola,\n\nSe ha creado un usuario para Anodal. Creá tu contraseña usando este link:\n{link}\n\nEl link expira en 24 horas.";

        // HTML bonito con botón
        var htmlContent = $@"
        <div style='font-family: Arial, sans-serif; color: #222;'>
            <h2>¡Bienvenido a Anodal!</h2>
            <p>Se ha creado un usuario para vos. Para crear tu contraseña, hacé clic en el siguiente botón:</p>
            <a href='{link}' style='
                display: inline-block;
                padding: 12px 24px;
                background-color: #00bcd4;
                color: #fff;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
            '>Crear contraseña</a>
            <p>O copiá y pegá este link en tu navegador:<br>
            <a href='{link}'>{link}</a></p>
            <p style='color: #888; font-size: 12px;'>El link expira en 24 horas.</p>
        </div>
    ";

        var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);
        var response = await client.SendEmailAsync(msg);
        if (!response.IsSuccessStatusCode)
            throw new Exception("Error enviando mail: " + response.StatusCode);
    }
}

public class SetPasswordRequest
{
    public string Token { get; set; }
    public string NewPassword { get; set; }
}
