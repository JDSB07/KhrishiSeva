export interface AIAnalysisResult {
  cropHealth: number;
  damageType: string;
  severity: "Low" | "Medium" | "High";
  confidence: number;
  recommendation: string;
}

export const analyzeCropDamage = async (
  cropName: string,
  declaredDamageType: string
): Promise<AIAnalysisResult> => {
  // Simulate network latency for AI inference
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Determine severity and health based on declared damage
  let cropHealth = 95;
  let severity: "Low" | "Medium" | "High" = "Low";
  let confidence = Math.floor(Math.random() * 15) + 80; // 80% to 95%
  let recommendation = "Foliar application of nutrients. Maintain regular irrigation.";

  if (declaredDamageType === "Flood") {
    cropHealth = Math.floor(Math.random() * 20) + 15; // 15% to 35%
    severity = "High";
    recommendation = "Drain excess water immediately. Apply fungicide to prevent root rot. Re-sow if submergence exceeded 7 days.";
  } else if (declaredDamageType === "Drought") {
    cropHealth = Math.floor(Math.random() * 20) + 30; // 30% to 50%
    severity = "High";
    recommendation = "Implement drip irrigation immediately. Spray potassium nitrate to increase drought tolerance.";
  } else if (declaredDamageType === "Pest") {
    cropHealth = Math.floor(Math.random() * 30) + 40; // 40% to 70%
    severity = "Medium";
    recommendation = "Apply recommended bio-pesticides (Neem Oil) or chlorpyrifos. Prune infected leaves.";
  } else if (declaredDamageType === "Heavy Rain") {
    cropHealth = Math.floor(Math.random() * 25) + 50; // 50% to 75%
    severity = "Medium";
    recommendation = "Clear drainage channels. Apply urea booster once dry to facilitate vegetative recovery.";
  } else if (declaredDamageType === "Other") {
    cropHealth = Math.floor(Math.random() * 30) + 60; // 60% to 90%
    severity = "Low";
    recommendation = "Monitor crop health. Ensure balanced fertilizer application.";
  }

  return {
    cropHealth,
    damageType: declaredDamageType === "None" ? "Healthy Crop" : `${declaredDamageType} Damage`,
    severity,
    confidence,
    recommendation,
  };
};
