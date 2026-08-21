
(() => {
  const openBtn = document.getElementById('openBtn');
  const replayBtn = document.getElementById('replayBtn');
  const landing = document.getElementById('landing');
  const invitation = document.getElementById('invitation');
  const envelope = document.querySelector('.envelope-scene');
  const confetti = document.getElementById('confetti');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function launchConfetti() {
    confetti.innerHTML = '';
    const items = ['✦', '❀', '♡', '✧', '◌'];
    const total = reduceMotion ? 10 : 26;
    for (let i = 0; i < total; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.textContent = items[Math.floor(Math.random() * items.length)];
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.animationDuration = `${2.5 + Math.random() * 1.8}s`;
      piece.style.animationDelay = `${Math.random() * .6}s`;
      piece.style.fontSize = `${14 + Math.random() * 12}px`;
      confetti.appendChild(piece);
    }
  }

  function openInvitation() {
    envelope.classList.add('open');
    openBtn.disabled = true;
    setTimeout(() => {
      landing.classList.add('hidden');
      invitation.classList.remove('hidden');
      invitation.setAttribute('aria-hidden', 'false');
      launchConfetti();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    }, reduceMotion ? 20 : 980);
  }

  function replayInvitation() {
    invitation.classList.add('hidden');
    invitation.setAttribute('aria-hidden', 'true');
    confetti.innerHTML = '';
    envelope.classList.remove('open');
    landing.classList.remove('hidden');
    openBtn.disabled = false;
    openBtn.focus({ preventScroll: true });
  }

  openBtn.addEventListener('click', openInvitation);
  replayBtn.addEventListener('click', replayInvitation);
})();
