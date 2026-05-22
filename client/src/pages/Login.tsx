import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Welcome back!");
      navigate("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message || "Invalid credentials. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="fixed top-0 left-1/3 w-96 h-96 rounded-full bg-violet-200/25 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/3 w-80 h-80 rounded-full bg-rose-200/25 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center justify-center cursor-pointer">
              <img src="/manus-storage/logo-transparent_b00932e3.png" alt="AI&Tech4Human" className="h-14 object-contain" />
            </div>
          </Link>
          <p className="text-sm text-muted-foreground mt-3">Member Area — Sign in to continue</p>
        </div>

        <div className="glass-card rounded-2xl p-8 bracket-accent">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-primary" />
            <h1 className="font-serif text-xl font-semibold text-foreground">Sign In</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full font-medium mt-2"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Access is restricted to group members.{" "}
            <Link href="/contact">
              <span className="text-primary hover:underline cursor-pointer">Contact us</span>
            </Link>{" "}
            to request access.
          </p>
        </div>

        <p className="text-center mt-6">
          <Link href="/">
            <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              ← Back to public site
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}
