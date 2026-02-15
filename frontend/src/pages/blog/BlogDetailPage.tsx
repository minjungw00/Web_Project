import { useParams } from 'react-router-dom';

const BlogDetailPage = (): React.ReactElement => {
  const { id } = useParams();
  const postId = id ?? 'unknown';

  return (
    <section>
      <h1>Blog Detail</h1>
      <p>Post id: {postId}</p>
    </section>
  );
};

export default BlogDetailPage;
