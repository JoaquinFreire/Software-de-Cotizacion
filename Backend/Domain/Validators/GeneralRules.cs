using Domain.Entities;
using Domain.Exceptions;
using System.Text.RegularExpressions;

namespace Domain.Validators
{
    public class GeneralRules
    {
        public static void ValidateDni(string dni)
        {
            if (string.IsNullOrEmpty(dni)) throw new CustomerException("El DNI no puede estar vacío.");
            if (!Regex.IsMatch(dni, @"^\d{1,10}$")) throw new CustomerException("El DNI debe contener solo numeros");
        }
        public static void ValidateTelephoneNumber(string tel)
        {
            if (string.IsNullOrWhiteSpace(tel))
                throw new BusinessException($"Debe ingresar un número de telefono.");
            if (tel.Length < 9 || tel.Length > 15)
                throw new BusinessException($"El número de telefono debe tener entre 7 y 15 caracteres.");
            if (!System.Text.RegularExpressions.Regex.IsMatch(tel, @"^\+?[0-9\s\-()]+$"))
                throw new BusinessException($"El número de telefono contiene caracteres inválidos.");
        }
        public static void ValidateEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                throw new BusinessException("El correo electrónico no puede estar vacío.");
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                if (addr.Address != email)
                    throw new BusinessException("El correo electrónico no es válido.");
            }
            catch
            {
                throw new BusinessException("El correo electrónico no es válido.");
            }
        }
        public static void ValidateNameAndLastName(string name, string lastName)
        {
            if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(lastName))
                throw new BusinessException("El nombre y apellido no pueden estar vacíos.");
            if (name.Length > 50 || lastName.Length > 50)
                throw new BusinessException("El nombre y apellido no pueden tener más de 50 caracteres.");
            if (!System.Text.RegularExpressions.Regex.IsMatch(name, @"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$") ||
                !System.Text.RegularExpressions.Regex.IsMatch(lastName, @"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$"))
                throw new BusinessException("El nombre y apellido contienen caracteres inválidos.");
        }
        public static void ValidateAddress(string address)
        {
            if (string.IsNullOrEmpty(address)) throw new CustomerException("La dirección no puede estar vacía.");
            if (address.Length > 100) throw new CustomerException("La dirección no puede tener más de 100 caracteres.");
            address = address.Trim();
        }
    }
}
