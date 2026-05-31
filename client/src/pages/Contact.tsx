import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Globe, Mail, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const contacts = [
  { name: "Juan Luis Blanco Guzmán", role: "Lead Researcher", email: "jbguzman@us.es" },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.warning("Email sending is not yet configured. Please contact us directly using the email addresses listed on the right.");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <section className="py-20">
        <div className="container max-w-5xl">
          <div className="mb-12">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Get in Touch</p>
            <h1 className="font-serif text-4xl md:text-5xl text-foreground">Contact Us</h1>
            <p className="text-muted-foreground mt-3 max-w-lg">
              Interested in collaborating, joining the group, or learning more about our research? We'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Form */}
            <div className="lg:col-span-3">
              <div className="glass-card rounded-2xl p-8">
                <h2 className="font-serif text-xl font-semibold text-foreground mb-6">Send a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="How can we help?"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us about your interest or inquiry..."
                      rows={5}
                      required
                    />
                  </div>
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">⚠</span>
                    <span>Email sending requires SMTP configuration. Please contact us directly using the addresses on the right.</span>
                  </div>
                  <Button type="submit" className="w-full font-medium" disabled>
                    Send Message (SMTP not configured)
                  </Button>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-5">
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Lead Researcher
                </h3>
                <div className="space-y-4">
                  {contacts.map((c) => (
                    <div key={c.name} className="border-b border-border/50 last:border-0 pb-4 last:pb-0">
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground mb-1">{c.role}</p>
                      <a href={`mailto:${c.email}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {c.email}
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-xl p-6">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Ulysseus Alliance
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AI&Tech4Human is part of the Ulysseus European University Alliance, a consortium committed to building a more inclusive and innovative European higher education area.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
