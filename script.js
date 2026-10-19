const startButton = document.getElementById('startButton');
const mainContainer = document.querySelector('.container');
const letterTrigger = document.getElementById('letterTrigger');
const letterOverlay = document.getElementById('letterOverlay');
const letterClose = document.getElementById('letterClose');
const envelope = document.getElementById('envelope');
const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let width = window.innerWidth;
let height = window.innerHeight;
let pixelRatio = 1;
let stars = [];
let driftingMessages = [];
let hearts = [];
let messageTimer;
let heartTimer;
let pointerX = 0;
let pointerY = 0;
let previousTime = 0;
const starCount = 160;
const messages = ['Chúc em 20/10 vui vẻ', 'Anh yêu em', 'Mãi yêu Ánh'];
const imageSources = [
  'images/1792409798529_132552474252515494_3423398790147597042_c63800157b6742d66f17f1377da8aa47.jpg',
  'images/1792409798490_132552474252515494_3423398790147597042_1c72e49e154b6d89b407e42d80e6d934.jpg',
  'images/1792409798468_132552474252515494_3423398790147597042_6da564fd93adad4aed830a55a58e8b02.jpg',
  'images/1792409798444_132552474252515494_3423398790147597042_be404adac2a6fcccf45932119a82bf5f.jpg',
];
const sampleImages = imageSources.map((src) => {
  const image = new Image();
  image.src = src;
  image.addEventListener('error', () => {
    console.error(`Không thể tải ảnh mẫu: ${src}`);
  });
  return image;
});

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  stars = Array.from({ length: starCount }, createStar);
}

function createStar() {
  return {
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    z: Math.random() * 0.96 + 0.04,
    speed: Math.random() * 0.00022 + 0.00008,
    hue: Math.random() < 0.18 ? 265 : Math.random() < 0.5 ? 205 : 0,
    previousX: null,
    previousY: null,
  };
}

function drawStar(star, delta) {
  if (!reducedMotion.matches) {
    star.z -= star.speed * delta;
  }
  if (star.z <= 0.035) {
    Object.assign(star, createStar(), { z: 1, previousX: null, previousY: null });
  }

  const focalLength = Math.min(width, height) * 0.72;
  const depth = 1 / star.z;
  const centerX = width / 2 - pointerX * 36 * (1 - star.z);
  const centerY = height / 2 - pointerY * 30 * (1 - star.z);
  const x = centerX + star.x * focalLength * depth;
  const y = centerY + star.y * focalLength * depth;
  const radius = Math.min(2.6, 0.35 + depth * 0.4);
  const opacity = Math.min(1, 0.2 + depth * 0.17);

  if (x >= 0 && x <= width && y >= 0 && y <= height) {
    ctx.beginPath();
    if (star.previousX !== null && !reducedMotion.matches) {
      ctx.moveTo(star.previousX, star.previousY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = `hsla(${star.hue}, 90%, 85%, ${opacity * 0.7})`;
      ctx.lineWidth = radius * 0.65;
      ctx.stroke();
    }
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${star.hue}, 90%, 92%, ${opacity})`;
    if (radius > 1.5) {
      ctx.shadowBlur = radius * 2;
      ctx.shadowColor = `hsla(${star.hue}, 100%, 80%, ${opacity})`;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  star.previousX = x;
  star.previousY = y;
}

function createDriftingMessage() {
  const showImage = Math.random() < 0.1;
  const image = sampleImages[Math.floor(Math.random() * sampleImages.length)];
  return {
    x: width * (Math.random() * 0.82 + 0.09),
    y: -Math.random() * height,
    depth: Math.random() * 0.4 + 0.6,
    speed: Math.random() * 0.09 + 0.06,
    drift: (Math.random() - 0.5) * 0.04,
    content: messages[Math.floor(Math.random() * messages.length)],
    isImage: showImage,
    image,
    size: Math.random() * 24 + 66,
    rotation: (Math.random() - 0.5) * 0.12,
  };
}

function drawDriftingMessage(item, delta) {
  item.y += item.speed * delta;
  item.x += item.drift * delta;
  if (item.y > height + 150) {
    Object.assign(item, createDriftingMessage(), { y: -100 });
  }

  const depthScale = 1 / item.depth;
  const x = item.x + pointerX * 18 * (1 - item.depth);
  const y = item.y + pointerY * 14 * (1 - item.depth);
  const fontSize = Math.min(40, 19 * depthScale);
  const opacity = Math.min(1, 0.82 + depthScale * 0.12);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(item.rotation);
  ctx.globalAlpha = opacity;
  if (item.isImage) {
    if (item.image.complete && item.image.naturalWidth > 0) {
      const imageSize = Math.min(100, item.size * depthScale);
      const imageHeight = imageSize * item.image.naturalHeight / item.image.naturalWidth;
      ctx.shadowBlur = 14;
      ctx.shadowColor = 'rgba(164, 179, 255, 0.8)';
      ctx.fillStyle = 'rgba(255, 245, 255, 0.9)';
      ctx.fillRect(-imageSize / 2 - 4, -imageHeight / 2 - 4, imageSize + 8, imageHeight + 8);
      ctx.shadowBlur = 0;
      ctx.drawImage(item.image, -imageSize / 2, -imageHeight / 2, imageSize, imageHeight);
    }
  } else {
    ctx.font = `italic 700 ${fontSize}px "Cormorant Garamond", Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, fontSize * 0.12);
    ctx.strokeStyle = 'rgba(18, 5, 19, 0.94)';
    ctx.strokeText(item.content, 0, 0);
    ctx.shadowBlur = 11;
    ctx.shadowColor = 'rgba(255, 91, 190, 0.95)';
    ctx.lineWidth = Math.max(1.4, fontSize * 0.045);
    ctx.strokeStyle = '#fff0fa';
    ctx.strokeText(item.content, 0, 0);
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(255, 105, 196, 0.9)';
    ctx.fillStyle = '#ffb5df';
    ctx.fillText(item.content, 0, 0);
  }
  ctx.restore();
}

