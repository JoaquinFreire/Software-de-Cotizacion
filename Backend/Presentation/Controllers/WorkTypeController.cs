using Domain.Entities;
using Domain.Repositories;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

[ApiController]
[Route("api/worktypes")]
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
            return Ok(workTypes);
        }
        catch (Exception ex)
        {
            // Agrega más detalles de depuración
            return StatusCode(500, $"Internal server error: {ex.Message}\n{ex.StackTrace}");
        }
    }
}
