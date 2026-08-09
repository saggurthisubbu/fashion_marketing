import app from './app.js';
import { connectDB } from './config/db.js';
import { seedDatabase } from './seed.js';

const PORT = process.env.PORT || 5000;

// Connect to DB, seed defaults, and listen on all network interfaces (0.0.0.0)
connectDB().then(async () => {
  await seedDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [QuickFit Backend Server]: Running on http://localhost:${PORT} (Bound to 0.0.0.0)`);
  });
});
