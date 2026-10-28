/* Mídia da abertura: fotografia publicada (D1/R2) e, se houver, vídeo autorizado. */
function renderHeroMedia() {
  const media = state.data?.heroImage;
  const heroImage = $('[data-hero-image]');
  if (media && safeMediaPath(media.key) && heroImage) {
    heroImage.src = `/${media.key}`;
    heroImage.alt = media.alt_text || 'Fotografia de veículo selecionada para o projeto Rota / Vetor.';
    const srcset = mediaSrcset(media.key);
    if (srcset) heroImage.srcset = srcset; else heroImage.removeAttribute('srcset');
    const caption = media.caption || media.alt_text || 'Imagem selecionada para o projeto.';
    const credit = [media.attribution, media.license].filter(Boolean).join(' · ') || 'Crédito e licença não registrados';
    if ($('#hero-image-caption')) $('#hero-image-caption').textContent = caption;
    if ($('#hero-image-credit')) $('#hero-image-credit').textContent = credit;
    const sourceNode = $('#hero-image-source');
    if (sourceNode) { const href = safeLink(media.source_url); if (href === '#') sourceNode.hidden = true; else { sourceNode.hidden = false; sourceNode.href = href; } }
  }
  const frame = $('[data-hero-frame]');
  if (heroImage && frame && !heroImage.dataset.fallbackBound) {
    heroImage.dataset.fallbackBound = 'true';
    heroImage.addEventListener('error', () => {
      heroImage.hidden = true;
      frame.classList.add('is-failed');
      if (!$('.hero-media-fallback', frame)) { const fallback = document.createElement('div'); fallback.className = 'hero-media-fallback'; fallback.textContent = 'Fotografia temporariamente indisponível'; frame.append(fallback); }
    }, { once: true });
  }
  renderHeroVideo();
}
function renderHeroVideo() {
  const info = state.data?.heroVideo;
  const frame = $('[data-hero-frame]');
  const toggle = $('[data-video-toggle]');
  if (!info || !frame || !toggle || !safeVideoPath(info.key) || $('video', frame)) return;
  if (prefersReducedMotion() || navigator.connection?.saveData) return;
  const mime = ['video/mp4', 'video/webm'].includes(info.mime_type) ? info.mime_type : (/\.webm$/i.test(info.key) ? 'video/webm' : 'video/mp4');
  const video = document.createElement('video');
  video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'metadata';
  video.setAttribute('role', 'img'); video.setAttribute('aria-label', info.alt_text || 'Vídeo de abertura');
  const poster = state.data.heroVideoPoster;
  if (poster && safeMediaPath(poster.key)) video.poster = `/${poster.key}`;
  const source = document.createElement('source'); source.src = `/${info.key}`; source.type = mime; video.append(source);
  let userPaused = false;
  const sync = () => { toggle.textContent = video.paused ? 'Reproduzir vídeo' : 'Pausar vídeo'; toggle.setAttribute('aria-pressed', String(video.paused)); };
  video.addEventListener('playing', () => { frame.classList.add('has-video'); sync(); });
  video.addEventListener('pause', sync);
  frame.append(video);
  toggle.hidden = false;
  toggle.addEventListener('click', () => { if (video.paused) { userPaused = false; video.play().catch(() => {}); } else { userPaused = true; video.pause(); } });
  document.addEventListener('rv:motion', (event) => { if (!event.detail.on) video.pause(); else if (!userPaused) video.play().catch(() => {}); });
  if (motionOn()) video.play().catch(() => sync());
  const caption = info.caption || info.alt_text; const credit = [info.attribution, info.license].filter(Boolean).join(' · ');
  if ($('#hero-image-caption')) $('#hero-image-caption').textContent = caption || '';
  if ($('#hero-image-credit')) $('#hero-image-credit').textContent = credit;
  const sourceNode = $('#hero-image-source');
  if (sourceNode) { const href = safeLink(info.source_url); if (href === '#') sourceNode.hidden = true; else { sourceNode.hidden = false; sourceNode.href = href; } }
}
function renderLiveStats() {
  const item = $('[data-live-sources]');
  const count = state.data?.sources?.length;
  if (!item || !count) return;
  item.hidden = false;
  const number = $('[data-count]', item);
  number.dataset.count = String(count);
  number.dataset.counted = '1';
  animateCount(number, count);
}
onData(renderHeroMedia);
onData(renderLiveStats);
