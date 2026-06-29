import Image from "next/image";

type DiceBearAvatarProps = {
  seed: string;
  type?: "person" | "store";
  className?: string;
  alt?: string;
};

export function getDiceBearAvatarUrl(seed: string, type: "person" | "store" = "person") {
  const style = type === "store" ? "bottts" : "micah";
  const backgrounds = type === "store"
    ? "b6e3f4,c0aede,d1d4f9"
    : "b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf";

  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed || "seapedia")}&backgroundColor=${backgrounds}`;
}

export function DiceBearAvatar({
  seed,
  type = "person",
  className = "h-10 w-10",
  alt,
}: DiceBearAvatarProps) {
  return (
    <Image
      src={getDiceBearAvatarUrl(seed, type)}
      alt={alt || (type === "store" ? `Avatar toko ${seed}` : `Avatar ${seed}`)}
      width={80}
      height={80}
      unoptimized
      className={`shrink-0 rounded-full bg-white object-cover ${className}`}
    />
  );
}
