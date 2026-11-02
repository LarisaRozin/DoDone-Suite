# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["DoDone.sln", "./"]
COPY ["DoDone.Worker/DoDone.Worker.csproj", "DoDone.Worker/"]
COPY ["DoDone.Server/DoDone.Server.csproj", "DoDone.Server/"]
COPY ["DoDone.Shared/DoDone.Shared.csproj", "DoDone.Shared/"]
COPY ["DoDone.Db/DoDone.Db.csproj", "DoDone.Db/"]

# Restore dependencies
RUN dotnet restore "DoDone.Worker/DoDone.Worker.csproj"

# Copy everything else
COPY . .

# Build the worker project
WORKDIR "/src/DoDone.Worker"
RUN dotnet build "DoDone.Worker.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "DoDone.Worker.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Set environment to Production
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "DoDone.Worker.dll"]
