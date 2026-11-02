const nav = document.querySelector("#site-nav");
const toggle = document.querySelector(".menu-toggle");
const dialog = document.querySelector("#estimate");
const form = document.querySelector("#estimate-form");
const confirm = document.querySelector("#confirm");
const error = document.querySelector(".form-error");
const submitButton = form.querySelector("[type=submit]");
const defaultSubmitLabel = submitButton.textContent;
const requestKey = "cisneros-request";

function showForm() {
  form.hidden = false;
  confirm.hidden = true;
  error.hidden = true;
  submitButton.disabled = false;
  submitButton.textContent = defaultSubmitLabel;
}

function showConfirmation(details) {
  const email = confirm.querySelector(".confirm-email");
  const phone = confirm.querySelector(".confirm-phone");
  email.textContent = details.email || "your email";
  phone.textContent = details.phone || "the number you gave us";
  form.hidden = true;
  confirm.hidden = false;
  error.hidden = true;
  dialog.showModal();
}

toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(open));
});

nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }
});

document.querySelectorAll("[data-open-estimate]").forEach((button) => {
  button.addEventListener("click", () => {
    form.reset();
    showForm();
    dialog.showModal();
  });
});

document.querySelectorAll("[data-close-estimate]").forEach((button) => {
  button.addEventListener("click", () => {
    dialog.close();
  });
});

form.addEventListener("submit", (event) => {
  if (String(new FormData(form).get("_honey") || "").trim()) {
    event.preventDefault();
    return;
  }

  const data = new FormData(form);
  sessionStorage.setItem(
    requestKey,
    JSON.stringify({
      email: data.get("email"),
      phone: data.get("phone"),
    }),
  );
  submitButton.disabled = true;
  submitButton.textContent = "Sending…";
});

const params = new URLSearchParams(window.location.search);
if (params.get("request") === "sent") {
  let details = {};
  try {
    details = JSON.parse(sessionStorage.getItem(requestKey) || "{}");
  } catch {
    details = {};
  }
  sessionStorage.removeItem(requestKey);
  showConfirmation(details);
  params.delete("request");
  const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", next);
}
