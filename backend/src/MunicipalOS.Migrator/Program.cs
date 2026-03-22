using DbUp;
using DbUp.Engine;

var connectionString = Environment.GetEnvironmentVariable("CONNECTION_STRING")
    ?? "Host=localhost;Port=5432;Database=municipalos;Username=postgres;Password=postgres";

EnsureDatabase.For.PostgresqlDatabase(connectionString);

var upgrader = DeployChanges.To
    .PostgresqlDatabase(connectionString)
    .WithScriptsEmbeddedInAssembly(typeof(Program).Assembly,
        s => s.EndsWith(".sql", StringComparison.OrdinalIgnoreCase))
    .WithTransactionPerScript()
    .LogToConsole()
    .Build();

DatabaseUpgradeResult result = upgrader.PerformUpgrade();

if (!result.Successful)
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine("Migration failed:");
    Console.WriteLine(result.Error);
    Console.ResetColor();
    Environment.Exit(-1);
}

Console.ForegroundColor = ConsoleColor.Green;
Console.WriteLine("Database migration completed successfully.");
Console.ResetColor();
