using Domain.Entities;
using Domain.Repositories;

namespace Domain.Services
{
    public class BudgetCalculator
    {

        private readonly IOpeningTypeRepository _openingRepository;
        private readonly IPriceRepository _priceRepository;
        private readonly IAlumTreatmentRepository _alumTreatmentRepository;
        private readonly IGlassTypeRepository _glassTypeRepository;
        private readonly IComplementPartitionRepository _partitionRepository;

        public BudgetCalculator(IOpeningTypeRepository openingTypeRepository, IPriceRepository priceRepository, IAlumTreatmentRepository alumTreatmentRepository, IGlassTypeRepository glassTypeRepository, IComplementPartitionRepository partitionRepository)
        {
            _openingRepository = openingTypeRepository;
            _priceRepository = priceRepository;
            _alumTreatmentRepository = alumTreatmentRepository;
            _glassTypeRepository = glassTypeRepository;
            _partitionRepository = partitionRepository;
        }

        private async Task<decimal> CalculateOpeningPrice(Budget_Product budget_Product) {

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
            double totalAluminumLengthM = panelPerimeterM * totalPanels;
            double aluminumWeight = totalAluminumLengthM * weightPerMeter; // peso total aluminio en kg
            Console.WriteLine($"Longitud total aluminio (m): {totalAluminumLengthM}, Peso aluminio (kg): {aluminumWeight}");

            var aluminumPriceData = await _priceRepository.GetByIdAsync(1); // precio del aluminio
            decimal aluminumPricePerKg = aluminumPriceData.price;
            decimal totalAluminumCost = (decimal)aluminumWeight * aluminumPricePerKg;  // costo total de aluminio
            Console.WriteLine($"Precio aluminio/kg: {aluminumPricePerKg}, Costo aluminio: {totalAluminumCost}");

            // 2. CALCULAR VIDRIO
            // Área de cada panel (m²): panelWidthM * panelHeightM
            double panelArea = panelWidthM * panelHeightM; // m²
            double totalGlassArea = panelArea * totalPanels; // área total de vidrio en m² por UNA abertura
            Console.WriteLine($"Area por panel (m2): {panelArea}, Area total vidrio (m2): {totalGlassArea}");

            var glassType = await _glassTypeRepository.GetByNameAsync(budget_Product.GlassType.name);
            decimal glassPricePerM2 = glassType.price;
            Console.WriteLine($"Precio por m² del tipo de vidrio '{budget_Product.GlassType.name}': {glassPricePerM2} $/m²");
            decimal totalGlassCost = (decimal)totalGlassArea * glassPricePerM2;
            budget_Product.GlassType.price = totalGlassCost; // Guardar el precio del vidrio en el producto
            Console.WriteLine($"Costo vidrio: {totalGlassCost}");

            // 3. CALCULAR TRATAMIENTO DE ALUMINIO
            var alumTreatment = await _alumTreatmentRepository.GetByNameAsync(budget_Product.AlumTreatment.name);
            int alumTreatmentPrice = int.Parse(alumTreatment.pricePercentage);
            Console.WriteLine($"Porcentaje del tratamiento de aluminio '{budget_Product.AlumTreatment.name}': {alumTreatmentPrice}%");
            decimal totalAlumTreatmentCost = (totalAluminumCost * alumTreatmentPrice) / 100;
            budget_Product.AlumTreatment.pricePercentage = totalAlumTreatmentCost.ToString(); // Guardar el precio del tratamiento en el producto
            Console.WriteLine($"Costo tratamiento aluminio: {totalAlumTreatmentCost}");

            // 4. SUMAR MANO DE OBRA
            var laborData = await _priceRepository.GetByIdAsync(6); // costo de mano de obra
            decimal laborCost = laborData.price;
            Console.WriteLine($"Costo de mano de obra por abertura: {laborCost} $");

            // 5. SUMAR SUBTOTAL (por UNA abertura, sin IVA)
            decimal subtotal = totalAluminumCost + totalGlassCost + totalAlumTreatmentCost + laborCost;
            Console.WriteLine($"Subtotal (sin IVA): {subtotal} $");

            // 6. APLICAR IVA
            var taxData = await _priceRepository.GetByIdAsync(4);
            decimal taxRate = taxData.price;
            decimal taxAmount = (subtotal * taxRate) / 100;
            Console.WriteLine($"IVA aplicado: {taxRate}% -> Monto IVA: {taxAmount} $");

            // 7. PRECIO TOTAL (por UNA abertura)
            decimal totalPrice = subtotal /* + taxAmount */;
            Console.WriteLine($"Precio total (con IVA): {totalPrice} $");

            // LOG final con resumen (útil para comparar con frontend)
            Console.WriteLine(">> RESUMEN CALCULO ABERTURA:");
            Console.WriteLine($"   Aluminio: {totalAluminumCost} | Vidrio: {totalGlassCost} | Tratamiento: {totalAlumTreatmentCost} | ManoObra: {laborCost}");
            Console.WriteLine($"   Subtotal: {subtotal} | IVA ({taxRate}%): {taxAmount} | Total IVA (sin por ahora  ): {totalPrice}");

            return totalPrice;
        }

