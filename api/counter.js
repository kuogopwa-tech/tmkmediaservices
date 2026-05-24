let visitorCount = 0;
let totalLikes = 0;
let ratings = [];
let ratingSum = 0;

module.exports = function handler(req, res) {
  const { action, value } = req.body || {};

  if (req.method === 'POST') {
    if (action === 'like') {
      totalLikes++;
    }

    if (action === 'rate' && value) {
      const rating = Number(value);
      if (!Number.isNaN(rating)) {
        ratings.push(rating);
        ratingSum += rating;
      }
    }
  } else {
    visitorCount++;
  }

  const avgRating = ratings.length
    ? (ratingSum / ratings.length).toFixed(1)
    : 0;

  res.status(200).json({
    visits: visitorCount,
    likes: totalLikes,
    avgRating,
    ratings: ratings.length
  });
};
