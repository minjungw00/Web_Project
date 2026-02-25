import workingImage from '@/assets/minjungw00_working_nobg.png';
import '@/shared/styles/status-page.css';

const WorkInProgressPage = (): React.ReactElement => (
  <section aria-live="polite" className="status-page">
    <img
      alt="작업 중 안내 이미지"
      className="status-page-media"
      src={workingImage}
    />
    <div className="status-page-copy">
      <h1>현재 작업 중인 페이지입니다.</h1>
      <p>더 나은 내용으로 준비 중입니다. 조금만 기다려 주세요.</p>
    </div>
  </section>
);

export default WorkInProgressPage;
