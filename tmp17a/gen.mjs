import {writeFileSync, readFileSync} from 'node:fs';
const F = '`'.repeat(3);
const fence = (lang, s) => `${F}${lang}\n${s}\n${F}`;
const rd = (f) => readFileSync(new URL(f, import.meta.url), 'utf8').trim();
const Q = [];
const verify = [];
const src = (n) => `Module 17 - ${n}`;

// Q1
Q.push({
  id: 'dotnet-m17-01', topic: 'Schema versioning', source: src('Event-driven architecture (EDA) - khi nào dùng?'),
  question: 'Trong queue còn message cũ (V1) chưa kịp xử lý, bạn triển khai consumer dùng record V2 có thêm trường `Source` với giá trị mặc định `null`. Chương trình sau in gì?',
  code: 'using System.Text.Json;\n\nvar json = """{"CustomerId":"c1","ConvertedAt":"2025-01-01T00:00:00Z"}""";\nvar evt = JsonSerializer.Deserialize<LeadConverted>(json)!;\nConsole.WriteLine($"{evt.CustomerId}|{evt.Source ?? "none"}");\n\npublic record LeadConverted(\n    string CustomerId, DateTime ConvertedAt, string? Source = null);',
  codeLang: 'csharp',
  options: ['c1|', 'c1|none', 'c1|null', 'JsonException lúc chạy vì message V1 thiếu `Source`'],
  answer: 1,
  explanation: 'Trường mới có giá trị mặc định (`= null`) nên message V1 không có `Source` vẫn đọc được: `Source` là `null`, toán tử `??` cho ra "none", nên in `c1|none`. Đây chính là quy tắc "chỉ thêm trường tuỳ chọn".\n- `c1|` sai: `??` thay giá trị null bằng "none", chuỗi không rỗng.\n- `c1|null` sai: `Console.WriteLine` không in chữ "null"; ở đây biểu thức đã trả về "none".\n- JsonException sai: lỗi chỉ xảy ra nếu trường là `required` (xem câu về trường bắt buộc), còn tham số có mặc định thì không bắt buộc.'
});
verify.push({id: 'dotnet-m17-01', kind: 'cs-predict', program: '#:property JsonSerializerIsReflectionEnabledByDefault=true\n#:property NoWarn=IL2026;IL3050\n' +rd('q1.cs').split('\n').slice(1).join('\n')});

// Q2
Q.push({
  id: 'dotnet-m17-02', topic: 'At-least-once và idempotent', source: src('Messaging fears: lost & duplicates'),
  question: 'Broker giao lại message vì ACK bị mất trên đường truyền. Consumer "ngây thơ" xử lý mọi lần giao, consumer "an toàn" ghi `MessageId` vào inbox (giống unique key) và bỏ qua nếu đã có. In ra `naive/safe` là gì?',
  code: 'var delivered = new[] { "m1", "m2", "m1", "m3", "m2" };\nint naive = 0, safe = 0;\nvar seen = new HashSet<string>();\n\nforeach (var id in delivered)\n{\n    naive++;\n    if (seen.Add(id)) safe++;\n}\nConsole.WriteLine($"{naive}/{safe}");',
  codeLang: 'csharp',
  options: ['5/5', '3/3', '5/2', '5/3'],
  answer: 3,
  explanation: 'Có 5 lần giao nhưng chỉ 3 `MessageId` khác nhau (m1, m2, m3). Consumer ngây thơ xử lý cả 5 lần; `HashSet.Add` trả `false` ở lần giao trùng nên consumer an toàn chỉ xử lý 3 lần: `5/3`.\n- `5/5` sai: nghĩa là inbox không chặn được gì.\n- `3/3` sai: consumer ngây thơ không lọc nên vẫn đếm đủ 5.\n- `5/2` sai: m3 chỉ giao một lần nhưng vẫn là message hợp lệ mới, nên safe phải tính cả m3.\nTrong hệ thống thật, vai trò của `HashSet` do PRIMARY KEY của bảng inbox đảm nhiệm.'
});
verify.push({id: 'dotnet-m17-02', kind: 'cs-predict', program: rd('q2.cs')});

