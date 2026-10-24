#:property JsonSerializerIsReflectionEnabledByDefault=true
using System.Text.Json;
var oldJson = """{"CustomerId":"c1"}""";
var evt = JsonSerializer.Deserialize<LeadConvertedV2>(oldJson)!;
Console.WriteLine(evt.CustomerId);
public class LeadConvertedV2
{
    public required string CustomerId { get; init; }
    public required string Source { get; init; }
}
