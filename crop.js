const modelURL = "./my_model/model.json";
const metadataURL = "./my_model/metadata.json";
let model, labelContainer, maxPredictions;
let cropData = [];

const soilModelURL = "./soilPredict_model/model.json";
const soilMetadataURL = "./soilPredict_model/metadata.json";
let soilModel;

async function isSoilImage(img) {
    if (!soilModel) {
        console.warn("⚠️ Soil verification model not loaded.");
        return false;
    }

    const prediction = await soilModel.predict(img);
    console.log("🌍 Soil Check Predictions:", prediction);

    const bestPrediction = prediction.reduce((max, p) => p.probability > max.probability ? p : max, prediction[0]);
    return bestPrediction.className.toLowerCase() === "soil" && bestPrediction.probability >= 0.8;
}



async function loadCropData() {
    if (cropData.length > 0) return cropData; // Avoids reloading 

    try {
        const response = await fetch("./Crop_recommendation.json");
        cropData = await response.json();
        console.log("✅ Crop Data Loaded:", cropData);
        return cropData;
    } catch (error) {
        console.error("❌ Error loading crop data:", error);
        return [];
    }
}

async function predict(input) {
    if (!model) {
        labelContainer.innerHTML = "⚠️ Model not loaded!";
        return;
    }
    const prediction = await model.predict(input);
    console.log(prediction);
    const bestPrediction = prediction.reduce((max, p) => (p.probability > max.probability ? p : max), prediction[0]);
    labelContainer.innerHTML = "Predicted Soil Type: " + bestPrediction.className;
}
async function extractDominantColor(img) {
    return new Promise((resolve) => {
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let r = 0, g = 0, b = 0, count = 0;

        for (let i = 0; i < imageData.length; i += 4) {
            r += imageData[i];
            g += imageData[i + 1];
            b += imageData[i + 2];
            count++;
        }

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        // document.getElementById("color-container").innerText = `🌈 Dominant Color: RGB(${r}, ${g}, ${b})`;
        console.log(`Dominant Color: RGB(${r}, ${g}, ${b})`);
        if ((r>=150 && r<=200) && (g>=50 && g<=100) && (b>=30 && b<=80)){
            labelContainer.innerHTML = "Predicted Soil Type: " + "LateriteSoil";
        }

        resolve({ r, g, b });
    });
}

// Get NPK Based on Closest pH
async function getNPKFromPH(pH) {
    cropData = await loadCropData();

    let closestMatch = null;
    let minDifference = Number.MAX_VALUE;

    cropData.forEach(crop => {
        let diff = Math.abs(crop.ph - pH);
        if (diff < minDifference) {
            minDifference = diff;
            closestMatch = crop;
        }
    });

    if (closestMatch) {
        return {
            N: closestMatch.N,
            P: closestMatch.P,
            K: closestMatch.K
        };
    } else {
        return { N: "Unknown", P: "Unknown", K: "Unknown" };
    }
}



// Recommend Crops Based on NPK Range
async function recommendCrop(pH) {
    const { N, P, K } = await getNPKFromPH(pH);
    console.log("✅ Extracted NPK:", N, P, K);

    const cropData = await loadCropData();
    const uniqueCrops = new Set();

    cropData.forEach(crop => {
        if (Math.abs(crop.N - N) <= 5 && Math.abs(crop.P - P) <= 5 && Math.abs(crop.K - K) <= 5) {
            uniqueCrops.add(crop.label); // Add unique crop names
        }
    });

    return [...uniqueCrops].map(cropName => ({
        name: cropName,
        image: `crop_img/${cropName.toLowerCase().replace(/\s+/g, '_')}.jpg` 
    }));
}






async function displayRecommendedCrops(pH) {
    const npkContainer = document.getElementById("npk-container");
    const cropContainer = document.getElementById("crop-container");

    if (!pH || isNaN(pH)) {
        npkContainer.innerHTML = "🌾 NPK Values: Invalid pH value";
        cropContainer.innerHTML = "⚠️ No suitable crops found.";
        return;
    }

    const { N, P, K } = await getNPKFromPH(pH);
    console.log("✅ Updating UI with NPK:", N, P, K);

    if (N === "Unknown" || P === "Unknown" || K === "Unknown") {
        npkContainer.innerHTML = "🌾 NPK Values: Data unavailable";
        cropContainer.innerHTML = "⚠️ No crop recommendations.";
        return;
    }

    npkContainer.innerHTML = `🌾 NPK Values: N=${N}, P=${P}, K=${K}`;
    npkContainer.style.display = "block";

    // Get recommended crops
    const recommendedCrops = await recommendCrop(pH);
    console.log("✅ Recommended Crops:", recommendedCrops);

    // Generate HTML with images
    cropContainer.innerHTML = recommendedCrops.length
        ? recommendedCrops.map(crop => `
            <div class="crop-item">
                <img src="${crop.image}" alt="${crop.name}" class="crop-img">
                <p>${crop.name}</p>
            </div>
        `).join("")
        : "⚠️ No suitable crops found.";

    cropContainer.style.display = "block";
}



