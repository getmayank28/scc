export const travelCard = [
  {
    m_id: "1",
    source: "assistant",
    content:
      "About how many holidays trips (domestic + international) do you take in a year?",
    order: 1,
    type: "SlotMessage",
    slots: [
      {
        label: "1-2",
        value: "1-2",
      },
      {
        label: "2-3",
        value: "2-3",
      },
      {
        label: "4-5",
        value: "4-5",
      },
      {
        label: "6+",
        value: "6+",
      },
    ],
  },
  {
    m_id: "2",
    source: "assistant",
    content: "Roughly how much of your total travel spend is international?",
    order: 2,
    type: "SlotMessage",
    slots: [
      {
        label: "Only domestic",
        value: "Only domestic",
      },
      {
        label: "Mostly domestic",
        value: "Mostly domestic",
      },
      {
        label: "Mostly international",
        value: "Mostly international",
      },
      {
        label: "Roughly equal",
        value: "Roughly equal",
      },
    ],
  },
  
  {
    m_id: "3",
    source: "assistant",
    content: "On average, how much do you spend per holiday?",
    order: 3,
    type: "SlotMessage",
    slots: [
      {
        label: "Less than ₹50,000",
        value:  "Less than ₹50,000",
      },
      {
        label: "₹50,000 – ₹1,00,000",
        value:  "₹50,000 – ₹1,00,000",
      },
      {
        label: "₹1 – ₹1.5 lakhs",
        value: "₹1 – ₹1.5 lakhs",
      },
      {
        label: "₹1.5 – ₹2 lakhs",
        value: "₹1.5 – ₹2 lakhs",
      },
      {
        label: "₹2 lakhs+",
        value: "₹2 lakhs+",
      },
    ],
  },
  {
    m_id: "4",
    source: "assistant",
    content:
      "I have 3 strong contenders, but 1  more minutes gets you THE perfect match!  Shall we dive deeper?",
    order: 4,
    type: "ButtonGroup",
    slots: [
      {
        label: "I want the perfect card",
        value: "skipEvaluation",
        variant:'primary'
      },
      {
        label: "Show me now",
        value: "evaluateEarly",
        variant:'outline'
      },
    ],
  },
  {
    m_id: "5",
    source: "assistant",
    content: "No. of international holiday trip each Year?",
    order: 5,
    type: "SliderMessage",
    default: 3,
    min: 0,
    max: 10,
    step: 1,
  },
  {
    m_id: "6",
    source: "assistant",
    content: "Approx how much do you spend on each international trip?",
    order: 6,
    type: "SlotMessage",
    slots: [
      {
        label: "Less than ₹1 lakh",
        value:"Less than ₹1 lakh",
      },
      {
        label: "₹1 – ₹1.5 lakhs",
        value: "₹1 – ₹1.5 lakhs",
      },
      {
        label: "₹1.5 – ₹2 lakhs",
        value:  "₹1.5 – ₹2 lakhs",
      },
      {
        label: "₹3 lakhs+",
        value: "₹3 lakhs+",
      },
    ],
  },
  {
    m_id: "7",
    source: "assistant",
    content: "Additional flight spend (excluding holidays)",
    order: 7,
    type: "SlotMessage",
    slots: [
      {
        label: "None",
        value: "none",
      },
      {
        label: "Low (~₹50,000)",
        value:  "Low (~₹50,000)",
      },
      {
        label: "Medium (₹50,000 – ₹1 lakh)",
        value:  "Medium (₹50,000 – ₹1 lakh)",
      },
      {
        label: "High (₹1 lakh – ₹2 lakhs)",
        value:"High (₹1 lakh – ₹2 lakhs)",
      },
      {
        label: "Globetrotter (₹2 lakhs+)",
        value: "Globetrotter (₹2 lakhs+)",
      },
    ],
  },
  {
    m_id: "8",
    source: "assistant",
    content: "What’s your priority?",
    order: 8,
    type: "MultiSelect",
    slots: [
      {
        label: "Lounge",
        value:  "Lounge",
      },
      {
        label: "Miles",
        value: "Miles",
      },
      {
        label: "Insurance",
        value:  "Insurance",
      },
      {
        label: "Low Forex",
        value: "Low Forex",
      },
      {
        label: "Max savings",
        value:"Max savings",
      },
    ],
  },
];
