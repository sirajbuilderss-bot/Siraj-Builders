import { useEffect, useState } from "react";
import ResourceManager from "../components/ResourceManager";
import { faqs } from "../../services/content";
import { Loading, Pill } from "../components/ui";

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
      description="Questions shown on /faq, grouped by category. The FAQ page's search and category filters read straight from this list."
      load={() => faqs.listQuestions({ activeOnly: false })}
      create={faqs.create}
      update={faqs.update}
      remove={faqs.remove}
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
          render: (row) => <div className="ad-cell-clamp">{row.answer}</div>,
        },
        {
          key: "is_active",
          label: "Live",
          render: (row) =>
            row.is_active ? <Pill tone="ok">Live</Pill> : <Pill tone="off">Hidden</Pill>,
        },
      ]}
      defaults={{
        category_id: categories[0]?.id || "",
        question: "",
        answer: "",
        is_active: true,
        sort_order: 0,
      }}
      fields={[
        {
          name: "category_id",
          label: "Category",
          type: "select",
          required: true,
          options: categories.map((row) => ({ value: row.id, label: row.label })),
        },
        { name: "sort_order", label: "Sort order", type: "number" },
        { name: "question", label: "Question", type: "textarea", rows: 2, required: true },
        { name: "answer", label: "Answer", type: "textarea", rows: 5, required: true, minLength: 20 },
        { name: "is_active", label: "Show on the website", type: "checkbox" },
      ]}
    />
  );
}
