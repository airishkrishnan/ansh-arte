import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-lux py-28 text-center">
      <p className="eyebrow mb-3">404</p>
      <h1 className="heading-lg">This piece has wandered off</h1>
      <p className="mt-4 text-ink-soft">The page you are looking for doesn&rsquo;t exist or has moved.</p>
      <Link href="/" className="btn btn-primary mt-8">
        Back to home
      </Link>
    </div>
  );
}
