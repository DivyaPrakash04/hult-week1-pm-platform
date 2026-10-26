"use client";
import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export function SheetContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <Dialog.Portal><Dialog.Overlay className="sheet-overlay" /><Dialog.Content className={`sheet-content ${className}`}><Dialog.Close className="sheet-close" aria-label="Close editor">×</Dialog.Close>{children}</Dialog.Content></Dialog.Portal>;
}
export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;
