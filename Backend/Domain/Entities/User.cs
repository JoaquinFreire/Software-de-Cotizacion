namespace Entities
{
    public class User
    {
        public int id { get; set; }
        public string name { get; set; }
        public string lastname { get; set; }
        public UserRole role { get; set; }

        public User(string name, string lastname, UserRole role)
        {
            string Name = name;
            string Lastname = lastname;
            UserRole Role = role;
        }
    }
}
