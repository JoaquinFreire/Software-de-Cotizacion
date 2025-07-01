using Domain.Entities;
using Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Validators
{
    public class BudgetRules
    {
        public static void ValidateMinimumProducts(List<Budget_Product> products)
        {
            if (products == null || !products.Any())
                throw new BusinessException("La cotización debe incluir al menos un producto");
        }

        public static void ValidatePositiveQuantity(Budget_Product product)
        {
            if (product.Quantity <= 0)
                throw new BusinessException("La cantidad del producto debe ser mayor a cero");
        }

        //public static void ValidatePositivePrice(Budget_Product product)
        //{
        //    if (product.price <= 0)
        //        throw new BusinessException("El precio del producto debe ser mayor a cero");
        //}

        public static void ValidateUser(Budget budget)
        {
                       if (budget.user == null)
                throw new BusinessException("El usuario de la cotización no puede ser nulo o vacío");
        }
        public static void ValidateAllDate(Budget budget)
        {
            if (budget.creationDate == null || budget.creationDate == DateTime.MinValue)
                throw new BusinessException("La fecha de la cotización no puede ser nula o vacía");
            if (budget.ExpirationDate == null || budget.ExpirationDate == DateTime.MinValue)
                throw new BusinessException("La fecha de expiración de la cotización no puede ser nula o vacía");
            if (budget.ExpirationDate <= budget.creationDate)
                throw new BusinessException("La fecha de expiración debe ser posterior a la fecha de creación");
            if (budget.EndDate != null && budget.EndDate <= budget.creationDate)
                throw new BusinessException("La fecha de finalización debe ser posterior a la fecha de creación");
        }

        public static void ValidateCustomer(Budget budget)
        {
            if (budget.customer == null)
                throw new BusinessException("Cliente no cargado o seleccionado");
        }

        public static void ValidateWorkPlace(Budget budget)
        {
            if (budget.workPlace == null)
                throw new BusinessException("El lugar de trabajo de la cotización no puede ser nulo o vacío");
        }

        //TODO: Descomentar y validar las referencias del dólar y la mano de obra cuando se implementen(BudgetValidator tambien)

        //public static void ValidateDollarReference(Budget budget)
        //{
        //    if (budget.DollarReference <= 0)
        //        throw new BusinessException("La referencia del dólar debe ser mayor a cero");
        //}

        //public static void ValidateLabourReference(Budget budget)
        //{
        //    if (budget.LabourReference <= 0)
        //        throw new BusinessException("La referencia de la mano de obra debe ser mayor a cero");
        //}

        //public static void ValidateTotal(Budget budget)
        //{
        //    if (budget.Total <= 0)
        //        throw new BusinessException("El total del presupuesto debe ser mayor a cero");
        //}


        //VALIDACIONES ESPECIFICAS DE PRODUCTOS

        //Validación de tamaño de abertura(ancho y largo) <= 10 y >= 0.5
        public static void ValidateSizeLimits(Budget_Product product)
        {
            //Maximo en metros(10mts en este caso)
            if (product.width > 10 || product.height > 10)
                throw new BusinessException("El tamaño de la abertura supera los límites permitidos.");
            //Minimo en metros(0.25mts en este caso)
            if (product.width < 0.25 || product.height < 0.25)
                throw new BusinessException("El tamaño de la abertura es mas pequeño de lo permitido.");
        }

        //Validación de cantidad máxima de cada producto permitidos en la cotización(limite de 100 por productos de mismas caracteristicas)
        public static void ValidateMaxQuantity(Budget_Product product)
        {
            if (product.Quantity > 100)
                throw new BusinessException("La cantidad no puede superar las 100 unidades por producto.");
        }

        //Validación de precio del vidrio, debe ser mayor a cero. TODO: Descomentar cuando se implemente la validación de precios
        //public static void ValidateGlassComplementPrice(Budget_Product product)
        //{
        //    if (product.GlassComplement?.price <= 0)
        //        throw new BusinessException("El precio del complemento de vidrio debe ser mayor a cero.");
        //}

        //Validación del porcentaje del tratamiento de aluminio, debe estar entre 0% y 100%. TODO: Descomentar cuando se implemente la validación de precios
        //public static void ValidateAlumTreatmentPercentage(Budget_Product product)
        //{
        //    if (product.AlumTreatment?.pricePercentage < 0 || product.AlumTreatment?.pricePercentage > 100)
        //        throw new BusinessException("El porcentaje del tratamiento debe estar entre 0% y 100%.");
        //}




    }
}
