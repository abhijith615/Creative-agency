/**
 * Front-end-only contact form: composes a mailto with the entered details so
 * the visitor's mail client opens pre-filled, and gives quick submit feedback.
 */
export function initContactForm() {
  const form = document.getElementById("contact-form") as HTMLFormElement | null;
  if (!form) return;

  const btn = form.querySelector<HTMLButtonElement>(".contact__submit");
  const btnLabel = btn?.querySelector("span");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const name = String(data.get("name") || "");
    const email = String(data.get("email") || "");
    const service = String(data.get("service") || "");
    const message = String(data.get("message") || "");

    const subject = encodeURIComponent(`New project enquiry — ${service}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nService: ${service}\n\n${message}`
    );
    window.location.href = `mailto:hello@noir.studio?subject=${subject}&body=${body}`;

    if (btnLabel) {
      const original = btnLabel.textContent;
      btnLabel.textContent = "Opening mail…";
      window.setTimeout(() => {
        if (btnLabel) btnLabel.textContent = original;
      }, 2600);
    }
  });
}
