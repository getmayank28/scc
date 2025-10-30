import { WavyBackground } from "@/components/ui/wavy-background"

const Tagline = () => {
    return (
        <div className="text-center mt-[180px] relative !h-[60vh] overflow-hidden">
            <WavyBackground containerClassName="absolute top-[-30%]" className="max-w-4xl mx-auto pb-40">
                <div className="absolute w-[500px] top-[90%] left-[50%] translate-[100%]">
                    <p className="text-2xl leading-[140%] md:text-4xl lg:text-5xl text-white font-bold inter-var text-center">
                        Before you choose, Go FiSense.
                    </p>
                    <p className="text-base md:text-lg mt-0 text-white font-normal inter-var text-center">
                        Your data stays private. Your decisions stay smart.
                    </p>
                </div>
            </WavyBackground>
        </div>
    )
}

export default Tagline