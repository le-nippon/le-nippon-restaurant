const STORAGE_KEYS = {
  reviewUnlocked: 'le_nippon_review_unlocked',
  rewardClaimed: 'le_nippon_reward_claimed',
};

const REVIEW_URL =
  'https://search.google.com/local/writereview?placeid=ChIJ7eN5L7LByRIRcTJEj6n2t_0';

const SEGMENTS = ['PERDU', '🎁', 'PERDU', '🎁', 'PERDU', '🎁', 'PERDU', '🎁', 'PERDU', '🎁'];
const SEGMENT_COLORS = ['#e85d04', '#1a1a1a'];
const POINTER_ANGLE = -Math.PI / 2;

const playButton = document.getElementById('playButton');
const helperText = document.getElementById('helperText');
const modalBackdrop = document.getElementById('modalBackdrop');
const closeModal = document.getElementById('closeModal');
const reviewButton = document.getElementById('reviewButton');
const listeningState = document.getElementById('listeningState');
const successState = document.getElementById('successState');
const statusText = document.getElementById('statusText');
const statusPill = document.getElementById('statusPill');
const statusCard = document.getElementById('statusCard');
const wheelCanvas = document.getElementById('wheelCanvas');
const resultCard = document.getElementById('resultCard');
const resultBadge = document.getElementById('resultBadge');
const resultTitle = document.getElementById('resultTitle');
const resultDescription = document.getElementById('resultDescription');
const resultHistory = document.getElementById('resultHistory');
const voucherCard = document.getElementById('voucherCard');
const voucherId = document.getElementById('voucherId');
const confettiContainer = document.getElementById('confettiContainer');
const ctx = wheelCanvas.getContext('2d');

const state = {
  reviewed: localStorage.getItem(STORAGE_KEYS.reviewUnlocked) === 'true',
  claimedReward: null,
  isSpinning: false,
  isListeningForReturn: false,
  currentRotation: 0,
  spinDuration: 5600,
  reviewClickedAt: null,
};

const storedReward = localStorage.getItem(STORAGE_KEYS.rewardClaimed);
if (storedReward) {
  try {
    state.claimedReward = JSON.parse(storedReward);
  } catch (error) {
    localStorage.removeItem(STORAGE_KEYS.rewardClaimed);
  }
}

function easeOutQuint(t) {
  return 1 - (1 - t) ** 5;
}

function resizeCanvas() {
  const rect = wheelCanvas.getBoundingClientRect();
  const cssSize = Math.max(280, Math.floor(Math.min(rect.width || 360, rect.height || rect.width || 360)));
  const dpr = window.devicePixelRatio || 1;

  wheelCanvas.width = Math.round(cssSize * dpr);
  wheelCanvas.height = Math.round(cssSize * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawWheel(cssSize);
}

function drawWheel(size = wheelCanvas.width / (window.devicePixelRatio || 1)) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.465;
  const segmentAngle = (Math.PI * 2) / SEGMENTS.length;

  ctx.clearRect(0, 0, size, size);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius + size * 0.01, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = '#120f0c';
  ctx.shadowColor = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur = size * 0.04;
  ctx.fill();
  ctx.restore();

  for (let index = 0; index < SEGMENTS.length; index += 1) {
    const startAngle = -Math.PI / 2 - segmentAngle / 2 + index * segmentAngle;
    const endAngle = startAngle + segmentAngle;
    const midAngle = startAngle + segmentAngle / 2;
    const color = SEGMENT_COLORS[index % 2];

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = Math.max(1.5, size * 0.006);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(startAngle) * radius, cy + Math.sin(startAngle) * radius);
    ctx.stroke();
    ctx.restore();

    const textRadius = radius * 0.64;
    const textX = cx + Math.cos(midAngle) * textRadius;
    const textY = cy + Math.sin(midAngle) * textRadius;

    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(midAngle + Math.PI / 2);

    if (SEGMENTS[index] === '🎁') {
      ctx.font = `${Math.max(28, size * 0.085)}px system-ui, Apple Color Emoji, Segoe UI Emoji, sans-serif`;
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.font = `800 ${Math.max(14, size * 0.035)}px Inter, system-ui, sans-serif`;
      ctx.letterSpacing = '0.08em';
      ctx.fillStyle = '#ffffff';
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(SEGMENTS[index], 0, 0);
    ctx.restore();
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.21, 0, Math.PI * 2);
  ctx.fillStyle = '#fcf8f4';
  ctx.fill();
  ctx.lineWidth = Math.max(4, size * 0.012);
  ctx.strokeStyle = '#d9b38f';
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.11, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();
  ctx.restore();
}

