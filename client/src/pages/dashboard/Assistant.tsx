import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { Sparkles, BookOpen, FileText, Trophy, Copy, RotateCcw } from "lucide-react";
import { Streamdown } from "streamdown";

function ResultCard({ content, onCopy, onReset }: { content: string; onCopy: () => void; onReset: () => void }) {
  return (
    <div className="glass-card rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">AI Response</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 bg-white/60 h-7 text-xs" onClick={onCopy}>
            <Copy className="w-3 h-3" />Copy
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs" onClick={onReset}>
            <RotateCcw className="w-3 h-3" />Reset
          </Button>
        </div>
      </div>
      <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed">
        <Streamdown>{content}</Streamdown>
      </div>
    </div>
  );
}

export default function Assistant() {
  // Journal suggestion state
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [journalResult, setJournalResult] = useState<any>(null);

  // Meeting summary state
  const [meetingNotes, setMeetingNotes] = useState("");
  const [meetingResult, setMeetingResult] = useState("");

  // Congress description state
  const [congressName, setCongressName] = useState("");
  const [congressTopic, setCongressTopic] = useState("");
  const [congressDetails, setCongressDetails] = useState("");
  const [congressResult, setCongressResult] = useState("");

  const journalMutation = trpc.ai.suggestJournals.useMutation({
    onSuccess: (data) => setJournalResult(data),
    onError: (e) => toast.error(e.message),
  });

  const meetingMutation = trpc.ai.summarizeMeeting.useMutation({
    onSuccess: (data) => setMeetingResult(data.summary),
    onError: (e) => toast.error(e.message),
  });

  const congressMutation = trpc.ai.draftCongressDescription.useMutation({
    onSuccess: (data) => setCongressResult(data.draft),
    onError: (e) => toast.error(e.message),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard.");
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">AI Research Assistant</h1>
            <p className="text-sm text-muted-foreground">Powered by AI to support your academic work</p>
          </div>
        </div>

        {/* Notice banner */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <span className="text-amber-500 text-lg leading-none mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-900">AI features require an OpenAI API key</p>
            <p className="text-xs text-amber-700 mt-1">
              The AI assistant is currently unavailable because no OpenAI API key has been configured on the server.
              Please contact the administrator to add the API key in the server environment settings.
            </p>
          </div>
        </div>

        <Tabs defaultValue="journals" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="journals" className="gap-1.5 text-xs">
              <BookOpen className="w-3.5 h-3.5" />Journal Suggestion
            </TabsTrigger>
            <TabsTrigger value="meeting" className="gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" />Meeting Summary
            </TabsTrigger>
            <TabsTrigger value="congress" className="gap-1.5 text-xs">
              <Trophy className="w-3.5 h-3.5" />Congress Draft
            </TabsTrigger>
          </TabsList>

          {/* Journal Suggestion */}
          <TabsContent value="journals" className="space-y-4">
            <div className="glass-card rounded-xl p-5 space-y-4">
              <div>
                <h2 className="font-serif font-semibold text-foreground mb-1">Suggest Relevant Journals</h2>
                <p className="text-sm text-muted-foreground">
                  Paste your paper's abstract and the assistant will suggest the most relevant journals for submission, including impact factor information and fit analysis.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Paper Abstract</Label>
                <Textarea
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  rows={6}
                  placeholder="Paste your abstract here..."
                  className="resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Keywords <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. machine learning, healthcare, NLP"
                />
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => journalMutation.mutate({ abstract, keywords: keywords || undefined })}
                disabled={!abstract.trim() || journalMutation.isPending}
              >
                <Sparkles className="w-4 h-4" />
                {journalMutation.isPending ? "Analyzing abstract..." : "Suggest Journals"}
              </Button>
            </div>
            {journalResult?.journals && (
              <div className="space-y-3">
                {journalResult.journals.map((j: any, i: number) => (
                  <div key={i} className="glass-card rounded-xl p-4 space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-serif font-semibold text-foreground text-sm">{j.name}</p>
                      {j.impactFactor && j.impactFactor !== "unknown" && (
                        <Badge variant="secondary" className="text-xs shrink-0">IF: {j.impactFactor}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{j.publisher}</p>
                    <p className="text-xs text-foreground/70 leading-relaxed">{j.justification}</p>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setJournalResult(null)}>
                  <RotateCcw className="w-3 h-3" />Reset
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Meeting Summary */}
          <TabsContent value="meeting" className="space-y-4">
            <div className="glass-card rounded-xl p-5 space-y-4">
              <div>
                <h2 className="font-serif font-semibold text-foreground mb-1">Summarize Meeting Notes</h2>
                <p className="text-sm text-muted-foreground">
                  Paste raw meeting notes, bullet points, or a transcript. The assistant will produce a structured summary with key decisions, action items, and next steps.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Meeting Notes</Label>
                <Textarea
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  rows={8}
                  placeholder="Paste your meeting notes, minutes, or transcript here..."
                  className="resize-none"
                />
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => meetingMutation.mutate({ notes: meetingNotes })}
                disabled={!meetingNotes.trim() || meetingMutation.isPending}
              >
                <Sparkles className="w-4 h-4" />
                {meetingMutation.isPending ? "Summarizing..." : "Generate Summary"}
              </Button>
            </div>
            {meetingResult && (
              <ResultCard
                content={meetingResult}
                onCopy={() => copyToClipboard(meetingResult)}
                onReset={() => setMeetingResult("")}
              />
            )}
          </TabsContent>

          {/* Congress Description */}
          <TabsContent value="congress" className="space-y-4">
            <div className="glass-card rounded-xl p-5 space-y-4">
              <div>
                <h2 className="font-serif font-semibold text-foreground mb-1">Draft Congress Description</h2>
                <p className="text-sm text-muted-foreground">
                  Provide basic information about a congress or conference call for papers. The assistant will draft a professional description or proposal text.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Congress Name</Label>
                <Input value={congressName} onChange={(e) => setCongressName(e.target.value)} placeholder="e.g. International Conference on AI & Society" />
              </div>
              <div className="space-y-1.5">
                <Label>Main Topic</Label>
                <Input value={congressTopic} onChange={(e) => setCongressTopic(e.target.value)} placeholder="e.g. Ethical AI, Human-Computer Interaction" />
              </div>
              <div className="space-y-1.5">
                <Label>Additional Details <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea
                  value={congressDetails}
                  onChange={(e) => setCongressDetails(e.target.value)}
                  rows={4}
                  placeholder="Dates, location, target audience, key themes..."
                  className="resize-none"
                />
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => congressMutation.mutate({ name: congressName, topic: congressTopic, details: congressDetails || undefined })}
                disabled={!congressName.trim() || !congressTopic.trim() || congressMutation.isPending}
              >
                <Sparkles className="w-4 h-4" />
                {congressMutation.isPending ? "Drafting..." : "Draft Description"}
              </Button>
            </div>
            {congressResult && (
              <ResultCard
                content={congressResult}
                onCopy={() => copyToClipboard(congressResult)}
                onReset={() => setCongressResult("")}
              />
            )}
          </TabsContent>
        </Tabs>

        <div className="glass-card rounded-xl p-4 flex items-start gap-3">
          <Badge variant="secondary" className="text-xs shrink-0 mt-0.5">Note</Badge>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The AI assistant uses a language model to generate suggestions. Always review and validate the output before using it in official submissions or documents. Journal impact factors and rankings should be verified against current databases.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
