
interface ToggleProps {
  value: string;
  onClick: () => void;
}

export default function AccuracyModeToggle({ value, onClick }: ToggleProps) {
  const valueType = value === "off" ? false : true;
  return (
    <div className="flex items-center justify-center">
      {/* Toggle Container */}
      <div onClick={onClick} className="relative cursor-pointer group">
        {/* Toggle Track */}
        <div
          className={`
          w-16 h-8 rounded-full p-1 transition-all duration-700 ease-out relative overflow-hidden
          ${valueType
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/50"
              : "bg-gradient-to-r from-gray-300 to-gray-400 shadow-inner"
            }
          group-hover:scale-105 transform
          ${valueType ? "ring-4 ring-blue-400/30" : "ring-2 ring-gray-400/20"}
        `}
        >
          {/* Precision Indicator Lines Inside Track */}
          <div className="absolute inset-1 rounded-full overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`
                  absolute w-0.5 h-full transition-all duration-500
                  ${valueType ? "bg-blue-300/30" : "bg-gray-500/20"}
                `}
                style={{
                  left: `${16 + i * 16}%`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>

          {/* Toggle Knob */}
          <div
            className={`
            w-6 h-6 bg-white rounded-full shadow-md transform transition-all duration-700 ease-out
            flex items-center justify-center relative overflow-hidden
            ${valueType ? "translate-x-8" : "translate-x-0"}
            group-hover:shadow-lg
          `}
          >
            {/* Center Precision Dot */}
            <div
              className={`
              w-1 h-1 rounded-full transition-all duration-500 ease-out
              ${valueType ? "bg-blue-500 animate-pulse" : "bg-gray-400"}
            `}
            />

            {/* Rotating Measurement Lines */}
            <div
              className={`
              absolute inset-0 transition-all duration-700 ease-out
              ${valueType ? "animate-spin opacity-60" : "opacity-20"}
            `}
              style={{ animationDuration: "8s" }}
            >
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`
                    absolute w-0.5 h-1 transition-colors duration-500
                    ${valueType ? "bg-blue-500" : "bg-gray-400"}
                  `}
                  style={{
                    left: "50%",
                    top: "1px",
                    transformOrigin: "50% 11px",
                    transform: `translateX(-50%) rotate(${i * 45}deg)`,
                  }}
                />
              ))}
            </div>

            {/* Pulse Ring */}
            <div
              className={`
              absolute inset-0 rounded-full border-2 transition-all duration-700 ease-out
              ${valueType
                  ? "border-blue-400 opacity-40 scale-150 animate-ping"
                  : "border-transparent opacity-0 scale-100"
                }
            `}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
