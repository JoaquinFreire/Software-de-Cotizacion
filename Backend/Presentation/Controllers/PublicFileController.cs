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
    private readonly string _publicFolder;               // wwwroot/public (persistente)
    private readonly string _tempFolder;                 // temp storage (no tracked by git)
    private readonly string _metaFilePath;               // metadata JSON (small)
    private readonly Application.Services.IMailServices? _mailService; // puede ser null si no registrado

    public PublicFileController(IWebHostEnvironment env, ILogger<PublicFileController> logger, Application.Services.IMailServices? mailService = null)
    {
        _env = env;
        _logger = logger;

        var webRoot = string.IsNullOrEmpty(env.WebRootPath)
            ? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")
            : env.WebRootPath;

        _publicFolder = Path.Combine(webRoot, "public");
        Directory.CreateDirectory(_publicFolder);

        // directorio TEMP fuera del repo para envíos -> evita agregar archivos al git
        _tempFolder = Path.Combine(Path.GetTempPath(), "anodal_public");
        Directory.CreateDirectory(_tempFolder);

        // metadata pequeña en carpeta TEMP (no en el repo) para evitar commits accidentales
        _metaFilePath = Path.Combine(_tempFolder, "public-links.json");

        _mailService = mailService;
    }

    // metadata model
    private class PublicLinkMeta
    {
        public string Token { get; set; } = null!;
        public string FileName { get; set; } = null!;
        public string Storage { get; set; } = "public"; // "public" or "temp"
        public string? BudgetId { get; set; }
        public DateTime ExpiresAt { get; set; }
    }

    private List<PublicLinkMeta> LoadMeta()
    {
        try
        {
            if (!System.IO.File.Exists(_metaFilePath)) return new List<PublicLinkMeta>();
            var txt = System.IO.File.ReadAllText(_metaFilePath);
            return JsonSerializer.Deserialize<List<PublicLinkMeta>>(txt) ?? new List<PublicLinkMeta>();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to read meta file");
            return new List<PublicLinkMeta>();
        }
    }

    private void SaveMeta(List<PublicLinkMeta> meta)
    {
        try
        {
            var txt = JsonSerializer.Serialize(meta);
            System.IO.File.WriteAllText(_metaFilePath, txt);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to write meta file");
        }
    }

    [HttpGet("health")]
    public IActionResult Health() => Ok(new { status = "ok", time = DateTime.UtcNow });

    // Upload público (persistente, para enlaces "permanentes")
    [HttpPost("upload")]
    public async Task<IActionResult> Upload([FromForm] IFormFile? file, [FromForm] string? budgetId, [FromForm] int expiresHours = 168)
    {
        _logger.LogInformation("Upload called. hasFile:{has} budgetId:{b}", file != null, budgetId);
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

        // Guardar metadata (apunta a public storage)
        var meta = LoadMeta();
        meta.RemoveAll(m => m.Token == token);
        meta.Add(new PublicLinkMeta
        {
            Token = token,
            FileName = filename,
            Storage = "public",
            BudgetId = budgetId,
            ExpiresAt = DateTime.UtcNow.AddHours(expiresHours)
        });
        SaveMeta(meta);

        var publicViewUrl = $"{Request.Scheme}://{Request.Host}/public/view/{token}";
        return Ok(new { url = publicViewUrl, token });
    }

    // Enviar por mail: guardar en TEMP (no tracked), registrar metadata y enviar.
    [HttpPost("send")]
    [DisableRequestSizeLimit]
    public async Task<IActionResult> SendAndStore([FromForm] IFormFile? file, [FromForm] string? to, [FromForm] string? budgetId)
    {
        _logger.LogInformation("Send called. hasFile:{has} to:{to} budgetId:{b}", file != null, to, budgetId);
        if (file == null) return BadRequest(new { error = "No file provided" });

        // Guardar en carpeta TEMP (no dentro del repo)
        var token = Guid.NewGuid().ToString("N");
        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext)) ext = ".pdf";
        var filename = $"{token}{ext}";
        var filePath = Path.Combine(_tempFolder, filename);

        try
        {
            using (var fs = System.IO.File.Create(filePath))
            {
                await file.CopyToAsync(fs);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving temp file");
            return StatusCode(500, new { error = "Error saving file" });
        }

        // Registrar metadata apuntando a temp storage
        var meta = LoadMeta();
        meta.RemoveAll(m => m.Token == token);
        meta.Add(new PublicLinkMeta
        {
            Token = token,
            FileName = filename,
            Storage = "temp",
            BudgetId = budgetId,
            ExpiresAt = DateTime.UtcNow.AddHours(168) // default 7 días
        });
        SaveMeta(meta);

        var publicViewUrl = $"{Request.Scheme}://{Request.Host}/public/view/{token}";
        var subject = $"Cotización {budgetId ?? ""}".Trim();
        var bodyHtml = $"Hola,<br/><br/>Podés ver y descargar tu cotización desde el siguiente link:<br/><a href=\"{publicViewUrl}\">{publicViewUrl}</a><br/><br/>Saludos.";

        // Intento IMailServices / SendGrid / SMTP (igual que antes)
        try
        {
            // 1) IMailServices invocation (if available) - keep existing flexible invocation
            if (_mailService != null)
            {
                try
                {
                    var msType = _mailService.GetType();
                    var availableMethods = msType.GetMethods(BindingFlags.Instance | BindingFlags.Public).ToArray();
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
                        .OrderBy(m => m.Name)
                        .FirstOrDefault();

                    if (candidateMethod != null)
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
                    else
                    {
                        _logger.LogWarning("No compatible IMailServices method found.");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "IMailServices invocation failed, will try SendGrid/SMTP fallback");
                }
            }

            // 1.b) SendGrid attempt (if configured)
            var sendGridKey = Environment.GetEnvironmentVariable("API_KEY") ?? Environment.GetEnvironmentVariable("SENDGRID_API_KEY");
            if (!string.IsNullOrEmpty(sendGridKey) && !string.IsNullOrEmpty(to))
            {
                try
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
                        content = new[] { new { type = "text/html", value = bodyHtml } },
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
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "SendGrid attempt failed, will try SMTP fallback");
                }
            }

            // 2) SMTP fallback (if configured)
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

            using var message = new MailMessage();
            message.From = new MailAddress(emailFrom);
            if (!string.IsNullOrEmpty(to)) message.To.Add(new MailAddress(to));
            message.Subject = subject;
            message.IsBodyHtml = true;
            message.Body = bodyHtml;
            message.Attachments.Add(new Attachment(filePath));

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

    // Buscar metadata y devolver el path físico según storage
    private (string? filePath, PublicLinkMeta? meta) ResolveFileByToken(string token)
    {
        var meta = LoadMeta().FirstOrDefault(m => m.Token == token);
        if (meta == null) return (null, null);
        if (meta.ExpiresAt < DateTime.UtcNow) return (null, meta);

        string path;
        if (meta.Storage == "public")
            path = Path.Combine(_publicFolder, meta.FileName);
        else
            path = Path.Combine(_tempFolder, meta.FileName);

        return (System.IO.File.Exists(path) ? path : null, meta);
    }

    [HttpGet("file/{token}")]
    public IActionResult GetFile(string token)
    {
        var (path, meta) = ResolveFileByToken(token);
        if (meta == null) return NotFound();
        if (meta.ExpiresAt < DateTime.UtcNow) return StatusCode(410, new { error = "Link expirado" });
        if (path == null) return NotFound();
        return PhysicalFile(path, "application/pdf", enableRangeProcessing: true);
    }

    [HttpGet("download/{token}")]
    public IActionResult DownloadFile(string token)
    {
        var (path, meta) = ResolveFileByToken(token);
        if (meta == null) return NotFound();
        if (path == null) return NotFound();
        var downloadName = $"cotizacion_{meta.BudgetId ?? token}.pdf";
        var fs = System.IO.File.OpenRead(path);
        return File(fs, "application/pdf", downloadName);
    }

    [HttpGet("/public/view/{token}")]
    public IActionResult PublicView(string token)
    {
        var (path, meta) = ResolveFileByToken(token);
        if (meta == null) return NotFound("Link no encontrado");
        if (meta.ExpiresAt < DateTime.UtcNow) return StatusCode(410, "Link expirado");

        // construir URLs para file + download (respectando token)
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
      <strong>Cotización {meta.BudgetId ?? ""}</strong>
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

    // Nuevo: endpoint de diagnóstico /debug para producción
    [HttpGet("debug")]
    public IActionResult Debug()
    {
        try
        {
            var metaExists = System.IO.File.Exists(_metaFilePath);
            var metaContents = metaExists ? System.IO.File.ReadAllText(_metaFilePath) : null;
            var publicFiles = Directory.Exists(_publicFolder) ? Directory.GetFiles(_publicFolder).Select(Path.GetFileName).ToArray() : Array.Empty<string>();
            var tempFiles = Directory.Exists(_tempFolder) ? Directory.GetFiles(_tempFolder).Select(Path.GetFileName).ToArray() : Array.Empty<string>();
            var env = new {
                SENDGRID = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("API_KEY") ?? Environment.GetEnvironmentVariable("SENDGRID_API_KEY")),
                SMTP_HOST = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("SMTP_HOST")),
                EMAIL_FROM = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("EMAIL_FROM") ?? Environment.GetEnvironmentVariable("MAIL"))
            };
            return Ok(new {
                status = "ok",
                metaFilePath = _metaFilePath,
                metaExists,
                metaSample = metaContents != null ? (metaContents.Length > 200 ? metaContents.Substring(0,200) + "..." : metaContents) : null,
                publicFiles,
                tempFiles,
                env
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Debug endpoint error");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
