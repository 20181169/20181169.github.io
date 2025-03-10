// GSAP 플러그인 등록
gsap.registerPlugin(ScrollTrigger);

// ----------------------------------
// 1. Experiences 가로 타임라인 스크롤 구현
// ----------------------------------
ScrollTrigger.create({
  trigger: ".experience-sec",
  pin: true, // 섹션을 고정하여 스크롤 시 화면에 유지
  scrub: 1,  // 스크롤에 따른 자연스러운 애니메이션
  start: "top top", // 섹션이 뷰포트 상단에 닿을 때 시작
  // 타임라인 전체 너비만큼 추가 스크롤
  end: () => "+=" + document.querySelector(".horizontal-timeline").scrollWidth,
});

gsap.to(".horizontal-timeline", {
  x: "-100%",
  ease: "none",
  scrollTrigger: {
    trigger: ".experience-sec",
    start: "top top",
    end: "bottom top",
    scrub: 0.5  // 기존보다 낮은 값으로 설정하면 스크롤에 더 민감하게 반응해 애니메이션이 빠르게 진행됩니다.
  }
});

// ----------------------------------
// 2. Lenis 스크롤 및 기본 설정
// ----------------------------------

// 브라우저 새로고침 시 스크롤 위치 초기화
history.scrollRestoration = "manual";

// Lenis 스크롤 스무스 설정
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 900);
});
gsap.ticker.lagSmoothing(0);

// ----------------------------------
// 3. 커스텀 커서
// ----------------------------------
const cursor = document.querySelector(".custom-cursor");
document.addEventListener("mousemove", (e) => {
  cursor.style.top = `${e.clientY}px`;
  cursor.style.left = `${e.clientX}px`;
});

// ----------------------------------
// 4. Lottie 애니메이션
// ----------------------------------
lottie.loadAnimation({
  container: document.getElementById("lottie"),
  renderer: "svg",
  loop: true,
  autoplay: true,
  path: "./assets/video/lottie_01.json",
});

// ----------------------------------
// 5. 텍스트 분리 (SplitType)
// ----------------------------------
const splitText = new SplitType('[data-text="split"]', { types: "chars" });

// ----------------------------------
// 6. 상단 네비게이션 링크 (Projects, Contact)
// ----------------------------------
const toProjects = document.querySelector(".project-link");
const toContact = document.querySelector(".contact-link");

function projectLink() {
  gsap.to(window, {
    duration: 1,
    scrollTo: { y: ".projects-sec" },
  });
}

function contactLink() {
  gsap.to(window, {
    duration: 1,
    scrollTo: { y: ".contact-address-block" },
  });
}

toProjects.addEventListener("click", projectLink);
toContact.addEventListener("click", contactLink);

// ----------------------------------
// 7. 스크롤 시 Header 숨기기/보이기
// ----------------------------------
let lastScrollY = window.scrollY;
const header = document.querySelector(".header");
window.addEventListener("scroll", function () {
  const currentScrollY = window.scrollY;
  if (currentScrollY > lastScrollY) {
    // 스크롤 내릴 때 헤더 숨김
    gsap.to(header, { y: "-100%", duration: 1 });
  } else {
    // 스크롤 올릴 때 헤더 표시
    gsap.to(header, { y: "0%", duration: 1 });
  }
  lastScrollY = currentScrollY;
});

// ----------------------------------
// 8. Contact 섹션 진입 시 Contact 텍스트 페이드인
// ----------------------------------
gsap.set(".contact-tit", { autoAlpha: 0 });
const contactTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: ".contact-intro-block",
    start: "0% 10%",
    end: "0% 10%",
    scrub: 1,
  },
});
contactTimeline.to(".contact-tit", {
  autoAlpha: 1,
  duration: 0.5,
});

// ----------------------------------
// 9. Footer marquee 애니메이션 (위로 슬라이드)
// ----------------------------------
gsap.set(".footer-marquee-block", { y: 100 });
const marquee = gsap.to(".footer-marquee-block", {
  scrollTrigger: {
    trigger: ".contact-address-block",
    start: "90% 100%",
    end: "100% 100%",
    scrub: 1,
    onEnter: function () {
      gsap.to(".footer-marquee-block", { y: 0 });
    },
    onLeaveBack: function () {
      gsap.to(".footer-marquee-block", { y: 100 });
    },
  },
});

