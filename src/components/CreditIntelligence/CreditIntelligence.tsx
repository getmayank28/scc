import { SparklesCore } from "../ui/sparkles";

const CreditIntelligence = () => {
  return (
    <div className="max-md:min-h-auto max-md:py-30 w-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-md">
      <div className="w-[60rem] h-90 relative">
        {/* Gradients */}
        <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
        <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
        <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
        <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />

        {/* Core component */}
        <SparklesCore
          background="#111"
          minSize={0.4}
          maxSize={1}
          particleDensity={2000}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />

        {/* Radial Gradient to prevent sharp edges */}
        <div className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(550px_400px_at_top,transparent_20%,white)]"></div>
      </div>
    </div>
  );
};

export default CreditIntelligence;
