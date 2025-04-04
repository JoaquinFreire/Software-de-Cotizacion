using Application.DTOs;
using Application.UseCases;
using DinkToPdf.Contracts;
using DinkToPdf;
using System.Text;

public class GeneratePdfBudgetUseCase : IBudgetPdfGenerator
{
    private readonly IConverter _converter;

    public GeneratePdfBudgetUseCase(IConverter converter)
    {
        _converter = converter;
    }

    public byte[] Execute(BudgetDTO budget)
    {
        var html = BuildHtml(budget);

        var doc = new HtmlToPdfDocument()
        {
            GlobalSettings = {
                    PaperSize = PaperKind.A4,
                    Orientation = Orientation.Portrait,
                    Margins = new MarginSettings { Top = 10, Bottom = 10 }
                },
            Objects = {
                    new ObjectSettings()
                    {
                        HtmlContent = html,
                        WebSettings = { DefaultEncoding = "utf-8" }
                    }
                }
        };

        return _converter.Convert(doc);
    }
    string BuildHtml(BudgetDTO budget)
    {
        var productosHtml = new StringBuilder();
        foreach (var p in budget.Products)
        {
            var accesoriosHtml = new StringBuilder();
            if (p.Accesory != null && p.Accesory.Any())
            {
                accesoriosHtml.Append("<ul>");
                foreach (var a in p.Accesory)
                {
                    accesoriosHtml.Append($"<li>{a.Accesory?.name} - Cantidad: {a.Quantity}</li>");
                }
                accesoriosHtml.Append("</ul>");
            }
            else
            {
                accesoriosHtml.Append("—");
            }

            productosHtml.Append($@"
        <tr>
            <td>{p.OpeningType?.Name}</td>
            <td>{p.Quantity}</td>
            <td>{p.width} x {p.height} cm</td>
            <td>{p.AlumComplement?.name}</td>
            <td>{p.GlassComplement?.name}</td>
            <td>{p.AlumTreatment?.Name}</td>
            <td>{accesoriosHtml}</td>
        </tr>");
        }

        return $@"
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 30px; }}
        .header {{
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;
        }}
        .logo {{ width: 150px; }}
        .title {{ font-size: 28px; font-weight: bold; }}
        .info-section, .client-project {{
            display: flex; justify-content: space-between; margin-bottom: 20px;
        }}
        .section {{
            width: 48%;
        }}
        table {{
            width: 100%; border-collapse: collapse; margin-top: 10px;
        }}
        th, td {{
            border: 1px solid #ccc; padding: 8px; text-align: left; vertical-align: top;
        }}
        th {{
            background-color: #f2f2f2;
        }}
        .total {{
            text-align: right; font-size: 16px; font-weight: bold; margin-top: 20px;
        }}
        .footer {{
            position: absolute; bottom: 30px; width: 100%; font-size: 12px;
        }}
    </style>
</head>
<body>
    <div class='header'>
        <img src='https://via.placeholder.com/150x50?text=LOGO' class='logo' />
        <div class='title'>Cotización</div>
    </div>

    <div class='info-section'>
        <div>
            <p><strong>Fecha:</strong> {budget.creationDate?.ToString("dd/MM/yyyy")}</p>
            <p><strong>ID Presupuesto:</strong> {budget.id}</p>
            <p><strong>Vencimiento:</strong> {budget.ExpirationDate?.ToString("dd/MM/yyyy")}</p>
            <p><strong>Cotizador:</strong> {budget.user?.name} {budget.user?.lastName}</p>
        </div>
    </div>

    <div class='client-project'>
        <div class='section'>
            <h4>Datos del Cliente</h4>
            <p><strong>Nombre:</strong> {budget.customer?.name} {budget.customer?.lastname}</p>
            <p><strong>Correo:</strong> {budget.customer?.mail}</p>
            <p><strong>Dirección:</strong> {budget.customer?.address}</p>
            <p><strong>Teléfono:</strong> {budget.customer?.tel}</p>
        </div>
        <div class='section'>
            <h4>Datos de la Obra</h4>
            <p><strong>Dirección:</strong> {budget.workPlace?.address}</p>
        </div>
    </div>

    <h3>Detalle de Productos</h3>
    <table>
        <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Dimensiones</th>
            <th>Aluminio</th>
            <th>Vidrio</th>
            <th>Tratamiento</th>
            <th>Accesorios</th>
        </tr>
        {productosHtml}
    </table>

    <div class='total'>
        <p>Total: ${budget.Total:F2}</p>
        <p>Referencia Dólar: ${budget.DollarReference:F2}</p>
        <p>Mano de Obra: ${budget.LabourReference:F2}</p>
    </div>

    <div class='footer'>
        <p><strong>Comentario:</strong> {budget.Comment}</p>
    </div>
</body>
</html>";
    }


}
