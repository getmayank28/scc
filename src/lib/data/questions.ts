export const questions = {
  version: 5,
  setId: "default",
  questions: [
    {
      questionId: "shoppingAndPayments",
      question:
        "How much do you spend every month on all shopping & bill payments?",
      description:
        "Include shopping, food, travel, fuel, and bill payments and all other spend",
      order: 1,
      inputs: [
        {
          id: "shoppingAndPayments",
          inputType: "number",
          allowSkip: true,
          validation: { min: 0, max: 400000 },
        },
      ],
    },
    {
      questionId: "onlineSpend",
      question: "What percentage of your monthly spend happens online?",
      order: 2,
      inputs: [
        {
          id: "onlineSpend",
          inputType: "number",
          allowSkip: true,
          validation: { min: 0, max: 400000 },
        },
      ],
    },
    {
      questionId: "travelAndHotel",
      question: "What is your average monthly spend on Travel & Hotel?",
      description:
        "e.g. if you take 2 holiday a year costing 1,20,000, your average monthly spend is 10,000",
      order: 3,
      inputs: [
        {
          id: "travelAndHotel",
          inputType: "number",
          allowSkip: true,
          validation: { min: 0, max: 100000 },
        },
      ],
    },
    {
      questionId: "travelBookings",
      question: "Which platform do you use most for travel bookings?",
      description:
        "Include shopping, food, travel, fuel, and bill payments and all other spend",
      order: 4,
      inputs: [
        {
          id: "travelBookings",
          inputType: "select",
          allowSkip: true,
          options: [
            "MakeMyTrip",
            "Goibibo",
            "EaseMyTrip",
            "Yatra",
            "Cleartrip",
            "Airline app/Others",
          ],
        },
      ],
    },
    {
      questionId: "onlineShoppingSpend",
      question: "What is your monthly Online Shopping Spend?",
      description: "Includes fashion, groceries & other purchases done online",
      order: 5,
      inputs: [
        {
          id: "onlineShoppingSpend",
          inputType: "number",
          allowSkip: true,
          validation: { min: 0, max: 100000 },
        },
      ],
    },
    {
      questionId: "onlineShopingPlatform",
      question: "Which platform do you use most for online shopping?",
      order: 6,
      inputs: [
        {
          id: "onlineShopingPlatform",
          inputType: "select",
          allowSkip: true,
          options: ["Amazon", "Flipkart", "Myntra", "Ajio", "Nykaa", "Others"],
        },
      ],
    },
    {
      questionId: "foodAndDining",
      question: "What is your average monthly spend on Food and Dining?",
      description:
        "e.g. if you order 2 times a week ( i.e 8 times a month), approx 300 per order, your food spend is 2400. If your dineout weekely with bill of ~1000, your dining bill is 4000, Total food & dining spend-Rs.6400",
      order: 7,
      inputs: [
        {
          id: "foodAndDining",
          inputType: "number",
          allowSkip: true,
          validation: { min: 0, max: 100000 },
        },
        {
          id: "foodAndDining",
          inputType: "select",
          allowSkip: true,
          options: ["Zomato", "Swiggy", "Uber Eats", "Diect from Restaurant"],
        },
      ],
    },
    {
      questionId: "miscellaneous",
      question: "What is your average monthly spend on  these?",
      description:
        "In case you don’t pay these monthly- mention approx. yearly spend divided by 12",
      order: 8,
      inputs: [
        {
          id: "miscellaneous",
          label: "Utility bill",
          inputType: "number",
          allowSkip: true,
          validation: { min: 0, max: 100000 },
        },
        {
          id: "miscellaneous",
          label: "Fuel",
          inputType: "number",
          allowSkip: true,
          validation: { min: 0, max: 100000 },
        },
        {
          id: "miscellaneous",
          label: "Insurance premium, Rent & Taxes",
          inputType: "number",
          allowSkip: true,
          validation: { min: 0, max: 100000 },
        },
      ],
    },
  ],
};
