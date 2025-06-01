import mongoose from 'mongoose'
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.URL; 
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users'); 

async function migrateRoles() {
    try {
        const result = await User.updateMany(
            { roles: { $exists: false } },
            {
                $set: {
                    roles: ['user']
                }
            }
        );
        console.log(`Updated ${result.modifiedCount} users.`);
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        mongoose.disconnect();
    }
}

migrateRoles();