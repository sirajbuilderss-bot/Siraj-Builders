document.addEventListener('DOMContentLoaded',()=>{
  const body=document.body;
  const nav=document.querySelector('[data-site-nav]');
  const hamb=document.querySelector('.hamb');
  const mobile=document.querySelector('.mobile-menu');
  const prefersReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header: transparent hero state, sticky/scrolled state and keyboard-friendly dropdown.
  const syncNav=()=>{ if(nav) nav.classList.toggle('scrolled',window.scrollY>24); };
  syncNav(); window.addEventListener('scroll',syncNav,{passive:true});
  if(nav && document.querySelector('.hero-slider')) nav.classList.add('transparent');

  // Mark the current page without relying on server-side rendering.
  const current=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav.toLowerCase()===current));

  const closeMobile=()=>{ if(!mobile||!hamb)return; mobile.classList.remove('open'); body.classList.remove('menu-open'); hamb.setAttribute('aria-expanded','false'); };
  if(hamb&&mobile){
    hamb.addEventListener('click',()=>{const open=!mobile.classList.contains('open'); mobile.classList.toggle('open',open); body.classList.toggle('menu-open',open); hamb.setAttribute('aria-expanded',String(open));});
    mobile.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMobile));
  }
  document.querySelectorAll('[data-mobile-toggle]').forEach(b=>b.addEventListener('click',()=>{const sub=document.getElementById(b.dataset.mobileToggle);const open=!sub?.classList.contains('open');sub?.classList.toggle('open',open);b.setAttribute('aria-expanded',String(open));b.querySelector('span').textContent=open?'−':'+';}));

  document.querySelectorAll('.dropdown').forEach(d=>{
    const t=d.querySelector('.drop-toggle');
    if(!t)return;
    t.addEventListener('click',()=>{const open=!d.classList.contains('open');d.classList.toggle('open',open);t.setAttribute('aria-expanded',String(open));});
    d.addEventListener('mouseleave',()=>{d.classList.remove('open');t.setAttribute('aria-expanded','false');});
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.dropdown.open').forEach(d=>d.classList.remove('open'));closeMobile();}});

  // Hero slider: 4 slides, 6 seconds, pause on hover/focus, arrows, dots, swipe and keyboard.
  const slider=document.querySelector('[data-hero-slider]');
  if(slider){
    const slides=[...slider.querySelectorAll('[data-slide]')];
    const dots=[...slider.querySelectorAll('[data-hero-dot]')];
    const prev=slider.querySelector('[data-hero-prev]'); const next=slider.querySelector('[data-hero-next]');
    let index=0,timer=null,paused=false,startX=0;
    const interval=6000;
    const show=(nextIndex)=>{
      index=(nextIndex+slides.length)%slides.length;
      slides.forEach((s,i)=>s.classList.toggle('is-active',i===index));
      dots.forEach((d,i)=>{d.classList.toggle('is-active',i===index);d.setAttribute('aria-selected',String(i===index));});
      const bar=slider.querySelector('.hero-progress span');
      if(bar&&!prefersReduced){bar.style.animation='none';void bar.offsetWidth;bar.style.animation='heroProgress 6s linear infinite';if(paused)bar.style.animationPlayState='paused';}
    };
    const start=()=>{if(prefersReduced||paused)return;clearInterval(timer);timer=setInterval(()=>show(index+1),interval);};
    const pause=()=>{paused=true;slider.classList.add('is-paused');clearInterval(timer);};
    const resume=()=>{paused=false;slider.classList.remove('is-paused');start();};
    prev?.addEventListener('click',()=>{show(index-1);start();}); next?.addEventListener('click',()=>{show(index+1);start();});
    dots.forEach((d,i)=>d.addEventListener('click',()=>{show(i);start();}));
    slider.addEventListener('mouseenter',pause);slider.addEventListener('mouseleave',resume);slider.addEventListener('focusin',pause);slider.addEventListener('focusout',e=>{if(!slider.contains(e.relatedTarget))resume();});
    slider.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){show(index-1);start();}if(e.key==='ArrowRight'){show(index+1);start();}});
    slider.addEventListener('touchstart',e=>{startX=e.changedTouches[0].clientX;},{passive:true});
    slider.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-startX;if(Math.abs(dx)>45){show(index+(dx<0?1:-1));start();}},{passive:true});
    show(0);start();
  }

  // Accessible FAQ accordion.
  document.querySelectorAll('.faq-q').forEach(q=>q.addEventListener('click',()=>{
    const item=q.closest('.faq-item'); if(!item)return;
    const willOpen=!item.classList.contains('open');
    item.parentElement.querySelectorAll('.faq-item.open').forEach(other=>{if(other!==item){other.classList.remove('open');other.querySelector('.faq-q')?.setAttribute('aria-expanded','false');}});
    item.classList.toggle('open',willOpen); q.setAttribute('aria-expanded',String(willOpen));
    const icon=q.querySelector('span:last-child');if(icon)icon.textContent=willOpen?'−':'+';
  }));

  // Scroll reveals.
  const revealObserver=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});
  document.querySelectorAll('.reveal').forEach(x=>revealObserver.observe(x));

  // Counters.
  document.querySelectorAll('[data-counter]').forEach(el=>{let done=false;const o=new IntersectionObserver(es=>{if(done||!es[0].isIntersecting)return;done=true;const target=+el.dataset.counter;let start=0;const step=Math.max(1,Math.ceil(target/55));const t=setInterval(()=>{start=Math.min(target,start+step);el.textContent=start+(el.dataset.suffix||'');if(start>=target)clearInterval(t)},22);o.disconnect()},{threshold:.5});o.observe(el);});

  // Portfolio filters.
  document.querySelectorAll('[data-filter]').forEach(group=>{const buttons=group.querySelectorAll('button');const items=document.querySelectorAll('[data-category-item]');buttons.forEach(btn=>btn.addEventListener('click',()=>{buttons.forEach(b=>b.classList.remove('active'));btn.classList.add('active');const f=btn.dataset.filter;items.forEach(i=>i.style.display=(f==='all'||i.dataset.categoryItem===f)?'':'none');}));});

  // Demo form: honest local success state.
  const form=document.querySelector('[data-demo-form]');
  if(form)form.addEventListener('submit',e=>{e.preventDefault();const notice=form.querySelector('.notice');if(!form.checkValidity()){form.reportValidity();return;}if(notice){notice.textContent='Thank you. Your project details have been captured locally for this demo. Connect this form to your backend or email service to enable real submissions.';notice.classList.add('show');}form.reset();});

  const back=document.querySelector('.backtop');
  if(back){window.addEventListener('scroll',()=>back.classList.toggle('show',scrollY>600),{passive:true});back.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));}
  document.querySelectorAll('[data-modal-open]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.modalOpen)?.classList.add('open')));
  document.querySelectorAll('[data-modal-close]').forEach(b=>b.addEventListener('click',()=>b.closest('.modal')?.classList.remove('open')));
  document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open');}));
});
