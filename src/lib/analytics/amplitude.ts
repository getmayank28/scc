import * as amplitude from "@amplitude/analytics-browser";
import { identify, Identify, reset, setUserId } from "@amplitude/analytics-browser";

let initialized = false;

export const initAmplitude = () => {
  if (initialized) return;

  amplitude.init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY as string, undefined, {
    defaultTracking: {
      sessions: true,
      pageViews: false,
    },
    logLevel:
      process.env.NODE_ENV === "development"
        ? amplitude.Types.LogLevel.Debug
        : amplitude.Types.LogLevel.Warn,
  });

  initialized = true;
};

interface IdentifyUserArgs {
  id: string;
  email?: string | null;
  username?: string | null;
}

export const identifyUser = ({ id, email, username }: IdentifyUserArgs) => {
  setUserId(id);

  const identifyObj = new Identify();
  if (email) identifyObj.set("email", email);
  if (username) identifyObj.set("username", username);

  identify(identifyObj);
};

export const resetAmplitude = () => {
  reset();
};
