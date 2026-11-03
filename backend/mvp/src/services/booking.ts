export const statuses = [
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "completed",
] as const;
export type Status = (typeof statuses)[number];
const transitions: Record<Status, Status[]> = {
  pending: ["accepted", "declined", "cancelled"],
  accepted: ["cancelled", "completed"],
  declined: [],
  cancelled: [],
  completed: [],
};
export function allows(from: Status, to: Status) {
  return transitions[from].includes(to);
}
