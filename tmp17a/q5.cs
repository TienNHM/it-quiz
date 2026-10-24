var cb = new Breaker();
var calls = new (bool ok, int t)[] { (false, 0), (false, 1), (false, 2), (true, 3), (true, 10) };
foreach (var (ok, t) in calls)
{
    if (!cb.TryEnter(t)) { Console.WriteLine($"t={t} skip"); continue; }
    cb.Report(ok, t);
    Console.WriteLine($"t={t} call -> {cb.State}");
}
class Breaker
{
    int fails, openedAt;
    public string State { get; private set; } = "Closed";
    public bool TryEnter(int now)
    {
        if (State == "Open" && now - openedAt >= 5) State = "HalfOpen";
        return State != "Open";
    }
    public void Report(bool ok, int now)
    {
        if (ok) { fails = 0; State = "Closed"; return; }
        fails++;
        if (State == "HalfOpen" || fails >= 3) { State = "Open"; openedAt = now; }
    }
}
