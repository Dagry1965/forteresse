import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "../lib/utils";

interface sidebaritemprops {
  icon: React.ReactNode;
  label: string;
  href: string;
}

export default function sidebaritem({ icon, label, href }: sidebaritemprops) {
  const router = useRouter();
  const active = router.pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2 rounded-md transition-colors",
        active
          ? "bg-[oklch(0.28_0_0)] text-white border-l-4 border-[oklch(0.65_0.15_260)]"
          : "text-[oklch(0.85_0_0)] hover:bg-[oklch(0.28_0_0)] hover:text-white"
      )}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
