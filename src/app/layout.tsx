import { Link, Outlet } from 'react-router-dom';

export const metadata = {
  title: { default: 'Bini Test', template: '%s · Bini Test' },
  description: 'Fixture for testing bini-router / bini-ssg / bini-env / bini-server / bini-deploy',
};

export default function RootLayout() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link> · <Link to="/about">About</Link> ·{' '}
        <Link to="/blog">Blog</Link> · <Link to="/dashboard">Dashboard</Link> ·{' '}
        <Link to="/docs/intro">Docs</Link> · <Link to="/private/a">Private A</Link>
      </nav>
      <main><Outlet /></main>
    </div>
  );
}
