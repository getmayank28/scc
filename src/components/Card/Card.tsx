
export default function Card({
  title = "Glass Effect",
  description = "Experience the modern glassmorphism design with a frosted glass effect, perfect for creating stunning UI components with depth and elegance.",
}) {
  return (
    <div className="relative group">
      <div className="relative p-8 border-white/20 max-w-sm">

        <h2 className="text-3xl max-md:text-lg font-bold text-white mb-3 tracking-tight">
          {title}
        </h2>

        <p className="text-white/80 max-md:text-md text-base leading-relaxed">{description}</p>

        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl transition-all duration-500" />
      </div>
    </div>
  );
}
