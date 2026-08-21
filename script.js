(() => {
  const welcome = document.getElementById('welcome');
  const invitation = document.getElementById('invitation');
  const envelope = document.querySelector('.envelope');
  const openButton = document.getElementById('openInvitation');
  const replayButton = document.getElementById('replayInvitation');
  const stars = document.getElementById('stars');
  const confetti = document.getElementById('confetti');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function buildStars() {
    const count = reduceMotion ? 18 : 36;
    for (let i = 0; i < count; i++) {
      const star = document.createElement('span');
      star.className = 'star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 55}%`;
      star.style.animationDelay = `${Math.random() * 2.2}s`;
      star.style.opacity = `${0.35 + Math.random() * 0.65}`;
      stars.appendChild(star);
    }
  }

  function launchConfetti() {
    confetti.innerHTML = '';
    const glyphs = ['✦','❀','♡','✧','🌺'];
    const count = reduceMotion ? 10 : 28;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.animationDelay = `${Math.random() * 0.7}s`;
      piece.style.animationDuration = `${2.4 + Math.random() * 1.7}s`;
      piece.style.fontSize = `${14 + Math.random() * 14}px`;
      confetti.appendChild(piece);
    }
  }

  function openInvitation() {
    envelope.classList.add('opening');
    openButton.disabled = true;

    window.setTimeout(() => {
      welcome.classList.add('hide');
    }, reduceMotion ? 0 : 500);

    window.setTimeout(() => {
      welcome.style.display = 'none';
      invitation.style.display = 'block';
      invitation.setAttribute('aria-hidden', 'false');
      invitation.classList.add('show');
      launchConfetti();
      replayButton.focus({ preventScroll: true });
    }, reduceMotion ? 20 : 1050);
  }

  function replay() {
    invitation.classList.remove('show');
    invitation.setAttribute('aria-hidden', 'true');
    invitation.style.display = 'none';
    confetti.innerHTML = '';
    envelope.classList.remove('opening');
    welcome.style.display = 'block';
    welcome.classList.remove('hide');
    openButton.disabled = false;
    openButton.focus({ preventScroll: true });
  }

  openButton.addEventListener('click', openInvitation);
  replayButton.addEventListener('click', replay);
  buildStars();
})();