// Q3
Q.push({
  id: 'dotnet-m17-03', topic: 'Inbox và vi phạm unique', source: src('Messaging fears: lost & duplicates'),
  question: 'Mô phỏng bảng inbox bằng `Dictionary` với khoá là `MessageId`. Broker giao `m1` hai lần. Dòng nào, khi đặt vào vòng lặp, sẽ **ném exception** ở lần giao trùng (giống vi phạm unique key không được bắt)?',
  code: 'var inbox = new Dictionary<string, bool>();\nvar ids = new[] { "m1", "m2", "m1" };\n\nforeach (var id in ids)\n{\n    // ??? chèn vào đây\n}\nConsole.WriteLine("done");',
  codeLang: 'csharp',
  options: ['```csharp\ninbox[id] = true;\n```', '```csharp\ninbox.TryAdd(id, true);\n```', '```csharp\ninbox.Add(id, true);\n```', '```csharp\nif (!inbox.ContainsKey(id))\n    inbox.Add(id, true);\n```'],
  answer: 2,
  explanation: '`Dictionary.Add` ném `ArgumentException` khi khoá đã tồn tại, giống `INSERT` bị vi phạm PRIMARY KEY: nếu không bắt lỗi thì consumer thất bại ở lần giao trùng.\n- `inbox[id] = true` ghi đè lặng lẽ, không ném lỗi.\n- `TryAdd` trả `false` thay vì ném lỗi, là cách "bỏ qua nếu trùng" an toàn.\n- `ContainsKey` rồi `Add` chạy được trong một luồng; nhưng lưu ý với cơ sở dữ liệu thật, kiểu "kiểm tra trước rồi ghi" có race condition khi nhiều consumer chạy song song, nên phải dựa vào unique constraint và bắt lỗi.'
});
verify.push({id: 'dotnet-m17-03', kind: 'cs-find-error', errorKind: 'runtime',
  template: 'var inbox = new Dictionary<string, bool>();\nvar ids = new[] { "m1", "m2", "m1" };\n\nforeach (var id in ids)\n{\n    {{X}}\n}\nConsole.WriteLine("done");',
  options: ['inbox[id] = true;', 'inbox.TryAdd(id, true);', 'inbox.Add(id, true);', 'if (!inbox.ContainsKey(id))\n    inbox.Add(id, true);']});

// Q4
const delayTpl = 'double Delay(int attempt)\n{\n    {{X}}\n}\n\nvar s = Enumerable.Range(0, 20)\n    .Select(_ => Delay(10)).ToList();\nConsole.WriteLine($"max<=60:{s.Max() <= 60} " +\n    $"min>=0:{s.Min() >= 0} " +\n    $"random:{s.Distinct().Count() > 2}");';
const dOpts = [
  'return Random.Shared.NextDouble()\n       * Math.Pow(2, attempt);',
  'var max = Math.Min(Math.Pow(2, attempt), 60);\nreturn Random.Shared.NextDouble() * max;',
  'return Math.Min(Math.Pow(2, attempt), 60);',
  'var max = Math.Min(Math.Pow(2, attempt), 60);\nreturn Random.Shared.NextDouble() * max\n       - max / 2;'
];
Q.push({
  id: 'dotnet-m17-04', topic: 'Retry với backoff và jitter', source: src('Retry và backoff'),
  question: 'Bạn cần hàm `Delay(attempt)` cho retry: luỹ thừa 2, **trần 60 giây**, và có **full jitter** (ngẫu nhiên trong [0, trần)) để 500 consumer không retry cùng một lúc. Mẫu kiểm tra in `max<=60`, `min>=0`, `random` cho 20 mẫu ở `attempt = 10`. Thân hàm nào đúng, tức là in `True True True`?',
  code: delayTpl.replace('{{X}}', '// ??? thân hàm cần chọn'),
  codeLang: 'csharp',
  options: dOpts.map((o) => fence('csharp', o)),
  answer: 1,
  explanation: 'Đáp án đúng lấy trần `Math.Min(2^attempt, 60)` rồi nhân với `NextDouble()` (thuộc [0, 1)), cho kết quả trong [0, 60) và khác nhau giữa các lần gọi: `True True True`.\n- Thiếu trần: ở lần thử 10, 2^10 = 1024 giây nên vượt 60, in `max<=60:False`.\n- Chỉ có trần mà không jitter: luôn trả 60, mọi consumer cùng chờ như nhau nên `random:False`, đúng kịch bản "đàn bò" đánh sập database đang hồi phục.\n- Trừ đi `max / 2`: jitter bị lệch về phía âm, `min>=0:False` (thời gian chờ âm là vô nghĩa).'
});
verify.push({id: 'dotnet-m17-04', kind: 'cs-choose', template: delayTpl, expectOutput: 'max<=60:True min>=0:True random:True', options: dOpts});

