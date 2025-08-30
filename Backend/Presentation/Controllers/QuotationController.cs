using Application.UseCases;
using Application.Services;
using Domain.Entities;
using Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using Application.DTOs.QuotationDTOs; // Agrega el using para los DTOs
using MediatR; // Agrega el using para MediatR

[ApiController]
[Route("api/quotations")]
[Authorize]
public class QuotationController : ControllerBase
{
    private readonly QuotationServices _services;
    private readonly IQuotationRepository _quotationRepository;
    private readonly CreateQuotation _createQuotation;
    private readonly ICustomerRepository _customerRepository;
    private readonly IUserRepository _userRepository;
    private readonly IWorkPlaceRepository _workPlaceRepository;
    private readonly IMediator _mediator; // Agrega la propiedad IMediator

    public QuotationController(
        QuotationServices services,
        IQuotationRepository quotationRepository,
        CreateQuotation createQuotation,
        ICustomerRepository customerRepository,
        IUserRepository userRepository,
        IWorkPlaceRepository workPlaceRepository,
        IMediator mediator // Agrega el parámetro IMediator
    )
    {
        _services = services;
        _quotationRepository = quotationRepository;
        _createQuotation = createQuotation;
        _customerRepository = customerRepository;
        _userRepository = userRepository;
        _workPlaceRepository = workPlaceRepository;
        _mediator = mediator; // Asigna el mediator
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 5, [FromQuery] string? status = null)
    {
        var query = _services.Query();
        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(q => q.Status == status);
        }
        var total = await query.CountAsync();
        var quotations = await query
            .OrderByDescending(q => q.CreationDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        Console.WriteLine("prueba!" + quotations);
        return Ok(new { total, quotations = quotations ?? new List<Quotation>() });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var quotation = await _services.GetByIdAsync(id);
        if (quotation == null) return NotFound();
        return Ok(new
        {
            quotation.Id,
            quotation.CustomerId,
            quotation.UserId,
            quotation.WorkPlaceId,
            quotation.Status,
            quotation.TotalPrice,
            LastEdit = quotation.LastEdit.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            CreationDate = quotation.CreationDate.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            Customer = new
            {
                Customer = quotation.Customer == null ? null : new
                {
                    quotation.Customer.id,
                    quotation.Customer.name,
                    quotation.Customer.lastname,
                    quotation.Customer.tel,
                    quotation.Customer.mail,
                    quotation.Customer.address,
                    RegistrationDate = quotation.Customer.registration_date.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    Agents = quotation.Customer.Agents?.Select(a => new {
                        a.id,
                        a.name,
                        a.lastname,
                        a.tel,
                        a.mail
                    }).ToList()
                }
            },
            WorkPlace = new
            {
                quotation.WorkPlace?.id,
                quotation.WorkPlace?.name,
                quotation.WorkPlace?.location,
                quotation.WorkPlace?.address,
                quotation.WorkPlace?.workTypeId
            }
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] QuotationFullRequest request)
    {
        // LOG DEL REQUEST RECIBIDO
        Console.WriteLine("Request recibido en /api/quotations:");
        Console.WriteLine(System.Text.Json.JsonSerializer.Serialize(request));
        Console.WriteLine("Contenido de customer.agent:");
        Console.WriteLine(request.customer.Agents == null ? "AGENTE ES NULL" : System.Text.Json.JsonSerializer.Serialize(request.customer.Agents));

        // Permitir totalPrice en 0 si hay aberturas o complementos
        bool hasOpenings = request?.openings != null && request.openings.Count > 0;
        bool hasComplements = request?.complements != null && request.complements.Count > 0;
        if (request == null || (!hasOpenings && !hasComplements))
            return BadRequest("Datos inválidos.");

        // 1. Agentes (si vienen en el payload)
        List<CustomerAgent> agents = new();
        var dbContext = HttpContext.RequestServices.GetService(typeof(AppDbContext)) as AppDbContext;

        if (request.customer?.Agents != null && request.customer.Agents.Count > 0)
        {
            foreach (var agentDto in request.customer.Agents)
            {
                // Buscar agente existente por DNI
                var existingAgent = await dbContext.CustomerAgents.FirstOrDefaultAsync(a => a.dni == agentDto.dni);
                if (existingAgent != null)
                {
                    Console.WriteLine($"[AGENTE] Encontrado existente: id={existingAgent.id}, dni={existingAgent.dni}");
                    agents.Add(existingAgent);
                }
                else
                {
                    var agent = new CustomerAgent
                    {
                        name = agentDto.name,
                        lastname = agentDto.lastname,
                        dni = agentDto.dni,
                        tel = agentDto.tel,
                        mail = agentDto.mail
                    };
                    dbContext.CustomerAgents.Add(agent);
                    agents.Add(agent);
                    Console.WriteLine($"[AGENTE] Nuevo agregado: dni={agent.dni}");
                }
            }
            await dbContext.SaveChangesAsync();
        }

        // 2. Cliente
        Customer customer = null;
        if (request.customer != null && !string.IsNullOrWhiteSpace(request.customer.dni))
        {
            customer = await _customerRepository.GetByDniAsync(request.customer.dni);
            if (customer == null)
            {
                customer = new Customer
                {
                    name = request.customer.name,
                    lastname = request.customer.lastname,
                    tel = request.customer.tel,
                    mail = request.customer.mail,
                    address = request.customer.address,
                    dni = request.customer.dni,
                    // Asocia los agentes creados
                    Agents = agents
                };
                await _customerRepository.AddAsync(customer);
                Console.WriteLine($"[CLIENTE] Nuevo cliente creado: dni={customer.dni}");
            }
            else
            {
                Console.WriteLine($"[CLIENTE] Cliente existente: id={customer.id}, dni={customer.dni}");
                // Si el cliente ya existe, asegurate de asociar los agentes (relación n a n)
                foreach (var agent in agents)
                {
                    Console.WriteLine($"[RELACION] Intentando asociar cliente {customer.id} con agente {agent.id}");
                    // Verifica si la relación ya existe usando LINQ
                    var exists = await dbContext.Set<Dictionary<string, object>>("customer_agent_relation")
                        .AnyAsync(r =>
                            EF.Property<int>(r, "id_customer") == customer.id &&
                            EF.Property<int>(r, "id_agent") == agent.id
                        );
                    Console.WriteLine($"[RELACION] ¿Ya existe relación ({customer.id},{agent.id})?: {exists}");
                    if (!exists)
                    {
                        Console.WriteLine($"[RELACION] Insertando relación ({customer.id},{agent.id})");
                        var relation = new Dictionary<string, object>
                        {
                            { "id_customer", customer.id },
                            { "id_agent", agent.id }
                        };
                        dbContext.Set<Dictionary<string, object>>("customer_agent_relation").Add(relation);
                        await dbContext.SaveChangesAsync();
                    }
                    else
                    {
                        Console.WriteLine($"[RELACION] Ya existe relación ({customer.id},{agent.id})");
                    }
                }
            }
        }
        else
        {
            Console.WriteLine("[ERROR] Datos de cliente inválidos.");
            return BadRequest("Datos de cliente inválidos.");
        }

        // 3. WorkPlace
        WorkPlace workPlace = null;
        if (request.workPlace != null)
        {
            // Asegúrate de asignar un valor a location
            workPlace = new WorkPlace
            {
                name = request.workPlace.name,
                address = request.workPlace.address,
                // Asigna location, usa "" si no tienes un campo específico
                location = request.workPlace.location ?? "", // <-- Cambia esto según tu DTO, o usa string.Empty
                workTypeId = int.TryParse(request.workPlace.workTypeId.ToString(), out var wtid) ? wtid : 1
            };
            await _workPlaceRepository.AddAsync(workPlace);
        }
        else
        {
            return BadRequest("Datos de espacio de trabajo inválidos.");
        }

        // Validar que haya al menos una abertura o un complemento
        hasOpenings = request.openings != null && request.openings.Count > 0;
        hasComplements = request.complements != null && request.complements.Count > 0;
        if (!hasOpenings && !hasComplements)
        {
            return BadRequest("Debe agregar al menos una abertura o un complemento.");
        }

        // 4. Crear la cotización
        var quotation = new Quotation
        {
            CustomerId = customer.id,
            UserId = int.TryParse(request.userId?.ToString(), out var uid) ? uid : 0,
            WorkPlaceId = workPlace.id,
            TotalPrice = request.totalPrice,
            Status = "pending",
            LastEdit = DateTime.UtcNow,
            CreationDate = DateTime.UtcNow
        };
        await _quotationRepository.AddAsync(quotation);

        // 4. (Opcional) Guardar aberturas y complementos relacionados si tienes tablas intermedias
        // Aquí deberías agregar la lógica para guardar en tablas intermedias si tu modelo lo requiere

        return CreatedAtAction(nameof(GetById), new { id = quotation.Id }, quotation);
    }
    [HttpGet("by-period")]
    public async Task<IActionResult> GetByPeriod([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var quotations = await _quotationRepository.GetByPeriodAsync(from, to);
        return Ok(quotations);
    }
    

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        var quotation = await _quotationRepository.GetByIdAsync(id);
        if (quotation == null) return NotFound();

        quotation.Status = request.Status ?? quotation.Status;
        await _quotationRepository.UpdateAsync(quotation);

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _quotationRepository.DeleteAsync(id);
        return NoContent();
    }

    [HttpGet("advanced-search")]
    public async Task<IActionResult> AdvancedSearch(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] string? status = null,
        [FromQuery] decimal? approxTotalPrice = null,
        [FromQuery] DateTime? lastEditFrom = null,
        [FromQuery] int? userId = null,
        [FromQuery] string? customerDni = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5
    )
    {
        var query = _quotationRepository.Query();

        if (from.HasValue)
            query = query.Where(q => q.CreationDate >= from.Value);
        if (to.HasValue)
            query = query.Where(q => q.CreationDate <= to.Value);
        if (!string.IsNullOrEmpty(status))
            query = query.Where(q => q.Status == status);
        if (approxTotalPrice.HasValue)
            query = query.Where(q => q.TotalPrice == approxTotalPrice.Value);
        if (lastEditFrom.HasValue)
            query = query.Where(q => q.LastEdit >= lastEditFrom.Value);
        if (userId.HasValue)
            query = query.Where(q => q.UserId == userId.Value);
        if (!string.IsNullOrEmpty(customerDni))
            query = query.Where(q => q.Customer.dni == customerDni);

        var total = await query.CountAsync();
        var quotations = await query
            .OrderByDescending(q => q.CreationDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { total, quotations });
    }

