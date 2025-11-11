import nodemailer from 'nodemailer';

let visits = 0;
let likes = 0;
let ratings = [];

export default async function handler(req, res) {
  if (req.method === 'POST') {
    if (req.body.action === 'like') likes++;
    if (req.body.action === 'rate') ratings.push(req.body.value);
    return res.status(200).json({ visits, likes, ratings });
  }
  if (req.method === 'GET') {
    visits++;

    // Send email notification
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NOTIFY_EMAIL, // your email
        pass: process.env.NOTIFY_PASS   // your email password or app password
      }
    });

    await transporter.sendMail({
      from: process.env.NOTIFY_EMAIL,
      to: process.env.NOTIFY_EMAIL,
      subject: 'New Website Visit',
      text: `Someone visited your website. Total visits: ${visits}`
    });

    return res.status(200).json({
      visits,
      likes,
      avgRating: ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0,
      ratings: ratings.length
    });
  }
  res.status(405).end();
}
