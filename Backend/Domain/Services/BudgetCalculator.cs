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

        public BudgetCalculator(IOpeningTypeRepository openingTypeRepository, IPriceRepository priceRepository, IAlumTreatmentRepository alumTreatmentRepository, IGlassTypeRepository glassTypeRepository)
        {
            _openingRepository = openingTypeRepository;
            _priceRepository = priceRepository;
            _alumTreatmentRepository = alumTreatmentRepository;
            _glassTypeRepository = glassTypeRepository;
        }

        private async Task<decimal> CalculateOpeningPrice(Budget_Product budget_Product) {

            // 1. CALCULAR ALUMINIO 

            // Obtener el peso por metro del tipo de apertura
            var openingType = await _openingRepository.GetByNameAsync(budget_Product.OpeningType.name);
            double weightPerMeter = openingType.weight;

            // Determinar consumo de aluminio
            int totalPanels = budget_Product.HeightPanelQuantity * budget_Product.WidthPanelQuantity; // número total de paneles
            double panelPerimeter = 2 * (budget_Product.width + budget_Product.height) / 1000; // perímetro del panel en metros
            double totalAluminumLength = panelPerimeter * totalPanels; // longitud total de aluminio en metros
            double aluminumWeight = totalAluminumLength * weightPerMeter; // peso total de aluminio en kg

            var aluminumPriceData = await _priceRepository.GetByIdAsync(1); // precio del aluminio (suponiendo que el ID 1 corresponde al aluminio)
            decimal aluminumPricePerKg = aluminumPriceData.price;
            decimal totalAluminumCost = (decimal)aluminumWeight * aluminumPricePerKg;  // costo total de aluminio

            // 2. CALCULAR VIDRIO
            //TODO: Terminar en cuanto se implementen las propiedades correspondientes a Budget_Product
            double panelArea = (budget_Product.PanelWidth * budget_Product.PanelHeight) / 1000000; // área de cada panel en m²
            double totalGlassArea = panelArea * totalPanels; // área total de vidrio en m²

            var glassType = await _glassTypeRepository.GetByNameAsync(budget_Product.GlassType.name);
            decimal glassPricePerM2 = glassType.price;
            decimal totalGlassCost = (decimal)totalGlassArea * glassPricePerM2;

            // 3. CALCULAR TRATAMIENTO DE ALUMINIO
            var alumTreatment = await _alumTreatmentRepository.GetByNameAsync(budget_Product.AlumTreatment.name);
            int alumTreatmentPrice = int.Parse(alumTreatment.pricePercentage);
            decimal totalAlumTreatmentCost = (totalAluminumCost * alumTreatmentPrice) / 100;

            // 4. SUMAR MANO DE OBRA
            var laborData = await _priceRepository.GetByIdAsync(6); // costo de mano de obra (suponiendo que el ID 6 corresponde a la mano de obra)
            decimal laborCost = laborData.price;

            //TODO: Incluir costos de accesorios cuando se implementen

            // 5. SUMAR SUBTOTAL
            decimal subtotal = totalAluminumCost + totalGlassCost + totalAlumTreatmentCost + laborCost; // subtotal antes de IVA 

            // 6. APLICAR IVA
            var taxData = await _priceRepository.GetByIdAsync(4);
            decimal taxRate = taxData.price;
            decimal taxAmount = (subtotal * taxRate) / 100;


            // 7. PRECIO TOTAL
            decimal totalPrice = subtotal + taxAmount; // precio total con IVA

            return totalPrice;
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
                product.price = unitPrice;

                // Multiplicar por la cantidad de aberturas de este tipo
                total += unitPrice * product.Quantity;
            }

            //TODO: Calculo de complementos

            // Guardar el total en el presupuesto
            budget.Total = (double)total;

            return total;
        }

    }
}
