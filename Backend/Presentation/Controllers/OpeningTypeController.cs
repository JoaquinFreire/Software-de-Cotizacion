using Application.Services;
using Application.DTOs.OpeningTypeDTOs.CreateOpeningType;
using Application.DTOs.OpeningTypeDTOs.UpdateOpeningType;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;

namespace Presentation.Controllers;

[Route("api/opening-types")]
[ApiController]
[Authorize]
public class OpeningTypeController : ControllerBase
{
    private readonly OpeningTypeServices _services;
    private IMediator _mediator;
    private readonly IConfiguration _configuration;
    private readonly Cloudinary? _cloudinary;
    private readonly ILogger<OpeningTypeController> _logger;

    // Tamaños en bytes (ajustables)
    private const long MinImageBytes = 5 * 1024;      // 5 KB mínimo
    private const long MaxImageBytes = 5 * 1024 * 1024; // 5 MB máximo

    public OpeningTypeController(OpeningTypeServices services, IMediator mediator, IConfiguration configuration, ILogger<OpeningTypeController> logger)
    {
        _services = services;
        _mediator = mediator;
        _configuration = configuration;
        _logger = logger;

        // Inicializa Cloudinary si hay credenciales en ENV / appsettings
        var cloudName = _configuration["CLOUDINARY_CLOUD_NAME"];
        var apiKey = _configuration["CLOUDINARY_API_KEY"];
        var apiSecret = _configuration["CLOUDINARY_API_SECRET"];

        // Si no hay cloud name, intentar parsear CLOUDINARY_URL: cloudinary://<api_key>:<api_secret>@<cloud_name>
        if (string.IsNullOrWhiteSpace(cloudName))
        {
            var cloudUrl = _configuration["CLOUDINARY_URL"];
            if (!string.IsNullOrWhiteSpace(cloudUrl))
            {
                try
                {
                    var m = Regex.Match(cloudUrl, @"cloudinary://(?<key>[^:]+):(?<secret>[^@]+)@(?<name>.+)");
                    if (m.Success)
                    {
                        apiKey = apiKey ?? m.Groups["key"].Value;
                        apiSecret = apiSecret ?? m.Groups["secret"].Value;
                        cloudName = m.Groups["name"].Value;
                    }
                }
                catch (System.Exception ex)
                {
                    _logger.LogWarning(ex, "Error parsing CLOUDINARY_URL.");
                }
            }
        }

        if (!string.IsNullOrWhiteSpace(cloudName) && !string.IsNullOrWhiteSpace(apiKey) && !string.IsNullOrWhiteSpace(apiSecret))
        {
            try
            {
                _cloudinary = new Cloudinary(new Account(cloudName, apiKey, apiSecret));
                _logger.LogInformation("Cloudinary initialized (cloud name: {cloud}).", cloudName);
            }
            catch (System.Exception ex)
            {
                _logger.LogWarning(ex, "Failed to initialize Cloudinary client.");
            }
        }
        else
        {
            _logger.LogWarning("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME (or CLOUDINARY_URL) and CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET in your environment.");
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _services.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _services.GetByIdAsync(id);
        return result is not null ? Ok(result) : NotFound();
    }

    [HttpPost]
    public async Task<IActionResult> Create()
    {
        var form = await Request.ReadFormAsync();
        var dto = new CreateOpeningTypeDTO
        {
            name = form["name"],
            weight = double.TryParse(form["weight"], out var w) ? w : 0,
            predefined_size = double.TryParse(form["predefined_size"], out var s) ? s : 0,
            description = form["description"] // <-- nueva línea
        };

        var file = form.Files.FirstOrDefault();
        if (file != null)
        {
            if (file.Length < MinImageBytes)
            {
                _logger.LogWarning("Uploaded image too small: {size} bytes.", file.Length);
                return BadRequest(new { message = "La imagen es demasiado pequeña." });
            }
            if (file.Length > MaxImageBytes)
            {
                _logger.LogWarning("Uploaded image too large: {size} bytes.", file.Length);
                return BadRequest(new { message = "La imagen es demasiado grande (máx 5 MB)." });
            }

            if (_cloudinary == null)
            {
                _logger.LogWarning("Received image file but Cloudinary is not configured. Image will be ignored.");
            }
            else
            {
                try
                {
                    using (var stream = file.OpenReadStream())
                    {
                        var uploadParams = new ImageUploadParams
                        {
                            File = new FileDescription(file.FileName, stream),
                            UseFilename = true,
                            UniqueFilename = false,
                            Folder = "openings",
                            // Transformación: limitar dimensiones y aplicar compresión/format automático
                            Transformation = new Transformation()
                                .Width(750).Height(563).Crop("limit")
                                .Quality("auto:eco")
                                .FetchFormat("auto")
                        };

                        var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                        if (uploadResult.StatusCode == System.Net.HttpStatusCode.OK)
                        {
                            dto.image_url = uploadResult.SecureUrl?.ToString();
                            _logger.LogInformation("Image uploaded to Cloudinary, size approx: {url}", dto.image_url);
                        }
                        else
                        {
                            _logger.LogWarning("Cloudinary upload returned status {status} - {info}", uploadResult.StatusCode, uploadResult.Error?.Message);
                        }
                    }
                }
                catch (System.Exception ex)
                {
                    _logger.LogError(ex, "Error uploading image to Cloudinary.");
                }
            }
        }

        var command = _mediator.Send(new CreateOpeningTypeCommand { OpeningType = dto });
        return Ok(await command);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id)
    {
        var form = await Request.ReadFormAsync();
        var dto = new UpdateOpeningTypeDTO
        {
            name = form["name"],
            weight = double.TryParse(form["weight"], out var w) ? w : 0,
            predefined_size = double.TryParse(form["predefined_size"], out var s) ? s : 0,
            description = form["description"] // <-- nueva línea
            // si tu Update DTO tiene otras propiedades agrégalas
        };

        var file = form.Files.FirstOrDefault();
        if (file != null)
        {
            if (file.Length < MinImageBytes)
            {
                _logger.LogWarning("Uploaded image too small: {size} bytes.", file.Length);
                return BadRequest(new { message = "La imagen es demasiado pequeña." });
            }
            if (file.Length > MaxImageBytes)
            {
                _logger.LogWarning("Uploaded image too large: {size} bytes.", file.Length);
                return BadRequest(new { message = "La imagen es demasiado grande (máx 5 MB)." });
            }

            if (_cloudinary == null)
            {
                _logger.LogWarning("Received image file but Cloudinary is not configured. Image will be ignored for update.");
            }
            else
            {
                try
                {
                    using (var stream = file.OpenReadStream())
                    {
                        var uploadParams = new ImageUploadParams
                        {
                            File = new FileDescription(file.FileName, stream),
                            UseFilename = true,
                            UniqueFilename = false,
                            Folder = "openings",
                            Transformation = new Transformation()
                                .Width(750).Height(563).Crop("limit")
                                .Quality("auto:eco")
                                .FetchFormat("auto")
                        };

                        var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                        if (uploadResult.StatusCode == System.Net.HttpStatusCode.OK)
                        {
                            dto.image_url = uploadResult.SecureUrl?.ToString();
                            _logger.LogInformation("Image uploaded to Cloudinary (update): {url}", dto.image_url);
                        }
                        else
                        {
                            _logger.LogWarning("Cloudinary upload (update) returned status {status} - {info}", uploadResult.StatusCode, uploadResult.Error?.Message);
                        }
                    }
                }
                catch (System.Exception ex)
                {
                    _logger.LogError(ex, "Error uploading image to Cloudinary (update).");
                }
            }
        }

        var command = _mediator.Send(new UpdateOpeningTypeCommand { id = id, OpeningType = dto });
        return Ok(await command);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _services.DeleteAsync(id);
        return Ok();
    }
}
