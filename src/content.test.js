/**
 * DOCUMENTED CONTENT GUARDS
 * The documentation forbids publishing anything marked [TO CONFIRM] and
 * forbids invented facts. These checks fail the test run if the generated
 * default content (src/content/defaults.json) ever breaks those rules.
 */
import DEFAULTS from "./content/defaults.json";
import { toEmbed } from "./lib/video";

const VISIBLE = ["eyebrow", "title", "subtitle", "body", "cta_label"];
const enabledSections = Object.entries(DEFAULTS.pages).flatMap(([path, page]) =>
  page.sections.filter((s) => s.enabled).map((s) => ({ path, ...s }))
);

describe("documented content", () => {
  test("no enabled section shows a [TO CONFIRM] placeholder", () => {
    const offenders = enabledSections.filter((s) =>
      [...VISIBLE.map((key) => s[key]), ...s.items.flatMap((i) => [i.title, i.body])].some((text) =>
        /to confirm|lorem ipsum|\[location\]/i.test(String(text || ""))
      )
    );
    expect(offenders.map((s) => `${s.path}#${s.key}`)).toEqual([]);
  });

  test("no superlative marketing claims", () => {
    const text = JSON.stringify(enabledSections);
    expect(text).not.toMatch(/\b(#1|number one|world'?s best|unmatched|unbeatable)\b/i);
  });

  test("every unanswered FAQ is unpublished", () => {
    const bad = DEFAULTS.faqs.filter((f) => f.is_active && !f.answer.trim());
    expect(bad).toEqual([]);
  });

  test("the documentation's 20 FAQs are all present", () => {
    expect(DEFAULTS.faqs).toHaveLength(20);
  });

  test("unconfirmed services ship unpublished", () => {
    for (const path of ["/design-architecture", "/grey-structure", "/turnkey-construction", "/project-management"]) {
      expect(DEFAULTS.pages[path].published).toBe(false);
    }
  });

  test("every page has a hero and SEO title", () => {
    for (const [path, page] of Object.entries(DEFAULTS.pages)) {
      expect([path, page.sections[0].type]).toEqual([path, "hero"]);
      expect(page.seo.title.length).toBeGreaterThan(10);
    }
  });
});

describe("video links", () => {
  test.each([
    ["https://www.youtube.com/watch?v=abc123XYZ_-", "iframe"],
    ["https://youtu.be/abc123XYZ_-", "iframe"],
    ["https://www.youtube.com/shorts/abc123XYZ_-", "iframe"],
    ["https://vimeo.com/123456789", "iframe"],
    ["https://drive.google.com/file/d/FILEID/view", "iframe"],
    ["https://example.supabase.co/storage/v1/object/public/site-media/a.mp4", "file"],
  ])("%s plays as %s", (url, kind) => {
    expect(toEmbed(url)?.kind).toBe(kind);
  });

  test("an unknown link is not embedded", () => {
    expect(toEmbed("https://example.com/page")).toBeNull();
  });
});
