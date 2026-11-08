import { useParams } from 'react-router-dom';

export const prerender = false;

export const metadata = { title: 'Private' };

export async function staticParams() {
  return [{ slug: 'a' }, { slug: 'b' }];
}

export default function Private() {
  const { slug } = useParams();
  return (
    <section data-route={`/private/${slug}`} data-marker={`private-shell-${slug}`}>
      <h1>Private: {slug}</h1>
      <p>prerender = false wins. This page should ship as a shell.</p>
    </section>
  );
}
