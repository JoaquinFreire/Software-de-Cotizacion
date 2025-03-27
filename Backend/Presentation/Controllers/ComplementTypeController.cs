using Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/complement-types")]
[Authorize]
public class ComplementTypeController : ControllerBase
{
    private readonly IComplementTypeRepository _repository;

    public ComplementTypeController(IComplementTypeRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var complementTypes = await _repository.GetAllAsync();
        return Ok(complementTypes);
    }
}
