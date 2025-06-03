public class BudgetIdGenerator
{
    public string GenerateBudgetId(string customerName, string customerLastName)
    {
        // Iniciales del cliente
        string initials = GetInitials(customerName, customerLastName);

        // Fecha en formato ddMMyy
        string date = DateTime.UtcNow.ToString("ddMMyy");

        // Código aleatorio de 6 caracteres
        string randomCode = GenerateRandomCode(6);
        return $"{initials}-{date}-{randomCode}";
    }

    private string GetInitials(string name, string lastName)
    {
        var n = string.IsNullOrWhiteSpace(name) ? "X" : name.Trim()[0].ToString().ToUpper();
        var l = string.IsNullOrWhiteSpace(lastName) ? "X" : lastName.Trim()[0].ToString().ToUpper();
        return n + l;
    }

    private string GenerateRandomCode(int length)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Range(0, length).Select(_ => chars[random.Next(chars.Length)]).ToArray());
    }
}
