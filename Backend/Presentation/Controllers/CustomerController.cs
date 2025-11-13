using System.Linq;
using Application.DTOs.CustomerDTOs.CreateCustomer;
using Application.DTOs.CustomerDTOs.GetCustomer;
using Application.DTOs.CustomerDTOs.UpdateCustomer;
using Application.Services;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // <-- nuevo using


[ApiController]
[Route("api/customers")]
[Authorize]
public class CustomerController : ControllerBase
{
    private readonly CustomerServices _customerServices;
    private readonly IMediator _mediator;
    private readonly IMapper _mapper;
    private readonly AppDbContext _dbContext; // <-- nuevo campo

    public CustomerController(CustomerServices customerServices, IMediator mediator, IMapper mapper, AppDbContext dbContext)
    {
        _customerServices = customerServices;
        _mediator = mediator;
        _mapper = mapper;
        _dbContext = dbContext; // <-- asignación
    }

    [HttpGet]
    public async Task<IEnumerable<GetCustomerDTO>> GetAll()
    {
        var customers = await _customerServices.GetAllAsync();
        return _mapper.Map<IEnumerable<GetCustomerDTO>>(customers);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        Console.WriteLine($"[CustomerController] GET /api/customers/{id} called");
        var customer = await _customerServices.GetByIdAsync(id);
        if (customer == null)
        {
            Console.WriteLine($"[CustomerController] Customer id={id} not found");
            return NotFound();
        }

        // Intento cargar agentes explícitamente si no vienen en la entidad
        try
        {
            var agents = await _dbContext.CustomerAgents
                .FromSqlRaw(@"SELECT ca.* FROM customeragent ca
                              JOIN customer_agent_relation car ON ca.id = car.id_agent
                              WHERE car.id_customer = {0}", customer.id)
                .ToListAsync();

            if (agents != null && agents.Count > 0)
            {
                customer.Agents = agents;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[CustomerController] Warning loading agents for id={id}: {ex.Message}");
        }

        var customerDTO = _mapper.Map<GetCustomerDTO>(customer);
        Console.WriteLine($"[CustomerController] Returning customer DTO id={customerDTO.id}, agentsCount={(customerDTO.agents?.Count() ?? 0)}");
        return Ok(customerDTO); // <-- devolver DTO con agents
    }

    [HttpGet("dni/{dni}")]
    public async Task<IActionResult> GetByDni(string dni)
    {
        Console.WriteLine($"[CustomerController] GET /api/customers/dni/{dni} called");

        // Busco el cliente primero
        var customerEntity = await _dbContext.Customers
            .FirstOrDefaultAsync(c => c.dni == dni);

        if (customerEntity == null)
        {
            Console.WriteLine($"[CustomerController] No customer found for dni={dni}");
            return NotFound(new { Message = $"Cliente con DNI {dni} no encontrado." });
        }

        // Cargo explícitamente los agentes relacionados usando la tabla de relación
        try
        {
            var agents = await _dbContext.CustomerAgents
                .FromSqlRaw(@"SELECT ca.* FROM customeragent ca
                              JOIN customer_agent_relation car ON ca.id = car.id_agent
                              WHERE car.id_customer = {0}", customerEntity.id)
                .ToListAsync();

            customerEntity.Agents = agents ?? new List<Domain.Entities.CustomerAgent>();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[CustomerController] Error loading agents for dni={dni}: {ex.Message}");
            customerEntity.Agents = new List<Domain.Entities.CustomerAgent>();
        }

        var customerDto = _mapper.Map<GetCustomerDTO>(customerEntity);
        Console.WriteLine($"[CustomerController] Returning customer for dni={dni}, agentsCount={(customerDto.agents?.Count() ?? 0)}");
        return Ok(customerDto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerDTO customerDTO)
    {
        //if (newCustomer == null) return BadRequest("Invalid data.");

        var command = new CreateCustomerCommand { createCustomerDTO = customerDTO };
        
        var customerId = await _mediator.Send(command);

        return Ok(new { Message = "Cliente creado correctamente.", CustomerId = customerId });
    }

    [HttpPut("{DNI}")]
    public async Task<IActionResult> Update(string dni, [FromBody] UpdateCustomerDTO updatedCustomer)
    {
        var result = await _mediator.Send(new UpdateCustomerCommand (dni, updatedCustomer));
        return result ? Ok(new { Message = "Cliente actualizado correctamente." }) : BadRequest("No se pudo actualizar el cliente.");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _customerServices.DeleteAsync(id);
        return NoContent();
    }

    [HttpGet("paged")]
    public async Task<ActionResult<PagedResultDTO<GetCustomerDTO>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        if (page < 1 || pageSize < 1) return BadRequest("Invalid pagination parameters.");
        var (items, total) = await _customerServices.GetPagedAsync(page, pageSize);
        var result = new PagedResultDTO<GetCustomerDTO>
        {
            Items = _mapper.Map<IEnumerable<GetCustomerDTO>>(items),
            Total = total
        };
        return Ok(result);
    }
}
