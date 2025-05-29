document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/videos');
    const videos = await res.json();

    const container = document.getElementById('videos');
    container.innerHTML = '';

    videos.forEach(video => {
      if (video.id.kind === 'youtube#video') {
        const videoId = video.id.videoId;
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}`;
        iframe.allowFullscreen = true;
        container.appendChild(iframe);
      }
    });
  } catch (err) {
    console.error('Error loading videos:', err);
  }
});

