import mongoose, { Schema } from 'mongoose';

const DismissedTransactionSchema = new Schema({
  reference: { type: String, required: true, unique: true },
  dismissedAt: { type: Date, default: Date.now },
});

export default mongoose.models.DismissedTransaction ||
  mongoose.model('DismissedTransaction', DismissedTransactionSchema);
