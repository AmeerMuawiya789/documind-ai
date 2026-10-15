"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Trash2, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setName(String(data.user?.user_metadata?.full_name ?? ""));
    });
  }, []);

  async function saveProfile() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    if (!supabase) {
      setError("Profile saving is not available — the database is not connected.");
      setSaving(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() || null } });
    if (error) {
      setError("Could not save your profile.");
    } else {
      await supabase.from("profiles").update({ full_name: name.trim() || null }).eq("email", email);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function deleteAccount() {
    if (deleteText !== "DELETE") return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not delete your account.");
      const supabase = createClient();
      if (supabase) await supabase.auth.signOut();
      router.push("/?account=deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete your account.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl dark:text-white">Account settings</h1>
        <p className="mt-1 text-navy-500 dark:text-navy-400">Manage your profile and data.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><User className="size-4" /> Profile</CardTitle>
          <CardDescription>How your name appears in the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="set-email">Email</Label>
            <Input id="set-email" value={email} disabled aria-describedby="email-note" />
            <p id="email-note" className="text-xs text-navy-400">Email can't be changed in the beta.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="set-name">Display name</Label>
            <Input
              id="set-name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Your name" maxLength={120}
            />
          </div>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
          <Button onClick={saveProfile} disabled={saving}>
            <Save className="size-4" /> {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-300">
            <AlertTriangle className="size-4" /> Danger zone
          </CardTitle>
          <CardDescription>
            Deleting your account permanently removes your profile, documents, conversations,
            generated outputs and usage history. This can't be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" /> Delete my account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              Everything associated with {email} will be permanently deleted. Type{" "}
              <strong>DELETE</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            placeholder="Type DELETE"
            aria-label="Type DELETE to confirm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteText !== "DELETE" || deleting} onClick={deleteAccount}>
              {deleting ? "Deleting…" : "Delete everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