    [HttpGet("by-period-location")]
    public async Task<IActionResult> GetByPeriodAndLocation([FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] string location)
    {
        var query = new GetQuotationsByPeriodAndLocationQuery
        {
            From = from,
            To = to,
            Location = location
        };
        var result = await _mediator.Send(query);
        return Ok(result);
    }
}

// DTOs internos
public class UpdateStatusRequest
{
    public string? Status { get; set; }
}

public class QuotationFullRequest
{
    public Customer customer { get; set; }
    public WorkPlaceDto workPlace { get; set; }
    public List<OpeningDto> openings { get; set; }
    public List<ComplementDto> complements { get; set; }
    public string userId { get; set; }
    public decimal totalPrice { get; set; }
}

public class WorkPlaceDto
{
    public string name { get; set; }
    public string address { get; set; }
    public string location { get; set; }
    public int workTypeId { get; set; }
}

public class OpeningDto
{
    public int typeId { get; set; }
    public double width { get; set; }
    public double height { get; set; }
    public int quantity { get; set; }
    public int treatmentId { get; set; }
    public int glassTypeId { get; set; }
    // Puedes agregar más campos si necesitas
}

public class ComplementDto
{
    public int id { get; set; }
    public int quantity { get; set; }
    public decimal price { get; set; }
    // Puedes agregar más campos si necesitas
}