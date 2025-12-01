import { useEffect } from "react";

export default function useNavigationGuard(props: { skip?: boolean }) {
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (props?.skip) return;
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
}
