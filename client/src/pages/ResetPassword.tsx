import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Password updated. You can now sign in.");
      navigate("/login");
    },
    onError: (error) => toast.error(error.message),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    resetMutation.mutate({ token, newPassword: password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed top-0 left-1/3 w-96 h-96 rounded-full bg-violet-200/25 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/3 w-80 h-80 rounded-full bg-rose-200/25 blur-3xl pointer-events-none" />
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <img src="/uploads/aitech4human-logo.png" alt="AI&Tech4Human Ulysseus R&I Group" className="h-14 object-contain mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">Member Area — Secure password recovery</p>
        </div>

        <div className="glass-card rounded-2xl p-8 bracket-accent">
          {!token ? (
            <div className="space-y-5 text-center">
              <ShieldCheck className="h-9 w-9 text-primary mx-auto" />
              <div>
                <h1 className="font-serif text-xl font-semibold text-foreground">Password link unavailable</h1>
                <p className="mt-2 text-sm text-muted-foreground">Request a new secure link from the sign-in page.</p>
              </div>
              <Button className="w-full" onClick={() => navigate("/login")}>Back to sign in</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="w-4 h-4 text-primary" />
                <h1 className="font-serif text-xl font-semibold text-foreground">Choose a new password</h1>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">Set a new password with at least eight characters. This secure link can be used only once.</p>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input id="new-password" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-new-password">Confirm new password</Label>
                <Input id="confirm-new-password" type="password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required />
              </div>
              <Button type="submit" className="w-full" disabled={resetMutation.isPending || password.length < 8 || password !== confirmPassword}>
                {resetMutation.isPending ? "Saving..." : "Save new password"}
              </Button>
              <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => navigate("/login")}>Back to sign in</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
