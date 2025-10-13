using Domain.Entities;
using Domain.Repositories;
using System.Text;
using System.Globalization; // <-- nuevo para parseo robusto
using System.Threading.Tasks;
using System.Reflection;
using System.Linq; // <-- requerido para Where/Any

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

        private async Task<decimal> CalculateOpeningPrice(Budget_Product budget_Product, bool excludeBackendTaxes = false, decimal? labourRateOverride = null) {

            // LOG: entrada del producto
            Console.WriteLine(">> CalculateOpeningPrice - producto recibido:");
            Console.WriteLine($"   OpeningType: {budget_Product.OpeningType?.name}");
            Console.WriteLine($"   AlumTreatment: {budget_Product.AlumTreatment?.name}");
            Console.WriteLine($"   GlassType: {budget_Product.GlassType?.name}");
            Console.WriteLine($"   Width (received): {budget_Product.width}, Height (received): {budget_Product.height} (these are expected in cm)");
            Console.WriteLine($"   PanelWidth (cm): {budget_Product.PanelWidth}, PanelHeight (cm): {budget_Product.PanelHeight}");
            Console.WriteLine($"   WidthPanelQuantity: {budget_Product.WidthPanelQuantity}, HeightPanelQuantity: {budget_Product.HeightPanelQuantity}");
            Console.WriteLine($"   Quantity: {budget_Product.Quantity}");

            // 1. CALCULAR ALUMINIO 
            // Obtener el peso por metro del tipo de abertura
            var openingType = await _openingRepository.GetByNameAsync(budget_Product.OpeningType.name);
            double weightPerMeter = openingType.weight;
            Console.WriteLine($"Peso por metro del tipo de abertura '{budget_Product.OpeningType.name}': {weightPerMeter} kg/m");
            
            // Determinar consumo de aluminio
            int totalPanels = budget_Product.HeightPanelQuantity * budget_Product.WidthPanelQuantity; // número total de paneles
            Console.WriteLine($"Número total de paneles: {totalPanels}");

            // PanelWidth and PanelHeight are expected in cm.
            double panelWidthM = (double)budget_Product.PanelWidth / 100.0; // cm -> m
            double panelHeightM = (double)budget_Product.PanelHeight / 100.0; // cm -> m

            // Perímetro del panel en metros
            double panelPerimeterM = 2 * (panelWidthM + panelHeightM);
            Console.WriteLine($"Perímetro del panel (m) calculado a partir de PanelWidth/PanelHeight (cm): {panelPerimeterM} m");
            
            // Longitud total de aluminio por UNA abertura (m)
            //            double totalAluminumLengthM = (panelPerimeterM * totalPanels) / 1000;
            // panelPerimeterM ya está en metros, así que no dividir por 1000.
            double totalAluminumLengthM = panelPerimeterM * totalPanels;
            double aluminumWeight = totalAluminumLengthM * weightPerMeter; // peso total aluminio en kg
            Console.WriteLine($"Longitud total aluminio (m): {totalAluminumLengthM}, Peso aluminio (kg): {aluminumWeight}");

            var aluminumPriceData = await _priceRepository.GetByIdAsync(1); // precio del aluminio
            var aluminiumScrapPorcentagePriceData = await _priceRepository.GetByIdAsync(15); // porcentaje de desperdicio de aluminio
            decimal aluminumPricePerKg = aluminumPriceData.price;
            decimal aluminumScrapPercentage = aluminiumScrapPorcentagePriceData.price;
            // Por compatibilidad con frontend: si se solicita excludeBackendTaxes, NO aplicar scrap aquí.
            decimal totalAluminumCost = (decimal)aluminumWeight * aluminumPricePerKg;  // costo total de aluminio (sin scrap)
            if (!excludeBackendTaxes)
            {
                totalAluminumCost += (totalAluminumCost * aluminumScrapPercentage) / 100; // agregar costo por desperdicio de aluminio SOLO si corresponde
            }
            Console.WriteLine($"Precio aluminio/kg: {aluminumPricePerKg}, Costo aluminio: {totalAluminumCost}");

            // 2. CALCULAR VIDRIO
            // Área de cada panel (m²): panelWidthM * panelHeightM
            double panelArea = panelWidthM * panelHeightM; // m²
            double totalGlassArea = panelArea * totalPanels; // área total de vidrio en m² por UNA abertura
            Console.WriteLine($"Area por panel (m2): {panelArea}, Area total vidrio (m2): {totalGlassArea}");

            // Preferir el precio que venga en el payload (si el frontend lo envió)
            decimal glassPricePerM2 = 0m;
            try
            {
                if (budget_Product?.GlassType != null)
                {
                    // intentos comunes: .price (decimal), .Price, .precio (string/decimal)
                    var gt = budget_Product.GlassType;
                    // propiedad strongly-typed (si existe en el model)
                    try { glassPricePerM2 = gt.price; } catch { }

                    if (glassPricePerM2 == 0m)
                    {
                        var gtypeRef = gt.GetType();
                        var prop = gtypeRef.GetProperty("Price") ?? gtypeRef.GetProperty("precio") ?? gtypeRef.GetProperty("price", System.Reflection.BindingFlags.IgnoreCase | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                        if (prop != null)
                        {
                            var val = prop.GetValue(gt);
                            if (val is decimal d) glassPricePerM2 = d;
                            else if (val is double db) glassPricePerM2 = (decimal)db;
                            else if (val is string s && decimal.TryParse(s.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed)) glassPricePerM2 = parsed;
                        }
                    }
                }
            }
            catch { /* ignore */ }

            var glassScrapData = await _priceRepository.GetByIdAsync(17); // porcentaje de desperdicio del vidrio
            if (glassPricePerM2 == 0m)
            {
                var glassType = await _glassTypeRepository.GetByNameAsync(budget_Product.GlassType.name);
                glassPricePerM2 = glassType?.price ?? 0m;
                Console.WriteLine($"(fallback) Precio por m² del tipo de vidrio '{budget_Product.GlassType.name}': {glassPricePerM2} $/m² (desde repo)");
            }
            else
            {
                Console.WriteLine($"Precio por m² del tipo de vidrio '{budget_Product.GlassType.name}': {glassPricePerM2} $/m² (desde payload)");
            }
             // Igual que con aluminio: evitar agregar scrap si el frontend solicitó exclusión
            decimal totalGlassCost = (decimal)totalGlassArea * glassPricePerM2;
             if (!excludeBackendTaxes)
             {
                 totalGlassCost += (totalGlassCost * glassScrapData.price) / 100; // agregar costo por desperdicio del vidrio SOLO si corresponde
             }
             budget_Product.GlassType.price = totalGlassCost; // Guardar el precio del vidrio en el producto (total por UNA abertura)
             Console.WriteLine($"Costo vidrio: {totalGlassCost}");
 
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

            decimal totalAlumTreatmentCost = (totalAluminumCost * alumTreatmentPct) / 100m;
            if (!excludeBackendTaxes)
            {
                totalAlumTreatmentCost += (totalAlumTreatmentCost * alumTreatmentScrapData.price) / 100; // agregar costo por desperdicio del tratamiento de aluminio SOLO si corresponde
            }
            // Guardar el porcentaje o el costo convertido a string (mantener compatibilidad)
            try { budget_Product.AlumTreatment.pricePercentage = alumTreatmentPct.ToString(CultureInfo.InvariantCulture); } catch { }
            Console.WriteLine($"Costo tratamiento aluminio: {totalAlumTreatmentCost}");

            // 4. SUMAR MANO DE OBRA
            // Determine labour rate: prefer override (sent by frontend), otherwise fallback to DB value.
            var laborData = await _priceRepository.GetByIdAsync(6); // costo de mano de obra (fallback)
            decimal labourRateToUse = labourRateOverride ?? laborData.price;
            // Interpret labourRateToUse as price per kilogram (align with frontend).
            decimal laborCost = (decimal)aluminumWeight * labourRateToUse;
            Console.WriteLine($"Labour rate used (per kg): {labourRateToUse} -> Mano de obra (kg {aluminumWeight} × {labourRateToUse}) = {laborCost} $");

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
            decimal subtotal = totalAluminumCost + totalGlassCost + totalAlumTreatmentCost + laborCost + totalAccessoriesCost;
            Console.WriteLine($"Subtotal (sin IVA): {subtotal} $");

            // 7/8. IMPUESTOS: si el payload solicitó excludeBackendTaxes evitar aplicar impuestos (el frontend los calcula/gestiona)
            var IvaData = await _priceRepository.GetByIdAsync(4); // IVA
            decimal IvaRate = IvaData.price;
            decimal taxAmount = 0m;
            if (!excludeBackendTaxes)
            {
                // Mantener solo IVA por defecto para alinearse con frontend. GIF/IFC se omite a menos que se decida lo contrario.
                taxAmount = subtotal * IvaRate / 100m;
            }
            Console.WriteLine($"IVA aplicado: {IvaRate}% (excludeBackendTaxes: {excludeBackendTaxes}) -> ${taxAmount}");

            // 8. PRECIO TOTAL (por UNA abertura)
            decimal totalPrice = subtotal + taxAmount ;

            // LOG final con resumen (útil para comparar con frontend)
            Console.WriteLine(">> RESUMEN CALCULO ABERTURA:");
            Console.WriteLine($"   Aluminio: {totalAluminumCost} | Vidrio: {totalGlassCost} | Tratamiento: {totalAlumTreatmentCost} | ManoObra: {laborCost}");
            Console.WriteLine($"   Subtotal: {subtotal} | IVA ({IvaRate}%): {taxAmount} | Total: {totalPrice}");

            return totalPrice;
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
 
        // Leer labour reference (si el frontend lo envió)
        decimal? labourReferenceFromPayload = ReadLabourReference(budget);
        Console.WriteLine($">> BudgetCalculator: labourReferenceFromPayload = {(labourReferenceFromPayload.HasValue ? labourReferenceFromPayload.Value.ToString() : "null (fallback DB will be used)")}");
 
          // Calculo de aberturas
          foreach (var product in budget.Products)
          {
            // PASAR labour reference aquí para que el cálculo use kg * rate
            var unitPrice = await CalculateOpeningPrice(product, excludeBackendTaxes, labourReferenceFromPayload);
 
             // Guardar el precio unitario en el producto (si lo querés persistir)
             product.price = Math.Round(unitPrice, 2);
 
             // Multiplicar por la cantidad de aberturas de este tipo
             total += unitPrice * product.Quantity;
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
         // Guardar el total en el presupuesto
         budget.Total = Math.Round(total, 2);
 
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