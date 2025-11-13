﻿using Application.Services;
using Microsoft.Extensions.Configuration;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace Infrastructure.Services
{
    public class SendGridMailService : IMailServices
    {
        private readonly IConfiguration _config;
        public SendGridMailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendInvitationMail(string toEmail, string token)
        {
            var link = GenerateLink(token);

            var plainTextContent = $"Hola,\n\nSe ha creado un usuario para Anodal. Creá tu contraseña usando este link:\n{link}\n\nEl link expira en 24 horas.";

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

            await SendEmail(toEmail, "Invitación para crear contraseña", plainTextContent, htmlContent);
        }

        public async Task SendRecoveryMail(string toEmail, string token)
        {
            var link = GenerateLink(token);

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
        '           >Crear nueva contraseña</a>
                    <p>O copiá y pegá este link en tu navegador:<br>
                        <a href='{link}'>{link}</a></p>
                    <p style='color: #888; font-size: 12px;'>El link expira en 24 horas.</p>
                    </div>
                    ";

            await SendEmail(toEmail, "Recuperar contraseña", plainTextContent, htmlContent);
        }

        private async Task SendEmail(string toEmail, string subject, string plainText, string html)
        {
            var apiKey = _config["API_KEY"];
            var fromMail = _config["MAIL"];
            var client = new SendGridClient(apiKey);
            var from = new EmailAddress(fromMail, "Bienvenido a Anodal");
            var to = new EmailAddress(toEmail);

            var msg = MailHelper.CreateSingleEmail(from, to, subject, plainText, html);
            var response = await client.SendEmailAsync(msg);

            if (!response.IsSuccessStatusCode)
                throw new Exception("Error enviando mail: " + response.StatusCode);
        }
        private string GenerateLink(string   token)
        {
            var host = _config["HOST"];
            return $"{host}/crear-password?token={token}";
        }
    }
}