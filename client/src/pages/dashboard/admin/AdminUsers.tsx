import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Shield, User, Mail } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminUsers() {
  const { isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: users, isLoading } = trpc.users.list.useQuery();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "member" as "admin" | "member" });

  // Welcome email state
  const [welcomeUser, setWelcomeUser] = useState<any>(null);
  const [welcomePassword, setWelcomePassword] = useState("");

  const createMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      setCreateOpen(false);
      setCreateForm({ name: "", email: "", password: "", role: "member" });
      toast.success("User created successfully.");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      setEditUser(null);
      toast.success("User updated.");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      toast.success("User deleted.");
    },
  });

  const welcomeEmailMutation = trpc.users.sendWelcomeEmail.useMutation({
    onSuccess: () => {
      toast.success(`Welcome email sent to ${welcomeUser?.email}`);
      setWelcomeUser(null);
      setWelcomePassword("");
    },
    onError: (e) => toast.error(e.message),
  });

  // Guard AFTER all hooks
  if (!isAdmin) {
    navigate("/dashboard");
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">User Management</h1>
            <p className="text-sm text-muted-foreground mt-1">{users?.length ?? 0} registered members</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 font-medium"><Plus className="w-4 h-4" />Add User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif">Create New User</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => { e.preventDefault(); createMutation.mutate(createForm); }}
                className="space-y-4 mt-2"
              >
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Email Address</Label>
                  <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Password <span className="text-muted-foreground text-xs">(min. 8 characters)</span></Label>
                  <Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} minLength={8} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v as "admin" | "member" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border/50">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">User</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Joined</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : users?.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">{u.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.role === "admin" ? "default" : "secondary"} className="gap-1 text-xs">
                      {u.role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {u.role === "admin" ? "Admin" : "Member"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isActive ? "outline" : "destructive"} className="text-xs">
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {format(new Date(u.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* Send Welcome Email */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-primary hover:text-primary"
                        title="Send welcome email"
                        onClick={() => { setWelcomeUser(u); setWelcomePassword(""); }}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </Button>
                      {/* Edit */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditUser(u)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Delete ${u.name}?`)) deleteMutation.mutate({ id: u.id });
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Edit dialog */}
        <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Edit User</DialogTitle>
            </DialogHeader>
            {editUser && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateMutation.mutate({
                    id: editUser.id,
                    name: editUser.name,
                    email: editUser.email,
                    role: editUser.role,
                    isActive: editUser.isActive,
                  });
                }}
                className="space-y-4 mt-2"
              >
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={editUser.role} onValueChange={(v) => setEditUser({ ...editUser, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active account</Label>
                  <Switch checked={editUser.isActive} onCheckedChange={(v) => setEditUser({ ...editUser, isActive: v })} />
                </div>
                <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Send Welcome Email dialog */}
        <Dialog open={!!welcomeUser} onOpenChange={(o) => { if (!o) { setWelcomeUser(null); setWelcomePassword(""); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Send Welcome Email
              </DialogTitle>
            </DialogHeader>
            {welcomeUser && (
              <div className="space-y-4 mt-2">
                <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-2">Recipient</p>
                  <p className="font-medium text-foreground">{welcomeUser.name}</p>
                  <p className="text-muted-foreground">{welcomeUser.email}</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A welcome email will be sent to <strong>{welcomeUser.email}</strong> with their login credentials.
                  Please enter the password you assigned to this user so it can be included in the email.
                </p>
                <div className="space-y-1.5">
                  <Label>User's password <span className="text-muted-foreground text-xs">(to include in the email)</span></Label>
                  <Input
                    type="text"
                    placeholder="Enter the password assigned to this user"
                    value={welcomePassword}
                    onChange={(e) => setWelcomePassword(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                  The email will include the website URL, username and this password in plain text.
                  Make sure SMTP is configured in Settings before sending.
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => { setWelcomeUser(null); setWelcomePassword(""); }}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    disabled={!welcomePassword || welcomeEmailMutation.isPending}
                    onClick={() => welcomeEmailMutation.mutate({ userId: welcomeUser.id, password: welcomePassword })}
                  >
                    <Mail className="w-4 h-4" />
                    {welcomeEmailMutation.isPending ? "Sending..." : "Send Email"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
