using Domain.Entities;
using Domain.Exceptions;
using System.Text.RegularExpressions;

namespace Domain.Validators
{
    public class CustomerRules
    {
        public static void ValidateDni(Customer customer)
        {
            if (string.IsNullOrEmpty(customer.dni)) throw new CustomerException("El DNI no puede estar vacío.");
            if (!Regex.IsMatch(customer.dni, @"^\d{1,10}$")) throw new CustomerException("El DNI debe contener solo numeros");
        }

        public static void ValidateName(Customer customer)
        {
            if (string.IsNullOrWhiteSpace(customer.name) || customer.name.Trim().Length < 2) throw new CustomerException("El nombre debe tener al menos 2 caracteres.");
            if (string.IsNullOrEmpty(customer.name)) throw new CustomerException("El nombre no puede estar vacío.");
            if (!Regex.IsMatch(customer.name, @"^[a-zA-Z\s]+$")) throw new CustomerException("El nombre solo puede contener letras y espacios.");
            if (customer.name.Length > 50) throw new CustomerException("El nombre no puede tener más de 50 caracteres.");
        }

        public static void ValidateLastName(Customer customer)
        {
            if (string.IsNullOrWhiteSpace(customer.lastname) || customer.lastname.Trim().Length < 2) throw new CustomerException("El apellido debe tener al menos 2 caracteres.");
            if (string.IsNullOrEmpty(customer.lastname)) throw new CustomerException("El apellido no puede estar vacío.");
            if (!Regex.IsMatch(customer.lastname, @"^[a-zA-Z\s]+$")) throw new CustomerException("El apellido solo puede contener letras y espacios.");
            if (customer.lastname.Length > 50) throw new CustomerException("El apellido no puede tener más de 50 caracteres.");
        }

        public static void ValidateTelephoneNumber(Customer customer)
        {
            if (string.IsNullOrEmpty(customer.tel)) throw new CustomerException("El número de teléfono no puede estar vacío.");
            customer.tel = Regex.Replace(customer.tel, @"[\s\-\(\)]", "");
            if (!Regex.IsMatch(customer.tel, @"^\+?\d{10,15}$")) throw new CustomerException("El número de teléfono debe contener entre 10 y 15 dígitos y puede contener un '+' opcional al inicio.");
            var repeated = new[] { "0000000000", "1111111111", "1234567890" };
            if (repeated.Contains(customer.tel)) throw new CustomerException("El número de teléfono ingresado no es válido.");
        }

        public static void ValidateEmail(Customer customer)
        {
            if (string.IsNullOrEmpty(customer.mail)) throw new CustomerException("El correo electrónico no puede estar vacío.");
            var regex = new Regex(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");
            if (!regex.IsMatch(customer.mail))throw new CustomerException("El correo electrónico no tiene un formato válido.");
            if (customer.mail.StartsWith(".") || customer.mail.EndsWith(".") || customer.mail.StartsWith("@") || customer.mail.EndsWith("@")) throw new CustomerException("El correo electrónico tiene un formato inválido.");
            if (customer.mail.Contains("..") || customer.mail.Contains("@@")) throw new CustomerException("El correo electrónico contiene caracteres inválidos repetidos.");
            if (customer.mail.Length > 100) throw new CustomerException("El correo electrónico no puede tener más de 100 caracteres.");
            customer.mail = customer.mail.Trim().ToLower();
        }

        public static void ValidateAddress(Customer customer)
        {
            if (string.IsNullOrEmpty(customer.address)) throw new CustomerException("La dirección no puede estar vacía.");
            if (customer.address.Length > 100) throw new CustomerException("La dirección no puede tener más de 100 caracteres.");
            customer.address = customer.address.Trim();
        }
    }
}
