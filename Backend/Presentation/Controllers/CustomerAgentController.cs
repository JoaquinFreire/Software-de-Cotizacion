using Application.Services;
using Application.DTOs.CustomerAgentDTOs.CreateCustomerAgent;
using Application.DTOs.CustomerAgentDTOs.UpdateCustomerAgent;
using Application.DTOs.CustomerAgentDTOs.GetCustomerAgent;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/customer-agents")]
[Authorize]
public class CustomerAgentController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly CustomerAgentServices _services;

    public CustomerAgentController(CustomerAgentServices services, IMediator mediator)
    {
        _services = services;
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IEnumerable<GetCustomerAgentDTO>> GetAll()
    {
        return await _services.GetAllAsync();
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var agent = await _services.GetByIdAsync(id);
        if (agent == null) return NotFound();
        return Ok(agent);
    }

    [HttpGet("dni/{dni}")]
    public async Task<IActionResult> GetByDni(string dni)
    {
        var agents = await _services.GetAllAsync();
        var agent = agents.FirstOrDefault(a => a.dni == dni);
        if (agent == null) return NotFound();
        return Ok(agent);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerAgentDTO newAgent)
    {
        var command = await _mediator.Send(new CreateCustomerAgentCommand { AgentDTO = newAgent});
        return Ok(new { Message = "Cliente creado correctamente."});
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCustomerAgentDTO updatedAgent)
    {
        var command = await _mediator.Send(new UpdateCustomerAgentCommand { id = id, AgentDTO = updatedAgent });
        return Ok(new { Message = "Cliente actualizado correctamente."});
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _services.DeleteAsync(id);
        return NoContent();
    }
}
