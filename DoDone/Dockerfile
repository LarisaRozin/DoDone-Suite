# Use the official .NET runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

# Use the SDK image to build the application
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files
COPY ["DoDone.Server/DoDone.Server.csproj", "DoDone.Server/"]
COPY ["DoDone.Shared/DoDone.Shared.csproj", "DoDone.Shared/"]
COPY ["DoDone.Db/DoDone.Db.csproj", "DoDone.Db/"]

# Restore dependencies
RUN dotnet restore "DoDone.Server/DoDone.Server.csproj"

# Copy all source code
COPY . .

# Debug: List what was copied to see if Firebase key is there
RUN ls -la /src/DoDone.Server/ | grep -i firebase || echo "Firebase key not found in build context"

# Build the application
WORKDIR "/src/DoDone.Server"
RUN dotnet build "DoDone.Server.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "DoDone.Server.csproj" -c Release -o /app/publish /p:UseAppHost=false
# Debug: List published files to see if Firebase key is included
RUN ls -la /app/publish/ | grep -i firebase || echo "Firebase key not found in publish output"

# Final stage - runtime image
FROM base AS final
WORKDIR /app

# Install GSSAPI library for Kerberos authentication
RUN apt-get update && \
    apt-get install -y libgssapi-krb5-2 && \
    rm -rf /var/lib/apt/lists/*

# Copy published application
COPY --from=publish /app/publish .

# Set environment variables for production
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "DoDone.Server.dll"]