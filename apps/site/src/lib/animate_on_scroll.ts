export function initScrollAnimation(
  selector: string = ".animate-on-scroll",
  animationClasses: string[] = ["visible"],
) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(...animationClasses);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );

  document.querySelectorAll(selector).forEach((el) => observer.observe(el));
}
