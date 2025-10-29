using Domain.Entities;
using Domain.Repositories;
using System.Text;
using System.Globalization; // <-- nuevo para parseo robusto
using System.Threading.Tasks;
using System.Reflection;
using System.Linq; // <-- requerido para Where/Any
using System.Text.Json; // <-- añadido para manejar JsonElement

namespace Domain.Services
{
    public class BudgetCalculator
    {

        private readonly IOpeningTypeRepository _openingRepository;
        private readonly IAccesoryRepository _accesoryRepository;
        private readonly IPriceRepository _priceRepository;
        private readonly IAlumTreatmentRepository _alumTreatmentRepository;
        private readonly IGlassTypeRepository _glassTypeRepository;
        private readonly IComplementPartitionRepository _partitionRepository;
        private readonly IComplementDoorRepository _doorRepository;
        private readonly IComplementRailingRepository _railingRepository;
        private readonly ICoatingRepository _coatingRepository;

        public BudgetCalculator(
            IOpeningTypeRepository openingTypeRepository, 
            IPriceRepository priceRepository, 
            IAlumTreatmentRepository alumTreatmentRepository, 
            IGlassTypeRepository glassTypeRepository, 
            IComplementPartitionRepository partitionRepository, 
            IComplementDoorRepository doorRepository,
            IComplementRailingRepository railingRepository,
            ICoatingRepository coatingRepository,
            IAccesoryRepository accesoryRepository)
        {
            _openingRepository = openingTypeRepository;
            _priceRepository = priceRepository;
            _alumTreatmentRepository = alumTreatmentRepository;
            _glassTypeRepository = glassTypeRepository;
            _partitionRepository = partitionRepository;
            _doorRepository = doorRepository;
            _coatingRepository = coatingRepository;
            _accesoryRepository = accesoryRepository;
            _railingRepository = railingRepository;


        }

