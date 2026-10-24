var delivered = new[] { "m1", "m2", "m1", "m3", "m2" };
int naive = 0, safe = 0;
var seen = new HashSet<string>();
foreach (var id in delivered)
{
    naive++;
    if (seen.Add(id)) safe++;
}
Console.WriteLine($"{naive}/{safe}");
