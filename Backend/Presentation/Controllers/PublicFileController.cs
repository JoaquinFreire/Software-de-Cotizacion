using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using System.Net.Mail;
using System.Text.Json;
using Application.Services; // para IMailServices si existe
using System.Reflection;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;

namespace Presentation.Controllers;
[ApiController]
[Route("api/public")]
public class PublicFileController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<PublicFileController> _logger;
    private readonly string _publicFolder;
    private readonly Application.Services.IMailServices? _mailService; // puede ser null si no registrado

    // IMailServices se inyecta por DI si está registrado. Si no está, queda null.
    public PublicFileController(IWebHostEnvironment env, ILogger<PublicFileController> logger, Application.Services.IMailServices? mailService = null)
    {
        _env = env;
        _logger = logger;
        var webRoot = string.IsNullOrEmpty(env.WebRootPath) ? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot") : env.WebRootPath;
        _publicFolder = Path.Combine(webRoot, "public");
        Directory.CreateDirectory(_publicFolder);

        // Asignar servicio inyectado (si existe)
        _mailService = mailService;
    }

    // Nuevo: subir y devolver link público (NO requiere SMTP)
    [HttpPost("upload")]
    public async Task<IActionResult> Upload([FromForm] IFormFile? file, [FromForm] string? budgetId, [FromForm] int expiresHours = 168)
    {
        if (file == null) return BadRequest(new { error = "No file provided" });

        var token = Guid.NewGuid().ToString("N");
        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext)) ext = ".pdf";
        var filename = $"{token}{ext}";
        var filePath = Path.Combine(_publicFolder, filename);

        try
        {
            using (var fs = System.IO.File.Create(filePath))
            {
                await file.CopyToAsync(fs);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving uploaded file");
            return StatusCode(500, new { error = "Error saving file" });
        }

        var publicViewUrl = $"{Request.Scheme}://{Request.Host}/public/view/{token}";
        return Ok(new { url = publicViewUrl, token });
    }

    // POST: guarda y envía desde el servidor (intenta IMailServices -> fallback SMTP)
    [HttpPost("send")]
    [DisableRequestSizeLimit]
    public async Task<IActionResult> SendAndStore([FromForm] IFormFile? file, [FromForm] string? to, [FromForm] string? budgetId)
    {
        if (file == null) return BadRequest(new { error = "No file provided" });

        // Guardar archivo
        var token = Guid.NewGuid().ToString("N");
        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext)) ext = ".pdf";
        var filename = $"{token}{ext}";
        var filePath = Path.Combine(_publicFolder, filename);

        try
        {
            using (var fs = System.IO.File.Create(filePath))
            {
                await file.CopyToAsync(fs);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving uploaded file");
            return StatusCode(500, new { error = "Error saving file" });
        }

        var publicViewUrl = $"{Request.Scheme}://{Request.Host}/public/view/{token}";
        var subject = $"Cotización {budgetId ?? ""}".Trim();
        // HTML estilizado y texto plano como fallback
        var bodyHtml = $@"
            <div style='font-family: Arial, Helvetica, sans-serif; color:#2c3e50; max-width:600px;margin:0 auto;'>
              <div style='background:#1976d2;padding:18px 20px;color:#fff;border-top-left-radius:6px;border-top-right-radius:6px;'>
                <h2 style='margin:0;font-size:18px;'>ANODAL S.A. - Cotización</h2>
              </div>
              <div style='padding:20px;background:#fff;border:1px solid #e6e9ee;border-bottom-left-radius:6px;border-bottom-right-radius:6px;'>
                <p style='margin:0 0 12px 0;'>Hola,</p>
                <p style='margin:0 0 18px 0;color:#444;'>Podés ver y descargar tu cotización desde el siguiente enlace seguro:</p>
                <div style='text-align:center;margin:16px 0;'>
                  <a href='{publicViewUrl}' style='display:inline-block;background:#27ae60;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;'>Ver cotización</a>
                </div>
                <p style='font-size:13px;color:#7f8c8d;margin:8px 0 0 0;word-break:break-all;'>{publicViewUrl}</p>
                <hr style='border:none;border-top:1px solid #eef2f5;margin:18px 0;'/>
                <p style='font-size:13px;color:#666;margin:0;'>Si tenés problemas para abrir el enlace, copiá y pegá la URL en tu navegador.</p>
                <p style='font-size:13px;color:#666;margin:6px 0 0 0;'>Saludos,<br/>ANODAL S.A.</p>
              </div>
              <div style='text-align:center;margin-top:8px;font-size:12px;color:#95a5a6;'>Av. Japón 1292 · Córdoba · Argentina · info@anodal.com.ar</div>
            </div>";
        var plainText = $"Hola,\n\nPodés ver y descargar tu cotización desde el siguiente link:\n{publicViewUrl}\n\nSaludos.\nANODAL S.A. - Av. Japón 1292 · Córdoba · Argentina · info@anodal.com.ar";

        // 1) Intentar usar IMailServices inyectado (invocación segura mediante reflexión)
        if (_mailService != null)
        {
            try
            {
                var msType = _mailService.GetType();
                var availableMethods = msType.GetMethods(BindingFlags.Instance | BindingFlags.Public).ToArray();

                // Filtrar métodos que NO sean de "Invitation" o "Recovery" y que tengan al menos un parámetro 'to' y (subject/body o attachment)
                var candidateMethod = availableMethods
                    .Where(m =>
                    {
                        var name = m.Name.ToLower();
                        if (name.Contains("invitation") || name.Contains("recovery")) return false;
                        var ps = m.GetParameters();
                        var hasTo = ps.Any(p => (p.Name ?? "").ToLower().Contains("to") || p.ParameterType == typeof(string) && p.Position == 0);
                        var hasSubjectOrBody = ps.Any(p => (p.Name ?? "").ToLower().Contains("subject") || (p.Name ?? "").ToLower().Contains("body") || (p.Name ?? "").ToLower().Contains("html"));
                        var hasAttachmentParam = ps.Any(p =>
                            (p.Name ?? "").ToLower().Contains("attach") ||
                            (p.Name ?? "").ToLower().Contains("file") ||
                            p.ParameterType == typeof(byte[]) ||
                            p.ParameterType == typeof(System.IO.Stream));
                        return hasTo && (hasSubjectOrBody || hasAttachmentParam);
                    })
                    .OrderBy(m => m.Name) // deterministic
                    .FirstOrDefault();

                if (candidateMethod == null)
                {
                    _logger.LogWarning("No compatible IMailServices send method found. Available: {methods}", string.Join(", ", availableMethods.Select(x => x.Name)));
                    // no forzar sent=true aquí, dejar que SMTP fallback o frontend fallback actúe
                }
                else
                {
                    var method = candidateMethod;
                    var parameters = method.GetParameters();
                    var argsList = new List<object?>();
                    foreach (var p in parameters)
                    {
                        var pname = (p.Name ?? "").ToLower();
                        if (p.ParameterType == typeof(string) && pname.Contains("to")) argsList.Add(to);
                        else if (p.ParameterType == typeof(string) && pname.Contains("subject")) argsList.Add(subject);
                        else if (p.ParameterType == typeof(string) && (pname.Contains("body") || pname.Contains("html"))) argsList.Add(bodyHtml);
                        else if (p.ParameterType == typeof(string) && (pname.Contains("path") || pname.Contains("file") || pname.Contains("attachment") || pname.Contains("attachments"))) argsList.Add(filePath);
                        else if (p.ParameterType == typeof(byte[]) && (pname.Contains("file") || pname.Contains("attachment")))
                        {
                            try { argsList.Add(System.IO.File.ReadAllBytes(filePath)); }
                            catch { argsList.Add(null); }
                        }
                        else if (p.ParameterType == typeof(System.IO.Stream) && (pname.Contains("file") || pname.Contains("attachment")))
                        {
                            try { argsList.Add(System.IO.File.OpenRead(filePath)); }
                            catch { argsList.Add(null); }
                        }
                        else
                        {
                            if (p.HasDefaultValue) argsList.Add(p.DefaultValue);
                            else argsList.Add(null);
                        }
                    }

                    _logger.LogInformation("Invoking IMailServices.{method} to {to}", method.Name, to);
                    var invokeResult = method.Invoke(_mailService, argsList.ToArray());
                    if (invokeResult is Task task) await task;
                    _logger.LogInformation("IMailServices.{method} completed for {to}", method.Name, to);
                    return Ok(new { sent = true, url = publicViewUrl });
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "IMailServices invocation failed, will try SMTP fallback");
            }
        }

        // 1.b) Intento por SendGrid (si existe API_KEY en entorno) - Envia link + adjunto directamente via API
        try
        {
            var sendGridKey = Environment.GetEnvironmentVariable("API_KEY") ?? Environment.GetEnvironmentVariable("SENDGRID_API_KEY");
            if (!string.IsNullOrEmpty(sendGridKey) && !string.IsNullOrEmpty(to))
            {
                _logger.LogInformation("Attempting SendGrid send to {to}", to);
                var bytes = System.IO.File.ReadAllBytes(filePath);
                var base64 = Convert.ToBase64String(bytes);
                var fromEmail = Environment.GetEnvironmentVariable("EMAIL_FROM") ?? Environment.GetEnvironmentVariable("MAIL") ?? "no-reply@anodal.com";

                var payload = new
                {
                    personalizations = new[]
                    {
                        new {
                            to = new[] { new { email = to } },
                            subject = subject
                        }
                    },
                    from = new { email = fromEmail },
                    // enviar texto plano + HTML para máxima compatibilidad
                    content = new[] {
                        new { type = "text/plain", value = plainText },
                        new { type = "text/html", value = bodyHtml }
                    },
                    attachments = new[]
                    {
                        new {
                            content = base64,
                            filename = $"cotizacion_{(string.IsNullOrEmpty(budgetId) ? token : budgetId)}.pdf",
                            type = "application/pdf",
                            disposition = "attachment"
                        }
                    }
                };

                using var http = new HttpClient();
                http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", sendGridKey);
                var json = JsonSerializer.Serialize(payload);
                using var content = new StringContent(json, Encoding.UTF8, "application/json");
                var resp = await http.PostAsync("https://api.sendgrid.com/v3/mail/send", content);
                if (resp.IsSuccessStatusCode || resp.StatusCode == System.Net.HttpStatusCode.Accepted)
                {
                    _logger.LogInformation("SendGrid accepted mail to {to} (status {status})", to, (int)resp.StatusCode);
                    return Ok(new { sent = true, url = publicViewUrl });
                }
                else
                {
                    var respBody = await resp.Content.ReadAsStringAsync();
                    _logger.LogWarning("SendGrid send failed: {status} {body}", (int)resp.StatusCode, respBody);
                    // continuar al fallback SMTP
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SendGrid attempt failed, will try SMTP fallback");
        }

        // 2) Fallback a SMTP usando variables de entorno
        var smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST");
        var smtpPortStr = Environment.GetEnvironmentVariable("SMTP_PORT");
        var smtpUser = Environment.GetEnvironmentVariable("SMTP_USER");
        var smtpPass = Environment.GetEnvironmentVariable("SMTP_PASS");
        var emailFrom = Environment.GetEnvironmentVariable("EMAIL_FROM") ?? Environment.GetEnvironmentVariable("MAIL");

        if (string.IsNullOrEmpty(smtpHost) || string.IsNullOrEmpty(smtpPortStr) || string.IsNullOrEmpty(emailFrom))
        {
            _logger.LogWarning("SMTP not configured and no IMailServices method available.");
            return StatusCode(500, new { error = "SMTP not configured on server. Configure SMTP_HOST/SMTP_PORT/EMAIL_FROM or ensure IMailServices has a Send method." });
        }

        if (!int.TryParse(smtpPortStr, out var smtpPort)) smtpPort = 25;

        try
        {
            using var message = new MailMessage();
            message.From = new MailAddress(emailFrom);
            if (!string.IsNullOrEmpty(to)) message.To.Add(new MailAddress(to));
            message.Subject = subject;
            // incluir alternativa en texto plano y HTML
            try
            {
                message.AlternateViews.Add(System.Net.Mail.AlternateView.CreateAlternateViewFromString(plainText, null, System.Net.Mime.MediaTypeNames.Text.Plain));
                message.AlternateViews.Add(System.Net.Mail.AlternateView.CreateAlternateViewFromString(bodyHtml, null, System.Net.Mime.MediaTypeNames.Text.Html));
            }
            catch
            {
                // Fallback sencillo si AlternateViews no está soportado: usar HTML
                message.IsBodyHtml = true;
                message.Body = bodyHtml;
            }

            var attachment = new Attachment(filePath);
            message.Attachments.Add(attachment);

            using var client = new SmtpClient(smtpHost, smtpPort);
            if (!string.IsNullOrEmpty(smtpUser))
            {
                client.Credentials = new System.Net.NetworkCredential(smtpUser, smtpPass);
                client.EnableSsl = true;
            }

            await client.SendMailAsync(message);
            _logger.LogInformation("Quotation email sent to {to}", to);
            return Ok(new { sent = true, url = publicViewUrl });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email from server");
            return StatusCode(500, new { error = "Error sending email from server", detail = ex.Message });
        }
    }

    // Mantener endpoints para servir y ver el PDF públicamente (sin auth)
    [HttpGet("file/{token}")]
    public IActionResult GetFile(string token)
    {
        var dir = _publicFolder;
        var file = Directory.GetFiles(dir).FirstOrDefault(f => Path.GetFileName(f).StartsWith(token));
        if (file == null) return NotFound();
        return PhysicalFile(file, "application/pdf", enableRangeProcessing: true);
    }

    [HttpGet("download/{token}")]
    public IActionResult DownloadFile(string token)
    {
        var dir = _publicFolder;
        var file = Directory.GetFiles(dir).FirstOrDefault(f => Path.GetFileName(f).StartsWith(token));
        if (file == null) return NotFound();
        var downloadName = $"cotizacion_{token}.pdf";
        var fs = System.IO.File.OpenRead(file);
        return File(fs, "application/pdf", downloadName);
    }

    [HttpGet("/public/view/{token}")]
    public IActionResult PublicView(string token)
    {
        var dir = _publicFolder;
        var file = Directory.GetFiles(dir).FirstOrDefault(f => Path.GetFileName(f).StartsWith(token));
        if (file == null) return NotFound("Link no encontrado");
        var fileUrl = $"{Request.Scheme}://{Request.Host}/api/public/file/{token}";
        var downloadUrl = $"{Request.Scheme}://{Request.Host}/api/public/download/{token}";

        var html = $@"
<!doctype html>
<html>
<head>
  <meta charset='utf-8'/>
  <meta name='viewport' content='width=device-width,initial-scale=1'/>
  <title>Cotización</title>
  <style>body,html{{height:100%;margin:0}}.wrap{{height:100%;display:flex;flex-direction:column}}header{{padding:10px;background:#1976d2;color:#fff}}iframe{{flex:1;border:none;width:100%}}.actions{{padding:8px;display:flex;gap:8px;justify-content:flex-end}}</style>
</head>
<body>
  <div class='wrap'>
    <header>
      <strong>Cotización</strong>
      <div class='actions'>
        <a href='{downloadUrl}' style='color:#fff;background:#27ae60;padding:6px 10px;border-radius:4px;text-decoration:none'>Descargar</a>
      </div>
    </header>
    <iframe src='{fileUrl}' title='Cotización'></iframe>
  </div>
</body>
</html>
";
        return Content(html, "text/html");
    }
}
