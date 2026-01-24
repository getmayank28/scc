import { v4 as uuid } from "uuid";

export function getAnonymousId() {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem("anon_id");
  if (!id) {
    id = uuid();
    localStorage.setItem("anon_id", id);
  }
  return id;
}
