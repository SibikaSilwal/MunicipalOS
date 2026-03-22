FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY src/MunicipalOS.Migrator/MunicipalOS.Migrator.csproj src/MunicipalOS.Migrator/
RUN dotnet restore src/MunicipalOS.Migrator/MunicipalOS.Migrator.csproj

COPY src/MunicipalOS.Migrator/ src/MunicipalOS.Migrator/
RUN dotnet publish src/MunicipalOS.Migrator/MunicipalOS.Migrator.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/runtime:10.0
WORKDIR /app
COPY --from=build /app .
ENTRYPOINT ["dotnet", "MunicipalOS.Migrator.dll"]
