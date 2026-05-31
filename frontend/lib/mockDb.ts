import bcrypt from "bcryptjs";

// Initialize global mock database container if not present to persist data across Next.js re-compilations/Route Handlers
if (!(global as any).mockDb) {
  (global as any).mockDb = {
    users: [],
    surveys: [],
    claims: [],
    notifications: [],
    aiAnalyses: [],
    weatherLogs: [],
    seeded: false
  };
}

export const users = (global as any).mockDb.users;
export const surveys = (global as any).mockDb.surveys;
export const claims = (global as any).mockDb.claims;
export const notifications = (global as any).mockDb.notifications;
export const aiAnalyses = (global as any).mockDb.aiAnalyses;
export const weatherLogs = (global as any).mockDb.weatherLogs;

// Helper to hash passwords during mock registration
export const hashPasswordSync = (password: string): string => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

// Seed initial demo users into the mock database
export const seedMockDatabase = () => {
  if ((global as any).mockDb.seeded) return; // already seeded

  console.log("🌱 Seeding In-Memory Mock Database Store (Global Cache)...");
  
  const hashedPassword = hashPasswordSync("password123");

  // Clear existing mock data first
  users.length = 0;
  surveys.length = 0;
  claims.length = 0;
  notifications.length = 0;
  aiAnalyses.length = 0;
  weatherLogs.length = 0;

  // 1. AEW Worker (Vikram Singh)
  users.push({
    _id: "mock_user_aew_123",
    name: "Vikram Singh",
    phone: "9876543210",
    password: hashedPassword,
    role: "aew",
    district: "Patna",
    state: "Bihar",
    createdAt: new Date(),
    toObject() { return { ...this }; }
  });

  // 2. Farmer 1 (Ramesh Prasad)
  users.push({
    _id: "mock_user_farmer_456",
    name: "Ramesh Prasad",
    phone: "9988776655",
    password: hashedPassword,
    role: "farmer",
    policyId: "AGRI-88402",
    district: "Patna",
    state: "Bihar",
    createdAt: new Date(),
    toObject() { return { ...this }; }
  });

  // 3. Farmer 2 (Sunita Devi)
  users.push({
    _id: "mock_user_farmer_101",
    name: "Sunita Devi",
    phone: "9876123456",
    password: hashedPassword,
    role: "farmer",
    policyId: "AGRI-77319",
    district: "Patna",
    state: "Bihar",
    createdAt: new Date(),
    toObject() { return { ...this }; }
  });

  // 4. District Officer (Sanjay Verma)
  users.push({
    _id: "mock_user_officer_789",
    name: "Sanjay Verma",
    phone: "9123456789",
    password: hashedPassword,
    role: "officer",
    district: "Patna",
    state: "Bihar",
    createdAt: new Date(),
    toObject() { return { ...this }; }
  });

  console.log("Mock users seeded successfully.");

  const dummyImage = "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";

  // --- Survey 1: Ramesh Prasad - Flood Damage (Pending) ---
  const survey1Id = "mock_survey_rice_001";
  const survey1 = {
    _id: survey1Id,
    farmerName: "Ramesh Prasad",
    farmerPhone: "9988776655",
    policyId: "AGRI-88402",
    cropName: "Rice (धान)",
    cropType: "Swarna Mansuri MTU-7029",
    area: 4.5,
    sowingDate: new Date("2025-06-15"),
    isDamaged: true,
    damageDetails: {
      damageType: "Flood",
      damageDescription: "Severe water logging and flooding across the field due to Ganga river overflow.",
      damageSeverity: "High"
    },
    images: [dummyImage],
    location: { lat: 25.5941, lng: 85.1376, accuracy: 8 },
    weatherData: {
      temp: 22,
      humidity: 95,
      windSpeed: 14,
      description: "Heavy rain, high river runoff",
      rawResponse: { mock: true, temp: 22, humidity: 95, description: "heavy downpour" }
    },
    gpsWeatherStatus: "Verified",
    status: "Pending",
    comments: "",
    createdBy: {
      _id: users[0]._id,
      name: users[0].name,
      phone: users[0].phone,
      district: users[0].district,
      role: users[0].role
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    toObject() { return this; }
  };
  surveys.push(survey1);

  // Weather Log for Survey 1
  weatherLogs.push({
    _id: "mock_weatherlog_rice_001",
    survey: survey1Id,
    coordinates: survey1.location,
    weatherFetched: survey1.weatherData.rawResponse,
    status: "Match",
    reason: "Local humidity of 95% and heavy downpour report matches the river overflow flood status.",
    createdAt: survey1.createdAt
  });

  // AI Analysis for Survey 1
  aiAnalyses.push({
    _id: "mock_ai_rice_001",
    survey: survey1Id,
    cropHealth: 25,
    damageType: "Flood Damage",
    severity: "High",
    confidence: 94,
    recommendation: "Drain excess water immediately. Field is completely submerged. Re-sowing may be required if roots rot.",
    createdAt: survey1.createdAt
  });

  // Claim for Survey 1
  claims.push({
    _id: "mock_claim_rice_001",
    survey: survey1Id,
    farmer: users[1]._id, // Ramesh Prasad
    policyId: "AGRI-88402",
    status: "Initiated",
    estimatedPayout: 45000, // 4.5 acres * 10,000 for High severity
    approvedPayout: 0,
    createdAt: survey1.createdAt,
    toObject() { return this; }
  });

  // Notifications for Survey 1
  notifications.push({
    _id: "mock_notif_f_001",
    recipient: users[1]._id,
    titleEn: "Crop Damage Survey Submitted",
    titleHi: "फसल क्षति सर्वेक्षण जमा किया गया",
    messageEn: "Your crop damage report for Rice has been submitted. Status is pending review.",
    messageHi: "धान की फसल के नुकसान की रिपोर्ट जमा हो गई है। स्थिति समीक्षा के लिए लंबित है।",
    type: "survey_submitted",
    surveyId: survey1Id,
    read: false,
    createdAt: survey1.createdAt
  });

  // Officer Notification for Survey 1
  notifications.push({
    _id: "mock_notif_o_001",
    recipient: users[3]._id, // Sanjay Verma (Officer)
    titleEn: "New Claim Pending Review: Policy #AGRI-88402",
    titleHi: "नया दावा समीक्षा लंबित है: पॉलिसी #AGRI-88402",
    messageEn: "A new flood survey has been submitted by Vikram Singh for farmer Ramesh Prasad.",
    messageHi: "विक्रम सिंह द्वारा किसान रमेश प्रसाद के लिए बाढ़ का एक नया सर्वेक्षण प्रस्तुत किया गया है।",
    type: "survey_submitted",
    surveyId: survey1Id,
    read: false,
    createdAt: survey1.createdAt
  });


  // --- Survey 2: Ramesh Prasad - Pest Infestation (Approved) ---
  const survey2Id = "mock_survey_mustard_002";
  const survey2 = {
    _id: survey2Id,
    farmerName: "Ramesh Prasad",
    farmerPhone: "9988776655",
    policyId: "AGRI-88402",
    cropName: "Mustard (सरसों)",
    cropType: "Pusa Mustard-25",
    area: 2.0,
    sowingDate: new Date("2025-10-10"),
    isDamaged: true,
    damageDetails: {
      damageType: "Pest",
      damageDescription: "Severe aphid outbreak causing leaves to curl and dry, reducing oilseed yield.",
      damageSeverity: "Medium"
    },
    images: [dummyImage],
    location: { lat: 25.5891, lng: 85.1482, accuracy: 10 },
    weatherData: {
      temp: 28,
      humidity: 55,
      windSpeed: 8,
      description: "Dry and humid skies",
      rawResponse: { mock: true, temp: 28, humidity: 55, description: "dry wind" }
    },
    gpsWeatherStatus: "Verified",
    status: "Approved",
    comments: "Verified by Officer Verma. High incidence of aphids matching district agricultural department alerts.",
    createdBy: {
      _id: users[0]._id,
      name: users[0].name,
      phone: users[0].phone,
      district: users[0].district,
      role: users[0].role
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    toObject() { return this; }
  };
  surveys.push(survey2);

  // Weather Log for Survey 2
  weatherLogs.push({
    _id: "mock_weatherlog_mustard_002",
    survey: survey2Id,
    coordinates: survey2.location,
    weatherFetched: survey2.weatherData.rawResponse,
    status: "Match",
    reason: "Mild temperatures and 55% humidity match optimal conditions for aphid pest reproduction.",
    createdAt: survey2.createdAt
  });

  // AI Analysis for Survey 2
  aiAnalyses.push({
    _id: "mock_ai_mustard_002",
    survey: survey2Id,
    cropHealth: 60,
    damageType: "Pest Damage",
    severity: "Medium",
    confidence: 89,
    recommendation: "Apply imidacloprid spray or neem-based organic pesticide to control aphid spread.",
    createdAt: survey2.createdAt
  });

  // Claim for Survey 2
  claims.push({
    _id: "mock_claim_mustard_002",
    survey: survey2Id,
    farmer: users[1]._id,
    policyId: "AGRI-88402",
    status: "Approved",
    estimatedPayout: 10000, // 2.0 acres * 5,000 for Medium severity
    approvedPayout: 10000,
    resolutionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    remarks: "Field visit and AI analysis align. Settlement of ₹10,000 approved.",
    createdAt: survey2.createdAt,
    toObject() { return this; }
  });

  // Notification for Survey 2
  notifications.push({
    _id: "mock_notif_f_002",
    recipient: users[1]._id,
    titleEn: "Insurance Claim Approved!",
    titleHi: "बीमा दावा स्वीकृत किया गया!",
    messageEn: "Your claim for Mustard crop has been approved. Payout of ₹10,000 has been initiated.",
    messageHi: "सरसों की फसल के लिए आपका दावा स्वीकृत हो गया है। ₹10,000 का भुगतान शुरू कर दिया गया है।",
    type: "approved",
    surveyId: survey2Id,
    read: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  });


  // --- Survey 3: Sunita Devi - Drought Mismatch (Rejected/Suspicious) ---
  const survey3Id = "mock_survey_maize_003";
  const survey3 = {
    _id: survey3Id,
    farmerName: "Sunita Devi",
    farmerPhone: "9876123456",
    policyId: "AGRI-77319",
    cropName: "Maize (मक्का)",
    cropType: "Ganga Safed-2",
    area: 3.0,
    sowingDate: new Date("2026-03-12"),
    isDamaged: true,
    damageDetails: {
      damageType: "Drought",
      damageDescription: "Claiming severe crop drying and water shortage across the field.",
      damageSeverity: "High"
    },
    images: [dummyImage],
    location: { lat: 25.6124, lng: 85.1105, accuracy: 12 },
    weatherData: {
      temp: 22,
      humidity: 92,
      windSpeed: 10,
      description: "Overcast with light rain showers",
      rawResponse: { mock: true, temp: 22, humidity: 92, description: "drizzle" }
    },
    gpsWeatherStatus: "Suspicious", // Drought claimed but rain/high humidity detected
    status: "Rejected",
    comments: "Rejected. Claimant reported drought damage, but district weather radar recorded rainfall and 92% humidity over the past 7 days.",
    createdBy: {
      _id: users[0]._id,
      name: users[0].name,
      phone: users[0].phone,
      district: users[0].district,
      role: users[0].role
    },
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    toObject() { return this; }
  };
  surveys.push(survey3);

  // Weather Log for Survey 3
  weatherLogs.push({
    _id: "mock_weatherlog_maize_003",
    survey: survey3Id,
    coordinates: survey3.location,
    weatherFetched: survey3.weatherData.rawResponse,
    status: "Mismatch",
    reason: "Reported drought conflicts with recorded 92% local humidity and light rain showers.",
    createdAt: survey3.createdAt
  });

  // AI Analysis for Survey 3
  aiAnalyses.push({
    _id: "mock_ai_maize_003",
    survey: survey3Id,
    cropHealth: 85,
    damageType: "Healthy Crop",
    severity: "Low",
    confidence: 91,
    recommendation: "Crop foliage index is normal. Soil moisture is sufficient. Drought claim rejected by AI model.",
    createdAt: survey3.createdAt
  });

  // Claim for Survey 3
  claims.push({
    _id: "mock_claim_maize_003",
    survey: survey3Id,
    farmer: users[2]._id, // Sunita Devi
    policyId: "AGRI-77319",
    status: "Rejected",
    estimatedPayout: 15000, // 3.0 acres * 5,000 for Medium or 10,000 for High
    approvedPayout: 0,
    resolutionDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    remarks: "Claim verification failed due to weather mismatch and healthy crop readings.",
    createdAt: survey3.createdAt,
    toObject() { return this; }
  });

  // Notification for Survey 3
  notifications.push({
    _id: "mock_notif_f_003",
    recipient: users[2]._id,
    titleEn: "Insurance Claim Rejected",
    titleHi: "बीमा दावा खारिज कर दिया गया",
    messageEn: "Your claim for Maize crop has been rejected due to climatic inconsistencies.",
    messageHi: "मक्का की फसल के लिए आपका दावा जलवायु विसंगतियों के कारण खारिज कर दिया गया है।",
    type: "rejected",
    surveyId: survey3Id,
    read: false,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
  });


  // --- Survey 4: Sunita Devi - Heavy Rain Lodging (Resurvey Required) ---
  const survey4Id = "mock_survey_wheat_004";
  const survey4 = {
    _id: survey4Id,
    farmerName: "Sunita Devi",
    farmerPhone: "9876123456",
    policyId: "AGRI-77319",
    cropName: "Wheat (गेंहू)",
    cropType: "Sonalika HD-1553",
    area: 5.0,
    sowingDate: new Date("2025-11-20"),
    isDamaged: true,
    damageDetails: {
      damageType: "Heavy Rain",
      damageDescription: "Unseasonal heavy rain lodged (flattened) the wheat shoots close to harvest.",
      damageSeverity: "Medium"
    },
    images: [dummyImage],
    location: { lat: 25.5910, lng: 85.1299, accuracy: 15 },
    weatherData: {
      temp: 19,
      humidity: 88,
      windSpeed: 16,
      description: "Storm winds and overcast sky",
      rawResponse: { mock: true, temp: 19, humidity: 88, description: "strong wind" }
    },
    gpsWeatherStatus: "Verified",
    status: "Resurvey Required",
    comments: "Camera photos are blurry. Please take high-contrast closeups of the lodged stalk bases to calculate grain loss percent.",
    createdBy: {
      _id: users[0]._id,
      name: users[0].name,
      phone: users[0].phone,
      district: users[0].district,
      role: users[0].role
    },
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    toObject() { return this; }
  };
  surveys.push(survey4);

  // Weather Log for Survey 4
  weatherLogs.push({
    _id: "mock_weatherlog_wheat_004",
    survey: survey4Id,
    coordinates: survey4.location,
    weatherFetched: survey4.weatherData.rawResponse,
    status: "Match",
    reason: "Recorded unseasonal high winds (16 km/h) and moisture support crop lodging claims.",
    createdAt: survey4.createdAt
  });

  // AI Analysis for Survey 4
  aiAnalyses.push({
    _id: "mock_ai_wheat_004",
    survey: survey4Id,
    cropHealth: 50,
    damageType: "Lodge Damage",
    severity: "Medium",
    confidence: 87,
    recommendation: "Crop flattened. Harvest early if grain is mature. Avoid chemical spray.",
    createdAt: survey4.createdAt
  });

  // Claim for Survey 4
  claims.push({
    _id: "mock_claim_wheat_004",
    survey: survey4Id,
    farmer: users[2]._id,
    policyId: "AGRI-77319",
    status: "Under Review",
    estimatedPayout: 25000, // 5.0 acres * 5,000 for Medium severity
    approvedPayout: 0,
    remarks: "Resurvey requested. Waiting for AEW worker to submit clear crop pictures.",
    createdAt: survey4.createdAt,
    toObject() { return this; }
  });

  // Notification for Survey 4
  notifications.push({
    _id: "mock_notif_f_004",
    recipient: users[2]._id,
    titleEn: "Resurvey Scheduled for Wheat",
    titleHi: "पुनः सर्वेक्षण निर्धारित (गेंहू)",
    messageEn: "The review officer has requested a resurvey of your field due to blurry photos.",
    messageHi: "समीक्षा अधिकारी ने धुंधली तस्वीरों के कारण आपके खेत के पुनः सर्वेक्षण का अनुरोध किया है।",
    type: "resurvey",
    surveyId: survey4Id,
    read: false,
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
  });

  (global as any).mockDb.seeded = true;
  console.log("Mock data (Surveys, Claims, WeatherLogs, AIAnalyses, Notifications) seeded successfully.");
};
