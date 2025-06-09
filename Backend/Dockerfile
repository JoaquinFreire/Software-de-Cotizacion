# Usa .NET 8 SDK para build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copia todo al contenedor
COPY . ./

# Restaura dependencias (desde Presentation.csproj)
WORKDIR /app/Presentation
RUN dotnet restore

# Publica en modo Release
RUN dotnet publish Presentation.csproj -c Release -o /app/out

# Imagen de runtime liviano para correr la app
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .

# Expone puerto por defecto de ASP.NET
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Presentation.dll"]