function openModal() {
  modalBackdrop.classList.remove('hidden');
  modalBackdrop.setAttribute('aria-hidden', 'false');
}

function closeModalWindow() {
  modalBackdrop.classList.add('hidden');
  modalBackdrop.setAttribute('aria-hidden', 'true');
}

function showListeningMode() {
  listeningState.classList.remove('hidden');
  successState.classList.add('hidden');
}

function showReviewSuccess() {
  successState.classList.remove('hidden');
  listeningState.classList.add('hidden');
}

function setButtonLocked() {
  playButton.disabled = false;
  playButton.classList.add('locked');
  playButton.classList.remove('unlocked', 'ready', 'spent');
  playButton.textContent = 'Jouer la partie';
}

function setButtonReady() {
  playButton.disabled = false;
  playButton.classList.remove('locked', 'spent');
  playButton.classList.add('unlocked', 'ready');
  playButton.textContent = 'Spin maintenant';
}

function setButtonSpent() {
  playButton.disabled = true;
  playButton.classList.remove('locked', 'unlocked', 'ready');
  playButton.classList.add('spent');
  playButton.textContent = 'Résultat déjà révélé';
}

function updateUiFromState() {
  if (state.claimedReward) {
    setButtonSpent();
    statusPill.textContent = '';
    statusText.textContent = '';
    helperText.textContent = '';
    statusCard.classList.add('hidden');
    helperText.classList.add('hidden');
    renderStoredResult(state.claimedReward, true);
    return;
  }

  if (state.reviewed) {
    setButtonReady();
    statusPill.textContent = 'Déverrouillé';
    statusText.textContent =
      'Lancez votre spin.';
    helperText.textContent =
      'Cliquez pour tourner la roue.';
    statusCard.classList.remove('hidden');
    helperText.classList.remove('hidden');
    return;
  }

  setButtonLocked();
  statusPill.textContent = 'En attente';
  statusText.textContent =
    'Laissez un avis pour déverrouiller.';
  helperText.textContent =
    'Cliquez sur « Jouer la partie » puis laissez votre avis.';
  statusCard.classList.remove('hidden');
  helperText.classList.remove('hidden');
}

function randomId(length = 10) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint32Array(length);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('');
}

function buildStoredReward(result) {
  return {
    type: result,
    segmentIndex: result === '🎁' ? 1 : 0,
    voucherId: result === '🎁' ? `LNP-${randomId(10)}` : null,
    claimedAt: new Date().toISOString(),
  };
}

function showResultCard() {
  resultCard.classList.remove('hidden');
}

function renderStoredResult(reward, isHistory = false) {
  showResultCard();
  resultHistory.classList.toggle('hidden', !isHistory);

  if (reward.type === '🎁') {
    resultBadge.textContent = 'Gagné';
    resultTitle.textContent = 'Félicitations !';
    resultDescription.textContent =
      'Vous avez gagné un cadeau.';
    voucherCard.classList.remove('hidden');
    voucherId.textContent = reward.voucherId;
  } else {
    resultBadge.textContent = 'Perdu';
    resultTitle.textContent = 'Merci pour votre participation.';
    resultDescription.textContent =
      'Cette tentative n\'est pas gagnante.';
    voucherCard.classList.add('hidden');
    voucherId.textContent = '---';
  }
}

function persistReward(reward) {
  state.claimedReward = reward;
  localStorage.setItem(STORAGE_KEYS.rewardClaimed, JSON.stringify(reward));
  renderStoredResult(reward, false);
  updateUiFromState();

  if (reward.type === '🎁') {
    launchConfettiBurst();
  }
}

function animateWheelTo(targetRotation) {
  const startRotation = state.currentRotation;
  const duration = state.spinDuration;
  const startTime = performance.now();

  function frame(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuint(progress);
    const current = startRotation + (targetRotation - startRotation) * eased;

    wheelCanvas.style.transform = `rotate(${current}deg)`;

    if (progress < 1) {
      requestAnimationFrame(frame);
      return;
    }

    state.currentRotation = targetRotation;
    state.isSpinning = false;
  }

  requestAnimationFrame(frame);
}

