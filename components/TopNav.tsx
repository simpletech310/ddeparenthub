import Link from "next/link";

export function TopNav({ links }: { links: { href: string; label: string }[] }) {
  return (
    <nav className="border-b border-brand-100 bg-white">
      <div className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-4">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-brand-600 hover:border-brand-300 hover:text-brand-800"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
