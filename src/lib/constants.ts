/**
 * Constants that are safe to import in both server AND client components.
 * Keep this file free of any Node.js built-ins (fs, path, etc.)
 */

export type Category =
  | "Cribbage"
  | "Solitaire"
  | "Strategy"
  | "Rules & How-To"
  | "History"
  | "Tips & Tricks"
  | "Card Game News";

export const CATEGORIES: Category[] = [
  "Cribbage",
  "Solitaire",
  "Strategy",
  "Rules & How-To",
  "History",
  "Tips & Tricks",
  "Card Game News",
];
