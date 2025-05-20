using Application.DTOs.CreateBudget;
using QuestPDF.Companion;
using QuestPDF.Fluent;
using QuestPDF.Previewer;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.UseCases.Budget
{
    public class PdfBudgetUseCase : IBudgetPdfGenerator
    {
        public byte[] Execute(CreateBudgetDTO budget)
        {
            var document = new CreateBudgetPdfDocument(budget);
            return document.GeneratePdf();
        }
    }
}
