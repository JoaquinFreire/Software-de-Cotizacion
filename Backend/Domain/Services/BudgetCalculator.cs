using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Services
{
    public class BudgetCalculator
    {
        //TODO: Llamar a un servicio externo para traer los precios para calcular


        /* Calcular el monto individual de cada producto en base a sus medidas, linea de abertura, precio de aluminio, precio de mano de obra, tipo de vidrio y tratamiento.
           Al subtotal se le sumara el precio de los accesorios.
           La disposición de los precios sera: 
           Precio individual de abertura, en base a sus requisitos, - Precio individual de accesorios - Subtotal(Precio individual(abertura) x cantidad + precio individual(accesorio) x cantidad)
         */
        public decimal CalculateProductAmount(double width, double heigth, int productQuantity, List<decimal>AccesoriesPrice, int accesoryQuantity) {

            return 0;
        }
        public decimal CalculateTotalAmount(List<decimal> itemPrices)
        {
            if (itemPrices == null || itemPrices.Count == 0)
            {
                throw new ArgumentException("Item prices cannot be null or empty.", nameof(itemPrices));
            }
            return itemPrices.Sum();
        }
        public decimal CalculateTax(decimal amount, decimal taxRate)
        {
            if (amount < 0)
            {
                throw new ArgumentException("Amount cannot be negative.", nameof(amount));
            }
            if (taxRate < 0 || taxRate > 1)
            {
                throw new ArgumentException("Tax rate must be between 0 and 1.", nameof(taxRate));
            }
            return amount * taxRate;
        }
        public decimal CalculateFinalAmount(decimal totalAmount, decimal taxAmount)
        {
            if (totalAmount < 0 || taxAmount < 0)
            {
                throw new ArgumentException("Total amount and tax amount cannot be negative.");
            }
            return totalAmount + taxAmount;
        }
    }
}
