using Domain.Entities;
using Domain.Repositories;

namespace Domain.Services
{
    public class BudgetCalculator
    {

        private readonly IOpeningTypeRepository _openingRepository;
        private readonly IPriceRepository _priceRepository;
        private readonly IAlumTreatmentRepository _alumTreatmentRepository;

        public BudgetCalculator(IOpeningTypeRepository openingTypeRepository, IPriceRepository priceRepository, IAlumTreatmentRepository alumTreatmentRepository) 
        {
            _openingRepository = openingTypeRepository;
            _priceRepository = priceRepository;
            _alumTreatmentRepository = alumTreatmentRepository;

        }

        public void CalculateOpeningPrice(Budget_Product budget_Product, Opening_Configuration opening_Configuration) {

            // 1. CALCULAR ALUMINIO 

            // Obtener el peso por metro del tipo de apertura
            double WeightPerMeter = _openingRepository.GetByNameAsync(budget_Product.OpeningType.name).Result.weight;

            // Determinar consumo de aluminio
            int totalPanels = opening_Configuration.num_panels_height * opening_Configuration.num_panels_width; // número total de paneles
            double panelPerimeter = 2 * (budget_Product.width + budget_Product.height) / 1000; // perímetro del panel en metros
            double totalAluminumLength = panelPerimeter * totalPanels; // longitud total de aluminio en metros
            double aluminumWeight = totalAluminumLength * WeightPerMeter; // peso total de aluminio en kg
            decimal aluminumPricePerKg = _priceRepository.GetByIdAsync(1).Result.price; // precio del aluminio por kg (suponiendo que el ID 1 corresponde al aluminio)
            decimal totalAluminumCost = (decimal)aluminumWeight * aluminumPricePerKg; // costo total de aluminio

            // 2. CALCULAR VIDRIO
            //TODO: Terminar en cuanto se implementen las propiedades correspondientes a Budget_Product
            //double glassArea = ;

            // 3. CALCULAR TRATAMIENTO DE ALUMINIO
            //TODO: Resolver si la propiedad PricePercentage queda como string o int
            int alumTreatmentPrice = int.Parse(_alumTreatmentRepository.GetByNameAsync(budget_Product.AlumTreatment.name).Result.pricePercentage); // precio del tratamiento de aluminio
            decimal totalAlumTreatmentCost = (totalAluminumCost * alumTreatmentPrice) / 100; // costo total del tratamiento de aluminio

            // 4. SUMAR MANO DE OBRA
            decimal laborCost = _priceRepository.GetByIdAsync(6).Result.price; // costo de mano de obra (suponiendo que el ID 6 corresponde a la mano de obra)

            // 5. SUMAR SUBTOTAL
            decimal subtotal = totalAluminumCost /* + totalGlassCost*/ + totalAlumTreatmentCost + laborCost; // subtotal antes de IVA 

            // 6. APLICAR IVA
            decimal taxRate = _priceRepository.GetByIdAsync(4).Result.price; // tasa de IVA (suponiendo que el ID 4 corresponde al IVA)
            decimal taxAmount = (subtotal * taxRate) / 100; // monto del IVA

            // 7. PRECIO TOTAL
            decimal totalPrice = subtotal + taxAmount; // precio total con IVA

        }

    }
}
