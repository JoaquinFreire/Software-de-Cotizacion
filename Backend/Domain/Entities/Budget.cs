using Enums;
namespace Domain.Entities;

public class Budget2
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