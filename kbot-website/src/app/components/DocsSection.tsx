import Link from 'next/link';

export default function DocsSection() {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold">Documentation</h1>
      <p>Learn how to integrate and use KsyncBot.</p>
      <Link
        href="https://github.com/kunszg/kbot"
        target="_blank"
        className="text-blue-400 underline"
      >
        View on GitHub
      </Link>
    </div>
  );
}
