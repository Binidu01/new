export const metadata = { title: 'Blog' };

const POSTS = [
  { slug: 'hello', title: 'Hello' },
  { slug: 'world', title: 'World' },
  { slug: 'extra', title: 'Extra (no staticParams entry)' },
];

export default function BlogIndex() {
  return (
    <section data-route="/blog" data-marker="blog-index-ssr">
      <h1>Blog</h1>
      <ul>
        {POSTS.map((p) => (
          <li key={p.slug}><a href={`/blog/${p.slug}`}>{p.title}</a></li>
        ))}
      </ul>
    </section>
  );
}
