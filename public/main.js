document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/videos');
    const videos = await res.json();

    const videoList = document.getElementById('videoList');
    if (!Array.isArray(videos) || videos.length === 0) {
      videoList.innerHTML = '<p>No videos found.</p>';
    } else {
      videoList.innerHTML = videos.map(video => `
        <div class="card mb-3">
          <div class="row g-0">
            <div class="col-4">
              <iframe 
                src="https://www.youtube.com/embed/${video.id}" 
                frameborder="0" 
                allowfullscreen 
                class="w-100"
                style="height:100px;">
              </iframe>
            </div>
            <div class="col-8 d-flex align-items-center">
              <p class="mb-0 fw-bold">${video.title}</p>
            </div>
          </div>
        </div>
      `).join('');
    }
    document.getElementById('loading').style.display = 'none';
  } catch (err) {
    document.getElementById('loading').innerHTML = 'Failed to load videos.';
    console.error('Error loading videos:', err);
  }
});

async function updateStats() {
  const res = await fetch('/api/counter');
  const data = await res.json();
  document.getElementById('visitorCount').textContent = `Visitors: ${data.visits}`;
  document.getElementById('likeCount').textContent = data.likes;
  document.getElementById('avgRating').textContent = data.avgRating;
  document.getElementById('ratingTotal').textContent = data.ratings;
}
updateStats();

document.getElementById('likeBtn').onclick = async () => {
  await fetch('/api/counter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'like' })
  });
  updateStats();
};

// Example: To send a rating (call this when user rates)
async function sendRating(value) {
  await fetch('/api/counter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'rate', value })
  });
  updateStats();
}

