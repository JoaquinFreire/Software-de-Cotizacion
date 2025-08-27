using Microsoft.AspNetCore.Mvc;
using Domain.Repositories;
using Domain.Entities;
using SendGrid;
using SendGrid.Helpers.Mail;
using Microsoft.AspNetCore.Authorization;
using Application.Services;

namespace Presentation.Controllers;
//TODO: Terminar de eliminar referencias a la capa de dominio
[ApiController]
[Route("api/user-invitations")]
/* [Authorize] */
public class UserInvitationController : ControllerBase
{
    private readonly IUserInvitationRepository _invitationRepo;
    private readonly IConfiguration _config;
    private readonly UserServices _services;
    public UserInvitationController(IUserInvitationRepository invitationRepo, IConfiguration config, UserServices services)
    {
        _config = config;
        {
            _invitationRepo = invitationRepo;
            _config = config;
            _services = services;
        }
    }

    public class InviteRequest { public int userId { get; set; } }
    // POST: api/user-invitations/invite
    [HttpPost("invite")]
    [Authorize]
    public async Task<IActionResult> Invite([FromBody] InviteRequest req)
    {
        var user = await _services.GetByIdAsync(req.userId);
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

        var user = await _services.GetByIdAsync(invitation.user_id);
        if (user == null) return NotFound();

        user.password_hash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        await _services.UpdateAsync(user);
        await _invitationRepo.MarkAsUsedAsync(invitation.id);

        return Ok("Contraseña actualizada.");
    }
    private async Task EnviarMailInvitacion(string toEmail, string token)
    {
        var apiKey = _config["API_KEY"];
        var fromMail = _config["MAIL"];
        var host = _config["HOST"];

        if (string.IsNullOrWhiteSpace(apiKey))
            throw new Exception("API_KEY de SendGrid no configurada.");

        // Debug: log apiKey (remove in production)
        Console.WriteLine("SendGrid API Key: " + apiKey);

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
        {
            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                throw new Exception("Error enviando mail: API Key inválida o sin permisos. Verifica que la API Key tenga permisos de 'Mail Send' y esté correctamente configurada en SendGrid.");
            throw new Exception("Error enviando mail: " + response.StatusCode);
        }
    }

    // POST: api/user-invitations/recover
    [AllowAnonymous]
    [HttpPost("recover")]
    public async Task<IActionResult> Recover([FromBody] RecoverRequest req)
    {
        Console.WriteLine("Entro a recover");
        // Buscar usuario por dni
        var user = await _services.GetByDniAsync(req.Dni);
        if (user == null || string.IsNullOrEmpty(user.mail))
            return Ok(new { error = "DNI no encontrado" });

        var token = Guid.NewGuid().ToString();
        var invitation = new UserInvitation
        {
            user_id = user.id,
            token = token,
            expires_at = DateTime.UtcNow.AddHours(24),
            used = false
        };
        await _invitationRepo.AddAsync(invitation);

        try
        {
            await EnviarMailRecuperacion(user.mail, token);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error enviando mail de recuperación: " + ex.Message);
        }

        // Enmascarar el mail
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

    private async Task EnviarMailRecuperacion(string toEmail, string token)
    {
        var apiKey = _config["API_KEY"];
        var fromMail = _config["MAIL"];
        var host = _config["HOST"];

        if (string.IsNullOrWhiteSpace(apiKey))
            throw new Exception("API_KEY de SendGrid no configurada.");

        // Debug: log apiKey (remove in production)
        Console.WriteLine("SendGrid API Key: " + apiKey);

        var client = new SendGridClient(apiKey);
        var from = new EmailAddress(fromMail, "Mi App");
        var subject = "Recuperar contraseña";
        var to = new EmailAddress(toEmail);

        var link = $"{host}/crear-password?token={token}";

        var plainTextContent = $"Hola,\n\nRecibimos una solicitud para recuperar tu contraseña en Anodal. Creá una nueva contraseña usando este link:\n{link}\n\nEl link expira en 24 horas.";

        var htmlContent = $@"
        <div style='font-family: Arial, sans-serif; color: #222;'>
            <h2>Recuperar contraseña</h2>
            <p>Recibimos una solicitud para recuperar tu contraseña. Para crear una nueva, hacé clic en el siguiente botón:</p>
            <a href='{link}' style='
                display: inline-block;
                padding: 12px 24px;
                background-color: #00bcd4;
                color: #fff;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
            '>Crear nueva contraseña</a>
            <p>O copiá y pegá este link en tu navegador:<br>
            <a href='{link}'>{link}</a></p>
            <p style='color: #888; font-size: 12px;'>El link expira en 24 horas.</p>
        </div>
        ";

        var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);
        var response = await client.SendEmailAsync(msg);
        if (!response.IsSuccessStatusCode)
        {
            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                throw new Exception("Error enviando mail: API Key inválida o sin permisos. Verifica que la API Key tenga permisos de 'Mail Send' y esté correctamente configurada en SendGrid.");
            throw new Exception("Error enviando mail: " + response.StatusCode);
        }
    }
}

public class SetPasswordRequest
{
    public string Token { get; set; }
    public string NewPassword { get; set; }
}

public class RecoverRequest
{
    public string Dni { get; set; }
}
