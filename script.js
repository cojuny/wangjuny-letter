(() => {
  'use strict';
  const arena = document.getElementById('choiceArea');
  const no = document.getElementById('noButton');
  const yes = document.getElementById('yesButton');
  const hint = document.getElementById('playfulHint');

  if (arena && no && yes && hint) {
    const lines = [
      '앗! NO 버튼이 도망갔어 🏃💨',
      '엇, 이번에도 실패! 🤭',
      '그 버튼은 너무 수줍은가 봐 🫣',
      '혹시 왼쪽 핑크 버튼은 어때? 💗',
      '왕주니는 아직 기다리는 중... 🥹',
      'NO 버튼: 오늘은 나 좀 쉬게 해줘! 😝'
    ];
    let count = 0;
    let lastMove = -Infinity;
    let relocated = false;
    let pointer = null;
    const margin = 16;

    function overlaps(rect, obstacle, padding = 26) {
      return rect.left < obstacle.right + padding &&
             rect.right > obstacle.left - padding &&
             rect.top < obstacle.bottom + padding &&
             rect.bottom > obstacle.top - padding;
    }

    function moveNo() {
      const now = performance.now();
      // Avoid double jumps from touchstart + pointerdown (or hover + move).
      if (now - lastMove < 190) return;
      lastMove = now;

      const previous = no.getBoundingClientRect();
      if (!relocated) {
        // Escape from the tiny button row and use the visible screen instead.
        // Preserve the original pixel width when switching to fixed positioning.
        no.style.width = `${Math.round(previous.width)}px`;
        no.classList.add('is-escaping');
        relocated = true;
      }

      const width = no.offsetWidth;
      const height = no.offsetHeight;
      const maxX = Math.max(margin, window.innerWidth - width - margin);
      const maxY = Math.max(margin, window.innerHeight - height - margin);
      const yesRect = yes.getBoundingClientRect();
      const minJump = Math.min(340, Math.hypot(window.innerWidth, window.innerHeight) * 0.36);
      const candidates = [];

      // Edge locations + random locations: travel much farther than before.
      const points = [
        [margin, margin], [maxX, margin], [margin, maxY], [maxX, maxY],
        [(margin + maxX) / 2, margin], [(margin + maxX) / 2, maxY],
        [margin, (margin + maxY) / 2], [maxX, (margin + maxY) / 2]
      ];
      for (let i = 0; i < 160; i++) {
        points.push([
          margin + Math.random() * (maxX - margin),
          margin + Math.random() * (maxY - margin)
        ]);
      }

      for (const [x, y] of points) {
        const candidate = {left: x, top: y, right: x + width, bottom: y + height};
        if (overlaps(candidate, yesRect, 25)) continue; // YES always stays clickable.
        const distance = Math.hypot(x - previous.left, y - previous.top);
        const pointerDistance = pointer
          ? Math.hypot(x + width / 2 - pointer.x, y + height / 2 - pointer.y)
          : Infinity;
        if (pointerDistance < 125) continue; // Don't land beneath a finger or mouse.
        candidates.push({x, y, distance});
      }

      const far = candidates.filter(item => item.distance >= minJump);
      const pool = (far.length ? far : candidates).sort((a, b) => b.distance - a.distance);
      // Choose among the farthest valid spots so the route isn't always identical.
      const chosen = pool[Math.floor(Math.random() * Math.min(12, pool.length))];
      if (chosen) {
        no.style.left = `${Math.round(chosen.x)}px`;
        no.style.top = `${Math.round(chosen.y)}px`;
      } else {
        no.style.left = `${margin}px`;
        no.style.top = `${margin}px`;
      }
      no.classList.remove('jumping');
      void no.offsetWidth;
      no.classList.add('jumping');
      hint.textContent = lines[count % lines.length];
      count++;
    }

    // Mouse: flee *before* the cursor reaches NO, on the entire screen.
    window.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      pointer = {x: event.clientX, y: event.clientY};
      const rect = no.getBoundingClientRect();
      const dx = Math.max(rect.left - event.clientX, 0, event.clientX - rect.right);
      const dy = Math.max(rect.top - event.clientY, 0, event.clientY - rect.bottom);
      if (Math.hypot(dx, dy) < 108) moveNo();
    }, {passive: true});

    no.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') moveNo();
    });
    // Mobile: move instantly when someone tries to tap NO.
    no.addEventListener('pointerdown', event => {
      event.preventDefault();
      pointer = {x: event.clientX, y: event.clientY};
      moveNo();
    });
    no.addEventListener('touchstart', event => {
      event.preventDefault();
      if (event.touches[0]) pointer = {x: event.touches[0].clientX, y: event.touches[0].clientY};
      moveNo();
    }, {passive: false});
    no.addEventListener('click', event => { event.preventDefault(); moveNo(); });
    no.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        pointer = null;
        moveNo();
      }
    });

    window.addEventListener('resize', () => {
      if (!relocated) return;
      // Keep the escaped button completely on screen after rotation or resizing.
      const width = Math.max(76, Math.min(Math.round(arena.clientWidth * 0.36), window.innerWidth - 2 * margin));
      no.style.width = `${width}px`;
      const maxX = Math.max(margin, window.innerWidth - no.offsetWidth - margin);
      const maxY = Math.max(margin, window.innerHeight - no.offsetHeight - margin);
      const x = Math.max(margin, Math.min(maxX, Number.parseFloat(no.style.left) || margin));
      const y = Math.max(margin, Math.min(maxY, Number.parseFloat(no.style.top) || margin));
      no.style.left = `${x}px`;
      no.style.top = `${y}px`;
      if (overlaps(no.getBoundingClientRect(), yes.getBoundingClientRect(), 16)) {
        lastMove = 0;
        pointer = null;
        moveNo();
      }
    });
  }

  const confetti = document.getElementById('confettiLayer');
  if (confetti && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const colors = ['#f28fad', '#f7adc6', '#ef729d', '#f3c0d0'];
    const shapes = ['♥', '♡', '✦', '♥', '♡'];
    for (let i = 0; i < 36; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-heart';
      piece.textContent = shapes[Math.floor(Math.random() * shapes.length)];
      piece.style.setProperty('--x', `${Math.random()*100}%`);
      piece.style.setProperty('--c', colors[i % colors.length]);
      piece.style.setProperty('--size', `${12+Math.random()*13}px`);
      piece.style.setProperty('--delay', `${Math.random()*2.5}s`);
      piece.style.setProperty('--duration', `${3.8+Math.random()*2.5}s`);
      piece.style.setProperty('--drift', `${Math.round((Math.random()-.5)*150)}px`);
      piece.style.setProperty('--spin', `${Math.round((Math.random()-.5)*720)}deg`);
      confetti.appendChild(piece);
    }
    // The decoration finishes after one short celebration; no continuous work.
    window.setTimeout(() => confetti.replaceChildren(), 9400);
  }
})();
