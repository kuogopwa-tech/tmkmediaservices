document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/videos');
    const videos = await res.json();

    const videoList = document.getElementById('videoList');
    if (videos.length === 0) {
      videoList.innerHTML = '<p>No videos found.</p>';
    } else {
      videoList.innerHTML = videos.map(video => {
        return `
          <div class="mb-4">
            <iframe 
              src="https://www.youtube.com/embed/${video.id.videoId || video.id}" 
              frameborder="0" 
              allowfullscreen 
              class="w-100" 
              style="height:300px;">
            </iframe>
            <p class="mt-2 fw-bold">${video.snippet ? video.snippet.title : video.title}</p>
          </div>
        `;
      }).join('');
    }
    document.getElementById('loading').style.display = 'none';
  } catch (err) {
    document.getElementById('loading').innerHTML = 'Failed to load videos.';
    console.error('Error loading videos:', err);
  }
});