// Load Model
async function loadModel() {
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
    labelContainer = document.getElementById("label-container");
}

// Upload and Process Image
async function uploadImage(event) {
    clearPrevious();
    const file = event.target.files[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.width = 200;

    img.onload = async () => {
        const validSoil = await isSoilImage(img);
        if (!validSoil) {
            clearPrevious();
            document.getElementById("label-container").classList.remove("hidden");
            document.getElementById("label-container").innerHTML = '<span style="color: red; font-weight: bold;">⚠️ Please upload a valid soil image!</span>';

            return;
        }
    
        document.getElementById("label-container").classList.remove("hidden");
    
        document.getElementById("image-container").innerHTML = "";
        document.getElementById("image-container").appendChild(img);
    
        const { r, g, b } = await extractDominantColor(img);
        const pH = getClosestSoilPH(r, g, b);
        document.getElementById("ph-container").innerText = `🧪 Estimated Soil pH: ${pH}`;
    
        document.getElementById("ph-container").classList.remove("hidden");
        document.getElementById("npk-container").classList.remove("hidden");
        document.getElementById("crop-container").classList.remove("hidden");
    
        await displayRecommendedCrops(pH);
        await predict(img);
        URL.revokeObjectURL(img.src);
    };
    
}

// Find Closest pH
function getClosestSoilPH(r, g, b) {
    let closestMatch = soilData[0];
    let smallestDifference = Number.MAX_VALUE;

    for (let i = 0; i < soilData.length; i++) {
        let diff = Math.sqrt(
            Math.pow(soilData[i].r - r, 2) +
            Math.pow(soilData[i].g - g, 2) +
            Math.pow(soilData[i].b - b, 2)
        );

        if (diff < smallestDifference) {
            smallestDifference = diff;
            closestMatch = soilData[i];
        }
    }
    return closestMatch.pH;
}

function clearPrevious() {
    document.getElementById("image-container").innerHTML = "";
    document.getElementById("label-container").innerText = "🔍 Prediction: N/A";
    document.getElementById("ph-container").innerText = "🧪 Estimated Soil pH: N/A";
    document.getElementById("npk-container").innerText = "🌾 NPK Values: N/A";
    document.getElementById("crop-container").innerHTML = "🌾 Crop recommendations will be displayed here.";

    document.getElementById("label-container").classList.add("hidden");
    document.getElementById("ph-container").classList.add("hidden");
    document.getElementById("npk-container").classList.add("hidden");
    document.getElementById("crop-container").classList.add("hidden");
}


async function initialize() {
    await loadCropData();
    await loadModel();
    soilModel = await tmImage.load(soilModelURL, soilMetadataURL);
}


initialize();

function startCamera() {
    const video = document.getElementById("camera");
    const captureBtn = document.getElementById("capture-btn");
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.style.display = "block";
            video.style.width = "100%";
            video.style.borderRadius = "10px";
            captureBtn.style.display = "block";
        })
        .catch(error => console.error("Error accessing camera:", error));
}

function captureImage() {
    const video = document.getElementById("camera");
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");

    // Capture image from the video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to image
    const img = new Image();
    img.src = canvas.toDataURL("image/png");
    img.width = 200;

    // Display the captured image
    document.getElementById("image-container").innerHTML = "";
    document.getElementById("image-container").appendChild(img);

    // Stop the camera stream
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());

    // Hide the video element
    video.style.display = "none";
    document.getElementById("capture-btn").style.display = "none";

    uploadImageFromCanvas(canvas);
}

function uploadImageFromCanvas(canvas) {
    canvas.toBlob(blob => {
        const file = new File([blob], "captured.png", { type: "image/png" });
        const event = { target: { files: [file] } };
        uploadImage(event);
    });
}
