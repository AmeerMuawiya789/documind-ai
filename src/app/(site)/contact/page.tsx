"use client";

import { useState } from "react";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SUPPORT_EMAIL } from "@/lib/config";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Beta: open the user's mail client with a prefilled message.
    // A ticket backend is on the roadmap; nothing is faked here.
    const data = new FormData(e.currentTarget);
    const subject = encodeURIComponent(`DocuMind AI support — ${data.get("topic")}`);
    const body = encodeURIComponent(
      `Name: ${data.get("name")}\nEmail: ${data.get("email")}\n\n${data.get("message")}`,
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-navy-950 dark:text-white">Contact & support</h1>
      <p className="mt-4 text-lg text-navy-500 dark:text-navy-400">
        Questions, feedback, or something broken? We read everything.
      </p>

      <Card className="mt-10">
        <CardHeader>
          <CardTitle>Send us a message</CardTitle>
          <CardDescription>
            We usually reply within one business day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <CheckCircle2 className="size-12 text-emerald-600" aria-hidden />
              <p className="font-semibold text-navy-900 dark:text-navy-100">Your email app should have opened.</p>
              <p className="max-w-sm text-sm text-navy-500 dark:text-navy-400">
                Just hit send there — your message is addressed to our support inbox.
                Prefer to write directly? Email{" "}
                <a className="font-medium text-brand-600 dark:text-brand-300" href={`mailto:${SUPPORT_EMAIL}`}>
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required autoComplete="name" placeholder="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required autoComplete="email" placeholder="jane@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input id="topic" name="topic" required placeholder="e.g. Question about a feature" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" required rows={5} placeholder="How can we help?" />
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                <Send className="size-4" /> Compose email
              </Button>
              <p className="flex items-start gap-2 text-xs text-navy-400">
                <Mail className="mt-0.5 size-3.5 shrink-0" />
                This opens your email app addressed to {SUPPORT_EMAIL}. Never share passwords or payment details by email.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
