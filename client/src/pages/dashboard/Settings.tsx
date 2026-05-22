import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Mail, Bot, Eye, EyeOff, Save } from "lucide-react";

const APP_VERSION = "v10";
const BUILD_DATE = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
const BUILD_TIME = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

export default function Settings() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: settings, isLoading } = trpc.settings.get.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const setMutation = trpc.settings.set.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      toast.success("Setting saved.");
    },
    onError: (e) => toast.error(e.message),
  });

  // SMTP state
  const [smtp, setSmtp] = useState({
    host: "", port: "587", user: "", password: "", from: "",
  });
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  // OpenAI state
  const [openaiKey, setOpenaiKey] = useState("");
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);

  useEffect(() => {
    if (settings) {
      setSmtp({
        host: settings["smtp_host"] ?? "",
        port: settings["smtp_port"] ?? "587",
        user: settings["smtp_user"] ?? "",
        password: settings["smtp_password"] ?? "",
        from: settings["smtp_from"] ?? "",
      });
      setOpenaiKey(settings["openai_api_key"] ?? "");
    }
  }, [settings]);

  const saveSmtp = async () => {
    await Promise.all([
      setMutation.mutateAsync({ key: "smtp_host", value: smtp.host }),
      setMutation.mutateAsync({ key: "smtp_port", value: smtp.port }),
      setMutation.mutateAsync({ key: "smtp_user", value: smtp.user }),
      setMutation.mutateAsync({ key: "smtp_password", value: smtp.password }),
      setMutation.mutateAsync({ key: "smtp_from", value: smtp.from }),
    ]);
    toast.success("SMTP settings saved.");
  };

  const saveOpenai = async () => {
    await setMutation.mutateAsync({ key: "openai_api_key", value: openaiKey });
    toast.success("OpenAI API key saved.");
  };

  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="max-w-2xl py-12 text-center">
          <SettingsIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Access restricted to administrators.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Application configuration (admin only)</p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        ) : (
          <>
            {/* SMTP Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base font-semibold">Email (SMTP) Configuration</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Configure the SMTP server for sending email notifications and contact form messages.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label>SMTP Host</Label>
                    <Input
                      value={smtp.host}
                      onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Port</Label>
                    <Input
                      value={smtp.port}
                      onChange={(e) => setSmtp({ ...smtp, port: e.target.value })}
                      placeholder="587"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Username / Email</Label>
                    <Input
                      value={smtp.user}
                      onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                      placeholder="noreply@yourdomain.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showSmtpPassword ? "text" : "password"}
                        value={smtp.password}
                        onChange={(e) => setSmtp({ ...smtp, password: e.target.value })}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>From Address</Label>
                    <Input
                      value={smtp.from}
                      onChange={(e) => setSmtp({ ...smtp, from: e.target.value })}
                      placeholder="AI&Tech4Human <noreply@yourdomain.com>"
                    />
                  </div>
                </div>
                <Button onClick={saveSmtp} disabled={setMutation.isPending} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save SMTP Settings
                </Button>
              </CardContent>
            </Card>

            <Separator />

            {/* OpenAI Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base font-semibold">AI Assistant (OpenAI)</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Provide your OpenAI API key to enable the AI Assistant features in the platform.
                  Get your key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">platform.openai.com</a>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>OpenAI API Key</Label>
                  <div className="relative">
                    <Input
                      type={showOpenaiKey ? "text" : "password"}
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-..."
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={saveOpenai} disabled={setMutation.isPending} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save API Key
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Version info */}
        <div className="text-right text-xs text-muted-foreground pt-4 border-t border-border/40">
          Version {APP_VERSION} · {BUILD_DATE} {BUILD_TIME}
        </div>
      </div>
    </DashboardLayout>
  );
}
