using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Application.Services;

[ApiController]
[Route("api/worktypes")] // Asegúrate de que la ruta sea correcta
[Authorize]
public class WorkTypeController : ControllerBase
{
    private readonly WorkTypeServices _services;

    public WorkTypeController(WorkTypeServices services)
    {
        _services = services;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var workTypes = await _services.GetAllAsync();
            Console.WriteLine("WorkTypes fetched: " + workTypes.Count()); // Verificar la cantidad de workTypes
            return Ok(workTypes);
        }
        catch (Exception ex)
        {
            // Agrega más detalles de depuración
            Console.WriteLine("Error fetching work types: " + ex.Message);
            Console.WriteLine("Stack Trace: " + ex.StackTrace);
            return StatusCode(500, $"Internal server error: {ex.Message}\n{ex.StackTrace}");
        }
    }
}
