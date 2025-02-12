using Enums;
namespace Entities
{
    internal class Budget
    {
        public int id { get; set; }
        public DateOnly creationDate { get; set; }
        public BudgetStatus status { get; set; }
        public double totalPrice { get; set; }
        public DateOnly last_edit { get; set; }
        public User employee { get; set; }
        public Customer customer { get; set; }
        public WorkSpace workspace { get; set; }
    }
}
