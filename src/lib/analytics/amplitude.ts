import * as amplitude from "@amplitude/analytics-browser";
import { identify, Identify, setUserId } from "@amplitude/analytics-browser";

let initialized = false;

export const initAmplitude = (userId?: string) => {
  //Initialize only once (NO userId here)
  if (!initialized) {
    amplitude.init(
      process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY as string,
      undefined, // ALWAYS undefined
      {
        defaultTracking: {
          sessions: true,
          pageViews: false, // you control manually
        },
        logLevel:
          process.env.NODE_ENV === "development"
            ? amplitude.Types.LogLevel.Debug
            : amplitude.Types.LogLevel.Warn,
      },
    );

    initialized = true;
  }

  // Step 2: Attach user if available
  if (userId) {
    amplitude.setUserId(userId);

    // optional: identify call
    const identifyObj = new Identify();
    //   .set("email", user.email)
    //   .set("plan", user.plan)
    //   .set("signup_date", user.createdAt);
    amplitude.identify(identifyObj);
  }
};

interface User {
  id: string;
  email: string;
  plan: "free" | "pro";
  createdAt: string;
}

export const identifyUser = (user: User) => {
  setUserId(user.id);

  const identifyObj = new Identify()
    .set("email", user.email)
    .set("plan", user.plan)
    .set("signup_date", user.createdAt);

  identify(identifyObj);
};
