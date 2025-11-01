import { SparklesCore } from "../ui/sparkles"

const CreditIntelligence = () => {
    return (
        <div className="min-h-screen max-md:min-h-auto max-md:py-30 w-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-md">
            <div>
                <h1 className="text-xl max-md:text-xl font-bold text-center text-white/80 relative z-20">
                    Credit Intelligence
                </h1>
                <h1 className="md:text-7xl text-6xl lg:text-9xl font-bold text-center text-white/90 relative z-20">
                    Instantly
                </h1>
            </div>

            <div className="w-[40rem] h-40 relative">
                {/* Gradients */}
                <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
                <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
                <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
                <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />

                {/* Core component */}
                <SparklesCore
                    background="transparent"
                    minSize={0.4}
                    maxSize={1}
                    particleDensity={1200}
                    className="w-full h-full"
                    particleColor="#FFFFFF"
                />

                {/* Radial Gradient to prevent sharp edges */}
                <div className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
            </div>
        </div>
    )
}

export default CreditIntelligence