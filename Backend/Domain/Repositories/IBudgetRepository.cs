using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Repositories;
public interface IBudgetRepository
{
    public interface CreateBudget;
    public interface UpdateBudget;
    public interface DeleteBudget;
    public interface UpdateStatus;
}

