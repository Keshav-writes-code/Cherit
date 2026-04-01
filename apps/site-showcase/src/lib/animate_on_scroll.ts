// @unocss-include
export function init_scroll_animation({
  selector = ".animate-on-scroll",
  animation_classes = ["visible"],
}: {
  selector?: string;
  animation_classes?: string[];
}) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(...animation_classes);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );

  document.querySelectorAll(selector).forEach((el) => observer.observe(el));
}
