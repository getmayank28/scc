import * as amplitude from "@amplitude/analytics-browser";
import { getUserId, identify, Identify, reset, setUserId } from "@amplitude/analytics-browser";

let initPromise: Promise<unknown> | null = null;

/** Idempotent; resolves once the SDK has loaded the stored identity. */
export const initAmplitude = () => {
  if (initPromise) return initPromise;

  initPromise = amplitude.init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY as string, undefined, {
    defaultTracking: {
      sessions: true,
      pageViews: false,
    },
    logLevel:
      process.env.NODE_ENV === "development"
        ? amplitude.Types.LogLevel.Debug
        : amplitude.Types.LogLevel.Warn,
  }).promise;
  return initPromise;
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

/**
 * Clears the identity of a user who has signed out. Only when one is stored:
 * reset() also mints a new device id, so calling it for every logged-out page
 * load gave each anonymous visit a fresh identity and split pre-sign-in
 * funnels (and their UTMs) across devices.
 */
export const resetAmplitude = async () => {
  await initAmplitude();
  if (getUserId()) reset();
};
