export const metadata = { title: 'Home' };

export default function Home() {
  return (
    <section data-route="/" data-marker="home-ssr">
      <h1>Home</h1>
      <p>This page is statically prerendered. If you can read this without JS, SSG worked.</p>
    </section>
  );
}
