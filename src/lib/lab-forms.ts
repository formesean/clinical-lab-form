import type { FormType } from "@prisma/client";

const pad2 = (value: number) => String(value).padStart(2, "0");
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDisplayDate(date: Date): string {
  return `${pad2(date.getDate())}/${MONTHS_SHORT[date.getMonth()]}/${date.getFullYear()}`;
}

export function formatDisplayTime(date: Date): string {
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const amPm = hours24 >= 12 ? "PM" : "AM";
  return `${pad2(hours12)}:${pad2(date.getMinutes())} ${amPm}`;
}

export function buildRequisitionDefaults(formType: FormType, at: Date = new Date()): Record<string, string> {
  const prefix = formType.toLowerCase();
  const date = formatDisplayDate(at);
  const time = formatDisplayTime(at);

  return {
    [`${prefix}.dateOfReq`]: date,
    [`${prefix}.timeOfReq`]: time,
  };
}
