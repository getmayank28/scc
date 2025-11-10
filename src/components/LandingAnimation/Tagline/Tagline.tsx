import { WavyBackground } from "@/components/ui/wavy-background"

const Tagline = () => {
    return (
        <div className="text-center py-10 relative !h-[60vh] max-md:h-[50vh]  overflow-hidden">
            <WavyBackground containerClassName="absolute top-[-30%] max-md:top-[-35%]" className="max-w-4xl mx-auto pb-40">
                <div></div>
            </WavyBackground>
            <div className="absolute w-[500px] max-md:w-[300px] top-1/2 left-1/2 transform -translate-1/2 z-10">
                    <p className="text-3xl leading-[140%] md:text-4xl lg:text-5xl text-white font-bold inter-var text-center">
                        Before you choose, Go FiSense.
                    </p>
                    <p className="text-base md:text-lg mt-0 text-white font-normal inter-var text-center">
                        Your data stays private. Your <br className="hidden max-md:block"/> decisions  stay smart.
                    </p>
                </div>
        </div>
    )
}

export default Tagline