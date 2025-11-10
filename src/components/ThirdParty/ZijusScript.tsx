"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ZijusScript() {
  const pathname = usePathname();

  useEffect(() => {
    const existing = document.querySelector("script[data-zijus-script]");
    if (existing) return;

    const scriptElement = document.createElement("script");
    scriptElement.async = true;
    scriptElement.src =
      "https://zijus-cdn.s3.eu-west-2.amazonaws.com/js/zijus-webclient-jupiter-v0.1.0.js";
    scriptElement.setAttribute("data-zijus-script", "true");
    scriptElement.setAttribute(
      "zijus-config",
           "eyJ0aXRsZVRleHQiOiJGaVNlbnNlIEFJIiwic3VidGl0bGVUZXh0IjoiSG93IG1heSBJIGhlbHAgeW91PyIsImRlZmF1bHRCb3RNZXNzYWdlIjp7CiAgIkVOX1VTIjogewogICAgImNvbnRlbnQiOiAi8J+RiyBIZXkgdGhlcmUhIFdlbGNvbWUgdG8gRmlTZW5zZSDigJQgeW91ciByZXdhcmRzIGdlbmllIGZvciBjcmVkaXQgY2FyZHMuIEnigJlsbCBoZWxwIHlvdSBwaWNrIChvciBmaXgpIHRoZSBjYXJkIHRoYXQgZ2l2ZXMgeW91IG1heCBjYXNoYmFjaywgcGVya3MsIGFuZCBzbWlsZXMuIFNvLCB3aGF0IHNob3VsZCBJIGNhbGwgeW91PyIKICB9LAoiSElfSU4iOiB7CiAgICAiY29udGVudCI6ICLwn5GLIOCkqOCkruCkuOCljeCkpOClhyEg4KSr4KS84KS/IOCkuOClh+CkguCkuCDgpK7gpYfgpIIg4KSG4KSq4KSV4KS+IOCkuOCljeCkteCkvuCkl+CkpCDgpLngpYgg4oCUIOCkhuCkquCkleCkviDgpLDgpL/gpLXgpYngpLDgpY3gpKHgpY3gpLgg4KSc4KS/4KSo4KWN4KSoLCDgpJzgpYsg4KSG4KSq4KSV4KWHIOCkleCljeCksOClh+CkoeCkv+CknyDgpJXgpL7gpLDgpY3gpKEg4KSV4KWHIOCksuCkv+CkjyDgpLngpYjgpaQg4KSu4KWI4KSCIOCkhuCkquCkleClgCDgpK7gpKbgpKYg4KSV4KSw4KWC4KSB4KSX4KS+IOCkteCkuSDgpJXgpL7gpLDgpY3gpKEg4KSa4KWB4KSo4KSo4KWHICjgpK/gpL4g4KSg4KWA4KSVIOCkleCksOCkqOClhykg4KSu4KWH4KSCIOCknOCliyDgpIbgpKrgpJXgpYsg4KS44KSs4KS44KWHIOCknOCkvOCljeCkr+CkvuCkpuCkviDgpJXgpYjgpLbgpKzgpYjgpJUsIOCkq+CkvOCkvuCkr+CkpuClhyDgpJTgpLAg4KSu4KWB4KS44KWN4KSV4KS+4KSo4KWH4KSCIOCkpuCkv+CksuCkvuCkj+ClpCDgpKTgpYsg4KSs4KSk4KS+4KSH4KSPLCDgpK7gpYjgpIIg4KSG4KSq4KSV4KWLIOCkleCljeCkr+CkviDgpJXgpLngpJXgpLAg4KSs4KWB4KSy4KS+4KSK4KSBPyIKICB9Cn0sCiJ0aGVtZSI6eyJpY29uQmciOiJiZy1zdG9uZS01MCIsImhlYWRlclRleHRDb2xvciI6InRleHQtc3RvbmUtNTAiLCJoZWFkZXJHcmFkaWVudERpcmVjdGlvbiI6ImJnLWdyYWRpZW50LXRvLXIiLCJoZWFkZXJHcmFkaWVudEZyb21Db2xvciI6ImZyb20taW5kaWdvLTYwMCIsImhlYWRlckdyYWRpZW50VG9Db2xvciI6InRvLXB1cnBsZS02MDAiLCJhdmF0YXJTaXplIjoidy0xMCBoLTEwIiwiY2hhdEJhY2tncm91bmQiOiJiZy1zdG9uZS01MCIsImJ1YmJsZVVzZXJCYWNrZ3JvdW5kIjoiYmctYmx1ZS01MDAiLCJidWJibGVVc2VyVGV4dENvbG9yIjoidGV4dC1zdG9uZS01MCIsImJ1YmJsZUJvdEJhY2tncm91bmQiOiJiZy1ncmF5LTIwMCIsImJ1YmJsZUJvdFRleHRDb2xvciI6InRleHQtZ3JheS04MDAiLCJidWJibGVSYWRpdXMiOiJyb3VuZGVkLTJ4bCIsImJ1YmJsZVBhZGRpbmdYIjoicHgtNCIsImJ1YmJsZVBhZGRpbmdZIjoicHktMiIsImhlYWRlckdyYWRpZW50IjoiYmctZ3JhZGllbnQtdG8tciBmcm9tLWluZGlnby02MDAgdG8tcHVycGxlLTYwMCJ9LCJhbGxvd0Z1bGxTY3JlZW4iOnRydWUsInNob3dBdHRhY2htZW50QnV0dG9uIjp0cnVlLCJzaG93TWljQnV0dG9uIjp0cnVlLCJoaW50VGV4dCI6IkFzayBtZSIsInByaXZhY3lQb2xpY3lVcmwiOiJodHRwczovL3d3dy5nb2Zpc2Vuc2UuY29tL3ByaXZhY3ktcG9saWN5Iiwid2Vic29ja2V0VXJsIjoiaHR0cHM6Ly9zYXJhdGhpLTk3MjAtNDExOTUxNDM0NDYyLnVzLWNlbnRyYWwxLnJ1bi5hcHAvd3MiLCJjaGF0Ym90SWNvbiI6Imh0dHBzOi8vemlqdXMtY2RuLnMzLmV1LXdlc3QtMi5hbWF6b25hd3MuY29tL2ltYWdlcy9zYXJhdGhpLTk3MjAtaWNvbi5zdmciLCJ0aXRsZUljb24iOiJodHRwczovL3ppanVzLWNkbi5zMy5ldS13ZXN0LTIuYW1hem9uYXdzLmNvbS9pbWFnZXMvc2FyYXRoaS05NzIwLWljb24uc3ZnIiwic3Vic2NyaXB0aW9uVHlwZSI6Imlnbml0ZSIsImxhbmd1YWdlcyI6W3siY29kZSI6IkVOX1VTIiwibmFtZSI6IkVuZ2xpc2gifSwgeyJjb2RlIjoiSElfSU4iLCJuYW1lIjoiSGluZGkifV0sICJmb3JjZWRGdWxsc2NyZWVuIjogdHJ1ZSwgImRlZmF1bHRPcGVuIjogdHJ1ZX0="
    );

    document.body.appendChild(scriptElement);

    return () => {
      // remove modal container if it exists
      const modal = document.querySelector("#zijus-root, #zijus-widget-root, [class*='zijus']");
      if (modal && modal.parentNode) modal.parentNode.removeChild(modal);

      // remove the script tag itself
      const script = document.querySelector("script[data-zijus-script]");
      if (script) {script.remove();
        window.location.reload()
      }
    };
  }, [pathname]);

  return null;
}




