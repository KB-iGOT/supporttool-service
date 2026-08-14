import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfigFormBuilder } from "./ConfigFormBuilder";

const CONFIG = {
  enableLazyLoading: true,
  order: ["banner", "spotlight"],
  homeSection: [
    { header: "Banner", sectionKey: "banner", displayType: "banner", addToAccordian: false },
    { header: "Trending", sectionKey: "trendingCourses", displayType: "cards", addToAccordian: true },
  ],
};

/** Wraps the builder in state, the way the edit screen does. */
const Harness: React.FC<{ initial?: any; onValue?: (v: any) => void }> = ({ initial = CONFIG, onValue }) => {
  const [value, setValue] = useState<any>(initial);
  return (
    <ConfigFormBuilder
      value={value}
      onChange={(next) => {
        setValue(next);
        onValue?.(next);
      }}
    />
  );
};

/** Reveals the add/delete controls, which are hidden by default. */
const enableStructureMode = () =>
  fireEvent.click(screen.getByRole("checkbox", { name: /edit structure/i }));

describe("ConfigFormBuilder", () => {
  it("shows top-level sections collapsed, with primitives inline", () => {
    render(<Harness />);
    // Top-level boolean is directly editable.
    expect(screen.getByText("Enable Lazy Loading")).toBeInTheDocument();
    // Sections are listed but their contents are not mounted yet.
    expect(screen.getByText("Home Section")).toBeInTheDocument();
    expect(screen.queryByText("1. Banner")).not.toBeInTheDocument();
  });

  it("hides destructive controls until structure editing is turned on", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("Home Section"));

    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add field/i })).not.toBeInTheDocument();
    // Duplicating and reordering stay available — they are how items get added safely.
    expect(screen.getAllByRole("button", { name: /duplicate/i }).length).toBeGreaterThan(0);

    enableStructureMode();
    expect(screen.getAllByRole("button", { name: /remove/i }).length).toBeGreaterThan(0);
  });

  it("mounts children only once a section is opened", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("Home Section"));
    expect(screen.getByText("1. Banner")).toBeInTheDocument();
    expect(screen.getByText("2. Trending")).toBeInTheDocument();
  });

  it("edits a boolean without disturbing anything else", () => {
    let latest: any = null;
    render(<Harness onValue={(v) => (latest = v)} />);

    fireEvent.click(screen.getByRole("checkbox", { name: /enable lazy loading/i }));

    expect(latest.enableLazyLoading).toBe(false);
    expect(Object.keys(latest)).toEqual(Object.keys(CONFIG));
    expect(latest.homeSection).toEqual(CONFIG.homeSection);
    expect(latest.order).toEqual(CONFIG.order);
  });

  it("duplicates a list item into a structurally identical sibling", () => {
    let latest: any = null;
    render(<Harness onValue={(v) => (latest = v)} />);

    fireEvent.click(screen.getByText("Home Section"));
    // One set of item controls per list item; [0] belongs to "1. Banner".
    fireEvent.click(screen.getAllByRole("button", { name: /duplicate/i })[0]);

    expect(latest.homeSection).toHaveLength(3);
    expect(latest.homeSection[1]).toEqual(CONFIG.homeSection[0]);
    expect(Object.keys(latest.homeSection[1])).toEqual(Object.keys(CONFIG.homeSection[0]));
  });

  it("reorders a list and keeps every other branch intact", () => {
    let latest: any = null;
    render(<Harness onValue={(v) => (latest = v)} />);

    fireEvent.click(screen.getByText("Home Section"));
    // [1] is the second item's control; the first item's "Move up" is disabled.
    fireEvent.click(screen.getAllByRole("button", { name: /move up/i })[1]);

    expect(latest.homeSection.map((s: any) => s.sectionKey)).toEqual(["trendingCourses", "banner"]);
    expect(latest.enableLazyLoading).toBe(true);
  });

  it("renders one property per row, with the key beside its value", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("Home Section"));
    fireEvent.click(screen.getByText("1. Banner"));

    // Each key appears once as a row label...
    expect(screen.getByText("Section Key")).toBeInTheDocument();
    expect(screen.getByText("Display Type")).toBeInTheDocument();
    // ...and its control is reachable by that name.
    expect(screen.getByRole("textbox", { name: /display type/i })).toHaveValue("banner");
    expect(screen.getByRole("checkbox", { name: /add to accordian/i })).not.toBeChecked();
  });

  it("adds a list of text values and opens it straight away", async () => {
    let latest: any = null;
    render(<Harness initial={{ existing: true }} onValue={(v) => (latest = v)} />);
    enableStructureMode();

    fireEvent.click(screen.getByRole("button", { name: /add top-level field/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /field name/i }), {
      target: { value: "roles" },
    });
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /type/i }));
    fireEvent.click(screen.getByRole("option", { name: /list of text values/i }));
    fireEvent.click(screen.getByRole("button", { name: /add field/i }));

    // A text list, not a list of objects, and it starts with one editable entry.
    expect(latest.roles).toEqual([""]);
    // Auto-expanded, so the new entry is visible rather than hidden in a collapsed row.
    // findBy waits out the dialog's closing transition, which keeps the page aria-hidden.
    expect(await screen.findByRole("button", { name: /add value/i })).toBeInTheDocument();
  });

  it("renames a field key on blur, keeping its position", () => {
    let latest: any = null;
    render(<Harness initial={{ first: "a", second: "b", third: "c" }} onValue={(v) => (latest = v)} />);
    enableStructureMode();

    const input = screen.getByRole("textbox", { name: /field name for second/i });
    fireEvent.change(input, { target: { value: "middle" } });
    fireEvent.blur(input);

    expect(Object.keys(latest)).toEqual(["first", "middle", "third"]);
    expect(latest.middle).toBe("b");
  });

  it("does not commit a rename while it is still being typed", () => {
    let commits = 0;
    render(
      <Harness initial={{ alpha: "a", beta: "b" }} onValue={() => { commits += 1; }} />
    );
    enableStructureMode();

    const input = screen.getByRole("textbox", { name: /field name for beta/i });
    // Typing character by character must not rewrite the document each time — that
    // would change the node's React key and drop focus mid-word.
    fireEvent.change(input, { target: { value: "b2" } });
    fireEvent.change(input, { target: { value: "b2c" } });
    fireEvent.change(input, { target: { value: "b2cd" } });
    expect(commits).toBe(0);
    expect(input).toHaveValue("b2cd");

    fireEvent.blur(input);
    expect(commits).toBe(1);
  });

  it("rejects a rename that collides with a sibling", () => {
    let latest: any = null;
    render(<Harness initial={{ alpha: "a", beta: "b" }} onValue={(v) => (latest = v)} />);
    enableStructureMode();

    const input = screen.getByRole("textbox", { name: /field name for beta/i });
    fireEvent.change(input, { target: { value: "alpha" } });
    expect(screen.getByText(/already used here/i)).toBeInTheDocument();

    fireEvent.blur(input);
    expect(latest).toBeNull();
    expect(input).toHaveValue("beta");
  });

  it("renames a parent section key", () => {
    let latest: any = null;
    render(<Harness onValue={(v) => (latest = v)} />);
    enableStructureMode();

    const input = screen.getByRole("textbox", { name: /section name for homeSection/i });
    fireEvent.change(input, { target: { value: "sections" } });
    fireEvent.blur(input);

    expect(Object.keys(latest)).toEqual(["enableLazyLoading", "order", "sections"]);
    expect(latest.sections).toEqual(CONFIG.homeSection);
  });

  it("renames a nested section key", () => {
    let latest: any = null;
    render(
      <Harness
        initial={{ apiConfig: { otpV4Verify: { url: "/otp/v4", enabled: true } } }}
        onValue={(v) => (latest = v)}
      />
    );
    enableStructureMode();
    fireEvent.click(screen.getByRole("button", { name: /expand api config/i }));

    const input = screen.getByRole("textbox", { name: /section name for otpV4Verify/i });
    fireEvent.change(input, { target: { value: "otpVerify" } });
    fireEvent.blur(input);

    expect(Object.keys(latest.apiConfig)).toEqual(["otpVerify"]);
    expect(latest.apiConfig.otpVerify).toEqual({ url: "/otp/v4", enabled: true });
  });

  it("filters to matching fields and opens the tree down to them", async () => {
    render(<Harness />);
    // Everything starts collapsed.
    expect(screen.queryByText("2. Trending")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/search fields/i), {
      target: { value: "trending" },
    });

    // The matching item is revealed without anyone expanding a section.
    expect(await screen.findByText("2. Trending")).toBeInTheDocument();
    expect(screen.getByText("Section Key")).toBeInTheDocument();
    // Non-matching siblings and unrelated top-level fields are filtered out.
    expect(screen.queryByText("1. Banner")).not.toBeInTheDocument();
    expect(screen.queryByText("Enable Lazy Loading")).not.toBeInTheDocument();
  });

  it("reports when nothing matches, and restores the tree when cleared", async () => {
    render(<Harness />);
    const box = screen.getByPlaceholderText(/search fields/i);

    fireEvent.change(box, { target: { value: "zzzznope" } });
    expect(await screen.findByText(/no fields match/i)).toBeInTheDocument();

    fireEvent.change(box, { target: { value: "" } });
    expect(await screen.findByText("Enable Lazy Loading")).toBeInTheDocument();
    expect(screen.getByText("Home Section")).toBeInTheDocument();
  });

  it("falls back to a notice when the draft is not an object", () => {
    render(<ConfigFormBuilder value={'{ "broken": ' as any} onChange={() => {}} />);
    expect(screen.getByText(/not valid JSON/i)).toBeInTheDocument();
  });
});
