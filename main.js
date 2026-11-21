const nav = document.querySelector("#site-nav");
const toggle = document.querySelector(".menu-toggle");

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

const watchButton = document.querySelector("#watch-process");
const lightbox = document.querySelector("#process-lightbox");
const processVideo = document.querySelector("#process-video");

function closeLightbox() {
  processVideo.pause();
  lightbox.close();
}

watchButton.addEventListener("click", () => {
  lightbox.showModal();
  processVideo.play().catch(() => {});
});

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

lightbox.addEventListener("close", () => {
  processVideo.pause();
});

lightbox.querySelector("[data-close-lightbox]").addEventListener("click", closeLightbox);
