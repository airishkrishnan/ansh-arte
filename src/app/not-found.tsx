import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="eyebrow mb-3">404</p>
        <h1 className="heading-lg">Page not found</h1>
        <Link href="/" className="btn btn-primary mt-8">
          Go to Ansh Arte
        </Link>
      </div>
    </div>
  );
}
