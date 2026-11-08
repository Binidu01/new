import { useParams } from 'react-router-dom';

export const metadata = { title: 'Post' };

export async function staticParams() {
  return [{ slug: 'hello' }, { slug: 'world' }];
}

export default function Post() {
  const { slug } = useParams();
  return (
    <section data-route={`/blog/${slug}`} data-marker={`post-ssr-${slug}`}>
      <h1>Post: {slug}</h1>
      <p>This page was prerendered from staticParams.</p>
    </section>
  );
}
