import { signOut } from "next-auth/react";
import Typography from "../Typography/Typography";
import { ROUTES } from "@/lib/constants/routes";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";

const ChangeEmail = ({ email }: { email: string }) => {

  const handleChangeEmail = () => {
    trackEvent(EventName.EMAIL_VERIFY_CHANGE_EMAIL_CLICKED, {});
    signOut({ callbackUrl: ROUTES.SIGN_IN });
  };
  return (
    <div className="flex justify-between">
      <Typography variant="caption" className={`text-left my-2`}>
        {email}
      </Typography>
      <Typography
        variant="caption"
        className={`text-left my-2 cursor-pointer text-white opacity-80 font-bold`}
        onClick={handleChangeEmail}
      >
        Change
      </Typography>
    </div>
  );
};

export default ChangeEmail;
