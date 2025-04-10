using Application.DTOs;
using QuestPDF.Companion;
using QuestPDF.Fluent;
using QuestPDF.Previewer;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.UseCases
{
    public class PdfBudgetUseCase : IBudgetPdfGenerator
    {
        public byte[] Execute(BudgetDTO budget)
        {
            var document = new BudgetPdfDocument(budget);
            return document.GeneratePdf();
        }
    }
}
