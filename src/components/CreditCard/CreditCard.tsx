import { CardSpotlight } from "../ui/card-spotlight"


const CreditCard = ({ background = 'linear-gradient(90deg, #454893 10%, #15162D 100%)', isCardSpotlightActive = true }: { background?: string, isCardSpotlightActive?: boolean }) => {
    const Comp = isCardSpotlightActive ? CardSpotlight : 'div'

    return <div className="relative w-96 h-[250px] max-md:w-[300px] max-md:h-[206px] max-md:mb-0 mb-8 lg:mb-0">
        {/* Card Bottom Shadow */}
        <div className="absolute top-[1px] left-[1px] w-96 h-[250px] rounded-lg bg-[#666666] shadow-lg hidden md:block"></div>

        {/* Card Top */}

        <div
            className="absolute top-0 left-0 w-96 h-[250px] max-md:w-[300px] max-md:h-[206px] rounded-lg shadow-xl overflow-hidden"
            style={{
                background: background,
                fontFamily: "Odibee Sans, Montserrat, sans-serif",
            }}
        >
            <Comp className="w-96 h-[250px]">
                <img src="/images/card-gradient.png" className="w-96  h-[250px]" alt="card" draggable="false" />
                <div className="absolute bottom-2 right-4">
                    <svg
                        version="1.1"
                        id="visa"
                        xmlns="http://www.w3.org/2000/svg"
                        x="0px"
                        y="0px"
                        width="64px"
                        height="64px"
                        viewBox="0 0 47.834 47.834"
                        fill="white"
                    >
                        <g>
                            <g>
                                <path
                                    d="M44.688,16.814h-3.004c-0.933,0-1.627,0.254-2.037,1.184l-5.773,13.074h4.083c0,0,0.666-1.758,0.817-2.143
                     c0.447,0,4.414,0.006,4.979,0.006c0.116,0.498,0.474,2.137,0.474,2.137h3.607L44.688,16.814z M39.893,26.01
                     c0.32-0.819,1.549-3.987,1.549-3.987c-0.021,0.039,0.317-0.825,0.518-1.362l0.262,1.23c0,0,0.745,3.406,0.901,4.119H39.893z
                     M34.146,26.404c-0.028,2.963-2.684,4.875-6.771,4.875c-1.743-0.018-3.422-0.361-4.332-0.76l0.547-3.193l0.501,0.228
                     c1.277,0.532,2.104,0.747,3.661,0.747c1.117,0,2.313-0.438,2.325-1.393c0.007-0.625-0.501-1.07-2.016-1.77
                     c-1.476-0.683-3.43-1.827-3.405-3.876c0.021-2.773,2.729-4.708,6.571-4.708c1.506,0,2.713,0.31,3.483,0.599l-0.526,3.092
                     l-0.351-0.165c-0.716-0.288-1.638-0.566-2.91-0.546c-1.522,0-2.228,0.634-2.228,1.227c-0.008,0.668,0.824,1.108,2.184,1.77
                     C33.126,23.546,34.163,24.783,34.146,26.404z M0,16.962l0.05-0.286h6.028c0.813,0.031,1.468,0.29,1.694,1.159l1.311,6.304
                     C7.795,20.842,4.691,18.099,0,16.962z M17.581,16.812l-6.123,14.239l-4.114,0.007L3.862,19.161
                     c2.503,1.602,4.635,4.144,5.386,5.914l0.406,1.469l3.808-9.729L17.581,16.812L17.581,16.812z M19.153,16.8h3.89L20.61,31.066
                     h-3.888L19.153,16.8z"
                                />
                            </g>
                        </g>
                    </svg>
                </div>

                <div className="absolute top-6 left-4">
                    <svg width="77" height="32" viewBox="0 0 77 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g filter="url(#filter0_d_2195_891)">
                            <rect width="41.57" height="31.44" rx="3" fill="url(#paint0_linear_2195_891)" />
                        </g>
                        <path d="M71.5632 2.48565C71.2278 2.43497 70.8733 2.51222 70.5798 2.73151C69.9915 3.16612 69.8683 3.99617 70.3029 4.58448C72.5554 7.63205 73.7966 11.5863 73.7966 15.7204C73.7966 19.8545 72.5554 23.81 70.3029 26.8589C69.8683 27.4473 69.9915 28.2773 70.5798 28.7119C70.8156 28.8881 71.0922 28.9707 71.3665 28.9707C71.7733 28.9707 72.1731 28.7848 72.4328 28.435C75.0205 24.9329 76.4467 20.4176 76.4467 15.7204C76.4467 11.0232 75.0205 6.50915 72.4328 3.00842C72.2155 2.71493 71.8986 2.53634 71.5632 2.48565ZM67.1068 5.18747C66.7707 5.14325 66.4187 5.22817 66.1285 5.45144C65.5482 5.89665 65.4375 6.72922 65.8827 7.30959C67.5429 9.47203 68.4965 12.5377 68.4965 15.7204C68.4965 18.8952 67.548 21.9571 65.893 24.1209C65.4491 24.7013 65.5598 25.5326 66.1415 25.9764C66.3813 26.1606 66.6628 26.2508 66.9437 26.2508C67.3412 26.2508 67.7347 26.0711 67.997 25.7306C70.027 23.0766 71.1466 19.5206 71.1466 15.7204C71.1466 11.9096 70.0233 8.35007 67.9841 5.69471C67.7608 5.40453 67.4428 5.23169 67.1068 5.18747ZM62.6659 7.84012C62.3275 7.81726 61.9807 7.92438 61.7057 8.1662C61.1545 8.64718 61.0992 9.48348 61.5815 10.0347C62.5779 11.1742 63.1964 13.3526 63.1964 15.7204C63.1964 18.0882 62.5767 20.2666 61.5789 21.4061C61.0979 21.9573 61.1545 22.7936 61.7057 23.2746C61.9575 23.4946 62.2691 23.6033 62.5779 23.6033C62.9475 23.6033 63.3145 23.4512 63.5768 23.1504C64.9972 21.5259 65.8464 18.7468 65.8464 15.7204C65.8464 12.694 64.996 9.9149 63.5742 8.29042C63.3331 8.01415 63.0042 7.86297 62.6659 7.84012ZM57.9817 10.6687C57.6433 10.6467 57.2971 10.7537 57.0215 10.9948C56.4717 11.4771 56.4163 12.3134 56.8999 12.8633C57.5319 13.5855 57.8963 14.6273 57.8963 15.7204C57.8963 16.8136 57.5319 17.8554 56.8999 18.5775C56.4176 19.1274 56.4742 19.9637 57.0241 20.446C57.2759 20.666 57.5862 20.7747 57.8963 20.7747C58.2633 20.7747 58.6316 20.6225 58.8926 20.3244C59.9606 19.1093 60.5463 17.4734 60.5463 15.7204C60.5463 13.9674 59.9606 12.3315 58.8926 11.1165C58.6521 10.8415 58.32 10.6908 57.9817 10.6687Z" fill="white" />
                        <defs>
                            <filter id="filter0_d_2195_891" x="0" y="0" width="42.0703" height="31.9395" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                                <feOffset dx="0.5" dy="0.5" />
                                <feComposite in2="hardAlpha" operator="out" />
                                <feColorMatrix type="matrix" values="0 0 0 0 0.604232 0 0 0 0 0.604232 0 0 0 0 0.604232 0 0 0 1 0" />
                                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2195_891" />
                                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2195_891" result="shape" />
                            </filter>
                            <linearGradient id="paint0_linear_2195_891" x1="40.5" y1="0.5" x2="0.999997" y2="31" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#D9D9D9" />
                                <stop offset="0.347245" stop-color="#B0B0B0" />
                                <stop offset="0.524405" stop-color="#CECECE" />
                                <stop offset="0.776262" stop-color="#BCBCBC" />
                                <stop offset="1" stop-color="#A2A2A2" />
                            </linearGradient>
                        </defs>
                    </svg>

                </div>

                {/* Card Number */}
                <div className="absolute top-1/2 left-4 transform -translate-y-1/2 text-white text-xl font-mono opacity-75 tracking-wider">
                    XXXX XXXX XXXX 8859
                </div>

                {/* Card Details */}
                <div className="absolute top-[61%] -translate-y-1/2 left-4 flex justify-between items-end text-white opacity-75">
                    <div className="flex flex-col w-[150px]">
                        <span className="text-[16px] font-medium capitalize">
                            Mayank sonkar
                        </span>
                    </div>
                </div>
            </Comp>
        </div>

    </div>
}

export default CreditCard