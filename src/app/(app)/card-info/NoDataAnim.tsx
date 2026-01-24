import {
  Search,
} from "lucide-react";

export default function NoCardData() {
  return (
    <div>
      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-8 py-20">
        <div className="relative">
          <div className="absolute inset-0 bg-primary-orange rounded-full blur-3xl opacity-30 animate-pulse"></div>
          <div className="relative w-48 h-48 bg-white/10 rounded-full flex items-center justify-center border-4 border-secondary-orange">
            <Search
              className="w-20 h-20 text-primary-orange"
              strokeWidth={2.5}
            />
          </div>
        </div>
        <p className="text-lg opacity-60 text-white font-semibold text-center mt-10">
          Enter the card name to get the annual fee, welcome benefits, reward
          points, <br /> insurance coverage, and redemption options of a
          card{" "}
        </p>
      </main>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite;
          animation-delay: 0.5s;
        }
      `}</style>
    </div>
  );
}
