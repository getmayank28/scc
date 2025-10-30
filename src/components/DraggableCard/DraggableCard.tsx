import { CreditCard } from "../CreditCard";
import { DraggableCardBody, DraggableCardContainer } from "../ui/draggable-card";

const DraggableCard = () => {
    const items = [
        {

            className: "absolute top-10 left-[60%] rotate-[-5deg]",
            cardBackground: 'linear-gradient(90deg, #454893 10%, #15162D 100%)'
        },
        {
            className: "absolute top-40 left-[15%] rotate-[-7deg]",
            cardBackground: 'linear-gradient(90deg, #F35A13 10%, #8D340B 100%)'
        },
        {
            className: "absolute top-5 left-[30%] rotate-[8deg]",
            cardBackground: 'linear-gradient(90deg, #676767 10%, #CDCDCD 100%)'
        },

        {
            className: "absolute top-20 right-[45%] rotate-[2deg]",
            cardBackground: 'linear-gradient(90deg, #604652 10%, #85576C 100%)'
        },
        {
            className: "absolute top-24 left-[45%] rotate-[-7deg]",
            cardBackground: 'linear-gradient(90deg, #AE1D1D 10%, #AC3B3B 100%)'
        },
        {
            className: "absolute top-8 left-[35%] rotate-[4deg]",
            cardBackground: 'linear-gradient(90deg, #010101 10%, #504848 100%)'
        },
    ];
    return (
        <DraggableCardContainer className="relative flex min-h-screen w-full items-center justify-center overflow-clip">
            <p className="absolute top-1/2 mx-auto max-w-sm -translate-y-3/4 text-center text-2xl font-black text-neutral-400 md:text-4xl dark:text-neutral-800">
                If its your first card, you have to choose right.
            </p>
            {items.map((item) => (
                <DraggableCardBody className={item.className}>
                    <div className="rotate-90">
                        <CreditCard background={item?.cardBackground} isCardSpotlightActive={false} />
                    </div>
                </DraggableCardBody>
            ))}
        </DraggableCardContainer>
    )

}

export default DraggableCard