        private async Task<decimal> CalculateComplementPrice(Complement complement)
        {
            decimal TotalComplementPrice = 0;

            if (complement.ComplementDoor != null)
            {
                //TODO: Implementar calculo de puertas cuando se termine de construir los accesorios
            }

            if (complement.ComplementRailing != null)
            {
                //Calculo basado en que la propiedad price es por unidad de baranda(sin tener en cuenta el tratamiento o refuerzo)
                foreach (var ComplementRailing in complement.ComplementRailing)
                {
                    if (ComplementRailing.Name == "Baranda City")
                    {
                        var railing = await _partitionRepository.GetByIdAsync(5);
                        decimal IndividualPartitionPrice = railing.price;

                        if (ComplementRailing.Reinforced == true)
                        {
                            IndividualPartitionPrice *= 1.05m;
                        }

                        var alumTreatment = await _alumTreatmentRepository.GetByNameAsync(ComplementRailing.AlumTreatment.name);
                        int alumTreatmentPrice = int.Parse(alumTreatment.pricePercentage);
                        decimal IndividualRailingAlumTreatmentCost = (IndividualPartitionPrice * alumTreatmentPrice) / 100;
                        IndividualPartitionPrice += IndividualRailingAlumTreatmentCost;
                        ComplementRailing.AlumTreatment.pricePercentage = IndividualRailingAlumTreatmentCost.ToString(); // Guardar el precio del tratamiento en la baranda

                        decimal TotalComplementRailingPrice = IndividualPartitionPrice * ComplementRailing.Quantity;
                        ComplementRailing.Price = TotalComplementRailingPrice;
                        TotalComplementPrice += TotalComplementRailingPrice;
                    }

                    if (ComplementRailing.Name == "Baranda Imperia") 
                    {
                        var railing = await _partitionRepository.GetByIdAsync(6);
                        decimal IndividualPartitionPrice = railing.price;

                        if (ComplementRailing.Reinforced == true)
                        {
                            IndividualPartitionPrice *= 1.15m;
                        }

                        var alumTreatment = await _alumTreatmentRepository.GetByNameAsync(ComplementRailing.AlumTreatment.name);
                        int alumTreatmentPrice = int.Parse(alumTreatment.pricePercentage);
                        decimal IndividualRailingAlumTreatmentCost = (IndividualPartitionPrice * alumTreatmentPrice) / 100;
                        IndividualPartitionPrice += IndividualRailingAlumTreatmentCost;
                        ComplementRailing.AlumTreatment.pricePercentage = IndividualRailingAlumTreatmentCost.ToString(); // Guardar el precio del tratamiento en la baranda

                        decimal TotalComplementRailingPrice = IndividualPartitionPrice * ComplementRailing.Quantity;
                        ComplementRailing.Price = TotalComplementRailingPrice;
                        TotalComplementPrice += TotalComplementRailingPrice;
                    }
                }
            }

            if (complement.ComplementPartition != null)
            {
                foreach(var ComplementPartition in complement.ComplementPartition)
                {
                    //Calculo basado en que la propiedad price es según cada metro de altura
                    var partition = await _partitionRepository.GetByIdAsync(5);
                    decimal IndividualPartitionPrice = partition.price * (decimal)ComplementPartition.Height /100; // Precio por metro de altura
                    if (ComplementPartition.Simple == false)
                    {
                        IndividualPartitionPrice *= 2.05m;
                    }
                    switch(complement.ComplementPartition.First().GlassMilimeters) // Aplico un recargo según el espesor del vidrio
                    {
                        case Enums.GlassMilimeters.Mm6:
                            IndividualPartitionPrice *= 1.0m;
                            break;
                        case Enums.GlassMilimeters.Mm8:
                            IndividualPartitionPrice *= 1.15m;
                            break;
                        case Enums.GlassMilimeters.Mm10:
                            IndividualPartitionPrice *= 1.30m;
                            break;
                    }
                    decimal TotalComplementPartitionPrice = IndividualPartitionPrice * ComplementPartition.Quantity;
                    ComplementPartition.Price = TotalComplementPartitionPrice;
                    TotalComplementPrice += TotalComplementPartitionPrice;
                }
            }

            return TotalComplementPrice;
        }

        // Calcula el precio TOTAL de un presupuesto con varias aberturas
        public async Task<decimal> CalculateBudgetTotal(Budget budget)
        {
            decimal total = 0;

            // Calculo de aberturas
            foreach (var product in budget.Products)
            {
                var unitPrice = await CalculateOpeningPrice(product);

                // Guardar el precio unitario en el producto (si lo querés persistir)
                product.price = Math.Round(unitPrice, 2);

                // Multiplicar por la cantidad de aberturas de este tipo
                total += unitPrice * product.Quantity;

                //TODO: Aplicar calculo de accesorios
            }

            //TODO: Aplicar Total de complementos cuando se finalice su implementacion

            // Guardar el total en el presupuesto
            budget.Total = Math.Round(total, 2);

            return total;
        }

    }
}
