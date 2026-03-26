// --- 1. NAVIGATIE TUSSEN SECTIES ---
function showPage(pageId) {
    const pages = document.querySelectorAll(".page");
    const buttons = document.querySelectorAll(".bottom-nav button");
    const hero = document.getElementById("home");

    if (pageId === 'home') {
        hero.style.display = "flex";
    } else {
        hero.style.display = "none";
    }

    pages.forEach(p => p.classList.remove("active"));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add("active");

    buttons.forEach(b => b.classList.remove("active"));
    const activeBtn = document.querySelector(`.bottom-nav button[onclick="showPage('${pageId}')"]`);
    if (activeBtn) activeBtn.classList.add("active");

    window.scrollTo({top: 0, behavior: 'smooth'});
}

// --- 2. LOCATIE & PRIJS LOGICA MET KAART ---
const baseLat = 5.8520; 
const baseLng = -55.2038;
let map; // Variabele voor de kaart
let marker; // Variabele voor de pin op de kaart

async function calculate() {
    const name = document.getElementById("name").value;
    const location = document.getElementById("location").value;
    const hours = parseFloat(document.getElementById("hours").value) || 0;
    const phone = document.getElementById("phone").value;
    const selectedServices = document.querySelectorAll('input[name="service"]:checked');

    if (!location || !name || selectedServices.length === 0 || hours <= 0) {
        alert("Vul a.u.b. alle velden in (Naam, Locatie, Uren en minimaal 1 dienst).");
        return;
    }

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
        const data = await res.json();
        
        let transport = 0;
        if (data.length > 0) {
            const lat2 = parseFloat(data[0].lat);
            const lon2 = parseFloat(data[0].lon);

            // --- KAART UPDATEN ---
            const mapEl = document.getElementById('map');
            mapEl.style.display = "block";

            if (!map) {
                map = L.map('map').setView([lat2, lon2], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            } else {
                map.setView([lat2, lon2], 13);
            }

            if (marker) map.removeLayer(marker);
            marker = L.marker([lat2, lon2]).addTo(map).bindPopup(location).openPopup();

            // --- AFSTAND BEREKENEN ---
            const R = 6371;
            const dLat = (lat2 - baseLat) * Math.PI / 180;
            const dLon = (lon2 - baseLng) * Math.PI / 180;
            const a = Math.sin(dLat / 2) ** 2 +
                      Math.cos(baseLat * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLon / 2) ** 2;
            const distance = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
            transport = Math.round(distance) * 25; 
        }

        let serviceTotal = 0;
        let serviceList = [];
        selectedServices.forEach(cb => {
            serviceTotal += parseFloat(cb.value) * (cb.getAttribute('data-name').toLowerCase().includes('movie') || cb.getAttribute('data-name').toLowerCase().includes('reclame') ? 1 : hours);
            serviceList.push(cb.getAttribute('data-name'));
        });

        const finalTotal = serviceTotal + transport;

        window.currentBooking = { 
            name, phone, location, 
            services: serviceList.join(", "), 
            hours, total: finalTotal 
        };

        document.getElementById("result").innerText = `Totaal: SRD ${finalTotal},- (incl. SRD ${transport} reiskosten)`;
        
    } catch (error) {
        console.error("Fout:", error);
    }
}

// --- 3. WHATSAPP VERSTUREN ---
function sendWhatsApp() {
    const b = window.currentBooking;
    const startTime = document.getElementById("start-time").value;
    const endTime = document.getElementById("end-time").value;

    if (!b) {
        alert("Bereken eerst de prijs!");
        return;
    }

    let timeMsg = (startTime && endTime) ? `*Tijd:* van ${startTime} tot ${endTime}%0A` : "";

    let msg = `*NIEUWE BOEKING BL4CKEYE*%0A` +
              `--------------------------%0A` +
              `*Klant:* ${b.name}%0A` +
              `*Telefoon:* ${b.phone}%0A` +
              `*Diensten:* ${b.services}%0A` +
              `*Locatie:* ${b.location}%0A` +
              timeMsg +
              `*Duur:* ${b.hours} uur%0A%0A` +
              `*Totaalprijs:* SRD ${b.total},-`;
    
    window.open(`https://wa.me/5978909628?text=${msg}`);
}

// --- 4. SCROLL EFFECTS ---
window.addEventListener('scroll', () => {
    const btt = document.getElementById("backToTop");
    if (window.scrollY > 400) {
        btt.style.display = "block";
    } else {
        btt.style.display = "none";
    }
});

if(document.getElementById("backToTop")) {
    document.getElementById("backToTop").onclick = () => {
        window.scrollTo({top: 0, behavior: 'smooth'});
    };
}