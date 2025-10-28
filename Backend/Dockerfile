# Stage 1: build
FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /src

# Copiar todo y restaurar paquetes
COPY . .
# Ajusta la ruta del proyecto si tu csproj está en otra ubicación
RUN dotnet restore "Backend/Presentation/Presentation.csproj"

# Publicar en Release
RUN dotnet publish "Backend/Presentation/Presentation.csproj" -c Release -o /app/publish

# Stage 2: runtime
FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5187
EXPOSE 5187

ENTRYPOINT ["dotnet", "Presentation.dll"]
