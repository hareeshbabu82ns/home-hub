"use client";

import { Ban, Check, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addSiteRule, removeSiteRule, type SiteRule } from "@/lib/actions/network-sites";

/** Add a domain for a scope ("global" or a device id). */
export function AddSiteRuleForm({
  scope,
  allowAllowed,
  onChanged,
  placeholder = "youtube.com or a pasted link",
}: {
  scope: string;
  /** Show the "Allow" button (device scope only). */
  allowAllowed: boolean;
  onChanged: () => void | Promise<void>;
  placeholder?: string;
}) {
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState<"block" | "allow" | null>(null);

  async function add(action: "block" | "allow") {
    if (!domain.trim()) return;
    setBusy(action);
    const result = await addSiteRule({ scope, domain, action });
    setBusy(null);
    if (result.success) {
      toast.success(`${result.domain} ${action === "block" ? "blocked" : "allowed"} (including subdomains)`);
      if (result.warning) toast.warning(result.warning);
      setDomain("");
      await onChanged();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        void add("block");
      }}
    >
      <Input
        value={domain}
        onChange={(event) => setDomain(event.target.value)}
        placeholder={placeholder}
        aria-label="Website domain"
        autoComplete="off"
      />
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" disabled={!!busy || !domain.trim()}>
          {busy === "block" ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Ban className="mr-1 size-4" />}
          Block
        </Button>
        {allowAllowed && (
          <Button
            type="button"
            variant="outline"
            disabled={!!busy || !domain.trim()}
            onClick={() => void add("allow")}
            title="Let this device reach the site even if it's blocked for all devices"
          >
            {busy === "allow" ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Check className="mr-1 size-4" />}
            Allow
          </Button>
        )}
      </div>
    </form>
  );
}

/** Domain chips with remove (confirmed). */
export function SiteRuleList({
  rules,
  canManage,
  onChanged,
  emptyText,
}: {
  rules: SiteRule[];
  canManage: boolean;
  onChanged: () => void | Promise<void>;
  emptyText: string;
}) {
  const [removing, setRemoving] = useState<SiteRule | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function remove(rule: SiteRule) {
    setRemoving(null);
    setBusyId(rule.id);
    const result = await removeSiteRule(rule.id);
    setBusyId(null);
    if (result.success) {
      toast.success(`${rule.domain} ${rule.action === "block" ? "unblocked" : "exception removed"}`);
      if (result.warning) toast.warning(result.warning);
      await onChanged();
    } else {
      toast.error(result.error);
    }
  }

  if (rules.length === 0) return <p className="text-muted-foreground text-sm">{emptyText}</p>;

  return (
    <>
      <ul className="flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {rules.map((rule) => (
            <motion.li
              key={rule.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <Badge
                variant={rule.action === "block" ? "destructive" : "secondary"}
                className="gap-1 py-1 pr-1 pl-2 text-sm font-normal"
                title={`${rule.action === "block" ? "Blocked" : "Allowed"}${rule.createdBy ? ` by ${rule.createdBy}` : ""} on ${new Date(rule.createdAt).toLocaleDateString()}`}
              >
                {rule.action === "block" ? <Ban className="size-3" /> : <Check className="size-3" />}
                <span className="font-mono">{rule.domain}</span>
                {canManage && (
                  <button
                    type="button"
                    className="hover:bg-background/30 ml-0.5 rounded p-0.5"
                    aria-label={`Remove ${rule.domain}`}
                    disabled={busyId === rule.id}
                    onClick={() => setRemoving(rule)}
                  >
                    {busyId === rule.id ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />}
                  </button>
                )}
              </Badge>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <AlertDialog open={!!removing} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {removing?.action === "block" ? `Unblock ${removing?.domain}?` : `Remove the exception for ${removing?.domain}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {removing?.action === "block"
                ? "The site becomes reachable again (unless another rule or the router's blocklists still block it). Devices may need a minute to forget the cached answer."
                : "The device follows the normal rules for this site again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => removing && void remove(removing)}>
              {removing?.action === "block" ? "Unblock" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

