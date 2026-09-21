/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: { children: unknown }) => children,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    profiles: {
      internalList: {
        useQuery: () => ({
          data: [{
            userId: 7,
            name: "Ada Lovelace",
            email: "ada@example.org",
            role: "member" as const,
            photoUrl: null,
            bio: "Researcher in human-centred technology.",
            interests: "AI governance and digital ethics",
            university: "University of Seville",
            department: "Computer Science",
            researchArea: "Human-centred AI",
            orcid: "0000-0001-2345-6789",
            googleScholar: "https://scholar.example.org/ada",
            researchGate: null,
            scopus: null,
            webOfScience: null,
            linkedin: null,
            personalWeb: null,
            cvPdfUrl: null,
            keywords: "AI, Ethics, Governance",
            languages: "English, Spanish",
            availableToCollaborate: true,
          }],
          isLoading: false,
        }),
      },
    },
  },
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/dashboard/members", mocks.navigate],
}));

import InternalMembers from "../client/src/pages/dashboard/InternalMembers";

describe("internal member directory", () => {
  beforeEach(() => {
    cleanup();
    mocks.navigate.mockReset();
  });

  it("shows the full private profile and starts a message from its card", () => {
    render(createElement(InternalMembers));

    fireEvent.click(screen.getByRole("button", { name: /view profile/i }));
    expect(screen.getByText("Contact and affiliation")).toBeTruthy();
    expect(screen.getByText("Research interests")).toBeTruthy();
    expect(screen.getByText("AI governance and digital ethics")).toBeTruthy();
    expect(screen.getAllByText("ada@example.org")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Send message to Ada Lovelace" }));
    expect(mocks.navigate).toHaveBeenCalledWith("/dashboard/messages?recipient=7");
  });
});
