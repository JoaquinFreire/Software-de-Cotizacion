using Domain.Entities;
using Domain.Repositories;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

[ApiController]
[Route("api/worktypes")] // Asegúrate de que la ruta sea correcta
public class WorkTypeController : ControllerBase
{
    private readonly IWorkTypeRepository _workTypeRepository;

    public WorkTypeController(IWorkTypeRepository workTypeRepository)
    {
        _workTypeRepository = workTypeRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var workTypes = await _workTypeRepository.GetAllAsync();
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