// Q5
const q5opts = [
  't=0 call -> Closed\nt=1 call -> Closed\nt=2 call -> Open\nt=3 skip\nt=10 call -> Closed',
  't=0 call -> Closed\nt=1 call -> Closed\nt=2 call -> Open\nt=3 skip\nt=10 call -> Open',
  't=0 call -> Closed\nt=1 call -> Closed\nt=2 call -> Open\nt=3 call -> Closed\nt=10 call -> Closed',
  't=0 call -> Closed\nt=1 call -> Closed\nt=2 call -> Closed\nt=3 call -> Closed\nt=10 call -> Closed'
];
Q.push({
  id: 'dotnet-m17-05', topic: 'Circuit breaker', source: src('Retry và backoff'),
  question: 'Circuit breaker đơn giản: mở sau 3 lỗi liên tiếp, thử lại (HalfOpen) khi đã qua 5 đơn vị thời gian, và đóng lại nếu lời gọi thử thành công. Chương trình in gì?',
  code: 'var cb = new Breaker();\nvar calls = new (bool ok, int t)[]\n    { (false,0), (false,1), (false,2), (true,3), (true,10) };\nforeach (var (ok, t) in calls)\n{\n    if (!cb.TryEnter(t)) { Console.WriteLine($"t={t} skip"); continue; }\n    cb.Report(ok, t);\n    Console.WriteLine($"t={t} call -> {cb.State}");\n}\n\nclass Breaker\n{\n    int fails, openedAt;\n    public string State { get; private set; } = "Closed";\n    public bool TryEnter(int now)\n    {\n        if (State == "Open" && now - openedAt >= 5) State = "HalfOpen";\n        return State != "Open";\n    }\n    public void Report(bool ok, int now)\n    {\n        if (ok) { fails = 0; State = "Closed"; return; }\n        fails++;\n        if (State == "HalfOpen" || fails >= 3) { State = "Open"; openedAt = now; }\n    }\n}',
  codeLang: 'csharp',
  options: q5opts.map((o) => fence('text', o)),
  answer: 0,
  explanation: 'Ba lỗi ở t=0,1,2 làm `fails` đạt 3 nên circuit chuyển sang Open ở t=2. Tại t=3 mới trôi qua 1 đơn vị (< 5) nên lời gọi bị chặn ngay ("skip") mà không đi ra mạng. Tại t=10 đã qua 5 đơn vị, trạng thái thành HalfOpen, lời gọi thử thành công nên circuit đóng lại.\n- Đáp án kết thúc bằng `Open` sai: lời gọi thử ở t=10 thành công (`true`), nên về Closed.\n- Đáp án có `t=3 call` sai: khi đang Open và chưa hết thời gian chờ, lời gọi phải bị từ chối.\n- Đáp án toàn `Closed` sai: nó giả định circuit không bao giờ mở dù đã có 3 lỗi liên tiếp.'
});
verify.push({id: 'dotnet-m17-05', kind: 'cs-predict', program: rd('q5.cs')});

