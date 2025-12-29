const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';
const GEO_API_URL = 'https://nominatim.openstreetmap.org';

const state = {
    cities: [],
    currentCityIndex: 0,
    isLoading: false,
    isLocationAllowed: null
};

const weatherCache = {};

const popularCities = [
    { name: 'Москва', country: 'RU', lat: 55.7558, lon: 37.6173 },
    { name: 'Санкт-Петербург', country: 'RU', lat: 59.9343, lon: 30.3351 },
    { name: 'Новосибирск', country: 'RU', lat: 55.0084, lon: 82.9357 },
    { name: 'Екатеринбург', country: 'RU', lat: 56.8389, lon: 60.6057 },
    { name: 'Казань', country: 'RU', lat: 55.7961, lon: 49.1064 },
    { name: 'Нижний Новгород', country: 'RU', lat: 56.3269, lon: 44.0075 },
    { name: 'Красноярск', country: 'RU', lat: 56.0184, lon: 92.8672 },
    { name: 'Челябинск', country: 'RU', lat: 55.1644, lon: 61.4368 },
    { name: 'Самара', country: 'RU', lat: 53.1959, lon: 50.1002 },
    { name: 'Уфа', country: 'RU', lat: 54.7355, lon: 55.9917 },
    { name: 'Ростов-на-Дону', country: 'RU', lat: 47.2357, lon: 39.7015 },
    { name: 'Омск', country: 'RU', lat: 54.9885, lon: 73.3242 },
    { name: 'Краснодар', country: 'RU', lat: 45.0448, lon: 38.976 },
    { name: 'Воронеж', country: 'RU', lat: 51.6606, lon: 39.2006 },
    { name: 'Пермь', country: 'RU', lat: 58.0105, lon: 56.2502 },
    { name: 'Волгоград', country: 'RU', lat: 48.708, lon: 44.5133 }
];

const weatherEmojis = {
    0: '☀️',  1: '🌤️',  2: '⛅',  3: '☁️',
    45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌦️', 55: '🌦️',
    61: '🌧️', 63: '🌧️', 65: '🌧️',
    71: '❄️', 73: '❄️', 75: '❄️',
    80: '🌧️', 81: '🌧️', 82: '🌧️',
    95: '⛈️', 96: '⛈️', 99: '⛈️'
};

const weatherDescriptions = {
    0: 'Ясно', 1: 'Преимущественно ясно', 2: 'Переменная облачность',
    3: 'Пасмурно', 45: 'Туман', 48: 'Иней',
    51: 'Легкая морось', 53: 'Умеренная морось', 55: 'Сильная морось',
    56: 'Легкая ледяная морось', 57: 'Сильная ледяная морось',
    61: 'Небольшой дождь', 63: 'Умеренный дождь', 65: 'Сильный дождь',
    66: 'Легкий ледяной дождь', 67: 'Сильный ледяной дождь',
    71: 'Небольшой снег', 73: 'Умеренный снег', 75: 'Сильный снег',
    77: 'Снежные зерна', 80: 'Небольшой ливень', 81: 'Умеренный ливень',
    82: 'Сильный ливень', 85: 'Снежный ливень', 86: 'Сильный снежный ливень',
    95: 'Гроза', 96: 'Гроза с градом', 99: 'Сильная гроза с градом'
};

