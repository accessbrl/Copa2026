FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY backend/AlbumCopa.Api.csproj backend/
RUN dotnet restore backend/AlbumCopa.Api.csproj

COPY backend/ backend/
RUN dotnet publish backend/AlbumCopa.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
ENTRYPOINT ["dotnet", "AlbumCopa.Api.dll"]
