export default function Checkmark() {
    return (
      <div className="flex justify-center">
        <div className="w-[16px]">
          <svg
            version="1.1"
            id="Layer_1"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            x="0px"
            y="0px"
            viewBox="0 0 98.5 98.5"
            enableBackground="new 0 0 98.5 98.5"
            xmlSpace="preserve"
          >
            <path
              className="animate-draw-checkmark"
              fill="none"
              stroke="green"
              strokeWidth="8"
              strokeMiterlimit="10"
              strokeDasharray="745.74853515625"
              strokeDashoffset="745.74853515625"
              d="M81.7,17.8C73.5,9.3,62,4,49.2,4
      C24.3,4,4,24.3,4,49.2s20.3,45.2,45.2,45.2s45.2-20.3,45.2-45.2c0-8.6-2.4-16.6-6.5-23.4l0,0L45.6,68.2L24.7,47.3"
            />
          </svg>
        </div>
  
        <style jsx>{`
          @keyframes draw-checkmark {
            0% {
              stroke-dashoffset: 745.74853515625;
            }
            100% {
              stroke-dashoffset: 0;
            }
          }
          .animate-draw-checkmark {
            animation: draw-checkmark 2s ease-out forwards infinite;
          }
        `}</style>
      </div>
    );
  }