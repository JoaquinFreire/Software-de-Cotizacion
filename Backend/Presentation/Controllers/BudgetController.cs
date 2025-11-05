using Application.DTOs.BudgetDTOs.CreateBudget;
using Application.DTOs.BudgetDTOs.GetBudget;
using Application.DTOs.BudgetDTOs.GetBudgetByCustomerDni;
using Application.DTOs.BudgetDTOs.DeleteBudget;
using Application.Services;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Presentation.Request;
using Application.DTOs.BudgetDTOs.GetAllBudgetByComplement;
using System.Text.Json; // <-- para serializar en consola
using System.Linq; // <--- agregado

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/Mongo")]
    public class BudgetController : ControllerBase
    {
        private readonly BudgetServices _budgetService;
        private readonly IMapper _mapper;
        private readonly IMediator _mediator;

        public BudgetController(BudgetServices budgetService, IMapper mapper, IMediator mediator)
        {
            _budgetService = budgetService;
            _mapper = mapper;
            _mediator = mediator;
        }

        // Nuevo endpoint: devuelve todas las versiones para un BudgetId (ordenadas: la más reciente primero)
        [HttpGet("GetBudgetVersions/{budgetId}")]
        public async Task<IActionResult> GetBudgetVersions(string budgetId)
        {
            if (string.IsNullOrEmpty(budgetId))
                return BadRequest("BudgetId requerido.");

            var allBudgets = await _budgetService.GetAllBudgetsAsync();

            // Filtrar por BudgetId de forma robusta (soporta propiedades 'budgetId' o 'BudgetId')
            var matches = allBudgets.Where(b =>
            {
                try
                {
                    var t = b.GetType();
                    var p1 = t.GetProperty("budgetId");
                    var p2 = t.GetProperty("BudgetId");
                    var val = p1?.GetValue(b) ?? p2?.GetValue(b);
                    return val != null && val.ToString() == budgetId;
                }
                catch
                {
                    return false;
                }
            }).ToList();

            if (!matches.Any())
                return NotFound("No se encontraron cotizaciones con el BudgetId indicado.");

            // Ordenar: intentar por 'version' (numérica si posible), si no por fecha de creación
            var ordered = matches
                .OrderByDescending(b =>
                {
                    try
                    {
                        var t = b.GetType();
                        var verProp = t.GetProperty("version") ?? t.GetProperty("Version");
                        if (verProp != null)
                        {
                            var v = verProp.GetValue(b);
                            if (v != null && int.TryParse(v.ToString(), out int vi)) return vi;
                        }
                    }
                    catch { }
                    return int.MinValue;
                })
                .ThenByDescending(b =>
                {
                    try
                    {
                        var t = b.GetType();
                        var dateProp = t.GetProperty("creationDate") ?? t.GetProperty("CreationDate") ?? t.GetProperty("file_date");
                        var dv = dateProp?.GetValue(b);
                        if (dv is DateTime dt) return dt;
                    }
                    catch { }
                    return DateTime.MinValue;
                })
                .ToList();

            return Ok(ordered);
        }

        [HttpPost("CreateBudget")]
        public async Task<IActionResult> CreateBudget([FromBody] CreateBudgetRequest request)
        {
            // Log del payload recibido para debug (compara con lo que el frontend imprime)
            Console.WriteLine("CreateBudget endpoint - payload recibido:");
            try
            {
                Console.WriteLine(JsonSerializer.Serialize(request, new JsonSerializerOptions { WriteIndented = true }));
            }
            catch { Console.WriteLine("No se pudo serializar request para log."); }

            // Log de la plantilla que Mongo espera (para comparar)
            var expectedTemplate = new
            {
                Budget = new {
                    budgetId = "string",
                    user = new { name = "string", lastName = "string", mail = "string" },
                    customer = new { name = "string", lastname = "string", tel = "string", mail = "string", address = "string", dni = "string" },
                    agent = new { name = "string", lastname = "string", dni = "string", tel = "string", mail = "string" },
                    workPlace = new { name = "string", location = "string", address = "string", workType = new { type = "string" } },
                    Products = new[] { new { OpeningType = new { name = "string" }, AlumTreatment = new { name = "string" }, GlassType = new { name = "string", Price = 0 }, width = 0, height = 0, WidthPanelQuantity = 0, HeightPanelQuantity = 0, PanelWidth = 0, PanelHeight = 0, Quantity = 0, Accesory = new object[] { }, price = 0 } },
                    complement = new[] { new { ComplementDoor = new object[] { }, ComplementRailing = new object[] { }, ComplementPartition = new object[] { }, price = 0 } },
                    Comment = "string",
                    DollarReference = 0,
                    LabourReference = 0
                }
            };
            Console.WriteLine("CreateBudget endpoint - plantilla esperada por Mongo (ejemplo):");
            Console.WriteLine(JsonSerializer.Serialize(expectedTemplate, new JsonSerializerOptions { WriteIndented = true }));

            if (request == null || request.Budget == null || request.Budget.Products == null)
                return BadRequest("Datos inválidos.");

            // Validar que venga el comentario si es requerido
            // if (string.IsNullOrEmpty(request.Budget.Comment)) return BadRequest("Falta el comentario.");

            // Mapear el DTO a un DTO que el servicio pueda usar (si es necesario)
            var budgetDTO = _mapper.Map<CreateBudgetDTO>(request.Budget);

            var command = new CreateBudgetCommand(budgetDTO);

            var budgetId = await _mediator.Send(command);

            return Ok("Presupuesto creado correctamente.");
        }


        [HttpGet("GetBudgetByBudgetId/{budgetId}")]
        public async Task<IActionResult> GetBudgetByBudgetId(string budgetId)
        {
            var query = new GetBudgetByBudgetIdQuery(budgetId);
            var result = await _mediator.Send(query);

            if (result == null)
                return NotFound("Presupuesto no encontrado.");

            return Ok(result);
        }

        [HttpGet("GetBudgetByCustomerDni/{customerDni}")]
        public async Task<IActionResult> GetBudgetByCustomerDni(string customerDni)
        {
            var query = new GetBudgetByCustomerDniQuery(customerDni);
            var result = await _mediator.Send(query);
            return Ok(result);
        }


        [HttpDelete("DeleteBudget")]
        public async Task<IActionResult> DeleteBudget([FromBody] string id)
        {
            var command = new DeleteBudgetCommand(id);
            return Ok("Cotización con ID:" + id + ", eliminada correctamente");
        }

        [HttpGet("GetAllBudgets")]
        public async Task<IActionResult> GetAllBudgets()
        {
            var budgets = await _budgetService.GetAllBudgetsAsync();
            return Ok(budgets);
        }

        [HttpGet("GetAllBudgetsWithComplements")]
        public async Task<IActionResult> GetAllBudgetsWithComplements([FromQuery] DateTime from, [FromQuery] DateTime to)
        {
            // Validar parámetros
            if (from == default || to == default) return BadRequest("Debe proporcionar desde (from) y hasta (to).");
            if (from > to) return BadRequest("El parámetro 'from' no puede ser posterior a 'to'.");

            var query = new GetAllBudgetByComplementQuery
            {
                FromDate = from,
                ToDate = to
            };

            var result = await _mediator.Send(query);
            return Ok(result);
        }


        [HttpGet("GetBudgetsByPeriod")]
        public async Task<IActionResult> GetBudgetsByPeriod([FromQuery] string from, [FromQuery] string to)
        {
            if (string.IsNullOrEmpty(from) || string.IsNullOrEmpty(to))
                return BadRequest("Debe especificar las fechas 'from' y 'to'.");

            DateTime desde, hasta;
            if (!DateTime.TryParse(from, out desde) || !DateTime.TryParse(to, out hasta))
                return BadRequest("Formato de fecha inválido.");

            var allBudgets = await _budgetService.GetAllBudgetsAsync();
            // Filtra por fecha de creación y estado rechazado
            var filtered = allBudgets.Where(b =>
                (b.creationDate >= desde && b.creationDate <= hasta) &&
                (b.status == Domain.Enums.BudgetStatus.Rejected)
            ).ToList();

            return Ok(filtered);
        }

        [HttpGet("GetMaterialsUsage")]
        public async Task<IActionResult> GetMaterialsUsage([FromQuery] string? from = null, [FromQuery] string? to = null)
        {
            // Log de entrada para verificar si la petición llega al backend
            try
            {
                var remote = HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "unknown";
                Console.WriteLine($">>> GetMaterialsUsage invoked. Remote: {remote}, Path: {Request?.Path}, QueryString: {Request?.QueryString}");
            }
            catch { }

            var allBudgets = await _budgetService.GetAllBudgetsAsync();

            DateTime? fromDt = null, toDt = null;
            if (!string.IsNullOrEmpty(from) && DateTime.TryParse(from, out var f)) fromDt = f;
            if (!string.IsNullOrEmpty(to) && DateTime.TryParse(to, out var t)) toDt = t;

            var openings = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
            var glassByType = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
            var accessories = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
            var treatments = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
            var coatings = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

            object GetProp(object src, string name)
            {
                if (src == null) return null;
                var prop = src.GetType().GetProperty(name, System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.IgnoreCase);
                return prop != null ? prop.GetValue(src) : null;
            }

            decimal ToDecimal(object o)
            {
                if (o == null) return 0m;
                if (o is decimal d) return d;
                if (o is double db) return (decimal)db;
                if (o is float f) return (decimal)f;
                if (o is int i) return i;
                if (o is long l) return l;
                if (o is string s && decimal.TryParse(s.Replace(',', '.'), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var parsed)) return parsed;
                return 0m;
            }

            int ToInt(object o)
            {
                if (o == null) return 0;
                if (o is int i) return i;
                if (o is long l) return (int)l;
                if (o is decimal d) return (int)d;
                if (o is double db) return (int)db;
                if (o is string s && int.TryParse(s, out var parsed)) return parsed;
                return 0;
            }

            DateTime? GetCreationDate(object budget)
            {
                var d = GetProp(budget, "creationDate") ?? GetProp(budget, "CreationDate") ?? GetProp(budget, "file_date");
                if (d == null) return null;
                if (d is DateTime dt) return dt;
                if (DateTime.TryParse(d.ToString(), out var parsed)) return parsed;
                return null;
            }

            foreach (var b in allBudgets)
            {
                var cd = GetCreationDate(b);
                if (fromDt.HasValue && (!cd.HasValue || cd.Value < fromDt.Value)) continue;
                if (toDt.HasValue && (!cd.HasValue || cd.Value > toDt.Value)) continue;

                var productsObj = GetProp(b, "Products") ?? GetProp(b, "products");
                if (productsObj == null) continue;

                if (productsObj is System.Collections.IEnumerable productsEnum)
                {
                    foreach (var p in productsEnum)
                    {
                        if (p == null) continue;

                        var openingName = GetProp(GetProp(p, "OpeningType"), "name")?.ToString() ?? GetProp(p, "OpeningType")?.ToString() ?? "Unknown Opening";
                        int quantity = ToInt(GetProp(p, "Quantity") ?? GetProp(p, "quantity"));
                        int wPanels = ToInt(GetProp(p, "WidthPanelQuantity") ?? GetProp(p, "widthPanelQuantity") ?? GetProp(p, "WidthPanel") ?? GetProp(p, "WidthPanelQty"));
                        int hPanels = ToInt(GetProp(p, "HeightPanelQuantity") ?? GetProp(p, "heightPanelQuantity") ?? GetProp(p, "HeightPanel") ?? GetProp(p, "HeightPanelQty"));
                        int panels = Math.Max(1, (wPanels == 0 || hPanels == 0) ? 1 : wPanels * hPanels);
                        decimal openUnits = quantity * panels;
                        if (!openings.ContainsKey(openingName)) openings[openingName] = 0m;
                        openings[openingName] += openUnits;

                        decimal panelWidth = ToDecimal(GetProp(p, "PanelWidth") ?? GetProp(p, "panelWidth") ?? GetProp(p, "PanelWidthCm"));
                        decimal panelHeight = ToDecimal(GetProp(p, "PanelHeight") ?? GetProp(p, "panelHeight") ?? GetProp(p, "PanelHeightCm"));
                        if (panelWidth == 0m) panelWidth = ToDecimal(GetProp(p, "Width") ?? GetProp(p, "width"));
                        if (panelHeight == 0m) panelHeight = ToDecimal(GetProp(p, "Height") ?? GetProp(p, "height"));

                        decimal panelAreaM2 = 0m;
                        if (panelWidth > 0 && panelHeight > 0)
                        {
                            panelAreaM2 = (panelWidth / 100m) * (panelHeight / 100m);
                        }
                        decimal totalGlassArea = panelAreaM2 * panels * quantity;
                        var glassName = GetProp(GetProp(p, "GlassType"), "name")?.ToString() ?? GetProp(p, "GlassType")?.ToString() ?? "Unknown Glass";
                        if (!glassByType.ContainsKey(glassName)) glassByType[glassName] = 0m;
                        glassByType[glassName] += Math.Round(totalGlassArea, 3);

                        var treatName = GetProp(GetProp(p, "AlumTreatment"), "name")?.ToString() ?? GetProp(p, "AlumTreatment")?.ToString();
                        if (!string.IsNullOrEmpty(treatName))
                        {
                            if (!treatments.ContainsKey(treatName)) treatments[treatName] = 0m;
                            treatments[treatName] += quantity;
                        }

                        var coatingName = GetProp(GetProp(p, "Coating"), "name")?.ToString() ?? GetProp(p, "Coating")?.ToString();
                        if (!string.IsNullOrEmpty(coatingName))
                        {
                            if (!coatings.ContainsKey(coatingName)) coatings[coatingName] = 0m;
                            coatings[coatingName] += quantity;
                        }

                        var accsObj = GetProp(p, "Accesory") ?? GetProp(p, "Accesories") ?? GetProp(p, "Accesorio");
                        if (accsObj is System.Collections.IEnumerable accEnum)
                        {
                            foreach (var acc in accEnum)
                            {
                                if (acc == null) continue;
                                var accName = GetProp(acc, "Name")?.ToString() ?? GetProp(acc, "name")?.ToString() ?? "Unknown Accessory";
                                int accQty = ToInt(GetProp(acc, "Quantity") ?? GetProp(acc, "quantity") ?? GetProp(acc, "Qty"));
                                decimal totalAcc = accQty * quantity;
                                if (!accessories.ContainsKey(accName)) accessories[accName] = 0m;
                                accessories[accName] += totalAcc;
                            }
                        }
                    }
                }

                var complements = GetProp(b, "Complement") ?? GetProp(b, "complement");
                if (complements is System.Collections.IEnumerable compEnum)
                {
                    foreach (var comp in compEnum)
                    {
                        if (comp == null) continue;
                        var doorsObj = GetProp(comp, "ComplementDoor") ?? GetProp(comp, "complementDoor");
                        if (doorsObj is System.Collections.IEnumerable doorsEnum)
                        {
                            foreach (var d in doorsEnum)
                            {
                                if (d == null) continue;
                                var name = GetProp(d, "Name")?.ToString() ?? "Door";
                                int qty = ToInt(GetProp(d, "Quantity") ?? GetProp(d, "quantity"));
                                if (!accessories.ContainsKey(name)) accessories[name] = 0m;
                                accessories[name] += qty;
                                var coat = GetProp(GetProp(d, "Coating"), "name")?.ToString();
                                if (!string.IsNullOrEmpty(coat))
                                {
                                    if (!coatings.ContainsKey(coat)) coatings[coat] = 0m;
                                    coatings[coat] += qty;
                                }
                            }
                        }

                        var railObj = GetProp(comp, "ComplementRailing") ?? GetProp(comp, "complementRailing");
                        if (railObj is System.Collections.IEnumerable railEnum)
                        {
                            foreach (var r in railEnum)
                            {
                                var name = GetProp(r, "Name")?.ToString() ?? "Railing";
                                int qty = ToInt(GetProp(r, "Quantity") ?? GetProp(r, "quantity"));
                                if (!accessories.ContainsKey(name)) accessories[name] = 0m;
                                accessories[name] += qty;
                            }
                        }
                    }
                }
            }

                        var topOpenings = openings.OrderByDescending(kv => kv.Value).ToDictionary(k => k.Key, v => Math.Round(v.Value, 2));
                        var topGlass = glassByType.OrderByDescending(kv => kv.Value).ToDictionary(k => k.Key, v => Math.Round(v.Value, 3));
                        var topAccessories = accessories.OrderByDescending(kv => kv.Value).ToDictionary(k => k.Key, v => Math.Round(v.Value, 2));
                        var topTreatments = treatments.OrderByDescending(kv => kv.Value).ToDictionary(k => k.Key, v => (int)v.Value);
                        var topCoatings = coatings.OrderByDescending(kv => kv.Value).ToDictionary(k => k.Key, v => (int)v.Value);
            
                        return Ok(new { 
                            openings = topOpenings,
                            glass = topGlass,
                            accessories = topAccessories,
                            treatments = topTreatments,
                            coatings = topCoatings
                        });
            
                    }
            
                }
            
            }