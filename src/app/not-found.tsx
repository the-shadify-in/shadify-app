import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFBF7] px-4 text-center text-[#1F1A2E]">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#8B1E3F]/10 font-serif text-2xl text-[#8B1E3F]">
        404
      </div>
      <h1 className="font-serif text-3xl tracking-tight text-[#1F1A2E] sm:text-4xl">
        Wedding Celebration Not Found
      </h1>
      <p className="mt-3 max-w-md text-sm text-[#1F1A2E]/70">
        This link may be private, expired, or mistyped. If you were invited to a wedding, please
        check the link sent by the couple.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-[#8B1E3F] px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-[#8B1E3F]/90"
        >
          Return to Shadify Home
        </Link>
        <a
          href="https://wa.me/919999999999?text=Hi%20Shadify,%20I%20need%20help%20locating%20a%20wedding%20website"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-[#EADDCF] bg-white px-5 py-2.5 text-xs font-medium text-[#1F1A2E] transition hover:bg-gray-50"
        >
          WhatsApp Concierge
        </a>
      </div>
    </div>
  );
}
