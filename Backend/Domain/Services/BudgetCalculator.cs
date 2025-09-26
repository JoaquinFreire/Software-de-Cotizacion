using Domain.Entities;
using Domain.Repositories;
using System.Text;
using System.Globalization; // <-- nuevo para parseo robusto
using System.Threading.Tasks;
using System.Reflection;

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

        private async Task<decimal> CalculateOpeningPrice(Budget_Product budget_Product, bool excludeBackendTaxes = false) {

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

            var glassType = await _glassTypeRepository.GetByNameAsync(budget_Product.GlassType.name);
            var glassScrapData = await _priceRepository.GetByIdAsync(17); // porcentaje de desperdicio del vidrio
            decimal glassPricePerM2 = glassType.price;
            Console.WriteLine($"Precio por m² del tipo de vidrio '{budget_Product.GlassType.name}': {glassPricePerM2} $/m²");
            // Igual que con aluminio: evitar agregar scrap si el frontend solicitó exclusión
            decimal totalGlassCost = (decimal)totalGlassArea * glassPricePerM2;
            if (!excludeBackendTaxes)
            {
                totalGlassCost += (totalGlassCost * glassScrapData.price) / 100; // agregar costo por desperdicio del vidrio SOLO si corresponde
            }
            budget_Product.GlassType.price = totalGlassCost; // Guardar el precio del vidrio en el producto (total por UNA abertura)
            Console.WriteLine($"Costo vidrio: {totalGlassCost}");

            // 3. CALCULAR TRATAMIENTO DE ALUMINIO
            var alumTreatment = await _alumTreatmentRepository.GetByNameAsync(budget_Product.AlumTreatment.name);
            var alumTreatmentScrapData = await _priceRepository.GetByIdAsync(16); // porcentaje de desperdicio del tratamiento de aluminio
            //            int alumTreatmentPrice = int.Parse(alumTreatment.pricePercentage);
            // pricePercentage puede venir con coma (ej. "80,325000"), parsear robustamente
            decimal alumTreatmentPriceDecimal = 0m;
            if (!string.IsNullOrEmpty(alumTreatment.pricePercentage))
            {
                var normalized = alumTreatment.pricePercentage.Replace(',', '.');
                decimal.TryParse(normalized, NumberStyles.Any, CultureInfo.InvariantCulture, out alumTreatmentPriceDecimal);
            }
            // si no se pudo parsear, asumir 0
            int alumTreatmentPrice = (int)Math.Round(alumTreatmentPriceDecimal);

            Console.WriteLine($"Porcentaje del tratamiento de aluminio '{budget_Product.AlumTreatment.name}': {alumTreatmentPrice}%");
            decimal totalAlumTreatmentCost = (totalAluminumCost * alumTreatmentPrice) / 100;
            if (!excludeBackendTaxes)
            {
                totalAlumTreatmentCost += (totalAlumTreatmentCost * alumTreatmentScrapData.price) / 100; // agregar costo por desperdicio del tratamiento de aluminio SOLO si corresponde
            }
            budget_Product.AlumTreatment.pricePercentage = totalAlumTreatmentCost.ToString(CultureInfo.InvariantCulture); // Guardar el precio del tratamiento en el producto
            Console.WriteLine($"Costo tratamiento aluminio: {totalAlumTreatmentCost}");

            // 4. SUMAR MANO DE OBRA
            //            var laborData = await _priceRepository.GetByIdAsync(6); // costo de mano de obra
            //            decimal laborCost = laborData.price;
            //            laborCost *= (decimal)aluminumWeight; // costo de mano de obra por UNA abertura
            // Frontend aplica mano de obra como un valor fijo por abertura (no por kg).
            var laborData = await _priceRepository.GetByIdAsync(6); // costo de mano de obra (por abertura)
            decimal laborCost = laborData.price;
            Console.WriteLine($"Costo de mano de obra por abertura: {laborCost} $");

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
            if (complement.ComplementDoor != null)
            {
                foreach (var ComplementDoor in complement.ComplementDoor)
                {
                    var door = await _doorRepository.GetByNameAsync(ComplementDoor.Name);
                    decimal individualDoorBasePrice = door.price; // precio base para 90x210 (según DB)

                    // Dimensiones estándar (cm)
                    double standardWidth = 90;
                    double standardHeight = 210;
                    double standardAreaCm2 = standardWidth * standardHeight;

                    // Dimensiones reales (cm)
                    double actualAreaCm2 = ComplementDoor.Width * ComplementDoor.Height;
                    // Precio proporcional al área
                    decimal proportionalPrice = individualDoorBasePrice * (decimal)(actualAreaCm2 / standardAreaCm2);

                    // Calculo del revestimiento (usar area real para coating)
                    var coating = await _coatingRepository.GetByNameAsync(ComplementDoor.Coating.name);
                    var coatingScrapData = await _priceRepository.GetByIdAsync(18); // porcentaje de desperdicio del revestimiento
                    // area en m2 = cm2 / 10000
                    decimal areaM2 = (decimal)(actualAreaCm2 / 10000.0);
                    // mantengo factor 2.2 si querés mantener la lógica previa (doble cara + pérdidas)
                    decimal coatingAreaFactor = 2.2m;
                    decimal coatingPrice = coating.price * (areaM2 * coatingAreaFactor);
                    if (!excludeBackendTaxes)
                    {
                        coatingPrice += (coatingPrice * coatingScrapData.price) / 100;
                    }
                    ComplementDoor.Coating.price = coatingPrice * ComplementDoor.Quantity; // Guardar el precio del revestimiento en la puerta

                    // Accesorios
                    decimal accessoriesTotalForThisDoor = 0m;
                    if (ComplementDoor.Accesory != null)
                    {
                        foreach (var Accesory in ComplementDoor.Accesory)
                        {
                            var accessory = await _accesoryRepository.GetByNameAsync(Accesory.Name);
                            decimal individualAccessoryPrice = accessory.price;
                            decimal accessoryTotalPrice = individualAccessoryPrice * Accesory.Quantity;
                            Accesory.Price = accessoryTotalPrice; // Guardar el precio total del accesorio en la puerta
                            accessoriesTotalForThisDoor += accessoryTotalPrice;
                        }
                    }

                    // Precio por unidad de puerta (area ajustada + coating)
                    decimal unitDoorPrice = proportionalPrice + coatingPrice;
                    decimal doorTotalPrice = (unitDoorPrice * ComplementDoor.Quantity) + accessoriesTotalForThisDoor;
                    ComplementDoor.Price = doorTotalPrice;
                    totalComplementPrice += doorTotalPrice;
                }
            }

            if (complement.ComplementRailing != null)
            {
                // Cálculo por unidad de baranda, buscar por nombre para evitar IDs hardcode
                foreach (var ComplementRailing in complement.ComplementRailing)
                {
                    var railing = await _railingRepository.GetByNameAsync(ComplementRailing.Name);
                    decimal unitRailingPrice = railing?.price ?? 0m;

                    // Reforzado según tipo (frontend aplica multiplicadores según nombre)
                    if (ComplementRailing.Reinforced == true)
                    {
                        var nm = (ComplementRailing.Name ?? "").ToLower();
                        if (nm.Contains("city")) unitRailingPrice *= 1.05m;
                        else if (nm.Contains("imperia")) unitRailingPrice *= 1.15m;
                        else unitRailingPrice *= 1.05m;
                    }

                    // tratamiento de aluminio (parsear porcentaje robustamente)
                    decimal alumTreatmentPct = 0m;
                    if (!string.IsNullOrEmpty(ComplementRailing.AlumTreatment?.name))
                    {
                        var alumTreatment = await _alumTreatmentRepository.GetByNameAsync(ComplementRailing.AlumTreatment.name);
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
                        treatmentCost += (treatmentCost * alumTreatmentScrap.price) / 100m;
                    }

                    decimal unitFinal = unitRailingPrice + treatmentCost;
                    decimal totalRailing = unitFinal * ComplementRailing.Quantity;
                    ComplementRailing.Price = totalRailing;
                    ComplementRailing.AlumTreatment.pricePercentage = treatmentCost.ToString(CultureInfo.InvariantCulture);
                    totalComplementPrice += totalRailing;
                }
            }

            if (complement.ComplementPartition != null)
            {
                foreach (var ComplementPartition in complement.ComplementPartition)
                {
                    // Evitar usar GetByNameAsync en IComplementPartitionRepository (no existe en la interfaz).
                    // Preferimos usar el precio que venga en el payload (ComplementPartition.Price) como base por 100cm.
                    // ComplementPartition.Price puede ser nullable (decimal?). Usar null-coalescing para evitar error de conversión.
                    decimal basePartitionPricePer100cm = ComplementPartition.Price ?? 0m;

                    decimal heightCm = (decimal)(ComplementPartition.Height);
                    decimal unitPrice = basePartitionPricePer100cm * (heightCm / 100m);
                    if (ComplementPartition.Simple == false)
                    {
                        unitPrice *= 1.15m;
                    }
                    switch (ComplementPartition.GlassMilimeters)
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
                    decimal totalPartitionPrice = unitPrice * ComplementPartition.Quantity;
                    ComplementPartition.Price = totalPartitionPrice;
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
 
          // Calculo de aberturas
          foreach (var product in budget.Products)
          {
            var unitPrice = await CalculateOpeningPrice(product, excludeBackendTaxes);
 
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
 
 }
}