function resolveTargetRotation(segmentIndex) {
  const segmentAngle = 360 / SEGMENTS.length;
  const baseCenter = segmentIndex * segmentAngle;
  const normalizedRotation = ((POINTER_ANGLE * 180) / Math.PI * -1 + 360) % 360;
  const targetCenter = (360 - baseCenter) % 360;
  const delta = ((targetCenter - (state.currentRotation % 360)) + 360) % 360;
  const fullSpins = 360 * 7;
  return state.currentRotation + fullSpins + delta;
}

function startSpin() {
  if (state.isSpinning || state.claimedReward) return;

  if (!state.reviewed) {
    openModal();
    return;
  }

  state.isSpinning = true;
  playButton.disabled = true;
  playButton.classList.remove('ready');

  const prizeIndexPool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const chosenIndex = prizeIndexPool[Math.floor(Math.random() * prizeIndexPool.length)];
  const chosenResult = SEGMENTS[chosenIndex];
  const targetRotation = resolveTargetRotation(chosenIndex);

  statusPill.textContent = 'Spin en cours';
  statusText.textContent = 'La roue tourne...';
  helperText.textContent = 'Résultat bientôt révélé.';
  animateWheelTo(targetRotation);

  window.setTimeout(() => {
    const reward = buildStoredReward(chosenResult);
    reward.segmentIndex = chosenIndex;
    persistReward(reward);
  }, state.spinDuration + 120);
}

function launchConfettiBurst() {
  confettiContainer.innerHTML = '';
  const totalPieces = 180;
  const palette = ['#e85d04', '#f6c453', '#ffffff', '#1a1a1a', '#ffd166', '#ff8c42'];

  for (let i = 0; i < totalPieces; i += 1) {
    const piece = document.createElement('span');
    const size = 6 + Math.random() * 10;
    const left = Math.random() * 100;
    const delay = Math.random() * 260;
    const duration = 2200 + Math.random() * 1800;
    const drift = -180 + Math.random() * 360;
    const rotation = Math.random() * 720;

    piece.className = 'confetti-piece';
    piece.style.left = `${left}%`;
    piece.style.top = '-10%';
    piece.style.width = `${size}px`;
    piece.style.height = `${size * 1.9}px`;
    piece.style.background = palette[Math.floor(Math.random() * palette.length)];
    piece.style.animationDuration = `${duration}ms`;
    piece.style.animationDelay = `${delay}ms`;
    piece.style.setProperty('--drift', `${drift}px`);
    piece.style.setProperty('--spin', `${rotation}deg`);
    confettiContainer.appendChild(piece);

    window.setTimeout(() => {
      piece.remove();
    }, duration + delay + 120);
  }
}

function handleReviewReturn() {
  if (!state.isListeningForReturn || state.claimedReward) return;

  const elapsed = state.reviewClickedAt ? Date.now() - state.reviewClickedAt : 0;
  if (elapsed < 7000) {
    return;
  }

  state.isListeningForReturn = false;
  state.reviewed = true;
  localStorage.setItem(STORAGE_KEYS.reviewUnlocked, 'true');
  showReviewSuccess();
  updateUiFromState();

  window.setTimeout(() => {
    closeModalWindow();
    successState.classList.add('hidden');
  }, 1200);
}

playButton.addEventListener('click', () => {
  if (state.claimedReward) return;

  if (!state.reviewed) {
    openModal();
    return;
  }

  startSpin();
});

closeModal.addEventListener('click', closeModalWindow);

modalBackdrop.addEventListener('click', (event) => {
  if (event.target === modalBackdrop) {
    closeModalWindow();
  }
});

reviewButton.addEventListener('click', () => {
  state.reviewClickedAt = Date.now();
  state.isListeningForReturn = true;
  reviewButton.href = REVIEW_URL;
  showListeningMode();
});

window.addEventListener('focus', handleReviewReturn);
window.addEventListener('resize', resizeCanvas);

resizeCanvas();
updateUiFromState();

// Scroll animations with Intersection Observer
const observerOptions = {
  threshold: 0.15,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.animation = 'fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.section-header, .gallery-card').forEach((el) => {
  el.style.opacity = '0';
  observer.observe(el);
});
