import { useParams } from 'react-router-dom';

const PortfolioDetailPage = (): React.ReactElement => {
  const { id } = useParams();
  const projectId = id ?? 'unknown';

  return (
    <section>
      <h1>Portfolio Detail</h1>
      <p>Project id: {projectId}</p>
    </section>
  );
};

export default PortfolioDetailPage;