const elements = {
    citiesList: document.getElementById('citiesList'),
    weatherContainer: document.getElementById('weatherContainer'),
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    errorMessage: document.getElementById('errorMessage'),
    weatherContent: document.getElementById('weatherContent'),
    locationName: document.getElementById('locationName'),
    currentDate: document.getElementById('currentDate'),
    currentTemp: document.getElementById('currentTemp'),
    weatherIcon: document.getElementById('weatherIcon'),
    weatherDesc: document.getElementById('weatherDesc'),
    feelsLikeTemp: document.getElementById('feelsLikeTemp'),
    windSpeed: document.getElementById('windSpeed'),
    humidity: document.getElementById('humidity'),
    pressure: document.getElementById('pressure'),
    forecastDays: document.getElementById('forecastDays'),
    refreshBtn: document.getElementById('refreshBtn'),
    addCityBtn: document.getElementById('addCityBtn'),
    addCityModal: document.getElementById('addCityModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cityInput: document.getElementById('cityInput'),
    suggestionsContainer: document.getElementById('suggestionsContainer'),
    cityError: document.getElementById('cityError'),
    confirmAddCityBtn: document.getElementById('confirmAddCityBtn'),
    cancelAddCityBtn: document.getElementById('cancelAddCityBtn'),
    locationPermissionModal: document.getElementById('locationPermissionModal'),
    allowLocationBtn: document.getElementById('allowLocationBtn'),
    denyLocationBtn: document.getElementById('denyLocationBtn')
};

function init() {
    loadStateFromStorage();
    setupEventListeners();
    
    if (state.cities.length > 0) {
        elements.locationPermissionModal.classList.add('hidden');
        updateWeatherForCurrentCity();
    } else {
        elements.locationPermissionModal.classList.remove('hidden');
    }
}

function loadStateFromStorage() {
    const savedState = localStorage.getItem('weatherAppState');
    if (savedState) {
        try {
            const parsedState = JSON.parse(savedState);
            state.cities = parsedState.cities || [];
            state.currentCityIndex = parsedState.currentCityIndex || 0;
        } catch (error) {
            console.error('Ошибка загрузки из localStorage:', error);
        }
    }
}

function saveStateToStorage() {
    localStorage.setItem('weatherAppState', JSON.stringify({
        cities: state.cities,
        currentCityIndex: state.currentCityIndex
    }));
}

function setupEventListeners() {
    elements.refreshBtn.addEventListener('click', () => {
        updateAllCitiesWeather();
    });
    
    elements.addCityBtn.addEventListener('click', () => {
        showAddCityModal();
    });
    
    elements.closeModalBtn.addEventListener('click', () => {
        elements.addCityModal.classList.add('hidden');
        clearCityForm();
    });

    elements.cancelAddCityBtn.addEventListener('click', () => {
        elements.addCityModal.classList.add('hidden');
        clearCityForm();
    });
    
    elements.confirmAddCityBtn.addEventListener('click', addCity);
    
    elements.cityInput.addEventListener('input', handleCityInput);
    
    elements.allowLocationBtn.addEventListener('click', requestGeolocation);
    elements.denyLocationBtn.addEventListener('click', () => {
        elements.locationPermissionModal.classList.add('hidden');
        showAddCityModal();
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === elements.addCityModal) {
            elements.addCityModal.classList.add('hidden');
            clearCityForm();
        }
    });
    
    elements.cityInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addCity();
        }
    });
}

function showAddCityModal() {
    elements.addCityModal.classList.remove('hidden');
    elements.cityInput.focus();
}

function clearCityForm() {
    elements.cityInput.value = '';
    elements.suggestionsContainer.innerHTML = '';
    elements.cityError.textContent = '';
    elements.cityError.classList.add('hidden');
}

function handleCityInput() {
    const query = elements.cityInput.value.trim();
    elements.suggestionsContainer.innerHTML = '';
    
    if (query.length < 2) return;
    
    const filteredCities = popularCities.filter(city => 
        city.name.toLowerCase().includes(query.toLowerCase())
    );
    
    if (filteredCities.length > 0) {
        const suggestionsList = document.createElement('div');
        suggestionsList.className = 'suggestions-list';
        
        filteredCities.slice(0, 5).forEach(city => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = `${city.name}, ${city.country}`;
            suggestionItem.addEventListener('click', () => {
                elements.cityInput.value = city.name;
                elements.suggestionsContainer.innerHTML = '';
            });
            suggestionsList.appendChild(suggestionItem);
        });
        
        elements.suggestionsContainer.appendChild(suggestionsList);
    }
}

async function addCity() {
    const cityName = elements.cityInput.value.trim();
    
    if (!cityName) {
        showCityError('Введите название города');
        return;
    }
    
    if (state.cities.some(city => city.name.toLowerCase() === cityName.toLowerCase())) {
        showCityError('Этот город уже добавлен');
        return;
    }
    
    const cityData = popularCities.find(city => 
        city.name.toLowerCase() === cityName.toLowerCase()
    );
    
    if (!cityData) {
        showCityError('Город не найден. Выберите город из списка');
        return;
    }
    
    elements.locationPermissionModal.classList.add('hidden');
    
    const newCity = {
        id: Date.now(),
        name: cityData.name,
        country: cityData.country,
        lat: cityData.lat,
        lon: cityData.lon,
        isCurrentLocation: false
    };
    
    state.cities.push(newCity);
    
    if (state.cities.length === 1) {
        state.currentCityIndex = 0;
    }
    
    saveStateToStorage();
    updateCitiesList();
    updateWeatherForCurrentCity();
    
    elements.addCityModal.classList.add('hidden');
    clearCityForm();
}

function showCityError(message) {
    elements.cityError.textContent = message;
    elements.cityError.classList.remove('hidden');
}

function requestGeolocation() {
    if (!navigator.geolocation) {
        alert('Геолокация не поддерживается вашим браузером');
        elements.locationPermissionModal.classList.add('hidden');
        showAddCityModal();
        return;
    }
    
    elements.locationPermissionModal.classList.add('hidden');
    showLoadingState();
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            await addCityByCoordinates(latitude, longitude, true);
        },
        (error) => {
            console.error('Ошибка геолокации:', error);
            showErrorState('Не удалось определить ваше местоположение');
            setTimeout(() => {
                elements.locationPermissionModal.classList.add('hidden');
                showAddCityModal();
            }, 2000);
        }
    );
}

