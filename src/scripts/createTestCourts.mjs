import dotenv from "dotenv";
import dbConnect from "../utils/db.js";
import Court from "../models/Court.js";
import promptSync from "prompt-sync";

// Load environment variables
dotenv.config();

// Initialize prompt-sync
const prompt = promptSync({ sigint: true });

async function createTestCourts() {
    await dbConnect(); // Connect to the database

    // Get date range
    const startDateStr = prompt("Start date (YYYY-MM-DD):");
    const endDateStr = prompt("End date (YYYY-MM-DD):");
    
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error("Invalid date format. Please use YYYY-MM-DD");
        process.exit(1);
    }

    if (endDate < startDate) {
        console.error("End date must be after start date");
        process.exit(1);
    }

    // Get default values for courts
    const defaultReserved = 1;
    const defaultTotal = 6;

    if (isNaN(defaultReserved) || defaultReserved < 0 || defaultReserved > defaultTotal) {
        console.error("Invalid number of reserved courts");
        process.exit(1);
    }

    // Generate time slots (8:00 to 23:00)
    const timeSlots = Array.from({ length: 15 }, (_, i) => `${(8 + i).toString().padStart(2, '0')}:00`);

    // Create courts for each day and time slot
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        console.log(`\nCreating courts for ${currentDate.toISOString().split('T')[0]}`);
        
        for (const timeSlot of timeSlots) {
            // Check if court already exists
            const existingCourt = await Court.findOne({
                date: currentDate,
                timeSlot: timeSlot
            });

            if (existingCourt) {
                console.log(`Court already exists for ${timeSlot}`);
                continue;
            }

            // Allow custom values for each time slot
            const customPrompt = prompt(`Reserved courts for ${timeSlot} (Enter for default ${defaultReserved}): `);
            const reservedCourts = customPrompt ? parseInt(customPrompt) : defaultReserved;

            if (isNaN(reservedCourts) || reservedCourts < 0 || reservedCourts > defaultTotal) {
                console.error(`Invalid number of reserved courts for ${timeSlot}`);
                continue;
            }

            const court = new Court({
                date: currentDate,
                timeSlot: timeSlot,
                reservedCourts: reservedCourts,
                totalCourts: defaultTotal
            });

            try {
                await court.save();
                console.log(`Created court for ${timeSlot}: ${reservedCourts}/${defaultTotal} courts reserved`);
            } catch (error) {
                console.error(`Error creating court for ${timeSlot}:`, error.message);
            }
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log("\nFinished creating test courts!");
    process.exit(0);
}

createTestCourts().catch((err) => {
    console.error("Error creating test courts:", err);
    process.exit(1);
});