// ----------------------------------
// 10. 반응형 처리 (gsap.matchMedia)
// ----------------------------------
let mm = gsap.matchMedia();

// PC 버전
mm.add("(min-width: 769px)", function () {
  const toContact = document.querySelector(".contact-link.mov");
  const toContactSec = document.querySelector(".contact-link:nth-child(2)");

  // 상단 네비 링크 (PC 전용)
  toContactSec.classList.remove("hidden");
  toContact.classList.add("hidden");
  function contactLink() {
    gsap.to(window, {
      duration: 1,
      scrollTo: { y: ".contact-address-block" },
    });
  }
  toContactSec.addEventListener("click", contactLink);

  // 사이드 프로젝트 섹션 진입 시 배경색 전환
  ScrollTrigger.create({
    trigger: ".sidepj-sec",
    start: "0% 30%",
    end: "100% 100%",
    toggleClass: {
      targets: "body",
      className: "begie",
    },
  });

  // 인트로 텍스트 글자별 애니메이션
  gsap.to(".intro-sec .intro-inner .intro-tx .char", {
    delay: 0.2,
    y: 0,
    stagger: {
      from: "random",
      each: 0.01,
    },
  });

  // 인트로 이미지 어둡게 처리
  gsap.to(".intro-sec", {
    scrollTrigger: {
      trigger: ".intro-sec",
      start: "0% 0%",
      end: "100% 0%",
      scrub: 0,
    },
    filter: "brightness(0)",
  });

  // 인트로 텍스트 및 헤더 초기 등장 애니메이션
  const intro = gsap.timeline();
  intro.to(".intro-tx", {
    x: 0,
    duration: 0.4,
    autoAlpha: 1,
    delay: 0.5,
  });
  intro.from(".header", { autoAlpha: 0 });

  // about 섹션: Lottie 이미지 이동 애니메이션
  const lottie01 = gsap.to(".lottie-block", {
    scrollTrigger: {
      trigger: ".about-sec",
      start: "0% 0%",
      end: "100% 100%",
      scrub: 1,
    },
    x: 200,
  });

  // 메인 프로젝트 섹션: 가로 스크롤 애니메이션
  const projects = gsap.to(".projects-list", {
    scrollTrigger: {
      trigger: ".projects-sec",
      start: "0% 0%",
      end: () => `+=${window.innerWidth * 1.5}`,
      scrub: 1,
      invalidateOnRefresh: true,
    },
    xPercent: -100,
    x: () => -(window.innerWidth - 65) * 0.25,
  });

  // 사이드 프로젝트 섹션 진입 시 하단 오버레이 및 커서 변경
  const sidepj = gsap.timeline({
    scrollTrigger: {
      trigger: ".sidepj-sec",
      start: "0% 0%",
      end: "100% 100%",
      scrub: 1,
      onEnter: function () {
        gsap.to(".bottom-overlay", { autoAlpha: 0 });
        document.querySelector(".custom-cursor").classList.add("white");
      },
      onLeaveBack: function () {
        gsap.to(".bottom-overlay", { autoAlpha: 1 });
        document.querySelector(".custom-cursor").classList.remove("white");
      },
    },
  });
});

// 모바일 버전
mm.add("(max-width: 768px)", function () {
  const toContact = document.querySelector(".contact-link.mov");
  toContact.classList.remove("hidden");

  // 인트로 텍스트 글자별 애니메이션 (모바일)
  gsap.to(".intro-sec .intro-inner .intro-tx .char", {
    delay: 0.2,
    y: 0,
    stagger: {
      from: "random",
      each: 0.01,
    },
  });

  // 모바일: 인트로 텍스트 상단으로 이동 애니메이션
  const introtx = gsap.to(".intro-tx", {
    scrollTrigger: {
      trigger: ".intro-sec",
      start: "50% 50%",
      end: "100% 50%",
      scrub: 1,
    },
    y: -100,
  });
});

// ----------------------------------
// 11. Experiences 섹션 개별 애니메이션 (경험 항목 페이드인)
// ----------------------------------
gsap.from(".experience-item", {
  scrollTrigger: {
    trigger: ".experience-sec",
    start: "top 80%",
    end: "top 20%",
    scrub: false,
  },
  y: 50,
  opacity: 0,
  stagger: 0.2,
  duration: 1,
});