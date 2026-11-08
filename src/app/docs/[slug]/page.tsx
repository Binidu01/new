import { useParams } from 'react-router-dom';

export const metadata = { title: 'Docs' };

export default function Doc() {
  const { slug } = useParams();
  return (
    <section data-route={`/docs/${slug}`} data-marker={`doc-ssr-${slug}`}>
      <h1>Doc: {slug}</h1>
      <p>This page has no staticParams. It should be prerendered if a page links to it.</p>
    </section>
  );
}
