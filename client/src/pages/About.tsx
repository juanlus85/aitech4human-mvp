import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { Badge } from "@/components/ui/badge";
import { Globe, Target, Lightbulb, Users, BookOpen, Handshake } from "lucide-react";

const objectives = [
  {
    icon: Target,
    title: "Advance Human-Centred AI Research",
    desc: "Generate new knowledge on how Artificial Intelligence can improve wellbeing, decision-making, accessibility, and societal outcomes.",
  },
  {
    icon: Lightbulb,
    title: "Develop and Evaluate Emerging Technologies",
    desc: "Design, test, and assess innovative applications of AI, XR, Eye Tracking, and related technologies in real-world contexts.",
  },
  {
    icon: Users,
    title: "Foster International Collaboration",
    desc: "Strengthen cooperation among researchers, institutions, and stakeholders across the Ulysseus ecosystem and beyond.",
  },
  {
    icon: BookOpen,
    title: "Promote Knowledge Transfer and Education",
    desc: "Deliver BIPs, COILs, workshops, seminars, and other educational initiatives that connect research, innovation, and learning.",
  },
  {
    icon: Handshake,
    title: "Generate Scientific and Innovation Outputs",
    desc: "Produce high-quality publications, conference contributions, collaborative projects, and competitive funding proposals.",
  },
  {
    icon: Globe,
    title: "Create Societal Impact",
    desc: "Promote ethical, sustainable, and inclusive technological innovation that addresses societal challenges and supports European priorities.",
  },
];

const universities = [
  {
    name: "University of Seville",
    country: "Spain",
    flag: "🇪🇸",
    description: "One of Spain's oldest and most prestigious universities, contributing expertise in AI applications for business and education.",
  },
  {
    name: "Haaga-Helia University of Applied Sciences",
    country: "Finland",
    flag: "🇫🇮",
    description: "A leading Finnish university of applied sciences, bringing expertise in digital innovation and technology-enhanced learning.",
  },
  {
    name: "University of Montenegro",
    country: "Montenegro",
    flag: "🇲🇪",
    description: "The national university of Montenegro, contributing perspectives on technology adoption and societal impact in the Western Balkans.",
  },
  {
    name: "Technical University of Košice (TUKE)",
    country: "Slovakia",
    flag: "🇸🇰",
    description: "A leading Slovak technical university, contributing expertise in engineering, information technologies, and applied research for industrial and societal innovation.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="container max-w-4xl">
          <div className="space-y-4 mb-12">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">About the Group</p>
            <h1 className="font-serif text-4xl md:text-5xl text-foreground leading-tight">
              AI&Tech4Human
              <span className="block text-2xl md:text-3xl text-muted-foreground font-normal italic mt-1">
                Emerging Technologies for Societal Wellbeing
              </span>
            </h1>
          </div>

          <div className="glass-card rounded-2xl p-8 md:p-10 line-accent">
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              AI&Tech4Human is a European research and innovation network dedicated to exploring how emerging technologies can improve people's lives and contribute to a more inclusive, sustainable, and human-centred society.

Bringing together researchers from multiple Ulysseus partner universities, the group works at the intersection of Artificial Intelligence, Extended Reality (XR), Eye Tracking, Digital Accessibility, Sustainability, and Human Behaviour. Our activities combine research, education, and innovation to address real-world challenges in areas such as tourism, health, education, business, and civic engagement.

Through international collaboration, joint educational initiatives, scientific research, and stakeholder engagement, AI&Tech4Human seeks to bridge technological advancement with societal needs. We believe that innovation should not only be technically advanced, but also ethical, accessible, sustainable, and designed to create positive impact for individuals and communities.
            </p>

          </div>
        </div>
      </section>

      {/* Topic */}
      <section className="py-12">
        <div className="container max-w-4xl">
          <div className="flex flex-wrap gap-3 mb-8">
            <Badge className="px-4 py-1.5 text-sm">Applied Artificial Intelligence</Badge>
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">Business & Education</Badge>
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">Extended Reality</Badge>
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">Eye-Tracking</Badge>
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">Horizon Europe</Badge>
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">Erasmus+</Badge>
          </div>
        </div>
      </section>

      {/* Objectives */}
      <section className="py-16">
        <div className="container">
          <div className="mb-10">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Our Mission</p>
            <h2 className="font-serif text-3xl text-foreground">Scientific & Innovation Goals</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {objectives.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="glass-card rounded-xl p-6 hover-lift bracket-accent">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">0{i + 1}</p>
                    <h3 className="font-semibold text-foreground text-sm mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Universities */}
      <section className="py-16">
        <div className="container">
          <div className="mb-10">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Collaboration</p>
            <h2 className="font-serif text-3xl text-foreground">Partner Universities</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {universities.map((uni) => (
              <div key={uni.name} className="glass-card rounded-xl p-7 hover-lift">
                <div className="text-3xl mb-4">{uni.flag}</div>
                <h3 className="font-serif text-lg font-semibold text-foreground mb-1">{uni.name}</h3>
                <p className="text-xs text-primary font-medium mb-3 uppercase tracking-wide">{uni.country}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{uni.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ulysseus */}
      <section className="py-16">
        <div className="container max-w-3xl">
          <div className="glass-card rounded-2xl p-8 md:p-10 text-center">
            <Globe className="w-8 h-8 text-primary mx-auto mb-4" />
            <h2 className="font-serif text-2xl text-foreground mb-3">Part of the Ulysseus Alliance</h2>
            <p className="text-muted-foreground leading-relaxed">
              AI&Tech4Human operates within the Ulysseus European University Alliance, a consortium of higher education institutions committed to building a European university that is inclusive, innovative, and connected to society. By integrating expertise from multiple fields, our group contributes to the Ulysseus Innovation Hub goals.
            </p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