function createHeart() {
  return {
    x: Math.random() * width,
    y: -24,
    size: Math.random() * 8 + 9,
    speed: Math.random() * 0.045 + 0.035,
    sway: (Math.random() - 0.5) * 0.035,
    phase: Math.random() * Math.PI * 2,
  };
}

function drawHeart(heart, delta) {
  heart.y += heart.speed * delta;
  heart.phase += delta * 0.0015;
  heart.x += heart.sway * delta + Math.sin(heart.phase) * 0.15;

  ctx.save();
  ctx.translate(heart.x, heart.y);
  ctx.scale(heart.size / 16, heart.size / 16);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-18, -6, -8, -17, 0, -8);
  ctx.bezierCurveTo(8, -17, 18, -6, 0, 5);
  ctx.fillStyle = '#ff3158';
  ctx.shadowBlur = 12;
  ctx.shadowColor = 'rgba(255, 38, 83, 0.8)';
  ctx.fill();
  ctx.restore();
}

function animate(time) {
  const delta = Math.min(time - previousTime || 16, 32);
  previousTime = time;
  ctx.clearRect(0, 0, width, height);
  stars.forEach((star) => drawStar(star, delta));
  driftingMessages.forEach((item) => drawDriftingMessage(item, delta));
  hearts = hearts.filter((heart) => heart.y < height + 30);
  hearts.forEach((heart) => drawHeart(heart, delta));

  requestAnimationFrame(animate);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('pointermove', (event) => {
  pointerX = (event.clientX / width - 0.5) * 2;
  pointerY = (event.clientY / height - 0.5) * 2;
  document.body.style.setProperty('--tilt-x', `${pointerX * 4}deg`);
  document.body.style.setProperty('--tilt-y', `${pointerY * -4}deg`);
});

function openLetter() {
  letterOverlay.hidden = false;
  letterTrigger.setAttribute('aria-expanded', 'true');
  letterOverlay.classList.remove('is-letter-open');
  envelope.classList.remove('is-open');
  envelope.setAttribute('aria-expanded', 'false');
  envelope.setAttribute('aria-label', '💖');
  document.getElementById('letterHint').textContent = 'Bấm vào phong thư để lấy thiệp ra';
  envelope.focus();
}

function revealLetter() {
  if (envelope.classList.contains('is-open')) {
    return;
  }
  envelope.classList.add('is-open');
  envelope.setAttribute('aria-expanded', 'true');
  envelope.setAttribute('aria-label', 'Tấm thiệp đã mở');
  letterOverlay.classList.add('is-letter-open');
  document.getElementById('letterHint').textContent = 'Gửi đến cô gái bé nhỏ của anh';
}

function closeLetter() {
  letterOverlay.hidden = true;
  letterOverlay.classList.remove('is-letter-open');
  envelope.classList.remove('is-open');
  envelope.setAttribute('aria-expanded', 'false');
  letterTrigger.setAttribute('aria-expanded', 'false');
  letterTrigger.focus();
}

letterTrigger.addEventListener('click', openLetter);
envelope.addEventListener('click', revealLetter);
envelope.addEventListener('keydown', (event) => {
  if ((event.key === 'Enter' || event.key === ' ') && !envelope.classList.contains('is-open')) {
    event.preventDefault();
    revealLetter();
  }
});
letterClose.addEventListener('click', closeLetter);
letterOverlay.addEventListener('click', (event) => {
  if (event.target === letterOverlay) {
    closeLetter();
  }
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !letterOverlay.hidden) {
    closeLetter();
  }
});

startButton.addEventListener('click', () => {
  if (startButton.disabled) {
    return;
  }

  startButton.disabled = true;
  mainContainer.classList.add('is-entering');
  window.setTimeout(() => {
    startButton.classList.add('hidden');
    mainContainer.classList.remove('is-entering');
    document.body.classList.add('is-entered');

    if (!messageTimer) {
      driftingMessages = Array.from({ length: 14 }, createDriftingMessage);
      messageTimer = window.setInterval(() => {
        if (driftingMessages.length < 20) {
          driftingMessages.push(createDriftingMessage());
        }
      }, 800);
    }
    if (!heartTimer) {
      hearts = Array.from({ length: 5 }, () => {
        const heart = createHeart();
        heart.y = -Math.random() * height;
        return heart;
      });
      heartTimer = window.setInterval(() => {
        if (hearts.length < 9) {
          hearts.push(createHeart());
        }
      }, 1100);
    }
  }, 460);
});

resizeCanvas();
requestAnimationFrame(animate);
