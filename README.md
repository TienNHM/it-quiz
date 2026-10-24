# IT Quiz

Web app quiz IT (PWA, offline-first) để ôn tập kiến thức và chuẩn bị phỏng vấn. Vite + React + TypeScript, dữ liệu lưu ở `localStorage`.

## Chạy

```bash
npm install
npm run dev        # phát triển
npm run build      # kiểm tra kiểu + build ra dist/ (kèm service worker)
npm run preview    # xem bản build (thử offline tại đây)
npm test           # vitest
npm run validate   # kiểm tra nội dung content/**
```

Sinh lại icon PWA từ `public/icon.svg`: `node scripts/make-icons.mjs`.

## Thêm môn / chương

1. Tạo thư mục `content/<môn>/`.
2. Tạo `content/<môn>/subject.json` (id, title, icon, description, `chapters[]` gồm id, slug, title, description, count).
3. Với mỗi chương, tạo `content/<môn>/<slug>.json` dạng `{ "questions": [...] }`. Mỗi câu gồm `id` (duy nhất toàn cục), `question`, `options`, `answer` (index hoặc mảng index), `explanation`; tuỳ chọn `topic`, `source`, `code`, `diagram` (mermaid).
4. Chạy `npm run validate` rồi `npm run build`.

## Deploy (GitHub Pages)

Workflow `.github/workflows/deploy.yml` tự chạy khi push lên `main` hoặc `master` (hoặc bấm **Run workflow** thủ công): cài đặt, kiểm tra nội dung, chạy test, build rồi đăng `dist/` lên Pages.

Cấu hình một lần: repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Site chạy tại `https://<user>.github.io/<repo>/`. `base` là `./` và router dùng hash nên không cần rewrite hay trang 404. Có thể đẩy `dist/` lên host tĩnh khác (Netlify, Cloudflare Pages...) mà không cần đổi gì.

## Bộ câu hỏi SQL

Nguồn: khóa học 30 ngày ở repo sql-challenge, 31 chương (ngày 1-30 và tổng kết), 478 câu trắc nghiệm trên cùng bộ dữ liệu cửa hàng DSC Shop. Dữ liệu mẫu nằm ở `content/sql/seed/`.

- `npm run sql:run -- "SELECT ..."`: chạy thử SQL trên DSC Shop (PostgreSQL chạy trong Node qua PGlite, không cần Docker).
- `npm run sql:lint`: kiểm tra định dạng câu hỏi (4 phương án, SQL trong fence, không emoji, phân bố đáp án...).
- `npm run sql:verify`: chạy thật mọi truy vấn trong các câu kiểm chứng (`content/sql/verify/*.json`): đáp án đúng chạy được, đáp án sai phải lỗi hoặc cho kết quả khác. Có 337 mục kiểm chứng.
- `npm run sql:subject`: dựng lại `content/sql/subject.json` từ các file chương.

CI chạy lint và verify trước khi deploy.

## Bộ câu hỏi .NET

Nguồn: khóa .NET Backend Zero → Senior (repo dotnet-course), 20 module (0 đến 19), 402 câu trắc nghiệm. Đáp án của các câu về C# được kiểm chứng bằng cách biên dịch và chạy thật bằng .NET SDK (291 mục kiểm chứng ở `content/dotnet/verify/`).

- `npm run dotnet:run -- --file x.cs`: chạy thử một chương trình C# (top-level statements, có thể dùng package qua dòng `#:package Tên@phiên-bản`).
- `npm run dotnet:lint`: kiểm tra định dạng câu hỏi.
- `npm run dotnet:verify`: biên dịch và chạy thật mọi mục kiểm chứng (mất vài phút, cần .NET 10 SDK và mạng để tải NuGet).
- `npm run dotnet:subject`: dựng lại `content/dotnet/subject.json` từ các file chương.

CI chỉ chạy lint cho .NET (verify chạy cục bộ vì chậm và cần SDK).
