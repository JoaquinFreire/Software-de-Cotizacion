FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copia SOLO los archivos necesarios
COPY ./Presentation ./Presentation
COPY ./Application ./Application
COPY ./Domain ./Domain
COPY ./Infrastructure ./Infrastructure
COPY ./Shared ./Shared

WORKDIR /app/Presentation
RUN dotnet restore
RUN dotnet publish Presentation.csproj -c Release -o /app/out

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Presentation.dll"]
