const slidess = document.querySelector('.slidess');
const images = document.querySelectorAll('.slidess img');
// const prevBtn = document.getElementById('prevBtn');
// const nextBtn = document.getElementById('nextBtn');

let currentIndex = 0;
const imageWidth = images[0].clientWidth;
let autoSlideInterval;
let slideDirection = 1; // 1 for forward, -1 for backward

function updateSlider() {
    slidess.style.transform = `translateX(-${currentIndex * imageWidth}px)`;
}

function startAutoSlide() {
    autoSlideInterval = setInterval(() => {
        currentIndex = (currentIndex + slideDirection + images.length) % images.length;
        updateSlider();
    }, 8000);
}

function stopAutoSlide() {
    clearInterval(autoSlideInterval);
}

nextBtn.addEventListener('click', () => {
    stopAutoSlide(); // Clear the interval first
    slideDirection = 1;
    currentIndex = (currentIndex + 1) % images.length;
    updateSlider();
    startAutoSlide(); // Restart with the new direction
});

prevBtn.addEventListener('click', () => {
    stopAutoSlide(); // Clear the interval first
    slideDirection = -1;
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateSlider();
    startAutoSlide(); // Restart with the new direction
});

startAutoSlide(); // Start the automatic slide initially