        // CAMBIO: ahora devuelve una tupla con (precioTotalPorUnidadIncluyendoImpuestos, desgloseTextual, subtotalSinImpuestosPorUnidad)
        private async Task<(decimal totalPrice, string breakdown, decimal subtotal)> CalculateOpeningPrice(Budget_Product budget_Product, bool excludeBackendTaxes = false, decimal? labourRateOverride = null) {

            // AGREGAR VALIDACIÓN AL INICIO
            if (budget_Product?.OpeningType == null)
            {
                throw new ArgumentNullException(nameof(budget_Product.OpeningType), "OpeningType no puede ser nulo.");
            }

            if (string.IsNullOrEmpty(budget_Product.OpeningType.name))
            {
                throw new ArgumentException("El nombre del OpeningType no puede estar vacío.");
            }

            // (todo el cálculo previo se mantiene igual hasta que se obtiene subtotal y totalPrice)
            // 1. CALCULAR ALUMINIO 
            // Obtener el peso por metro del tipo de abertura
            Console.WriteLine($"Buscando OpeningType: '{budget_Product.OpeningType.name}'");
            var openingType = await _openingRepository.GetByNameAsync(budget_Product.OpeningType.name);
            if (openingType == null)
            {
                throw new KeyNotFoundException($"No se encontró el tipo de abertura en la base de datos: '{budget_Product.OpeningType.name}'. Verifica que exista en la tabla opening_type.");
            }

            Console.WriteLine($"OpeningType encontrado - ID: {openingType.id}, Peso: {openingType.weight}");

            double weightPerMeter;
            try
            {
                weightPerMeter = Convert.ToDouble(openingType.weight);
                Console.WriteLine($"Peso convertido a double: {weightPerMeter} kg/m");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error convirtiendo peso: {ex.Message}");
                throw new FormatException($"No se pudo convertir el peso '{openingType.weight}' a número. Tipo: {openingType.weight.GetType()}");
            }

            // Determinar consumo de aluminio
            int totalPanels = budget_Product.HeightPanelQuantity * budget_Product.WidthPanelQuantity; // número total de paneles
     

            // PanelWidth and PanelHeight in budget_Product are expected in cm.
            // PARA COINCIDIR con el cálculo del FRONTEND: trabajar en mm exactamente como allí,
            // luego convertir a metros y calcular el peso.
            // ancho/alto del panel (cm -> mm)
            double panelWidthMm = (double)budget_Product.PanelWidth * 10.0; // cm -> mm
            double panelHeightMm = (double)budget_Product.PanelHeight * 10.0; // cm -> mm

            // Perímetro del panel en mm
            double panelPerimeterMm = 2.0 * (panelWidthMm + panelHeightMm);
            // Longitud total de aluminio en mm por UNA abertura
            double totalAluminumLengthMm = panelPerimeterMm * totalPanels;
            // Convertir a metros (1 m = 1000 mm)
            double totalAluminumLengthM = totalAluminumLengthMm / 1000.0;
            // Peso en kg = longitud (m) * peso por metro
            double aluminumWeight = totalAluminumLengthM * weightPerMeter;

            // REDONDEAR el peso a 0 decimales (usar entero como el frontend muestra 1377.00)
            // luego se formatea con F2 en el desglose para mostrar "1377.00"
            decimal roundedAluminumWeight = Math.Round((decimal)aluminumWeight, 0, MidpointRounding.AwayFromZero);

            var aluminumPriceData = await _priceRepository.GetByIdAsync(1); // precio del aluminio
            var aluminiumScrapPorcentagePriceData = await _priceRepository.GetByIdAsync(15); // porcentaje de desperdicio de aluminio
            decimal aluminumPricePerKg = aluminumPriceData.price;
            decimal aluminumScrapPercentage = aluminiumScrapPorcentagePriceData.price;
            // Por compatibilidad con frontend: si se solicita excludeBackendTaxes, NO aplicar scrap aquí.
            // Usar el peso redondeado para los cálculos (como hace el frontend)
            decimal baseAluminumCost = roundedAluminumWeight * aluminumPricePerKg;  // costo base sin scrap
            decimal scrapAluminumAmount = 0m;
            if (!excludeBackendTaxes)
            {
                scrapAluminumAmount = (baseAluminumCost * aluminumScrapPercentage) / 100;
            }
            decimal totalAluminumCost = baseAluminumCost + scrapAluminumAmount;

            // 2. CALCULAR VIDRIO
            // Área de cada panel (m²): panelWidthM * panelHeightM
            // Calcular área en m² tomando los mm originales (coherente con frontend)
            double panelAreaM2 = (panelWidthMm / 1000.0) * (panelHeightMm / 1000.0); // m²
            double totalGlassArea = panelAreaM2 * totalPanels; // área total de vidrio en m² por UNA abertura
        
            // Preferir el precio que venga en el payload (si el frontend lo envió)
            decimal glassPricePerM2 = 0m;
            try
            {
                if (budget_Product?.GlassType != null)
                {
                    var gt = budget_Product.GlassType;
                    // intento directo (si el modelo fuere fuertemente tipado)
                    try { glassPricePerM2 = gt.price; } catch { }

                    if (glassPricePerM2 == 0m)
                    {
                        var gtypeRef = gt.GetType();
                        // Buscar propiedad Price/price/Precio sin case-sensitive
                        var prop = gtypeRef.GetProperty("Price", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase)
                                   ?? gtypeRef.GetProperty("precio", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase)
                                   ?? gtypeRef.GetProperty("price", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                        if (prop != null)
                        {
                            var val = prop.GetValue(gt);
                            if (val is decimal d) glassPricePerM2 = d;
                            else if (val is double db) glassPricePerM2 = (decimal)db;
                            else if (val is float f) glassPricePerM2 = (decimal)f;
                            else if (val is string s && decimal.TryParse(s.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed)) glassPricePerM2 = parsed;
                            else if (val is JsonElement je)
                            {
                                if (je.ValueKind == JsonValueKind.Number)
                                {
                                    if (je.TryGetDecimal(out var jd)) glassPricePerM2 = jd;
                                    else if (je.TryGetDouble(out var jdb)) glassPricePerM2 = (decimal)jdb;
                                }
                                else if (je.ValueKind == JsonValueKind.String)
                                {
                                    var s2 = je.GetString();
                                    if (!string.IsNullOrEmpty(s2) && decimal.TryParse(s2.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed2)) glassPricePerM2 = parsed2;
                                }
                            }
                        }
                        // Si sigue en 0, intentar leer Id desde payload (Id/id) para consultar repo por id
                        if (glassPricePerM2 == 0m)
                        {
                            var idProp = gtypeRef.GetProperty("Id", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase)
                                         ?? gtypeRef.GetProperty("id", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                            if (idProp != null)
                            {
                                var idVal = idProp.GetValue(gt);
                                if (idVal != null && int.TryParse(idVal.ToString(), out var gid))
                                {
                                    try
                                    {
                                        var glassFromRepoById = await _glassTypeRepository.GetByIdAsync(gid);
                                        if (glassFromRepoById != null) glassPricePerM2 = glassFromRepoById.price;
                                    }
                                    catch { /* ignore */ }
                                }
                            }
                        }
                    }
                }
            }
            catch { /* ignore */ }

            var glassScrapData = await _priceRepository.GetByIdAsync(17); // porcentaje de desperdicio del vidrio
            // Si aún no tenemos precio por m2, intentar fallback por nombre si existe
            if (glassPricePerM2 == 0m)
            {
                try
                {
                    var gnameProp = budget_Product?.GlassType?.GetType().GetProperty("name", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                    var gname = gnameProp != null ? gnameProp.GetValue(budget_Product.GlassType)?.ToString() : budget_Product?.GlassType?.name;
                    if (!string.IsNullOrEmpty(gname))
                    {
                        var glassTypeRepo = await _glassTypeRepository.GetByNameAsync(gname);
                        if (glassTypeRepo != null) glassPricePerM2 = glassTypeRepo.price;
                    }
                }
                catch { /* ignore */ }
            }
            // REDONDEAR área a 3 decimales antes de multiplicar (para coincidir con frontend)
            decimal roundedGlassArea = Math.Round((decimal)totalGlassArea, 3, MidpointRounding.AwayFromZero);
            decimal baseGlassCost = roundedGlassArea * glassPricePerM2;
            decimal scrapGlassAmount = 0m;
            if (!excludeBackendTaxes)
            {
                scrapGlassAmount = (baseGlassCost * glassScrapData.price) / 100;
            }
            decimal totalGlassCost = baseGlassCost + scrapGlassAmount;
            try { budget_Product.GlassType.price = totalGlassCost; } catch { /* ignore */ }

            // --- MOSQUITERA (opcional por abertura) ---
            bool mosquitoSelected = false;
            try
            {
                var mprop = budget_Product.GetType().GetProperty("Mosquito", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase)
                         ?? budget_Product.GetType().GetProperty("mosquito", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                if (mprop != null)
                {
                    var mval = mprop.GetValue(budget_Product);
                    if (mval is bool mb) mosquitoSelected = mb;
                    else if (mval is JsonElement je)
                    {
                        if (je.ValueKind == JsonValueKind.Object)
                        {
                            if (je.TryGetProperty("selected", out var sel) && sel.ValueKind == JsonValueKind.True) mosquitoSelected = true;
                        }
                        else if (je.ValueKind == JsonValueKind.True) mosquitoSelected = true;
                    }
                    else if (mval is string s && bool.TryParse(s, out var parsed)) mosquitoSelected = parsed;
                }
            }
            catch { /* ignore */ }

            decimal mosquitoCost = 0m;
            decimal mosquitoPricePerM2 = 0m;
            if (mosquitoSelected)
            {
                try
                {
                    var mosquitoPriceData = await _priceRepository.GetByIdAsync(7); // Tela Mosquitera
                    mosquitoPricePerM2 = mosquitoPriceData?.price ?? 0m;
                    mosquitoCost = roundedGlassArea * mosquitoPricePerM2;
                }
                catch { mosquitoCost = 0m; }
            }

            // 3. CALCULAR TRATAMIENTO DE ALUMINIO
            // Preferir el porcentaje que venga en el payload (si aplica), sino fallback a repo
            var alumTreatmentScrapData = await _priceRepository.GetByIdAsync(16); // porcentaje de desperdicio del tratamiento de aluminio
            decimal alumTreatmentPct = 0m;
            bool alumPctFromPayload = false;
            try
            {
                if (budget_Product?.AlumTreatment != null)
                {
                    // intentar leer pricePercentage o price desde payload (puede venir como string decimal)
                    var at = budget_Product.AlumTreatment;
                    // si existe propiedad pricePercentage y no es vacía, parsearla
                    if (!string.IsNullOrEmpty(at.pricePercentage))
                    {
                        var normalized = at.pricePercentage.Replace(',', '.').Replace("%", "");
                        if (decimal.TryParse(normalized, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed)) { alumTreatmentPct = parsed; alumPctFromPayload = true; }
                    }
                    // si no vino en pricePercentage, intentar propiedades alternativas (Price, price)
                    if (!alumPctFromPayload)
                    {
                        var atRef = at.GetType();
                        var prop = atRef.GetProperty("Price") ?? atRef.GetProperty("price");
                        if (prop != null)
                        {
                            var val = prop.GetValue(at);
                            if (val is decimal d) { alumTreatmentPct = d; alumPctFromPayload = true; }
                            else if (val is double db) { alumTreatmentPct = (decimal)db; alumPctFromPayload = true; }
                            else if (val is string s && decimal.TryParse(s.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed2)) { alumTreatmentPct = parsed2; alumPctFromPayload = true; }
                        }
                    }
                }
            }
            catch { /* ignore */ }

            // si no vino en payload, buscar en repo (comportamiento previo)
            if (!alumPctFromPayload)
            {
                var alumTreatmentRepo = await _alumTreatmentRepository.GetByNameAsync(budget_Product.AlumTreatment.name);
                if (alumTreatmentRepo != null)
                {
                    var normalized = (alumTreatmentRepo.pricePercentage ?? "").Replace(',', '.').Replace("%", "");
                    decimal.TryParse(normalized, NumberStyles.Any, CultureInfo.InvariantCulture, out alumTreatmentPct);
                }
                Console.WriteLine($"Porcentaje tratamiento (desde repo) '{budget_Product.AlumTreatment.name}': {alumTreatmentPct}%");
            }
            else
            {
                Console.WriteLine($"Porcentaje tratamiento (desde payload) '{budget_Product.AlumTreatment.name}': {alumTreatmentPct}%");
            }

            // Calcular tratamiento SOBRE el costo base del aluminio (no sobre el costo ya con scrap)
            decimal treatmentBase = (baseAluminumCost * alumTreatmentPct) / 100m;
            decimal treatmentScrapAmount = 0m;
            if (!excludeBackendTaxes)
            {
                treatmentScrapAmount = (treatmentBase * alumTreatmentScrapData.price) / 100;
            }
            decimal totalAlumTreatmentCost = treatmentBase + treatmentScrapAmount;

            // Guardar el porcentaje o el costo convertido a string (mantener compatibilidad)
            try { budget_Product.AlumTreatment.pricePercentage = alumTreatmentPct.ToString(CultureInfo.InvariantCulture); } catch { }
            

            // 4. SUMAR MANO DE OBRA
            // Determine labour rate: prefer override (sent by frontend), otherwise fallback to DB value.
            var laborData = await _priceRepository.GetByIdAsync(6); // costo de mano de obra (fallback)
            decimal labourRateToUse = labourRateOverride ?? laborData.price;
            // Interpret labourRateToUse as price per kilogram (align with frontend).
            // Usar el peso redondeado (como hace el frontend)
            decimal laborCost = roundedAluminumWeight * labourRateToUse;
            

            // 5. SUMAR ACCESORIOS
            //            decimal totalAccessoriesCost = 0;
            decimal totalAccessoriesCost = 0;
             if (budget_Product.Accesory != null && budget_Product.Accesory.Count > 0)
             {
                 StringBuilder accessoriesLog = new StringBuilder("Accesorios incluidos:\n");
                 foreach (var accesory in budget_Product.Accesory)
                 {
                     var accessoryData = await _accesoryRepository.GetByNameAsync(accesory.Name);
                     decimal individualAccessoryPrice = accessoryData.price;
                     decimal accessoryTotalPrice = individualAccessoryPrice * accesory.Quantity;
                     accesory.Price = accessoryTotalPrice; // Guardar el precio total del accesorio en el producto
                     totalAccessoriesCost += accessoryTotalPrice;
                     accessoriesLog.AppendLine($"   - {accesory.Name}: {accesory.Quantity} x {individualAccessoryPrice} $ = {accessoryTotalPrice} $");
                 }
                 Console.WriteLine(accessoriesLog.ToString());
                 Console.WriteLine($"Costo total accesorios: {totalAccessoriesCost} $");
             }
             else
             {
                 Console.WriteLine("No se incluyen accesorios.");
             }

            // 6. SUMAR SUBTOTAL (por UNA abertura, sin IVA)
            // Incluir mosquitoCost si aplica
            decimal subtotal = totalAluminumCost + totalGlassCost + totalAlumTreatmentCost + laborCost + totalAccessoriesCost + mosquitoCost;

            // 7/8. IMPUESTOS: si el payload solicitó excludeBackendTaxes evitar aplicar impuestos (el frontend los calcula/gestiona)
            var IvaData = await _priceRepository.GetByIdAsync(4); // IVA
            decimal IvaRate = IvaData.price;
            decimal taxAmount = 0m;
            if (!excludeBackendTaxes)
            {
                // Mantener solo IVA por defecto para alinearse con frontend. GIF/IFC se omite a menos que se decida lo contrario.
                taxAmount = subtotal * IvaRate / 100m;
            }

            // 8. PRECIO TOTAL (por UNA abertura)
            decimal totalPrice = subtotal + taxAmount ;

            // Construir DESGLOSE textual parecido al frontend para facilitar comparación
            var sb = new StringBuilder();
            sb.AppendLine("==== CÁLCULO DE ABERTURA (BACKEND) ====");
            try
            {
                sb.AppendLine($"Panel: {budget_Product.PanelWidth:F1} x {budget_Product.PanelHeight:F1} cm");
            }
            catch { sb.AppendLine($"Panel: {budget_Product.PanelWidth} x {budget_Product.PanelHeight} cm"); }
            sb.AppendLine($"Paneles: {budget_Product.WidthPanelQuantity} × {budget_Product.HeightPanelQuantity}");
            sb.AppendLine();
            sb.AppendLine("Desglose por unidad:");

            // Mostrar ALUMINIO: costo base y desperdicio por separado (evita confusión cuando se muestra precio unitario pero el total incluye scrap)
            // Mostrar el peso REDONDEADO (igual que el frontend) y usarlo en la multiplicación mostrada
            sb.AppendLine($"• Aluminio: {roundedAluminumWeight:F2} kg × ${aluminumPricePerKg:F2} = ${baseAluminumCost:F2}");
             if (scrapAluminumAmount > 0m)
             {
                 sb.AppendLine($"  (Desperdicio {aluminumScrapPercentage}%): ${scrapAluminumAmount:F2} -> Total aluminio: ${totalAluminumCost:F2}");
             }

             // Mostrar TRATAMIENTO (se indica % y se rompe en base + scrap si aplica)
             sb.AppendLine($"• Tratamiento ({alumTreatmentPct}%): ${treatmentBase:F2}");
             if (treatmentScrapAmount > 0m)
             {
                 sb.AppendLine($"  (Desperdicio tratamiento {alumTreatmentScrapData.price}%): ${treatmentScrapAmount:F2} -> Total tratamiento: ${totalAlumTreatmentCost:F2}");
             }

             // Mostrar VIDRIO: base y desperdicio (si aplica)
             sb.AppendLine($"• Vidrio: {roundedGlassArea:F3} m² × ${glassPricePerM2:F2} = ${baseGlassCost:F2}");
             if (scrapGlassAmount > 0m)
             {
                 sb.AppendLine($"  (Desperdicio {glassScrapData.price}%): ${scrapGlassAmount:F2} -> Total vidrio: ${totalGlassCost:F2}");
             }

            // Mostrar MOSQUITERA si aplica
            if (mosquitoSelected && mosquitoCost > 0m)
            {
                sb.AppendLine($"• Tela mosquitera: {roundedGlassArea:F3} m² × ${mosquitoPricePerM2:F2} = ${mosquitoCost:F2}");
            }
 
              // Mano de obra (directo)
              sb.AppendLine($"• Mano obra: {roundedAluminumWeight:F2} kg × ${labourRateToUse:F2} = ${laborCost:F2}");

            if (totalAccessoriesCost > 0)
            {
                sb.AppendLine($"• Accesorios: ${totalAccessoriesCost:F2}");
            }
            sb.AppendLine($"Subtotal unidad: ${subtotal:F2}");
            sb.AppendLine($"Cantidad: {budget_Product.Quantity} → Total (sin IVA por cantidad): ${(subtotal * budget_Product.Quantity):F2}");
            if (!excludeBackendTaxes)
            {
                sb.AppendLine($"IVA aplicado: {IvaRate}% -> Monto IVA por unidad: ${taxAmount:F2} -> Total unidad c/IVA: ${totalPrice:F2}");
            }
            sb.AppendLine("==== FIN DESGLOSE ====");

            Console.WriteLine(sb.ToString());

            return (totalPrice, sb.ToString(), subtotal);
        }

        private async Task<decimal> CalculateComplementPrice(Complement complement, bool excludeBackendTaxes = false)
        {
            decimal totalComplementPrice = 0m;

            // Puertas
            if (complement.ComplementDoor != null)
            {
                foreach (var complementDoor in complement.ComplementDoor.Where(d => d != null))
                {
                    var door = await _doorRepository.GetByNameAsync(complementDoor.Name);
                    decimal individualDoorBasePrice = door?.price ?? 0m; // precio base para 90x210 (según DB)

                    // Dimensiones estándar (cm)
                    double standardWidth = 90;
                    double standardHeight = 210;
                    double standardAreaCm2 = standardWidth * standardHeight;

                    // Dimensiones reales (cm)
                    double actualAreaCm2 = complementDoor.Width * complementDoor.Height;
                    // Precio proporcional al área
                    decimal proportionalPrice = individualDoorBasePrice * (decimal)(actualAreaCm2 / standardAreaCm2);

                    // Calculo del revestimiento (usar area real para coating)
                    var coating = await _coatingRepository.GetByNameAsync(complementDoor.Coating?.name);
                    var coatingScrapData = await _priceRepository.GetByIdAsync(18); // porcentaje de desperdicio del revestimiento
                    // area en m2 = cm2 / 10000
                    decimal areaM2 = (decimal)(actualAreaCm2 / 10000.0);
                    decimal coatingAreaFactor = 2.2m;
                    decimal coatingPrice = (coating?.price ?? 0m) * (areaM2 * coatingAreaFactor);
                    if (!excludeBackendTaxes)
                    {
                        coatingPrice += (coatingPrice * (coatingScrapData?.price ?? 0m)) / 100m;
                    }
                    // Guardar el precio del coating por la cantidad de puertas (si la propiedad existe)
                    try { complementDoor.Coating.price = coatingPrice * complementDoor.Quantity; } catch { /* ignore if model differs */ }

                    // Accesorios
                    decimal accessoriesTotalForThisDoor = 0m;
                    if (complementDoor.Accesory != null)
                    {
                        foreach (var acc in complementDoor.Accesory)
                        {
                            var accessory = await _accesoryRepository.GetByNameAsync(acc.Name);
                            decimal individualAccessoryPrice = accessory?.price ?? 0m;
                            decimal accessoryTotalPrice = individualAccessoryPrice * acc.Quantity;
                            try { acc.Price = accessoryTotalPrice; } catch { }
                            accessoriesTotalForThisDoor += accessoryTotalPrice;
                        }
                    }

                    // Precio por unidad de puerta (area ajustada + coating)
                    decimal unitDoorPrice = proportionalPrice + coatingPrice;
                    decimal doorTotalPrice = (unitDoorPrice * complementDoor.Quantity) + accessoriesTotalForThisDoor;
                    try { complementDoor.Price = doorTotalPrice; } catch { }
                    totalComplementPrice += doorTotalPrice;
                }
            }

            // Barandas
            if (complement.ComplementRailing != null)
            {
                foreach (var complementRailing in complement.ComplementRailing.Where(r => r != null))
                {
                    var railing = await _railingRepository.GetByNameAsync(complementRailing.Name);
                    decimal unitRailingPrice = railing?.price ?? 0m;

                    // Reforzado según tipo
                    if (complementRailing.Reinforced == true)
                    {
                        var nm = (complementRailing.Name ?? "").ToLower();
                        if (nm.Contains("city")) unitRailingPrice *= 1.05m;
                        else if (nm.Contains("imperia")) unitRailingPrice *= 1.15m;
                        else unitRailingPrice *= 1.05m;
                    }

                    // tratamiento de aluminio
                    decimal alumTreatmentPct = 0m;
                    if (!string.IsNullOrEmpty(complementRailing.AlumTreatment?.name))
                    {
                        var alumTreatment = await _alumTreatmentRepository.GetByNameAsync(complementRailing.AlumTreatment.name);
                        if (alumTreatment != null)
                        {
                            var normalized = (alumTreatment.pricePercentage ?? "").Replace(',', '.');
                            decimal.TryParse(normalized, NumberStyles.Any, CultureInfo.InvariantCulture, out alumTreatmentPct);
                        }
                    }
                    var alumTreatmentScrap = await _priceRepository.GetByIdAsync(16);
                    decimal treatmentCost = (unitRailingPrice * alumTreatmentPct) / 100m;
                    if (!excludeBackendTaxes)
                    {
                        treatmentCost += (treatmentCost * (alumTreatmentScrap?.price ?? 0m)) / 100m;
                    }

                    decimal unitFinal = unitRailingPrice + treatmentCost;
                    decimal totalRailing = unitFinal * complementRailing.Quantity;
                    try { complementRailing.Price = totalRailing; complementRailing.AlumTreatment.pricePercentage = treatmentCost.ToString(CultureInfo.InvariantCulture); } catch { }
                    totalComplementPrice += totalRailing;
                }
            }

            // Tabiques / Partitions
            if (complement.ComplementPartition != null)
            {
                foreach (var complementPartition in complement.ComplementPartition.Where(p => p != null))
                {
                    // Usar el precio que venga en el payload (o 0 si no existe)
                    decimal basePartitionPricePer100cm = complementPartition.Price;

                    decimal heightCm = (decimal)(complementPartition.Height);
                    decimal unitPrice = basePartitionPricePer100cm * (heightCm / 100m);
                    if (complementPartition.Simple == false)
                    {
                        unitPrice *= 1.15m;
                    }
                    switch (complementPartition.GlassMilimeters)
                    {
                        case Enums.GlassMilimeters.Mm6:
                            unitPrice *= 1.0m;
                            break;
                        case Enums.GlassMilimeters.Mm8:
                            unitPrice *= 1.15m;
                            break;
                        case Enums.GlassMilimeters.Mm10:
                            unitPrice *= 1.30m;
                            break;
                    }
                    decimal totalPartitionPrice = unitPrice * complementPartition.Quantity;
                    try { complementPartition.Price = totalPartitionPrice; } catch { }
                    totalComplementPrice += totalPartitionPrice;
                }
            }

            return totalComplementPrice;
        }



        // Calcula el precio TOTAL de un presupuesto con varias aberturas
     public async Task<decimal> CalculateBudgetTotal(Budget budget)
     {
         decimal total = 0;

        // Detectar si el payload indica que el backend debe excluir impuestos/scrap.
        // Usa helper robusto que busca Meta o Budget.Meta, acepta bool/string/0-1.
        bool excludeBackendTaxes = ReadExcludeBackendTaxesFlag(budget);
        Console.WriteLine($">> BudgetCalculator: excludeBackendTaxes = {excludeBackendTaxes}");

        // FORZAR temporalmente que backend NO aplique impuestos ni scrap (según tu pedido "no quiero por ahora")
        excludeBackendTaxes = true;
        Console.WriteLine($">> BudgetCalculator: forced excludeBackendTaxes = {excludeBackendTaxes}");
 
        // Leer labour reference (si el frontend lo envió)
        decimal? labourReferenceFromPayload = ReadLabourReference(budget);
        Console.WriteLine($">> BudgetCalculator: labourReferenceFromPayload = {(labourReferenceFromPayload.HasValue ? labourReferenceFromPayload.Value.ToString() : "null (fallback DB will be used)")}");
 
          // Calculo de aberturas
          foreach (var product in budget.Products)
          {
            // Calcular apertura (ahora devuelve tupla: totalPrice, breakdown, subtotal)
            var result = await CalculateOpeningPrice(product, excludeBackendTaxes, labourReferenceFromPayload);

            // Guardar el precio unitario en el producto (incluye IVA si el backend lo aplica)
            try { product.price = Math.Round(result.totalPrice, 2); } catch { /* mantener compatibilidad si model difiere */ }

            // Multiplicar por la cantidad de aberturas de este tipo (usar totalPrice que puede incluir IVA según bandera)
            total += result.totalPrice * product.Quantity;

            // Imprimir el desglose para facilitar comparación con el frontend
            Console.WriteLine($">>> PRODUCT: {product.OpeningType?.name ?? "unknown"} | Qty: {product.Quantity}");
            Console.WriteLine(result.breakdown);
            Console.WriteLine($">>> Subtotal (sin impuestos) por unidad según backend: ${result.subtotal:F2}");
            Console.WriteLine($">>> Total acumulado hasta ahora (sin costos adicionales): ${total:F2}");
          }
 
         // Calculo de complementos
        if (budget.Complement != null && budget.Complement.Count > 0)
        {
              foreach (var complement in budget.Complement)
              {
                var complementPrice = await CalculateComplementPrice(complement, excludeBackendTaxes);
                  total += complementPrice;
              }
          }

        // AGREGAR COSTOS ADICIONALES COMO HACE EL FRONTEND
        decimal fabricationCost = total * 0.10m; // 10%
        decimal administrativeCost = total * 0.05m; // 5%
        Console.WriteLine($">> Costos adicionales: Fabricación 10% = ${fabricationCost:F2}, Administrativo 5% = ${administrativeCost:F2}");
        total += fabricationCost + administrativeCost;

         // Guardar el total en el presupuesto
         budget.Total = Math.Round(total, 2);

         Console.WriteLine($">> TOTAL FINAL (incluye complementos y costos adicionales): ${budget.Total:F2}");
 
         return total;
     }

     // Helper para leer el flag excludeBackendTaxes de Budget.Meta (acepta bool, string, int)
     private bool ReadExcludeBackendTaxesFlag(object budgetObj)
     {
         if (budgetObj == null) return false;
         try
         {
             // Intentar encontrar Meta directamente en la raíz (budget.Meta)
             var metaProp = budgetObj.GetType().GetProperty("Meta", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
             object metaVal = null;
             if (metaProp != null)
             {
                 metaVal = metaProp.GetValue(budgetObj);
             }

             // Si no hay Meta en root, intentar buscar un wrapper Budget.Budget?.Meta
             if (metaVal == null)
             {
                 var innerBudgetProp = budgetObj.GetType().GetProperty("Budget", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                 if (innerBudgetProp != null)
                 {
                     var innerBudget = innerBudgetProp.GetValue(budgetObj);
                     if (innerBudget != null)
                     {
                         var innerMetaProp = innerBudget.GetType().GetProperty("Meta", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                         if (innerMetaProp != null)
                         {
                             metaVal = innerMetaProp.GetValue(innerBudget);
                         }
                     }
                 }
             }

             if (metaVal != null)
             {
                 // Buscar la propiedad excludeBackendTaxes (case-insensitive)
                 var flagProp = metaVal.GetType().GetProperty("excludeBackendTaxes", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase)
                                ?? metaVal.GetType().GetProperty("ExcludeBackendTaxes", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                 if (flagProp != null)
                 {
                     var flagVal = flagProp.GetValue(metaVal);
                     if (flagVal is bool b) return b;
                     if (flagVal is string s && bool.TryParse(s, out var parsedStr)) return parsedStr;
                     if (flagVal is int i) return i != 0;
                     if (flagVal is long l) return l != 0;
                 }
             }
         }
         catch
         {
             // En caso de cualquier error, no excluir impuestos por defecto
         }
         return false;
     }

     // NEW helper: lee LabourReference desde Budget o Budget.Meta (acepta number/string)
     private decimal? ReadLabourReference(object budgetObj)
     {
         if (budgetObj == null) return null;
         try
         {
             // Intentar encontrar una propiedad LabourReference o labourReference en la raíz
             var props = budgetObj.GetType().GetProperty("LabourReference", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase)
                       ?? budgetObj.GetType().GetProperty("labourReference", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
             if (props != null)
             {
                 var val = props.GetValue(budgetObj);
                 if (val is decimal d) return d;
                 if (val is double db) return (decimal)db;
                 if (val is float f) return (decimal)f;
                 if (val is int i) return (decimal)i;
                 if (val is long l) return (decimal)l;
                 if (val is string s && decimal.TryParse(s.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed)) return parsed;
             }

             // Intentar buscar dentro de Budget wrapper (Budget.Budget?.LabourReference o Budget.Meta.LabourReference)
             var innerBudgetProp = budgetObj.GetType().GetProperty("Budget", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
             if (innerBudgetProp != null)
             {
                 var innerBudget = innerBudgetProp.GetValue(budgetObj);
                 if (innerBudget != null)
                 {
                     var lbProp = innerBudget.GetType().GetProperty("LabourReference", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase)
                                  ?? innerBudget.GetType().GetProperty("labourReference", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                     if (lbProp != null)
                     {
                         var val = lbProp.GetValue(innerBudget);
                         if (val is decimal d) return d;
                         if (val is double db) return (decimal)db;
                         if (val is float f) return (decimal)f;
                         if (val is int i) return (decimal)i;
                         if (val is long l) return (decimal)l;
                         if (val is string s && decimal.TryParse(s.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed)) return parsed;
                     }

                     // También buscar en Meta (Budget.Meta.excludeBackendTaxes ya tratado); ahora Meta.LabourReference
                     var metaProp = innerBudget.GetType().GetProperty("Meta", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                     if (metaProp != null)
                     {
                         var metaVal = metaProp.GetValue(innerBudget);
                         if (metaVal != null)
                         {
                             var lrProp = metaVal.GetType().GetProperty("LabourReference", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase)
                                          ?? metaVal.GetType().GetProperty("labourReference", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                             if (lrProp != null)
                             {
                                 var val = lrProp.GetValue(metaVal);
                                 if (val is decimal d) return d;
                                 if (val is double db) return (decimal)db;
                                 if (val is float f) return (decimal)f;
                                 if (val is int i) return (decimal)i;
                                 if (val is long l) return (decimal)l;
                                 if (val is string s && decimal.TryParse(s.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed)) return parsed;
                             }
                         }
                     }
                 }
             }
         }
         catch
         {
             // ignore and fallback to null
         }
         return null;
     }
 
 }
}