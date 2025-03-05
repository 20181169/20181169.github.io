history.scrollRestoration = "manual"
//lenis 스크롤 스무스
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 900); 
});
gsap.ticker.lagSmoothing(0);

// 마우스 커스텀 커서
const cursor = document.querySelector('.custom-cursor');
document.addEventListener('mousemove', (e) => {
    cursor.style.top = `${e.clientY}px`;
    cursor.style.left = `${e.clientX}px`;
});

// lottie
lottie.loadAnimation({
    container: document.getElementById('lottie'),
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: './assets/video/lottie_01.json'
});

//text분리 함수
const splitText = new SplitType('[data-text="split"]', { types: 'chars' });

// 상단 왼쪽 nav link
const toProjects = document.querySelector(".project-link");
const toContact = document.querySelector(".contact-link");

function projectLink() {
    gsap.to(window,{
        duration:1,
        scrollTo: { y: ".projects-sec" }
    });
};
function contactLink() {
    gsap.to(window,{
        duration:1,
        scrollTo: { y: ".contact-address-block"}
    });
};
toProjects.addEventListener("click", projectLink);
toContact.addEventListener("click", contactLink);

// header gsap
let lastScrollY = window.scrollY;
const header = document.querySelector('.header');
window.addEventListener('scroll',function(){
    const currentScrollY = window.scrollY;
    if(currentScrollY > lastScrollY){
        gsap.to(header, {y:'-100%', duration: 1});
    } else {
        gsap.to(header, {y:'0%', duration: 1});
    }
    lastScrollY = currentScrollY; 
});

// contact gsap
gsap.set('.contact-tit',{autoAlpha:0});
const contact = gsap.timeline({
    scrollTrigger: {
        trigger :'.contact-intro-block',
        start: "0% 10%",
        end: "0% 10%",
        scrub:1,
    }
});
contact.to('.contact-tit',{
    autoAlpha:1,
    duration:0.5
});

gsap.set('.footer-marquee-block',{y:100});
const marquee = gsap.to('.footer-marquee-block',{
    scrollTrigger:{
        trigger:'.contact-address-block',
        start:"90% 100%",
        end:"100% 100%",
        scrub:1,
        onEnter:function(){
            gsap.to('.footer-marquee-block',{
                y:0,
            });
        },
        onLeaveBack:function(){
            gsap.to('.footer-marquee-block',{y:100});
        }
    }
});

let mm = gsap.matchMedia();
//pc
mm.add("(min-width:769px)",function(){
    const toContact = document.querySelector(".contact-link.mov");
    const toContactSec = document.querySelector(".contact-link:nth-child(2)");

    // 상단 왼쪽 nav link
    toContactSec.classList.remove('hidden');
    toContact.classList.add('hidden');
    function contactLink() {
        gsap.to(window,{
            duration:1,
            scrollTo: { y: ".contact-address-block"}
        });
    };
    toContactSec.addEventListener("click", contactLink);

    ScrollTrigger.create({
        trigger:'.sidepj-sec',
        start:"0% 30%",
        end:"100% 100%",
        toggleClass: {
            targets:"body",
            className:"begie"
        },
    });

    // intro gsap
    gsap.to('.intro-sec .intro-inner .intro-tx .char', {
        delay:0.2,
        y:0,
        stagger:{
            from:'random',
            each:0.01
        }
    });

    gsap.to('.intro-sec',{
        scrollTrigger:{
            trigger:".intro-sec",
            start: '0% 0%',
            end: '100% 0%',
            scrub:0
        },
        filter:"brightness(0)"
    })

    const intro = gsap.timeline();
    intro.to('.intro-tx',{ 
        x:0,
        duration:0.4,
        autoAlpha:1,
        delay:0.5
    })
    intro.from('.header',{autoAlpha:0});

    // about gsap
    const lottie01 = gsap.to('.lottie-block',{
        scrollTrigger : {
            trigger :'.about-sec',
            start:"0% 0%",
            end: "100% 100%",
            scrub:1, 
        },
        x:200,
    });
    // mainprojects gsap
    const projects = gsap.to('.projects-list',{
        scrollTrigger: {
            trigger: '.projects-sec',
            start:"0% 0%",
            end: "100% 100%",
            scrub: 1,
            invalidateOnRefresh: true,
        },
        xPercent: -100,
        x:function(){ return (window.innerWidth - 65); }
    });
    // sidepj gsap
    const sidepj = gsap.timeline({
        scrollTrigger: {
            trigger:'.sidepj-sec',
            start:"0% 0%",
            end:"100% 100%",
            scrub:1,
            onEnter: function(){
                gsap.to('.bottom-overlay',{autoAlpha:0});
                document.querySelector('.custom-cursor').classList.add('white');
            },
            onLeaveBack: function(){
                gsap.to('.bottom-overlay',{autoAlpha:1});
            }
        },
    });
});
//mobie
mm.add("(max-width:768px)",function(){
    const toContact = document.querySelector(".contact-link.mov");
    toContact.classList.remove('hidden');
    // intro gsap
    gsap.to('.intro-sec .intro-inner .intro-tx .char', {
        delay:0.2,
        y:0,
        stagger:{
            from:'random',
            each:0.01
        }
    });

    const introtx = gsap.to('.intro-tx',{
        scrollTrigger : {
            trigger :'.intro-sec',
            start:"50% 50%",
            end: "100% 50%",
            scrub:1,
        },
        y:-100
    });
});