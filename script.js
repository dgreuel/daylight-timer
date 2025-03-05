// Background images for different times of day
const backgrounds = {
    day: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
    night: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1920&q=80'
};

// DOM elements
const container = document.querySelector('.container');
const countdownElement = document.getElementById('countdown');
const nextEventElement = document.getElementById('next-event');
const locationElement = document.getElementById('location');

let currentPosition = null;
let updateInterval = null;

// Format time as HH:MM:SS
function formatTime(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Update the background based on time of day
function updateBackground(isDay) {
    container.style.backgroundImage = `url(${isDay ? backgrounds.day : backgrounds.night})`;
}

// Get the next sunrise or sunset
function getNextSunEvent() {
    const now = new Date();
    const times = SunCalc.getTimes(now, currentPosition.lat, currentPosition.lng);
    
    // If it's currently day (between sunrise and sunset)
    const isDay = now >= times.sunrise && now < times.sunset;
    
    // Set the next event time
    const nextEvent = isDay ? times.sunset : times.sunrise;
    const nextEventName = isDay ? 'Sunset' : 'Sunrise';
    
    // Update the background
    updateBackground(isDay);
    
    return { time: nextEvent, name: nextEventName };
}

// Update the countdown display
function updateCountdown() {
    if (!currentPosition) return;
    
    const { time, name } = getNextSunEvent();
    const now = new Date();
    const timeUntil = time - now;
    
    if (timeUntil <= 0) {
        // If the event has passed, recalculate for the next day
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextTimes = SunCalc.getTimes(tomorrow, currentPosition.lat, currentPosition.lng);
        const nextEvent = now >= time ? nextTimes.sunrise : nextTimes.sunset;
        const nextEventName = now >= time ? 'Sunrise' : 'Sunset';
        
        countdownElement.textContent = formatTime(nextEvent - now);
        nextEventElement.textContent = `Until ${nextEventName}`;
    } else {
        countdownElement.textContent = formatTime(timeUntil);
        nextEventElement.textContent = `Until ${name}`;
    }
}

// Get user's location
function getLocation() {
    if (!navigator.geolocation) {
        locationElement.textContent = 'Geolocation is not supported by your browser';
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            currentPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            // Get location name using reverse geocoding
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentPosition.lat}&lon=${currentPosition.lng}`)
                .then(response => response.json())
                .then(data => {
                    console.log(data);
                    locationElement.textContent = data.address.city || data.address.town || data.address.village || data.address.hamlet || data.address.suburb || data.address.district || data.address.county || data.address.state || data.address.country;
                })
                .catch(() => {
                    locationElement.textContent = `${currentPosition.lat.toFixed(2)}°, ${currentPosition.lng.toFixed(2)}°`;
                });
            
            // Start the countdown
            updateCountdown();
            if (updateInterval) clearInterval(updateInterval);
            updateInterval = setInterval(updateCountdown, 1000);
        },
        (error) => {
            locationElement.textContent = 'Unable to retrieve your location';
            console.error('Error getting location:', error);
        }
    );
}

// Initialize the app
getLocation(); 