async function addCityByCoordinates(lat, lon, isCurrentLocation = false) {
    try {
        const response = await fetch(
            `${GEO_API_URL}/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ru&addressdetails=1`
        );
        
        if (!response.ok) {
            throw new Error('Не удалось определить город по координатам');
        }
        
        const geoData = await response.json();
        
        if (!geoData || !geoData.address) {
            throw new Error('Город не найден по указанным координатам');
        }
        
        const address = geoData.address;
        const cityName = address.city || address.town || address.village || address.municipality || 'Неизвестное место';
        const country = address.country_code?.toUpperCase() || 'RU';
        
        if (state.cities.some(city => 
            Math.abs(city.lat - lat) < 0.01 && Math.abs(city.lon - lon) < 0.01
        )) {
            const existingIndex = state.cities.findIndex(
                city => Math.abs(city.lat - lat) < 0.01 && Math.abs(city.lon - lon) < 0.01
            );
            state.currentCityIndex = existingIndex;
            saveStateToStorage();
            updateCitiesList();
            updateWeatherForCurrentCity();
            return;
        }
        
        const newCity = {
            id: Date.now(),
            name: cityName,
            country: country,
            lat: lat,
            lon: lon,
            isCurrentLocation: isCurrentLocation
        };
        
        state.cities.push(newCity);
        state.currentCityIndex = state.cities.length - 1;
        
        saveStateToStorage();
        updateCitiesList();
        updateWeatherForCurrentCity();
        
    } catch (error) {
        console.error('Ошибка при добавлении города по координатам:', error);
        showErrorState('Не удалось определить город по координатам');
        setTimeout(() => {
            showAddCityModal();
        }, 2000);
    }
}

function updateCitiesList() {
    elements.citiesList.innerHTML = '';
    
    if (state.cities.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'Добавьте город для отображения погоды';
        elements.citiesList.appendChild(emptyMessage);
        return;
    }
    
    state.cities.forEach((city, index) => {
        const cityElement = createCityElement(city, index);
        elements.citiesList.appendChild(cityElement);
    });
}

function createCityElement(city, index) {
    const cityElement = document.createElement('div');
    cityElement.className = `city-item ${index === state.currentCityIndex ? 'active' : ''}`;
    
    const cachedWeather = weatherCache[city.id];
    const displayName = city.isCurrentLocation ? 'Текущее местоположение' : city.name;
    
    let weatherHTML = '';
    if (cachedWeather && cachedWeather.current) {
        const temp = Math.round(cachedWeather.current.temperature_2m);
        const desc = cachedWeather.current.description || 'Загрузка...';
        weatherHTML = `
            <div class="city-temp">${temp}°C</div>
            <div class="city-description">${desc}</div>
            <div class="city-date">Обновлено: ${formatTime(Date.now())}</div>
        `;
    } else {
        weatherHTML = `<div class="city-temp">--°C</div>`;
    }
    
    cityElement.innerHTML = `
        <div class="city-item-header">
            <div class="city-name">${displayName}</div>
            ${index !== state.currentCityIndex ? `<button class="remove-city-btn" data-index="${index}">×</button>` : ''}
        </div>
        ${weatherHTML}
    `;
    
    cityElement.addEventListener('click', () => {
        if (index !== state.currentCityIndex) {
            state.currentCityIndex = index;
            saveStateToStorage();
            updateCitiesList();
            updateWeatherForCurrentCity();
        }
    });
    
    if (index !== state.currentCityIndex) {
        const removeBtn = cityElement.querySelector('.remove-city-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                removeCity(index);
            });
        }
    }
    
    return cityElement;
}

function removeCity(index) {
    state.cities.splice(index, 1);
    
    if (state.currentCityIndex >= state.cities.length) {
        state.currentCityIndex = Math.max(0, state.cities.length - 1);
    }
    
    saveStateToStorage();
    updateCitiesList();
    
    if (state.cities.length > 0) {
        updateWeatherForCurrentCity();
    } else {
        showAddCityModal();
    }
}

async function updateAllCitiesWeather() {
    if (state.cities.length === 0) return;
    
    showLoadingState();
    
    try {
        for (let i = 0; i < state.cities.length; i++) {
            const city = state.cities[i];
            const weatherData = await fetchWeatherData(city);
            weatherCache[city.id] = weatherData;
        }
        
        updateCitiesList();
        
        const currentCity = state.cities[state.currentCityIndex];
        updateWeatherUI(currentCity, weatherCache[currentCity.id]);
        showWeatherContent();
    } catch (error) {
        console.error('Ошибка при обновлении погоды:', error);
        showErrorState('Не удалось обновить данные о погоде');
    }
}

