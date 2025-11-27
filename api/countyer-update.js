let visitorCount = 0;
let totalLikes = 0;
let ratings = [];
let ratingSum = 0;

export default function handler(req, res) {
  const { action, value } = req.body;

  if (action === 'like') {
    totalLikes++;
  }

  if (action === 'rate' && value) {
    ratings.push(Number(value));
    ratingSum += Number(value);
  }

  const avgRating = ratings.length
    ? (ratingSum / ratings.length).toFixed(1)
    : 0;

  res.status(200).json({
    success: true,
    visits: visitorCount,
    likes: totalLikes,
    avgRating,
    ratings: ratings.length
  });
}
