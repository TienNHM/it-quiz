#:property JsonSerializerIsReflectionEnabledByDefault=true
using System.Text.Json;
var json = """{"CustomerId":"c1","ConvertedAt":"2025-01-01T00:00:00Z"}""";
var evt = JsonSerializer.Deserialize<LeadConverted>(json)!;
Console.WriteLine($"{evt.CustomerId}|{evt.Source ?? "none"}");
public record LeadConverted(string CustomerId, DateTime ConvertedAt, string? Source = null);
