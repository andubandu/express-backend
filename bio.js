import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function removeAllBios() {
    try {
        await mongoose.connect(process.env.URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const result = await User.updateMany(
            { bio: { $exists: true } },  // Only update users who have a bio field
            { $unset: { bio: "" } }      // This removes the bio field
        );

        console.log(`Removed 'bio' from ${result.modifiedCount} users.`);
    } catch (err) {
        console.error('Error removing bios:', err);
    } finally {
        await mongoose.disconnect();
    }
}

removeAllBios();
