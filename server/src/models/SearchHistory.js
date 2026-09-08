import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional for guest / pre-login searches
      index: true,
    },
    userEmail: {
      type: String,
      index: true,
      default: '',
    },
    query: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    count: {
      type: Number,
      default: 1, // Number of times searched (for global trending aggregation)
    },
    lastSearchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for user query uniqueness/fast lookup
searchHistorySchema.index({ userId: 1, query: 1 });
searchHistorySchema.index({ userEmail: 1, query: 1 });
searchHistorySchema.index({ count: -1, lastSearchedAt: -1 });

export const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);
export default SearchHistory;
