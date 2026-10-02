import { useEffect, useState } from "react";
import ResourceManager from "../components/ResourceManager";
import { faqs } from "../../services/content";
import { Loading, Pill } from "../components/ui";
import { clearPublicCache } from "../../services/publicData";

const fresh = (fn) => async (...args) => {
  const result = await fn(...args);
  clearPublicCache();
  return result;
};

/**
 * FAQs belong to a category, so the category list has to be fetched before
 * the form can offer it as a dropdown. ResourceManager takes a static field
 * config, so the fetch happens here and the configured component is rendered
 * only once the options exist.
 */
export default function FaqsPage() {
  const [categories, setCategories] = useState(null);

  useEffect(() => {
    let cancelled = false;
    faqs
      .listCategories({ activeOnly: false })
      .then((rows) => {
        if (!cancelled) setCategories(rows);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (categories === null) return <Loading label="Loading categories…" />;

  const byId = categories.reduce((acc, row) => ({ ...acc, [row.id]: row.label }), {});

  return (
    <ResourceManager
      title="FAQs"
      singular="FAQ"
      entity="faqs"
      description="Questions shown on /faq, grouped by category. Questions marked “Needs answer” came from the project documentation as [TO CONFIRM] — write the real answer, then publish. Tick “Show on homepage” for the homepage FAQ preview."
      load={() => faqs.listQuestions({ activeOnly: false })}
      create={fresh(faqs.create)}
      update={fresh(faqs.update)}
      remove={fresh(faqs.remove)}
      reorder={fresh(faqs.reorder)}
      toggle={{ field: "is_active", on: "Publish", off: "Hide" }}
      filters={[
        { key: "live", label: "Live", test: (row) => row.is_active },
        { key: "needs", label: "Needs answer", test: (row) => !String(row.answer || "").trim() },
        { key: "home", label: "On homepage", test: (row) => row.show_on_home },
      ]}
      validate={(values) =>
        values.is_active && String(values.answer || "").trim().length < 20
          ? { answer: "A published question needs an answer of at least 20 characters." }
          : {}
      }
      labelOf={(row) => row.question}
      searchKeys={["question", "answer"]}
      columns={[
        {
          key: "question",
          label: "Question",
          render: (row) => <div className="ad-cell-strong">{row.question}</div>,
        },
        {
          key: "category_id",
          label: "Category",
          render: (row) => byId[row.category_id] || "—",
        },
        {
          key: "answer",
          label: "Answer",
          render: (row) =>
            String(row.answer || "").trim() ? (
              <div className="ad-cell-clamp">{row.answer}</div>
            ) : (
              <Pill tone="new">Needs answer</Pill>
            ),
        },
        {
          key: "is_active",
          label: "Live",
          render: (row) => (
            <>
              {row.is_active ? <Pill tone="ok">Live</Pill> : <Pill tone="off">Hidden</Pill>}
              {row.show_on_home ? <> <Pill tone="new">Home</Pill></> : null}
            </>
          ),
        },
      ]}
      defaults={{
        category_id: categories[0]?.id || "",
        question: "",
        answer: "",
        is_active: false,
        show_on_home: false,
      }}
      fields={[
        {
          name: "category_id",
          label: "Category",
          type: "select",
          required: true,
          options: categories.map((row) => ({ value: row.id, label: row.label })),
        },
        { name: "question", label: "Question", type: "textarea", rows: 2, required: true },
        {
          name: "answer",
          label: "Answer",
          type: "textarea",
          rows: 5,
          help: "Only confirmed information. A question can be saved without an answer but cannot be published.",
        },
        { name: "is_active", label: "Show on the website", type: "checkbox" },
        { name: "show_on_home", label: "Show on the homepage FAQ preview", type: "checkbox", help: "Up to four are shown, in this list's order." },
      ]}
    />
  );
}
