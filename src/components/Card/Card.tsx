import { Sparkles } from 'lucide-react';

export default function Card({
  icon: Icon = Sparkles,
  title = "Glass Effect",
  description = "Experience the modern glassmorphism design with a frosted glass effect, perfect for creating stunning UI components with depth and elegance."
}) {
  return (
    <div className="relative group">
      <div className="relative p-8 border-white/20 max-w-sm">
        <div className="mb-6 inline-flex p-4 rounded-2xl  border border-slate-800 transition-transform duration-300">
          <Icon className="w-8 h-8 text-[#D9D9D9]" strokeWidth={2} />
        </div>

        <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
          {title}
        </h2>

        <p className="text-white/80 text-base leading-relaxed">
          {description}
        </p>

        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl transition-all duration-500" />
      </div>
    </div>
  );
}