// Q6
Q.push({
  id: 'dotnet-m17-06', topic: 'Schema versioning', source: src('Event-driven architecture (EDA) - khi nào dùng?'),
  question: 'Team phát hành V2 của event và đánh dấu trường mới là `required`. Trong queue vẫn còn message V1 chưa có trường này. Điều gì xảy ra khi consumer V2 đọc message V1?',
  code: 'using System.Text.Json;\n\nvar oldJson = """{"CustomerId":"c1"}""";\nvar evt = JsonSerializer.Deserialize<LeadConvertedV2>(oldJson)!;\nConsole.WriteLine(evt.CustomerId);\n\npublic class LeadConvertedV2\n{\n    public required string CustomerId { get; init; }\n    public required string Source { get; init; }\n}',
  codeLang: 'csharp',
  options: ['Chạy OK và in `c1`', 'Lỗi biên dịch vì `Source` là `required`', 'Ném `JsonException` lúc chạy vì thiếu thuộc tính `required`', 'Chạy OK và in dòng rỗng'],
  answer: 2,
  explanation: 'Code biên dịch bình thường (không có đoạn nào tự tạo object mà quên `Source`). Nhưng `System.Text.Json` kiểm tra thuộc tính `required` khi deserialize, JSON V1 thiếu `Source` nên ném `JsonException` ("missing required properties"). Message cũ trở thành poison message, đây chính là lý do chỉ được **thêm trường tuỳ chọn**.\n- In `c1` sai: deserialize đã thất bại trước khi tới dòng in.\n- Lỗi biên dịch sai: `required` chỉ bắt lỗi ở chỗ khởi tạo object bằng code, không bắt lỗi dữ liệu JSON.\n- In dòng rỗng sai: không có giá trị nào được gán, mà thực tế deserialize còn không hoàn tất.'
});
verify.push({id: 'dotnet-m17-06', kind: 'cs-outcome', expect: 'runtime-error', program: '#:property JsonSerializerIsReflectionEnabledByDefault=true\n' + rd('q6.cs').split('\n').slice(1).join('\n')});

// Q7
Q.push({
  id: 'dotnet-m17-07', topic: 'Kafka partition key', source: src('Kafka vs RabbitMQ thực dụng'),
  question: 'Để "đảm bảo thứ tự tuyệt đối", một team đặt message key là hằng số `"all"` cho mọi message gửi vào topic Kafka có 12 partition. Hệ quả là gì?',
  options: ['Mọi message vào một partition: giữ thứ tự nhưng mất song song', 'Message được chia đều cho 12 partition, thứ tự vẫn đúng toàn cục', 'Kafka từ chối message vì key trùng nhau', 'Mỗi consumer trong group nhận một bản sao của message'],
  answer: 0,
  explanation: 'Partition được chọn theo hash của key, nên key hằng số đẩy mọi message vào cùng một partition. Thứ tự đúng toàn cục, nhưng một partition chỉ được một consumer trong group đọc, nên 11 partition còn lại vô dụng và Kafka biến thành hàng đợi một luồng.\n- "Chia đều cho 12 partition" sai: chia đều chỉ xảy ra khi key null hoặc phân tán, và khi đó thứ tự toàn cục mất.\n- "Kafka từ chối" sai: key không cần duy nhất, nhiều message cùng key là cách dùng bình thường.\n- "Mỗi consumer nhận một bản sao" sai: trong cùng một group, mỗi message chỉ tới một consumer; bản sao riêng chỉ có giữa các group khác nhau.'
});

// Q8
Q.push({
  id: 'dotnet-m17-08', topic: 'Consumer group và partition', source: src('Kafka vs RabbitMQ thực dụng'),
  question: 'Topic có 3 partition, bạn chạy 10 instance consumer cùng một consumer group để xử lý nhanh hơn. Điều gì đúng?',
  options: ['Cả 10 consumer chia đều message, thông lượng tăng gấp hơn 3 lần', 'Kafka tự động thêm 7 partition để mỗi consumer có việc làm', 'Chỉ 1 consumer hoạt động, 9 consumer còn lại là dự phòng', 'Chỉ 3 consumer nhận message, 7 consumer còn lại ngồi không'],
  answer: 3,
  explanation: 'Trong một consumer group, mỗi partition chỉ gán cho tối đa một consumer, nên số consumer hữu ích không vượt quá số partition: 3 consumer làm việc, 7 consumer nhàn rỗi. Muốn scale thêm phải tăng số partition (và nhớ rằng việc đó ảnh hưởng tới việc ánh xạ key sang partition).\n- "Chia đều cho 10" sai vì giới hạn trên.\n- "Tự động thêm partition" sai: Kafka không bao giờ tự tăng số partition.\n- "Chỉ 1 hoạt động" sai: Kafka gán mỗi partition cho một consumer, nên có 3 consumer đang chạy, không phải mô hình active/standby.'
});

