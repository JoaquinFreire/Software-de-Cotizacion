using Application.DTOs;
using Application.DTOs.CustomerDTOs.CreateCustomer;
using Application.Services;
using Domain.Entities;
using Domain.Repositories;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


[ApiController]
[Route("api/customers")]
[Authorize]
public class CustomerController : ControllerBase
{
    private readonly ICustomerRepository _customerRepository;
    private readonly CustomerServices _customerServices;
    private readonly IMediator _mediator;

    public CustomerController(ICustomerRepository customerRepository, CustomerServices customerServices, IMediator mediator)
    {
        _customerRepository = customerRepository;
        _customerServices = customerServices;
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IEnumerable<Customer>> GetAll()
    {
        return await _customerRepository.GetAllAsync();
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var customer = await _customerRepository.GetByIdAsync(id);
        if (customer == null) return NotFound();
        return Ok(customer);
    }

    [HttpGet("dni/{dni}")]
    public async Task<IActionResult> GetByDni(string dni)
    {
        var customer = await _customerRepository.GetByDniAsync(dni);
        if (customer == null) return NotFound();
        return Ok(customer);
    }

    //TODO: Revertir si no funciona
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerDTO customerDTO)
    {
        //if (newCustomer == null) return BadRequest("Invalid data.");

        var command = new CreateCustomerCommand { createCustomerDTO = customerDTO };
        
        var customerId = await _mediator.Send(command);

        return Ok(new { Message = "Cliente creado correctamente.", CustomerId = customerId });
        //await _customerRepository.AddAsync(newCustomer);
        //return CreatedAtAction(nameof(GetById), new { id = newCustomer.id }, newCustomer);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Customer updatedCustomer)
    {
        if (updatedCustomer == null || updatedCustomer.id != id) return BadRequest("Invalid data.");

        await _customerRepository.UpdateAsync(updatedCustomer);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _customerRepository.DeleteAsync(id);
        return NoContent();
    }

    [HttpGet("paged")]
    public async Task<ActionResult<PagedResultDTO<Customer>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        if (page < 1 || pageSize < 1) return BadRequest("Invalid pagination parameters.");
        var (items, total) = await _customerRepository.GetPagedAsync(page, pageSize);
        var result = new PagedResultDTO<Customer>
        {
            Items = items,
            Total = total
        };
        return Ok(result);
    }
}
