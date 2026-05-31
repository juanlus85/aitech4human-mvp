import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { Camera, FileText, Save, Upload, KeyRound } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.profiles.getMyProfile.useQuery();

  const [form, setForm] = useState({
    bio: "", interests: "", university: "", department: "",
    researchArea: "", orcid: "", googleScholar: "", researchGate: "",
    scopus: "", webOfScience: "", linkedin: "", personalWeb: "",
    keywords: "", languages: "", availableToCollaborate: false, showEmail: false, isPublic: true,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        bio: profile.bio ?? "",
        interests: profile.interests ?? "",
        university: profile.university ?? "",
        department: profile.department ?? "",
        researchArea: profile.researchArea ?? "",
        orcid: profile.orcid ?? "",
        googleScholar: profile.googleScholar ?? "",
        researchGate: profile.researchGate ?? "",
        scopus: profile.scopus ?? "",
        webOfScience: profile.webOfScience ?? "",
        linkedin: profile.linkedin ?? "",
        personalWeb: profile.personalWeb ?? "",
        keywords: profile.keywords ?? "",
        languages: profile.languages ?? "",
        availableToCollaborate: profile.availableToCollaborate ?? false,
        showEmail: profile.showEmail ?? false,
        isPublic: profile.isPublic ?? true,
      });
    }
  }, [profile]);

  const updateMutation = trpc.profiles.update.useMutation({
    onSuccess: () => {
      utils.profiles.getMyProfile.invalidate();
      toast.success("Profile updated successfully.");
    },
    onError: () => toast.error("Failed to update profile."),
  });

  const [photoUploading, setPhotoUploading] = useState(false);
  const [cvUploading, setCvUploading] = useState(false);

  // Change password
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const changePasswordMutation = trpc.users.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed successfully.");
      setPwForm({ current: "", next: "", confirm: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const photoRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await fetch("/api/upload/photo", { method: "POST", credentials: "include", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      await utils.profiles.getMyProfile.invalidate();
      toast.success("Photo updated.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to upload photo.");
    } finally {
      setPhotoUploading(false);
      if (photoRef.current) photoRef.current.value = "";
    }
  };

  const handleCvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvUploading(true);
    try {
      const fd = new FormData();
      fd.append("cv", file);
      const res = await fetch("/api/upload/cv", { method: "POST", credentials: "include", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      await utils.profiles.getMyProfile.invalidate();
      toast.success("CV uploaded.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to upload CV.");
    } finally {
      setCvUploading(false);
      if (cvRef.current) cvRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const field = (id: keyof typeof form, label: string, placeholder?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={form[id] as string}
        onChange={(e) => setForm({ ...form, [id]: e.target.value })}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Your profile is visible on the public members page.</p>
        </div>

        {/* Photo */}
        <div className="glass-card rounded-xl p-6 flex items-center gap-5">
          <div className="relative">
            <Avatar className="w-20 h-20">
              {profile?.photoUrl && <AvatarImage src={profile.photoUrl} />}
              <AvatarFallback className="text-2xl font-serif font-semibold bg-primary/10 text-primary">
                {user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => !photoUploading && photoRef.current?.click()}
              disabled={photoUploading}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {photoUploading ? <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
          <div>
            <p className="font-semibold text-foreground">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">{user?.role}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Academic info */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Academic Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("university", "University", "University of...")}
              {field("department", "Department", "Department of...")}
              {field("researchArea", "Research Area", "e.g. Artificial Intelligence")}
              {field("languages", "Languages", "e.g. English, Spanish")}
            </div>
          </div>

          {/* Bio & Interests */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Biography & Interests</h2>
            <div className="space-y-1.5">
              <Label htmlFor="bio">Biography</Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Write a short academic biography..."
                rows={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="interests">Research Interests</Label>
              <Textarea
                id="interests"
                value={form.interests}
                onChange={(e) => setForm({ ...form, interests: e.target.value })}
                placeholder="Describe your research interests..."
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="keywords">Keywords <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
              <Input
                id="keywords"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="AI, XR, eye-tracking, education..."
              />
            </div>
          </div>

          {/* Academic profiles */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Academic & Social Profiles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("orcid", "ORCID", "0000-0000-0000-0000")}
              {field("googleScholar", "Google Scholar URL")}
              {field("researchGate", "ResearchGate URL")}
              {field("scopus", "Scopus URL")}
              {field("webOfScience", "Web of Science URL")}
              {field("linkedin", "LinkedIn URL")}
              {field("personalWeb", "Personal Website URL")}
            </div>
          </div>

          {/* CV */}
          <div className="glass-card rounded-xl p-6 space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">Curriculum Vitae</h2>
            <div className="flex items-center gap-3">
              {profile?.cvPdfUrl ? (
                <a href={profile.cvPdfUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2 bg-white/60">
                    <FileText className="w-4 h-4" /> View current CV
                  </Button>
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">No CV uploaded yet.</p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 bg-white/60"
                onClick={() => cvRef.current?.click()}
                disabled={cvUploading}
              >
                <Upload className="w-4 h-4" />
                {cvUploading ? "Uploading..." : "Upload PDF"}
              </Button>
              <input ref={cvRef} type="file" accept="application/pdf" className="hidden" onChange={handleCvChange} />
            </div>
          </div>

          {/* Visibility */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Visibility Settings</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Public profile</p>
                <p className="text-xs text-muted-foreground">Show your profile on the public members page</p>
              </div>
              <Switch
                checked={form.isPublic}
                onCheckedChange={(v) => setForm({ ...form, isPublic: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Show email on public profile</p>
                <p className="text-xs text-muted-foreground">Display your email address on the public members page</p>
              </div>
              <Switch
                checked={form.showEmail}
                onCheckedChange={(v) => setForm({ ...form, showEmail: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Open to collaborate</p>
                <p className="text-xs text-muted-foreground">Display a collaboration badge on your profile</p>
              </div>
              <Switch
                checked={form.availableToCollaborate}
                onCheckedChange={(v) => setForm({ ...form, availableToCollaborate: v })}
              />
            </div>
          </div>

          <Button type="submit" className="font-medium gap-2" disabled={updateMutation.isPending}>
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </form>

        {/* Change Password */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-lg font-semibold text-foreground">Change Password</h2>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pwForm.next !== pwForm.confirm) {
                toast.error("New passwords do not match.");
                return;
              }
              changePasswordMutation.mutate({ currentPassword: pwForm.current, newPassword: pwForm.next });
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="pw-current">Current password</Label>
              <Input
                id="pw-current"
                type="password"
                value={pwForm.current}
                onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pw-new">New password <span className="text-muted-foreground text-xs">(min. 8 characters)</span></Label>
                <Input
                  id="pw-new"
                  type="password"
                  value={pwForm.next}
                  onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw-confirm">Confirm new password</Label>
                <Input
                  id="pw-confirm"
                  type="password"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              variant="outline"
              className="gap-2 bg-white/60"
              disabled={!pwForm.current || !pwForm.next || !pwForm.confirm || changePasswordMutation.isPending}
            >
              <KeyRound className="w-4 h-4" />
              {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
