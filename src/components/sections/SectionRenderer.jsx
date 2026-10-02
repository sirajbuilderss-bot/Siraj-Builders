import { Fragment } from "react";
import HeroSlider from "../home/HeroSlider";
import {
  ContentBlock,
  CtaBlock,
  FeaturesBlock,
  GalleryBlock,
  HeroBlock,
  IntroBlock,
  ProcessBlock,
  TrustBlock,
  VideoBlock,
} from "./blocks";
import {
  ContactBlock,
  FaqBlock,
  ProjectsBlock,
  ServicesBlock,
  StatsBlock,
  TeamBlock,
  TestimonialsBlock,
} from "./liveBlocks";
import "../../styles/sections.css";

const BLOCKS = {
  hero: HeroBlock,
  intro: IntroBlock,
  content: ContentBlock,
  custom: ContentBlock,
  features: FeaturesBlock,
  trust: TrustBlock,
  process: ProcessBlock,
  cta: CtaBlock,
  gallery: GalleryBlock,
  services: ServicesBlock,
  projects: ProjectsBlock,
  testimonials: TestimonialsBlock,
  faq: FaqBlock,
  stats: StatsBlock,
  team: TeamBlock,
  contact: ContactBlock,
  video: VideoBlock,
};

/**
 * Renders a page from its ordered sections.
 *
 * `slots` lets a page with bespoke functionality (the consultation form)
 * place a component after a named section: { hero: <Form /> }. A slot whose
 * section the admin has hidden still renders — at the top — so hiding a
 * heading can never remove a form.
 */
export default function SectionRenderer({ sections, path, pageLabel, slots = {} }) {
  const keys = new Set(sections.map((s) => s.key));
  const orphanSlots = Object.entries(slots).filter(([key]) => !keys.has(key));

  return (
    <>
      {orphanSlots.map(([key, node]) => (
        <Fragment key={`slot-${key}`}>{node}</Fragment>
      ))}
      {sections.map((section, index) => {
        const isHomeHero =
          section.type === "hero" &&
          (section.settings?.source === "hero_slides" || (path === "/" && section.key === "hero"));
        const Block = isHomeHero ? null : BLOCKS[section.type] || ContentBlock;
        return (
          <Fragment key={section.id || `${section.key}-${index}`}>
            {isHomeHero ? (
              <HeroSlider />
            ) : (
              <Block section={section} path={path} pageLabel={pageLabel} headingTag={index === 0 ? "h1" : "h2"} />
            )}
            {slots[section.key] || null}
          </Fragment>
        );
      })}
    </>
  );
}
