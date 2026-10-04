import { useSiteData } from "../../context/SiteDataContext";

export default function FloatingWhatsApp() {
  const { whatsappHref } = useSiteData();
  if (!whatsappHref) return null;

  return (
    <a
      className="floating-whatsapp"
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Siraj Builders on WhatsApp"
      title="Chat with us on WhatsApp"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path d="M16 3.2A12.4 12.4 0 0 0 5.4 22.1L3.8 28l6.1-1.6A12.4 12.4 0 1 0 16 3.2Zm0 22.7a10.2 10.2 0 0 1-5.2-1.4l-.4-.2-3.6.9 1-3.5-.3-.4A10.2 10.2 0 1 1 16 25.9Zm5.6-7.6c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-.9 1.2-.3.2-.6.1a8.3 8.3 0 0 1-2.5-1.5 9.1 9.1 0 0 1-1.7-2.1c-.2-.3 0-.5.2-.6l.5-.6.3-.5a.6.6 0 0 0 0-.5c-.1-.2-.7-1.7-1-2.3-.2-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.8 3.8 0 0 0-1.2 2.8 6.5 6.5 0 0 0 1.4 3.5 14.8 14.8 0 0 0 5.7 5.1c.8.3 1.3.5 1.8.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2.1-1.4s.3-1.3.2-1.4-.3-.3-.6-.5Z" />
      </svg>
      <span className="sr-only">Chat with us on WhatsApp</span>
    </a>
  );
}
