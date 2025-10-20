// GSAP 플러그인
gsap.registerPlugin(ScrollTrigger);

// ----------------------------------
// 1) Experiences 섹션 고정 + 가로 진행감
// ----------------------------------
(function setupExperiencePin() {
  const sec = document.querySelector(".experience-sec");
  const rail = document.querySelector(".horizontal-timeline");
  if (!sec || !rail) return;

  ScrollTrigger.create({
    trigger: sec,
    pin: true,
    scrub: 1,
    start: "top top",
    end: () => "+=" + rail.scrollWidth, // 타임라인 전체 너비만큼 추가 스크롤
  });
})();

// ----------------------------------
// 2) Lenis 스무스 스크롤
// ----------------------------------
try {
  history.scrollRestoration = "manual";
  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
} catch (e) {
  // Lenis 미탑재 시 무시
}

// ----------------------------------
// 3) 커스텀 커서
// ----------------------------------
document.addEventListener("mousemove", (e) => {
  const cur = document.querySelector(".custom-cursor");
  if (!cur) return;
  cur.style.top = `${e.clientY}px`;
  cur.style.left = `${e.clientX}px`;
});

// ----------------------------------
// 4) Lottie (존재할 때만)
// ----------------------------------
(function setupLottie() {
  const el = document.getElementById("lottie");
  if (!el || !window.lottie) return;
  window.lottie.loadAnimation({
    container: el,
    renderer: "svg",
    loop: true,
    autoplay: true,
    path: "./assets/video/lottie_01.json",
  });
})();

// ----------------------------------
// 5) SplitType (있으면 글자 애니메이션, 없으면 폴백)
// ----------------------------------
const hasSplitType = !!window.SplitType;
if (hasSplitType) {
  new window.SplitType(".intro-sec .intro-inner .intro-tx", { types: "words, chars" });
}

// ----------------------------------
// 6) 상단 링크(Projects/Contact) 스크롤
// ----------------------------------
function pickFirst(selArr) {
  for (const s of selArr) {
    const el = document.querySelector(s);
    if (el) return el;
  }
  return null;
}

const toProjects = pickFirst([
  "a.project-link",      // a 태그에 클래스가 붙은 경우
  ".project-link a",     // li에 클래스가 있고 그 안에 a가 있는 경우
  ".project-link"        // 임의의 요소
]);
const toContact = pickFirst([
  ".header-quick-block .contact-link:not(.mov) a",
  ".header-contact-block .contact-link",
  ".contact-link"
]);

function scrollToSel(sel) {
  const target = document.querySelector(sel);
  if (!target) return;
  gsap.to(window, { duration: 1, scrollTo: { y: target, autoKill: true } });
}
if (toProjects) toProjects.addEventListener("click", (e) => {
  e.preventDefault();
  scrollToSel(".projects-sec");
});
if (toContact) toContact.addEventListener("click", (e) => {
  e.preventDefault();
  scrollToSel(".contact-address-block");
});

// ----------------------------------
// 7) 스크롤 방향에 따른 헤더 표시/숨김
// ----------------------------------
(function headerHideShow() {
  const header = document.querySelector(".header");
  if (!header) return;
  let lastY = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (y > lastY) gsap.to(header, { autoAlpha: 0 });
    else gsap.to(header, { autoAlpha: 1 });
    lastY = y;
  });
})();

// ----------------------------------
// 8) Contact 타이틀 페이드인
// ----------------------------------
gsap.set(".contact-tit", { autoAlpha: 0 });
gsap.to(".contact-tit", {
  autoAlpha: 1,
  duration: 1,
  scrollTrigger: {
    trigger: ".contact-intro-block",
    start: "0% 10%",
    end: "0% 10%",
    scrub: 1,
  },
});

// ----------------------------------
// 9) 인트로 텍스트 등장
// ----------------------------------
const introBase = gsap.timeline();
introBase.fromTo(".intro-tx", { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, delay: 0.3 });

if (hasSplitType) {
  // 글자 단위 애니메이션
  gsap.to(".intro-sec .intro-inner .intro-tx .char", {
    delay: 0.2,
    y: 0,
    stagger: { from: "random", each: 0.01 },
  });
}

// ----------------------------------
// 10) PC/모바일 분기
// ----------------------------------
const mm = gsap.matchMedia();

// PC
mm.add("(min-width: 769px)", () => {
  // 모바일용 contact 링크 숨기고 데스크톱용 노출
  const mobileContact = document.querySelector(".contact-link.mov");
  const deskContact = pickFirst([
    ".header-quick-block .contact-link:not(.mov) a",
    ".header-contact-block .contact-link",
  ]);
  if (deskContact) deskContact.classList.remove("hidden");
  if (mobileContact) mobileContact.classList.add("hidden");

  // Lottie 블록 살짝 이동
  if (document.querySelector(".lottie-block")) {
    gsap.to(".lottie-block", {
      x: 200,
      scrollTrigger: { trigger: ".about-sec", start: "top bottom", end: "bottom top", scrub: 1 },
    });
  }

  // (옵션) Projects 가로 스크롤 핀 — 리스트가 충분히 넓을 때만
  const pl = document.querySelector(".projects-list");
  if (pl && pl.scrollWidth > pl.clientWidth * 1.1) {
    gsap.to(pl, {
      xPercent: -100,
      ease: "none",
      scrollTrigger: {
        trigger: ".projects-sec",
        pin: true,
        scrub: 1,
        start: "top top",
        end: () => "+=" + pl.scrollWidth,
      },
    });
  }

  // Footer 마키 in/out
  if (document.querySelector(".footer-marquee-block")) {
    ScrollTrigger.create({
      trigger: ".footer",
      start: "top bottom",
      end: "bottom bottom",
      onEnter: () => gsap.to(".footer-marquee-block", { y: 0 }),
      onLeaveBack: () => gsap.to(".footer-marquee-block", { y: 100 }),
    });
  }
});

// 모바일
mm.add("(max-width: 768px)", () => {
  const mob = document.querySelector(".contact-link.mov");
  if (mob) mob.classList.remove("hidden");
});

// ----------------------------------
// 11) 경험 카드 개별 페이드
// ----------------------------------
gsap.from(".experience-item, .timeline-item", {
  scrollTrigger: { trigger: ".experience-sec", start: "top 80%", end: "top 20%" },
  y: 50,
  opacity: 0,
  stagger: 0.2,
  duration: 1,
});