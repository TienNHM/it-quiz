import {lazy, Suspense} from 'react';
import {HashRouter, Route, Routes} from 'react-router-dom';
import Layout from './components/Layout';

const Home = lazy(() => import('./pages/Home'));
const SubjectPage = lazy(() => import('./pages/Subject'));
const Play = lazy(() => import('./pages/Play'));
const Result = lazy(() => import('./pages/Result'));
const Review = lazy(() => import('./pages/Review'));
const Stats = lazy(() => import('./pages/Stats'));
const Settings = lazy(() => import('./pages/Settings'));

/**
 * Routes (HashRouter để host tĩnh/GitHub Pages không cần rewrite):
 *  /                              Home: danh sách môn + streak/XP + nút "Luyện hôm nay"
 *  /s/:subjectId                  Subject: danh sách chương + tiến độ + thi thử + ôn tập
 *  /play/:subjectId/:mode         Play. mode = practice|exam|review|daily; query ?chapter=<chapterId>
 *  /result                        Result: đọc kết quả phiên vừa xong (getProgress().history[0])
 *  /review                        Review: flashcard / câu sai, đến hạn (toàn bộ môn)
 *  /stats                         Stats: thống kê, chủ đề yếu, lịch sử
 *  /settings                      Settings: theme, trộn đáp án, đề thi, export/import/reset
 */
export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Suspense fallback={<p className="muted">Đang tải…</p>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/s/:subjectId" element={<SubjectPage />} />
            <Route path="/play/:subjectId/:mode" element={<Play />} />
            <Route path="/result" element={<Result />} />
            <Route path="/review" element={<Review />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </Layout>
    </HashRouter>
  );
}