// Q9
Q.push({
  id: 'dotnet-m17-09', topic: 'Change Data Capture', source: src('Change Data Capture (CDC)'),
  question: 'Trong bảng thay đổi `cdc.dbo_Leads_CT` của SQL Server, một câu `UPDATE` duy nhất sinh ra hai dòng với `__$operation` = 3 và 4. Ý nghĩa đúng là gì?',
  options: ['3 là insert mới, 4 là delete bản ghi cũ', '3 là ảnh sau khi update, 4 là ảnh trước khi update', '3 là ảnh trước khi update, 4 là ảnh sau khi update', '3 là update thành công, 4 là bản sao dự phòng của dòng đó'],
  answer: 2,
  explanation: 'Quy ước của SQL Server CDC: 1 = delete, 2 = insert, 3 = ảnh TRƯỚC update, 4 = ảnh SAU update. Một UPDATE ghi hai dòng để consumer so sánh được giá trị cũ và mới (row-diff).\n- "3 insert, 4 delete" sai: insert là 2 và delete là 1; một UPDATE không bị tách thành insert cộng delete trong chế độ này.\n- Đảo ngược "sau" và "trước" sai thứ tự quy ước.\n- "Bản sao dự phòng" sai: không có cơ chế sao lưu, hai dòng mang nội dung khác nhau (trước và sau).'
});

// Q10
Q.push({
  id: 'dotnet-m17-10', topic: 'Outbox dispatcher', source: src('Outbox pattern áp dụng'),
  question: 'Worker dispatcher publish một outbox message lên broker thành công, nhưng process bị kill **trước khi** kịp đánh dấu `ProcessedOnUtc`. Khi worker khởi động lại, điều gì xảy ra và hệ quả thiết kế là gì?',
  options: ['Message bị mất vĩnh viễn vì broker đã nhận nó', 'Message được publish lại, nên consumer phải idempotent', 'Transaction nghiệp vụ tự rollback, lead trở về trạng thái cũ', 'Broker tự loại message trùng nhờ `Id` của outbox'],
  answer: 1,
  explanation: 'Hàng outbox vẫn có `ProcessedOnUtc IS NULL` nên lần poll tiếp theo publish nó thêm một lần nữa: outbox là at-least-once, giống broker. Vì vậy consumer phải idempotent (inbox hoặc unique constraint).\n- "Mất vĩnh viễn" sai: đó là rủi ro của việc đánh dấu **trước** khi publish, không phải đánh dấu sau.\n- "Rollback nghiệp vụ" sai: transaction nghiệp vụ đã commit từ trước, outbox chỉ lo phần gửi tin.\n- "Broker tự loại trùng" sai: broker thông thường không biết `Id` trong payload của bạn, việc chống trùng là trách nhiệm của consumer.'
});

const chapter = {
  id: 'dotnet-m17', title: 'Module 17: Hệ thống phân tán',
  description: 'Event-driven, outbox, inbox, retry/backoff, Kafka vs RabbitMQ và CDC: lỗi mất tin, trùng tin và cách thiết kế consumer an toàn.',
  questions: Q
};
writeFileSync('D:/repos/it-quiz/content/dotnet/parts/17-distributed-systems.A.json', JSON.stringify(chapter, null, 2));
writeFileSync('D:/repos/it-quiz/content/dotnet/parts/verify/17-distributed-systems.A.json', JSON.stringify(verify, null, 2));
console.log('written', Q.length, verify.length);
