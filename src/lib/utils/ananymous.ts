import { v4 as uuid } from "uuid";

export function getAnonymousId() {
  let id = localStorage.getItem("anon_id");
  if (!id) {
    id = uuid();
    localStorage.setItem("anon_id", id);
  }
  return id;
}
