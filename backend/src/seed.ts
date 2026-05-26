import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User";
import Survey from "./models/Survey";
import Claim from "./models/Claim";
import Notification from "./models/Notification";
import AIAnalysis from "./models/AIAnalysis";
import WeatherLog from "./models/WeatherLog";

dotenv.config();

const seedData = async () => {
  const connUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/agrishield";
  
  try {
    console.log("Connecting to database for seeding...");
    await mongoose.connect(connUri);
    console.log("Connected successfully.");

    // Clear old test accounts to start clean
    console.log("Clearing existing user collections...");
    await User.deleteMany({
      phone: { $in: ["9876543210", "9988776655", "9123456789"] }
    });

    // Create AEW Worker
    console.log("Creating AEW Worker account...");
    const aew = await User.create({
      name: "Rajnish Kumar",
      phone: "9876543210",
      password: "password123",
      role: "aew",
      district: "Patna",
      state: "Bihar"
    });

    // Create Farmer
    console.log("Creating Farmer account...");
    const farmer = await User.create({
      name: "Hari Singh",
      phone: "9988776655",
      password: "password123",
      role: "farmer",
      policyId: "AGRI-98273",
      district: "Patna",
      state: "Bihar"
    });

    // Create District Officer
    console.log("Creating District Officer account...");
    const officer = await User.create({
      name: "Amit Sharma",
      phone: "9123456789",
      password: "password123",
      role: "officer",
      district: "Patna",
      state: "Bihar"
    });

    console.log("\n==================================================");
    console.log("🎉 SEEDING COMPLETED SUCCESSFULLY!");
    console.log("==================================================");
    console.log("Use the following credentials to test AgriShield:");
    console.log("--------------------------------------------------");
    console.log("1. Farmer (किसान):");
    console.log("   Phone: 9988776655");
    console.log("   Password / Policy ID: password123 OR AGRI-98273");
    console.log("--------------------------------------------------");
    console.log("2. AEW Worker (कृषि विस्तार कार्यकर्ता):");
    console.log("   Phone: 9876543210");
    console.log("   Password: password123");
    console.log("--------------------------------------------------");
    console.log("3. District Officer (जिला अधिकारी):");
    console.log("   Phone: 9123456789");
    console.log("   Password: password123");
    console.log("==================================================\n");

  } catch (error: any) {
    console.error("Seeding failed:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedData();
