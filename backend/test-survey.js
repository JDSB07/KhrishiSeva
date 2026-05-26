async function testSubmit() {
  try {
    const loginRes = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "9876543210", password: "password123", role: "aew" })
    });
    
    if (!loginRes.ok) {
      console.log("Login failed", loginRes.status);
      return;
    }
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    const res = await fetch("http://localhost:5000/api/surveys", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        farmerName: "Test Farmer",
        farmerPhone: "1234567890",
        policyId: "POL123",
        cropName: "Wheat",
        cropType: "Kalyan",
        area: 3.5,
        sowingDate: "2023-01-01",
        isDamaged: false,
        images: ["data:image/jpeg;base64,1234"],
        location: { lat: 25.5941, lng: 85.1376 },
      })
    });
    const data = await res.json();
    console.log("Submit Status:", res.status);
    console.log("Submit Data:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}

testSubmit();
