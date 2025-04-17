using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using QuestPDF.Drawing;
using QuestPDF.Previewer;
using Application.DTOs.CreateBudget;
using System.Security.Cryptography.X509Certificates;
using QuestPDF.Companion;

public class CreateBudgetPdfDocument : IDocument
{
    private readonly CreateBudgetDTO _budget;
    public CreateBudgetPdfDocument(CreateBudgetDTO budget)
    {
        _budget = budget;
    }

    public DocumentMetadata Metadata() => DocumentMetadata.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Margin(30);
            page.Size(PageSizes.A4);
            page.DefaultTextStyle(x => x.FontSize(12));

            page.Header().Element(ComposeHeader);
            page.Content().Element(ComposeContent);
            page.Footer().Element(ComposeFooter);
        });
        //this.ShowInCompanion();
    }

    void ComposeHeader(IContainer container)
    {
        container.Column(column =>
        {
            column.Item().Row(row =>
            {
                //Logo Anodal
                var logoBytes = File.ReadAllBytes("img/anodalLogo.png");
                row.RelativeItem().Height(100).Image(logoBytes).FitHeight();

                //Titulo documento
                row.RelativeItem().AlignMiddle().AlignCenter().Text("Cotización")
                    .FontSize(24).Bold();

                //Info Empresa
                row.RelativeItem().AlignMiddle().AlignRight().Column(col =>
                {
                    col.Item().Text("Anodal S.A.");
                    col.Item().Text("Av. Japón 1292 Córdoba");
                    col.Item().Text("info@anodal.com.ar");
                    col.Item().Text("0351 4995870");
                });
            });
            //Linea divisoria
            column.Item().PaddingTop(0).PaddingBottom(15).LineHorizontal(1).LineColor(Colors.Grey.Medium);
        });
    }

    void ComposeContent(IContainer container)
    {
        container.Column(col =>
        {
            col.Item().Row(row => {
                //Info Cotización
                row.RelativeItem().Column(col1 =>
                {
                    col1.Item().Text($"Cotización N°: ").FontSize(16).Bold();
                });
                row.RelativeItem().Column(col2 =>
                {
                    col2.Item().AlignRight().Text($"Fecha: {DateTime.Now.ToString("dd/MM/yyyy")}");
                    col2.Item().AlignRight().Text($"Válido hasta: {DateTime.Now.AddDays(7).ToString("dd/MM/yyyy")}");
                });

                col.Item().PaddingVertical(10);
            });

            col.Item().Row(row =>
            {
                row.RelativeItem().Column(col1 =>
                {
                    //Info Cliente
                    col1.Item().Text("Cliente").FontSize(14).Bold();
                    col1.Item().Text($"Nombre: {_budget.customer?.name} {_budget.customer?.lastname}");
                    col1.Item().Text($"Correo: {_budget.customer?.mail}");
                    col1.Item().Text($"Tel: {_budget.customer?.tel}");
                    col1.Item().Text($"Dirección: {_budget.customer?.address}");
                });

                row.RelativeItem().Column(col2 =>
                {
                    //Info Lugar de trabajo
                    col2.Item().Text("Lugar de Trabajo").FontSize(14).Bold();
                    col2.Item().Text($"Nombre: {_budget.workPlace?.name}");
                    col2.Item().Text($"Dirección: {_budget.workPlace?.address}");
                });

                row.RelativeItem().Column(col3 =>
                {
                    //Info Vendedor/Cotizador
                    col3.Item().Text("Vendedor").FontSize(14).Bold();
                    col3.Item().Text($"Nombre: {_budget.user?.name} {_budget.user?.lastName}");
                    col3.Item().Text($"Mail: {_budget.user?.mail}");
                });

                col.Item().PaddingVertical(10).LineHorizontal(1).LineColor(Colors.Grey.Medium);
            });

            //Tabla de productos
            col.Item().Text("Productos").FontSize(16).Bold();
            col.Item().PaddingVertical(5);
            col.Item().Table(table =>
            {
                //Columnas de la tabla
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn();      // Producto
                    columns.ConstantColumn(45);    // Cantidad
                    columns.ConstantColumn(90);    // Dimensiones
                    columns.RelativeColumn();      // Vidrio
                    columns.RelativeColumn();      // Tratamiento
                    columns.ConstantColumn(70);    // Precio/u
                });

                //Encabezado de la tabla
                table.Header(header =>
                {
                    header.Cell().Text("Producto").Bold();
                    header.Cell().Text("Cant.").Bold();
                    header.Cell().Text("Dimensiones").Bold();
                    header.Cell().Text("Vidrio").Bold();
                    header.Cell().Text("Tratamiento").Bold();
                    header.Cell().Text("Precio/u").Bold();
                });

                //Contenido de la tabla
                foreach (var p in _budget.Products)
                {
                    // Fila principal del producto
                    table.Cell().PaddingVertical(5).Text(p.OpeningType?.name ?? "-");
                    table.Cell().PaddingVertical(5).Text($"{p.Quantity}");
                    table.Cell().PaddingVertical(5).Text($"{p.width}x{p.height} cm");
                    table.Cell().PaddingVertical(5).Text(p.GlassComplement?.name ?? "-");
                    table.Cell().PaddingVertical(5).Text(p.AlumTreatment?.name ?? "-");
                    table.Cell().PaddingVertical(5).Text($"abc");

                    // Subtabla de accesorios (una fila extra)
                    table.Cell().ColumnSpan(6).PaddingBottom(10).PaddingLeft(10).Element(cell =>
                    {
                        if (p.Accesory != null && p.Accesory.Any())
                        {
                            cell.Column(subCol =>
                            {
                                subCol.Item().Text("Accesorios:").Bold().FontSize(11).Underline();

                                foreach (var a in p.Accesory)
                                {
                                    subCol.Item().Row(row =>
                                    {
                                        row.RelativeItem().Text($"• {a.Accesory?.name ?? "-"}");
                                        row.ConstantItem(50).AlignRight().Text($"x{a.Quantity}");
                                        row.ConstantItem(100).AlignRight().Text("Precio de accesorio");//Precio de accesorio(?)
                                    });
                                }
                            });
                        }
                        else
                        {
                            cell.Text("Sin accesorios").Italic().FontSize(10).FontColor(Colors.Grey.Medium);
                        }
                    });

                    // Esta celda vacía compensa la 7ma columna (Precio/u)
                    table.Cell().Text("");

                    // Subtotal del producto (alineado a la derecha)
                    table.Cell().ColumnSpan(6).AlignRight().PaddingBottom(15).Text(text =>
                    {
                        text.Span("Subtotal: ").Bold();
                    });
                }

            });

            col.Item().PaddingTop(10).AlignRight().Text(text =>
            {
                text.Span("Total: ").Bold().FontSize(16);
                //text.Span($"${_budget.Total:F2}").FontSize(14);
            });
            col.Item().AlignRight().Text($"Dólar Ref:");//Agregar metodo para obtener el dolar referencia
            col.Item().AlignRight().Text($"Mano de Obra:");//Agregar metodo para obtener la mano de obra referencia
            col.Item().PaddingTop(10).Text($"Observaciones: {_budget.Comment}");
        });
    }

    public void ComposeFooter(IContainer container)
    {
        container.Column(col =>
        {
            col.Item().PaddingBottom(5).LineHorizontal(1).LineColor(Colors.Grey.Medium);

            col.Item().Row(row =>
            {
                row.RelativeItem().AlignRight().Text(text =>
                {
                    text.Span("Página ");
                    text.CurrentPageNumber();
                    text.Span(" de ");
                    text.TotalPages();
                });
            });
        });
    }
}
