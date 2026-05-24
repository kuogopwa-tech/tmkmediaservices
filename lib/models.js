const { mongoose } = require('./mongo');

const ImageLike = mongoose.model(
  'ImageLike',
  new mongoose.Schema(
    {
      filename: { type: String, required: true, unique: true, index: true },
      likes: { type: Number, default: 0 },
      likedBy: { type: [String], default: [] },
    },
    { timestamps: true }
  )
);

const Counter = mongoose.model(
  'Counter',
  new mongoose.Schema(
    {
      _id: { type: String, required: true },
      visits: { type: Number, default: 0 },
      totalLikes: { type: Number, default: 0 },
      ratings: { type: [Number], default: [] },
      ratingSum: { type: Number, default: 0 },
    },
    { timestamps: true, versionKey: false }
  )
);

const Admin = mongoose.model(
  'Admin',
  new mongoose.Schema(
    {
      _id: { type: String, required: true },
      password: { type: String, required: true },
    },
    { timestamps: true, versionKey: false }
  )
);

module.exports = {
  ImageLike,
  Counter,
  Admin,
};