async function updateWeatherForCurrentCity() {
    if (state.cities.length === 0) return;
    
    const currentCity = state.cities[state.currentCityIndex];
    showLoadingState();
    
    try {
        const weatherData = await fetchWeatherData(currentCity);
        weatherCache[currentCity.id] = weatherData;
        updateWeatherUI(currentCity, weatherData);
        updateCitiesList();
        showWeatherContent();
    } catch (error) {
        console.error('Ошибка при получении данных о погоде:', error);
        showErrorState('Не удалось загрузить данные о погоде');
    }
}

async function fetchWeatherData(city) {
    try {
        const url = `${WEATHER_API_URL}?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,relative_humidity_2m_max&timezone=auto&forecast_days=3`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Ошибка при получении данных о погоде');
        }
        
        const data = await response.json();
        
        const forecastForThreeDays = processForecastData(data);
        
        return {
            current: {
                temperature_2m: data.current.temperature_2m,
                feels_like: data.current.temperature_2m,
                weather_code: data.current.weather_code,
                description: weatherDescriptions[data.current.weather_code] || 'Неизвестно',
                humidity: data.current.relative_humidity_2m,
                wind_speed: data.current.wind_speed_10m,
                pressure: data.current.surface_pressure
            },
            forecast: forecastForThreeDays
        };
    } catch (error) {
        console.error('Ошибка fetchWeatherData:', error);
        throw error;
    }
}

function processForecastData(data) {
    const forecast = [];
    const daily = data.daily;
    
    for (let i = 0; i < 3 && i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const code = daily.weather_code[i];
        
        forecast.push({
            date: date,
            temperature_2m: (daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2,
            temp_max: daily.temperature_2m_max[i],
            temp_min: daily.temperature_2m_min[i],
            weather_code: code,
            description: weatherDescriptions[code] || 'Неизвестно',
            humidity: daily.relative_humidity_2m_max[i],
            wind_speed: daily.wind_speed_10m_max[i]
        });
    }
    
    return forecast;
}

function updateWeatherUI(city, weatherData) {
    const current = weatherData.current;
    const forecast = weatherData.forecast;
    
    const displayName = city.isCurrentLocation 
        ? 'Текущее местоположение' 
        : `${city.name}, ${city.country}`;
    
    elements.locationName.textContent = displayName;
    elements.currentDate.textContent = formatDate(new Date());
    elements.currentTemp.textContent = Math.round(current.temperature_2m);
    elements.feelsLikeTemp.textContent = Math.round(current.feels_like);
    
    const weatherCode = current.weather_code;
    elements.weatherIcon.textContent = weatherEmojis[weatherCode] || '🌤️';
    elements.weatherDesc.textContent = current.description;
    
    elements.windSpeed.textContent = `${current.wind_speed.toFixed(1)} м/с`;
    elements.humidity.textContent = `${current.humidity}%`;
    elements.pressure.textContent = `${Math.round(current.pressure)} гПа`;
    
    updateForecastUI(forecast);
}

function updateForecastUI(forecast) {
    elements.forecastDays.innerHTML = '';
    
    const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    
    forecast.forEach((dayForecast, index) => {
        const date = dayForecast.date;
        const dayName = index === 0 ? 'Сегодня' : index === 1 ? 'Завтра' : daysOfWeek[date.getDay()];
        
        const forecastElement = document.createElement('div');
        forecastElement.className = 'forecast-day';
        
        const code = dayForecast.weather_code;
        const emoji = weatherEmojis[code] || '🌤️';
        
        forecastElement.innerHTML = `
            <div class="forecast-date">${dayName}</div>
            <div class="forecast-date-small">${formatDate(date, true)}</div>
            <div class="forecast-icon">${emoji}</div>
            <div class="forecast-temp">${Math.round(dayForecast.temp_max)}° / ${Math.round(dayForecast.temp_min)}°</div>
            <div class="forecast-desc">${dayForecast.description}</div>
            <div class="forecast-details">
                <div>💨 Ветер: ${dayForecast.wind_speed.toFixed(1)} м/с</div>
                <div>💧 Влажность: ${Math.round(dayForecast.humidity)}%</div>
            </div>
        `;
        
        elements.forecastDays.appendChild(forecastElement);
    });
}

function formatDate(date, short = false) {
    const options = short 
        ? { day: 'numeric', month: 'short' }
        : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    
    return date.toLocaleDateString('ru-RU', options);
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function showLoadingState() {
    elements.loadingState.classList.remove('hidden');
    elements.errorState.classList.add('hidden');
    elements.weatherContent.classList.add('hidden');
}

function showErrorState(message) {
    elements.errorMessage.textContent = message;
    elements.loadingState.classList.add('hidden');
    elements.errorState.classList.remove('hidden');
    elements.weatherContent.classList.add('hidden');
}

function showWeatherContent() {
    elements.loadingState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.weatherContent.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', init);
