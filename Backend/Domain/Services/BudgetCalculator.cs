using Domain.Entities;
using Domain.Repositories;
using System.Text;

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
            double totalAluminumLengthM = (panelPerimeterM * totalPanels) / 1000;
            double aluminumWeight = totalAluminumLengthM * weightPerMeter; // peso total aluminio en kg
            Console.WriteLine($"Longitud total aluminio (m): {totalAluminumLengthM}, Peso aluminio (kg): {aluminumWeight}");

            var aluminumPriceData = await _priceRepository.GetByIdAsync(1); // precio del aluminio
            var aluminiumScrapPorcentagePriceData = await _priceRepository.GetByIdAsync(15); // porcentaje de desperdicio de aluminio
            decimal aluminumPricePerKg = aluminumPriceData.price;
            decimal aluminumScrapPercentage = aluminiumScrapPorcentagePriceData.price;
            decimal totalAluminumCost = (decimal)aluminumWeight * aluminumPricePerKg;  // costo total de aluminio
            totalAluminumCost += (totalAluminumCost * aluminumScrapPercentage) / 100; // agregar costo por desperdicio de aluminio
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
            decimal totalGlassCost = (decimal)totalGlassArea * glassPricePerM2;
            totalGlassCost += (totalGlassCost * glassScrapData.price) / 100; // agregar costo por desperdicio del vidrio
            budget_Product.GlassType.price = totalGlassCost; // Guardar el precio del vidrio en el producto
            Console.WriteLine($"Costo vidrio: {totalGlassCost}");

            // 3. CALCULAR TRATAMIENTO DE ALUMINIO
            var alumTreatment = await _alumTreatmentRepository.GetByNameAsync(budget_Product.AlumTreatment.name);
            var alumTreatmentScrapData = await _priceRepository.GetByIdAsync(16); // porcentaje de desperdicio del tratamiento de aluminio
            int alumTreatmentPrice = int.Parse(alumTreatment.pricePercentage);
            Console.WriteLine($"Porcentaje del tratamiento de aluminio '{budget_Product.AlumTreatment.name}': {alumTreatmentPrice}%");
            decimal totalAlumTreatmentCost = (totalAluminumCost * alumTreatmentPrice) / 100;
            totalAlumTreatmentCost += (totalAlumTreatmentCost * alumTreatmentScrapData.price) / 100; // agregar costo por desperdicio del tratamiento de aluminio
            budget_Product.AlumTreatment.pricePercentage = totalAlumTreatmentCost.ToString(); // Guardar el precio del tratamiento en el producto
            Console.WriteLine($"Costo tratamiento aluminio: {totalAlumTreatmentCost}");

            // 4. SUMAR MANO DE OBRA
            var laborData = await _priceRepository.GetByIdAsync(6); // costo de mano de obra
            decimal laborCost = laborData.price;
            laborCost *= (decimal)aluminumWeight; // costo de mano de obra por UNA abertura
            Console.WriteLine($"Costo de mano de obra por abertura: {laborCost} $");

            // 5. SUMAR ACCESORIOS
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

            // 7. APLICAR IMPUESTOS Y GASTOS INDIRECTOS DE FABRICACIÓN
            var IvaData = await _priceRepository.GetByIdAsync(4); // IVA
            var IFCData = await _priceRepository.GetByIdAsync(12); // Gastos Indirectos de Fabricación (GIF)
            decimal IvaRate = IvaData.price;
            decimal IFCRate = IFCData.price;
            decimal taxAmount = subtotal * (IvaRate + IFCRate) / 100; // Monto total de impuestos(IVA + GIF) TODO: Revisar si esta bien aplicado el GIF
            Console.WriteLine($"IVA aplicado: {IvaRate}% + Gastos indirectos de fabricación: {IFCRate}% = ${taxAmount}");

            // 8. PRECIO TOTAL (por UNA abertura)
            decimal totalPrice = subtotal + taxAmount ;
            Console.WriteLine($"Precio total (con IVA): {totalPrice} $");

            // LOG final con resumen (útil para comparar con frontend)
            Console.WriteLine(">> RESUMEN CALCULO ABERTURA:");
            Console.WriteLine($"   Aluminio: {totalAluminumCost} | Vidrio: {totalGlassCost} | Tratamiento: {totalAlumTreatmentCost} | ManoObra: {laborCost}");
            Console.WriteLine($"   Subtotal: {subtotal} | IVA ({IFCRate}%): {taxAmount} | Total IVA (sin por ahora  ): {totalPrice}");

            return totalPrice;
        }

        decimal TotalComplementPrice = 0;
        private async Task<decimal> CalculateComplementPrice(Complement complement)
        {
            if (complement.ComplementDoor != null)
            {
                foreach (var ComplementDoor in complement.ComplementDoor)
                {
                    var door = await _doorRepository.GetByNameAsync(ComplementDoor.Name);
                    decimal IndividualDoorPrice = door.price;
                    // Dimensiones estándar
                    double standardWidth = 90;
                    double standardHeight = 210;
                    double standardArea = standardWidth * standardHeight;

                    // Si alguna de las dimensiones es mayor al tamaño estandar , se aplica un precio acorde al tamaño
                    if (ComplementDoor.Width != 90 || ComplementDoor.Height != 210)
                    {
                        // Dimensiones reales de la puerta
                        double actualArea = ComplementDoor.Width * ComplementDoor.Height;

                        // Precio proporcional al área
                        decimal proportionalPrice = IndividualDoorPrice * (decimal)(actualArea / standardArea);

                        IndividualDoorPrice = proportionalPrice;
                    }

                    //Calculo del revestimiento
                    var coating = await _coatingRepository.GetByNameAsync(ComplementDoor.Coating.name);
                    var coatingScrapData = await _priceRepository.GetByIdAsync(18); // porcentaje de desperdicio del revestimiento
                    decimal coatingPrice = coating.price;
                    coatingPrice *= (decimal)(standardArea * 2.2) / 10000; // precio por m2 * area en cm2 / 10000 para pasar a m2
                    coatingPrice += (coatingPrice * coatingScrapData.price) / 100; // agregar costo por desperdicio del revestimiento
                    IndividualDoorPrice += coatingPrice;
                    ComplementDoor.Coating.price = coatingPrice * ComplementDoor.Quantity; // Guardar el precio del revestimiento en la puerta


                    if (ComplementDoor.Accesory != null)
                    {
                        //Calculo de accesorios
                        foreach (var Accesory in ComplementDoor.Accesory)
                        {
                            var accessory = await _accesoryRepository.GetByNameAsync(Accesory.Name);
                            decimal IndividualAccessoryPrice = accessory.price;

                            TotalComplementPrice += IndividualAccessoryPrice * Accesory.Quantity;
                            Accesory.Price = IndividualAccessoryPrice * Accesory.Quantity; // Guardar el precio total del accesorio en la puerta
                            ComplementDoor.Price += Accesory.Price * Accesory.Quantity; // Sumar el precio del accesorio al precio total del complemento

                        }
                    }
                    ComplementDoor.Price = (IndividualDoorPrice + coatingPrice) * ComplementDoor.Quantity;
                    TotalComplementPrice += ComplementDoor.Price; // Sumar el precio de la puerta al precio total del complemento
                    

                }
            }

            if (complement.ComplementRailing != null)
            {
                //Calculo basado en que la propiedad price es por unidad de baranda
                foreach (var ComplementRailing in complement.ComplementRailing)
                {
                    if (ComplementRailing.Name == "Baranda City")
                    {
                        var railing = await _railingRepository.GetByIdAsync(5);
                        decimal IndividualPartitionPrice = railing.price;

                        Console.WriteLine($"[DEBUG] Precio base SQL Baranda Imperia (ID=6): {IndividualPartitionPrice}");

                        if (ComplementRailing.Reinforced == true)
                        {
                            IndividualPartitionPrice *= 1.05m;
                            Console.WriteLine($"[DEBUG] Precio con refuerzo: {IndividualPartitionPrice}");

                        }

                        var alumTreatment = await _alumTreatmentRepository.GetByNameAsync(ComplementRailing.AlumTreatment.name);
                        int alumTreatmentPrice = int.Parse(alumTreatment.pricePercentage);
                        var alumTreatmentScrapData = await _priceRepository.GetByIdAsync(16); // porcentaje de desperdicio del tratamiento de aluminio
                        decimal IndividualRailingAlumTreatmentCost = (IndividualPartitionPrice * alumTreatmentPrice) / 100;
                        IndividualRailingAlumTreatmentCost += (IndividualRailingAlumTreatmentCost * alumTreatmentScrapData.price) / 100; // agregar costo por desperdicio del tratamiento de aluminio
                        IndividualPartitionPrice += IndividualRailingAlumTreatmentCost;
                        ComplementRailing.AlumTreatment.pricePercentage = IndividualRailingAlumTreatmentCost.ToString(); // Guardar el precio del tratamiento en la baranda
                        Console.WriteLine($"[DEBUG] Precio con tratamiento : {IndividualPartitionPrice}");

                        decimal TotalComplementRailingPrice = IndividualPartitionPrice * ComplementRailing.Quantity;
                        ComplementRailing.Price = TotalComplementRailingPrice;
                        TotalComplementPrice += TotalComplementRailingPrice;
                        Console.WriteLine($"[DEBUG] Precio final baranda: {ComplementRailing.Price}");
                    }

                    if (ComplementRailing.Name == "Baranda Imperia") 
                    {
                        var railing = await _railingRepository.GetByIdAsync(6);
                        decimal IndividualPartitionPrice = railing.price;

                        if (ComplementRailing.Reinforced == true)
                        {
                            IndividualPartitionPrice *= 1.15m;
                        }

                        var alumTreatment = await _alumTreatmentRepository.GetByNameAsync(ComplementRailing.AlumTreatment.name);
                        int alumTreatmentPrice = int.Parse(alumTreatment.pricePercentage);
                        var alumTreatmentScrapData = await _priceRepository.GetByIdAsync(16); // porcentaje de desperdicio del tratamiento de aluminio
                        decimal IndividualRailingAlumTreatmentCost = (IndividualPartitionPrice * alumTreatmentPrice) / 100;
                        IndividualRailingAlumTreatmentCost += (IndividualRailingAlumTreatmentCost * alumTreatmentScrapData.price) / 100; // agregar costo por desperdicio del tratamiento de aluminio
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
                    switch (ComplementPartition.GlassMilimeters)// Aplico un recargo según el espesor del vidrio
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
            }

            // Calculo de complementos
            if (budget.Complement != null && budget.Complement.Count > 0)
            {
                foreach (var complement in budget.Complement)
                {
                    var complementPrice = await CalculateComplementPrice(complement);
                    total += complementPrice;
                }
            }

            // Guardar el total en el presupuesto
            budget.Total = Math.Round(total, 2);

            return total;
        }

    }
}
