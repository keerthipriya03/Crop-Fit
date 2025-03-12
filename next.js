// Soil pH Ranges
const soilPH = {
    black: { min: 6.5, max: 7.5 },
    brown: { min: 5.5, max: 7.0 },
    gray: { min: 4.5, max: 6.0 },
    red: { min: 4.5, max: 6.5 },
    yellow: { min: 5.0, max: 6.5 }
};

// Function to check the pH and display appropriate soil options
function checkPH() {
    let phInput = parseFloat(document.getElementById("pH").value);
    let soilSelection = document.getElementById("soilSelection");
    let buttons = document.querySelectorAll(".soil-btn");

    if (isNaN(phInput) || phInput < 0 || phInput > 14) {
        soilSelection.classList.add("hidden");
        return;
    }

    buttons.forEach(button => {
        let soilType = button.getAttribute("data-value");
        let { min, max } = soilPH[soilType];

        if (phInput >= min && phInput <= max) {
            button.style.display = "flex";  
        } else {
            button.style.display = "none";  
        }
    });

    let visibleSoils = Array.from(buttons).some(button => button.style.display === "flex");
    if (visibleSoils) {
        soilSelection.classList.remove("hidden");
    } else {
        soilSelection.classList.add("hidden");
    }
}

// Add event listeners to soil buttons
document.querySelectorAll(".soil-btn").forEach(button => {
    button.addEventListener("click", function() {
        document.querySelectorAll(".soil-btn").forEach(btn => btn.classList.remove("selected"));
        this.classList.add("selected");
        document.getElementById("locationSection").classList.remove("hidden");
    });
});

// Detect User Location
// function getUserLocation() {
//     if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(async function(position) {
//             let lat = position.coords.latitude;
//             let lon = position.coords.longitude;

//             let response = await fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}');
//             let data = await response.json();

//             if (data.address && data.address.state) {
//                 document.getElementById('state').value = data.address.state;
//             } else {
//                 alert("Could not determine your state. Please enter it manually.");
//             }
//         }, function(error) {
//             alert("Location access denied. Please enter your state manually.");
//         });
//     } else {
//         alert("Geolocation is not supported in your browser.");
//     }
// }



// Function to get the selected soil type
function getSelectedSoilType() {
    let selectedBtn = document.querySelector(".soil-btn.selected");
    return selectedBtn ? selectedBtn.getAttribute("data-value") : null;
}

// Mapping generic "millets" to specific types based on conditions
function getSpecificMillet(state, soilType) {
    const milletTypes = {
        "Bajra": ["Rajasthan", "Gujarat", "Madhya Pradesh", "Sandy"],
        "Ragi": ["Karnataka", "Tamil Nadu", "Hilly"],
        "Jowar": ["Maharashtra", "Andhra Pradesh", "Black Soil"],
        "Foxtail Millet": ["Odisha", "Jharkhand", "Loamy"]
    };

    for (let millet in milletTypes) {
        if (milletTypes[millet].includes(state) || milletTypes[millet].includes(soilType)) {
            return millet;
        }
    }
    return "Bajra"; // Default millet if no match
}

// Suggest Crop Based on Soil, State, and Month
function getSelectedSoilType() {
    let selectedBtn = document.querySelector(".soil-btn.selected");
    return selectedBtn ? selectedBtn.getAttribute("data-value") : null;
}

// Mapping generic "millets" to specific types based on conditions
function getSpecificMillet(state, soilType) {
    const milletTypes = {
        "Bajra": ["Rajasthan", "Gujarat", "Madhya Pradesh", "Sandy"],
        "Ragi": ["Karnataka", "Tamil Nadu", "Hilly"],
        "Jowar": ["Maharashtra", "Andhra Pradesh", "Black Soil"],
        "Foxtail Millet": ["Odisha", "Jharkhand", "Loamy"]
    };

    for (let millet in milletTypes) {
        if (milletTypes[millet].includes(state) || milletTypes[millet].includes(soilType)) {
            return millet;
        }
    }
    return "Bajra"; // Default millet if no match
}

// Suggest Multiple Crops Based on Soil, State, and Month
function suggestCrop() {
    let soilType = getSelectedSoilType();
    let month = document.getElementById('month').value;

    if (!soilType || !month) {
        alert("Please enter all required details.");
        return;
    }

    let crops = cropDatabase[soilType]?.[month];

    if (crops && crops.length > 0) {
        let recommendedCrops = crops.map(crop => {
            let cropName = crop.name;

            // If the suggested crop is "Millets", determine the specific type
            if (cropName.toLowerCase() === "millets") {
                cropName = getSpecificMillet(state, soilType);
            }

            return {
                name: cropName,
                image: crop.image,
                description: crop.description
            };
        });

        let encodedCrops = encodeURIComponent(JSON.stringify(recommendedCrops));
        let queryString = `result.html?crops=${encodedCrops}`;
        window.location.href = queryString;
    } else {
        alert("No suitable crop found for your selection.");
    }
}
