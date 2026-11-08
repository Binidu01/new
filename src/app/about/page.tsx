export const metadata = { title: 'About' };

export default function About() {
  return (
    <section data-route="/about" data-marker="about-ssr">
      <h1>About</h1>
      <p>Another static page.</p>
      <p>
        Link to a dynamic route without staticParams:{' '}
        <a href="/docs/intro">/docs/intro</a> (this URL should be crawled and prerendered).
      </p>
    </section>
  );
}
