import bcrypt from "bcryptjs";

// In-Memory arrays to simulate database collections
export let users: any[] = [];
export let surveys: any[] = [];
export let claims: any[] = [];
export let notifications: any[] = [];
export let aiAnalyses: any[] = [];
export let weatherLogs: any[] = [];

// Helper to hash passwords during mock registration
export const hashPasswordSync = (password: string): string => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

// Seed initial demo users into the mock database
export const seedMockDatabase = () => {
  if (users.length > 0) return; // already seeded

  console.log("🌱 Seeding In-Memory Mock Database Store...");
  
  const hashedPassword = hashPasswordSync("password123");

  // AEW Worker
  users.push({
    _id: "mock_user_aew_123",
    name: "Rajnish Kumar",
    phone: "9876543210",
    password: hashedPassword,
    role: "aew",
    district: "Patna",
    state: "Bihar",
    createdAt: new Date(),
    toObject() { return { ...this }; }
  });

  // Farmer
  users.push({
    _id: "mock_user_farmer_456",
    name: "Hari Singh",
    phone: "9988776655",
    password: hashedPassword,
    role: "farmer",
    policyId: "AGRI-98273",
    district: "Patna",
    state: "Bihar",
    createdAt: new Date(),
    toObject() { return { ...this }; }
  });

  // District Officer
  users.push({
    _id: "mock_user_officer_789",
    name: "Amit Sharma",
    phone: "9123456789",
    password: hashedPassword,
    role: "officer",
    district: "Patna",
    state: "Bihar",
    createdAt: new Date(),
    toObject() { return { ...this }; }
  });

  console.log("Mock users seeded successfully.");

  // --- Mock Survey 1: Approved Claim (Wheat Pest Damage) ---
  const survey1Id = "mock_survey_wheat_001";
  const dummyImage = "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";

  const survey1 = {
    _id: survey1Id,
    farmerName: "Hari Singh",
    farmerPhone: "9988776655",
    policyId: "AGRI-98273",
    cropName: "Wheat (गेंहू)",
    cropType: "Kalyan Sona PBW-343",
    area: 3.5,
    sowingDate: new Date("2025-11-15"),
    isDamaged: true,
    damageDetails: {
      damageType: "Pest",
      damageDescription: "Spotted severe yellow rust infestation across the main crop foliage.",
      damageSeverity: "High"
    },
    images: [dummyImage],
    location: { lat: 25.5941, lng: 85.1376, accuracy: 8 },
    weatherData: {
      temp: 26,
      humidity: 65,
      windSpeed: 8,
      description: "Passing clouds, humid air",
      rawResponse: { mock: true, temp: 26, humidity: 65, description: "humble breeze" }
    },
    gpsWeatherStatus: "Verified",
    status: "Approved",
    comments: "High yellow rust pest damage verified. Matching local agricultural reports.",
    createdBy: users[0], // Rajnish Kumar (AEW)
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    toObject() { return this; }
  };
  surveys.push(survey1);

  // Weather Log for Survey 1
  weatherLogs.push({
    _id: "mock_weatherlog_wheat_001",
    survey: survey1Id,
    coordinates: survey1.location,
    weatherFetched: survey1.weatherData.rawResponse,
    status: "Match",
    reason: "Local humidity of 65% matches yellow rust growth criteria.",
    createdAt: survey1.createdAt
  });

  // AI Analysis for Survey 1
  aiAnalyses.push({
    _id: "mock_ai_wheat_001",
    survey: survey1Id,
    cropHealth: 35,
    damageType: "Pest Damage",
    severity: "High",
    confidence: 92,
    recommendation: "Apply chlorpyrifos foliar spray. Prune infected stems immediately.",
    createdAt: survey1.createdAt
  });

  // Claim for Survey 1
  claims.push({
    _id: "mock_claim_wheat_001",
    survey: survey1Id,
    farmer: users[1]._id, // Hari Singh
    policyId: "AGRI-98273",
    status: "Approved",
    estimatedPayout: 35000, // 3.5 acres * 10,000 for High severity
    approvedPayout: 35000,
    resolutionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    remarks: "Verification completed by Officer Sharma. Full settlement approved.",
    createdAt: survey1.createdAt,
    toObject() { return this; }
  });

  // Notifications for Survey 1
  notifications.push({
    _id: "mock_notif_f_001",
    recipient: users[1]._id,
    titleEn: "Insurance Claim Approved!",
    titleHi: "बीमा दावा स्वीकृत किया गया!",
    messageEn: "Your crop claim for Wheat (गेंहू) has been approved. Payout of ₹35,000 has been initiated.",
    messageHi: "आपकी Wheat (गेंहू) फसल के लिए आपका दावा स्वीकृत कर दिया गया है। ₹35,000 का भुगतान शुरू हो गया है।",
    type: "approved",
    surveyId: survey1Id,
    read: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  });


  // --- Mock Survey 2: Rejected Claim (Flood Fraud Attempt) ---
  const survey2Id = "mock_survey_paddy_002";

  const survey2 = {
    _id: survey2Id,
    farmerName: "Hari Singh",
    farmerPhone: "9988776655",
    policyId: "AGRI-98273",
    cropName: "Paddy (धान)",
    cropType: "Basmati-370",
    area: 2.0,
    sowingDate: new Date("2025-07-01"),
    isDamaged: true,
    damageDetails: {
      damageType: "Flood",
      damageDescription: "Reported deep inundation of the paddies due to flash storms.",
      damageSeverity: "High"
    },
    images: [dummyImage],
    location: { lat: 25.6124, lng: 85.1105, accuracy: 12 },
    weatherData: {
      temp: 41,
      humidity: 15,
      windSpeed: 14,
      description: "Severe hot air, dry winds",
      rawResponse: { mock: true, temp: 41, humidity: 15, description: "extreme heat" }
    },
    gpsWeatherStatus: "Suspicious", // High temperature and low humidity mismatches flood claim
    status: "Rejected",
    comments: "Claim rejected. Anti-fraud checks detected dry weather conditions (41°C, 15% humidity) contradicting the flood declaration.",
    createdBy: users[0],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    toObject() { return this; }
  };
  surveys.push(survey2);

  // Weather Log for Survey 2
  weatherLogs.push({
    _id: "mock_weatherlog_paddy_002",
    survey: survey2Id,
    coordinates: survey2.location,
    weatherFetched: survey2.weatherData.rawResponse,
    status: "Mismatch",
    reason: "Reported Flood damage conflicts with recorded 15% local relative humidity.",
    createdAt: survey2.createdAt
  });

  // AI Analysis for Survey 2
  aiAnalyses.push({
    _id: "mock_ai_paddy_002",
    survey: survey2Id,
    cropHealth: 88,
    damageType: "Healthy Crop",
    severity: "Low",
    confidence: 89,
    recommendation: "Crop foliage appears mostly green and dry. Monitor water retention.",
    createdAt: survey2.createdAt
  });

  // Claim for Survey 2
  claims.push({
    _id: "mock_claim_paddy_002",
    survey: survey2Id,
    farmer: users[1]._id,
    policyId: "AGRI-98273",
    status: "Rejected",
    estimatedPayout: 20000,
    approvedPayout: 0,
    resolutionDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    remarks: "Anti-fraud weather verification flagged this claim. Soil and air moisture confirm no flooding.",
    createdAt: survey2.createdAt,
    toObject() { return this; }
  });

  // Notification for Survey 2
  notifications.push({
    _id: "mock_notif_f_002",
    recipient: users[1]._id,
    titleEn: "Insurance Claim Rejected",
    titleHi: "बीमा दावा खारिज कर दिया गया",
    messageEn: "Your claim for Paddy (धान) was rejected by the audit officer due to climatic mismatches.",
    messageHi: "जलवायु विसंगतियों के कारण लेखा परीक्षा अधिकारी द्वारा धान की फसल का आपका दावा खारिज कर दिया गया था।",
    type: "rejected",
    surveyId: survey2Id,
    read: false,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
  });


  // --- Mock Survey 3: Pending Claim (Maize Drought Damage) ---
  const survey3Id = "mock_survey_maize_003";

  const survey3 = {
    _id: survey3Id,
    farmerName: "Hari Singh",
    farmerPhone: "9988776655",
    policyId: "AGRI-98273",
    cropName: "Maize (मक्का)",
    cropType: "Ganga-11",
    area: 4.0,
    sowingDate: new Date("2026-03-10"),
    isDamaged: true,
    damageDetails: {
      damageType: "Drought",
      damageDescription: "Foliage drying up due to lack of ground moisture and high heat.",
      damageSeverity: "Medium"
    },
    images: [dummyImage],
    location: { lat: 25.5891, lng: 85.1482, accuracy: 10 },
    weatherData: {
      temp: 39,
      humidity: 28,
      windSpeed: 16,
      description: "Haze and dry winds",
      rawResponse: { mock: true, temp: 39, humidity: 28, description: "dry heat" }
    },
    gpsWeatherStatus: "Verified",
    status: "Pending",
    comments: "",
    createdBy: users[0],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    toObject() { return this; }
  };
  surveys.push(survey3);

  // Weather Log for Survey 3
  weatherLogs.push({
    _id: "mock_weatherlog_maize_003",
    survey: survey3Id,
    coordinates: survey3.location,
    weatherFetched: survey3.weatherData.rawResponse,
    status: "Match",
    reason: "Drought metrics match high temperature (39°C) and low humidity (28%).",
    createdAt: survey3.createdAt
  });

  // AI Analysis for Survey 3
  aiAnalyses.push({
    _id: "mock_ai_maize_003",
    survey: survey3Id,
    cropHealth: 45,
    damageType: "Drought Damage",
    severity: "Medium",
    confidence: 87,
    recommendation: "Introduce immediate water sprinklers. Apply potassium nitrate nutrient booster.",
    createdAt: survey3.createdAt
  });

  // Claim for Survey 3
  claims.push({
    _id: "mock_claim_maize_003",
    survey: survey3Id,
    farmer: users[1]._id,
    policyId: "AGRI-98273",
    status: "Initiated",
    estimatedPayout: 20000, // 4 acres * 5,000 for Medium severity
    approvedPayout: 0,
    createdAt: survey3.createdAt,
    toObject() { return this; }
  });

  // Notifications for Survey 3
  notifications.push({
    _id: "mock_notif_f_003",
    recipient: users[1]._id,
    titleEn: "Crop Damage Survey Submitted",
    titleHi: "फसल क्षति सर्वेक्षण जमा किया गया",
    messageEn: "An AEW worker has submitted a damage report for your Maize (मक्का) crop. Audit is pending.",
    messageHi: "एक कृषि कार्यकर्ता ने आपकी मक्का फसल के लिए नुकसान की रिपोर्ट जमा की है। ऑडिट लंबित है।",
    type: "survey_submitted",
    surveyId: survey3Id,
    read: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  });

  // Officer Notification for Survey 3
  notifications.push({
    _id: "mock_notif_o_003",
    recipient: users[2]._id, // Amit Sharma (Officer)
    titleEn: "New Claim Pending Review: Policy #AGRI-98273",
    titleHi: "नया दावा समीक्षा लंबित है: पॉलिसी #AGRI-98273",
    messageEn: "A new survey was submitted by Rajnish Kumar for farmer Hari Singh. Weather status is Verified.",
    messageHi: "रजनीश कुमार द्वारा किसान हरि सिंह के लिए एक नया सर्वेक्षण प्रस्तुत किया गया है। मौसम की स्थिति सत्यापित है।",
    type: "survey_submitted",
    surveyId: survey3Id,
    read: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  });


  // --- Mock Survey 4: Resurvey Required (Pulses Pest Damage) ---
  const survey4Id = "mock_survey_pulses_004";

  const survey4 = {
    _id: survey4Id,
    farmerName: "Hari Singh",
    farmerPhone: "9988776655",
    policyId: "AGRI-98273",
    cropName: "Pulses (दालें)",
    cropType: "Pusa-16 (Arhar)",
    area: 1.5,
    sowingDate: new Date("2026-01-20"),
    isDamaged: true,
    damageDetails: {
      damageType: "Pest",
      damageDescription: "Reported minor leaf damage on young shoots.",
      damageSeverity: "Low"
    },
    images: [dummyImage],
    location: { lat: 25.5910, lng: 85.1299, accuracy: 15 },
    weatherData: {
      temp: 24,
      humidity: 50,
      windSpeed: 10,
      description: "Clear skies",
      rawResponse: { mock: true, temp: 24, humidity: 50, description: "clear" }
    },
    gpsWeatherStatus: "Verified",
    status: "Resurvey Required",
    comments: "Image clarity is low. Please capture closer photos of the crop roots and stem base to evaluate pest damage severity.",
    createdBy: users[0],
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
    toObject() { return this; }
  };
  surveys.push(survey4);

  // Weather Log for Survey 4
  weatherLogs.push({
    _id: "mock_weatherlog_pulses_004",
    survey: survey4Id,
    coordinates: survey4.location,
    weatherFetched: survey4.weatherData.rawResponse,
    status: "Match",
    reason: "Weather metrics correlate with dry field conditions suitable for pulses growth.",
    createdAt: survey4.createdAt
  });

  // AI Analysis for Survey 4
  aiAnalyses.push({
    _id: "mock_ai_pulses_004",
    survey: survey4Id,
    cropHealth: 72,
    damageType: "Pest Damage",
    severity: "Low",
    confidence: 88,
    recommendation: "Apply organic neem extract spray. Clear field boundaries of weeds.",
    createdAt: survey4.createdAt
  });

  // Claim for Survey 4 (Under Review when resurvey is required)
  claims.push({
    _id: "mock_claim_pulses_004",
    survey: survey4Id,
    farmer: users[1]._id,
    policyId: "AGRI-98273",
    status: "Under Review",
    estimatedPayout: 3000, // 1.5 acres * 2000 for Low severity
    approvedPayout: 0,
    remarks: "Resurvey requested. Waiting for AEW worker to submit high-resolution crop photos.",
    createdAt: survey4.createdAt,
    toObject() { return this; }
  });

  // Farmer Notification for Survey 4
  notifications.push({
    _id: "mock_notif_f_004",
    recipient: users[1]._id,
    titleEn: "Resurvey Scheduled for Pulses",
    titleHi: "पुनः सर्वेक्षण निर्धारित (दालें)",
    messageEn: "The review officer has requested a resurvey of your field. Reason: Image clarity is too low.",
    messageHi: "समीक्षा अधिकारी ने आपके खेत के पुनः सर्वेक्षण का अनुरोध किया है। कारण: छवि स्पष्टता बहुत कम है।",
    type: "resurvey",
    surveyId: survey4Id,
    read: false,
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)
  });


  // --- Mock Survey 5: Healthy Crop (Paddy) ---
  const survey5Id = "mock_survey_paddy_healthy_005";

  const survey5 = {
    _id: survey5Id,
    farmerName: "Hari Singh",
    farmerPhone: "9988776655",
    policyId: "AGRI-98273",
    cropName: "Paddy (धान)",
    cropType: "Pusa Basmati 1121",
    area: 5.0,
    sowingDate: new Date("2025-07-15"),
    isDamaged: false, // Healthy crop
    images: [dummyImage],
    location: { lat: 25.6015, lng: 85.1220, accuracy: 6 },
    weatherData: {
      temp: 31,
      humidity: 82,
      windSpeed: 12,
      description: "Humid air, scattered cloud cover",
      rawResponse: { mock: true, temp: 31, humidity: 82, description: "monsoon clouds" }
    },
    gpsWeatherStatus: "Verified",
    status: "Approved", // Approved as verified healthy report
    comments: "Healthy crop verified. Excellent growth index and standard soil irrigation detected.",
    createdBy: users[0],
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    toObject() { return this; }
  };
  surveys.push(survey5);

  // Weather Log for Survey 5
  weatherLogs.push({
    _id: "mock_weatherlog_paddy_005",
    survey: survey5Id,
    coordinates: survey5.location,
    weatherFetched: survey5.weatherData.rawResponse,
    status: "Match",
    reason: "Weather indicators (82% humidity) correlate perfectly with normal paddy water levels.",
    createdAt: survey5.createdAt
  });

  // AI Analysis for Survey 5
  aiAnalyses.push({
    _id: "mock_ai_paddy_005",
    survey: survey5Id,
    cropHealth: 96,
    damageType: "Healthy Crop",
    severity: "Low",
    confidence: 95,
    recommendation: "Maintain field moisture level. Standard nitrogen application is sufficient.",
    createdAt: survey5.createdAt
  });

  // No Claim record is generated when isDamaged is false.

  // Notification for Survey 5
  notifications.push({
    _id: "mock_notif_f_005",
    recipient: users[1]._id,
    titleEn: "Crop Survey Report Approved",
    titleHi: "फसल सर्वेक्षण रिपोर्ट स्वीकृत",
    messageEn: "Your Paddy crop survey has been audited as healthy and approved. No active claim required.",
    messageHi: "आपकी धान की फसल के सर्वेक्षण को स्वस्थ और स्वीकृत के रूप में ऑडिट किया गया है। किसी सक्रिय दावे की आवश्यकता नहीं है।",
    type: "approved",
    surveyId: survey5Id,
    read: true,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  });


  // --- Mock Survey 6: Pending Claim (Wheat Drought Damage) ---
  const survey6Id = "mock_survey_wheat_drought_006";

  const survey6 = {
    _id: survey6Id,
    farmerName: "Hari Singh",
    farmerPhone: "9988776655",
    policyId: "AGRI-98273",
    cropName: "Wheat (गेंहू)",
    cropType: "Sonalika HD-1553",
    area: 2.0,
    sowingDate: new Date("2025-11-20"),
    isDamaged: true,
    damageDetails: {
      damageType: "Drought",
      damageDescription: "Signs of moisture stress. Leaf tips showing chlorosis.",
      damageSeverity: "Medium"
    },
    images: [dummyImage],
    location: { lat: 25.5901, lng: 85.1510, accuracy: 10 },
    weatherData: {
      temp: 34,
      humidity: 32,
      windSpeed: 15,
      description: "Hazy sunshine, dry heat",
      rawResponse: { mock: true, temp: 34, humidity: 32, description: "dry hot" }
    },
    gpsWeatherStatus: "Verified",
    status: "Pending",
    comments: "",
    createdBy: users[0],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    toObject() { return this; }
  };
  surveys.push(survey6);

  // Weather Log for Survey 6
  weatherLogs.push({
    _id: "mock_weatherlog_wheat_drought_006",
    survey: survey6Id,
    coordinates: survey6.location,
    weatherFetched: survey6.weatherData.rawResponse,
    status: "Match",
    reason: "Drought condition verified by high heat (34°C) and low relative humidity (32%).",
    createdAt: survey6.createdAt
  });

  // AI Analysis for Survey 6
  aiAnalyses.push({
    _id: "mock_ai_wheat_drought_006",
    survey: survey6Id,
    cropHealth: 55,
    damageType: "Drought Damage",
    severity: "Medium",
    confidence: 90,
    recommendation: "Provide light sprinkler irrigation. Avoid heavy chemical fertilizers at this stage.",
    createdAt: survey6.createdAt
  });

  // Claim for Survey 6
  claims.push({
    _id: "mock_claim_wheat_drought_006",
    survey: survey6Id,
    farmer: users[1]._id,
    policyId: "AGRI-98273",
    status: "Initiated",
    estimatedPayout: 10000, // 2 acres * 5000 rate for Medium severity
    approvedPayout: 0,
    createdAt: survey6.createdAt,
    toObject() { return this; }
  });

  // Officer Notification for Survey 6
  notifications.push({
    _id: "mock_notif_o_006",
    recipient: users[2]._id,
    titleEn: "New Claim Pending Review: Policy #AGRI-98273",
    titleHi: "नया दावा समीक्षा लंबित है: पॉलिसी #AGRI-98273",
    messageEn: "A new survey was submitted by Rajnish Kumar for farmer Hari Singh. Weather status is Verified.",
    messageHi: "रजनीश कुमार द्वारा किसान हरि सिंह के लिए एक नया सर्वेक्षण प्रस्तुत किया गया है। मौसम की स्थिति सत्यापित है।",
    type: "survey_submitted",
    surveyId: survey6Id,
    read: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  });

  console.log("Mock data (Surveys, Claims, WeatherLogs, AIAnalyses, Notifications) seeded successfully.");
};
