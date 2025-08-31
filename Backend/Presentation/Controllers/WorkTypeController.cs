using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Application.Services;

[ApiController]
[Route("api/worktypes")]
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
            if (workTypes == null)
            {
                Console.WriteLine("WorkTypes is null!");
                return StatusCode(500, "No se pudo obtener la lista de tipos de trabajo.");
            }
            var list = workTypes.ToList();
            Console.WriteLine("WorkTypes fetched: " + list.Count);
            return Ok(list);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error fetching work types: " + ex.Message);
            Console.WriteLine("Stack Trace: " + ex.StackTrace);
            return StatusCode(500, $"Internal server error: {ex.Message}\n{ex.StackTrace}");
        }
    }
}
