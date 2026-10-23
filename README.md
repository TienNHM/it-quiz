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

## Deploy

`base` là `./` nên deploy được ở sub-path. Đẩy thư mục `dist/` lên bất kỳ host tĩnh nào (GitHub Pages, Netlify...). Router dùng hash nên không cần rewrite.
