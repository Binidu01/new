import { useLoaderData } from 'react-router-dom';

export const metadata = { title: 'Dashboard' };

export async function loader() {
  return { generatedAt: new Date().toISOString() };
}

export default function Dashboard() {
  const { generatedAt } = useLoaderData();
  return (
    <section data-route="/dashboard" data-marker="dashboard-shell">
      <h1>Dashboard</h1>
      <p>This page has a loader, so it should be served as a CSR shell.</p>
      <p>Loader ran at: {generatedAt}</p>
    </section>
  );
}
