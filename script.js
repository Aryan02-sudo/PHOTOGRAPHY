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
// Dit zijn de coördinaten voor Welgedacht C weg 146
const baseLat = 5.7698; 
const baseLng = -55.2015; 
let map; 
let marker; 

async function calculate() {
    const name = document.getElementById("name").value;
    const location = document.getElementById("location").value;
    const hours = parseFloat(document.getElementById("hours").value) || 0;
    const phone = document.getElementById("phone").value;
    const selectedServices = document.querySelectorAll('input[name="service"]:checked');

    if (!location || !name || selectedServices.length === 0) {
        alert("Vul a.u.b. je naam, locatie en kies minimaal 1 dienst.");
        return;
    }

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location + ", Suriname")}`);
        const data = await res.json();
        
        let transport = 0;

        if (data && data.length > 0) {
            const lat2 = parseFloat(data[0].lat);
            const lon2 = parseFloat(data[0].lon);

            // Kaart update
            const mapEl = document.getElementById('map');
            mapEl.style.display = "block";

            if (!map) {
                map = L.map('map').setView([lat2, lon2], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            } else {
                map.setView([lat2, lon2], 13);
                setTimeout(() => map.invalidateSize(), 200);
            }

            if (marker) map.removeLayer(marker);
            marker = L.marker([lat2, lon2]).addTo(map).bindPopup(location).openPopup();

            // Haversine formule voor afstand vanaf Welgedacht C
            const R = 6371;
            const dLat = (lat2 - baseLat) * Math.PI / 180;
            const dLon = (lon2 - baseLng) * Math.PI / 180;
            const a = Math.sin(dLat / 2) ** 2 +
                      Math.cos(baseLat * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLon / 2) ** 2;
            const distance = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
            
            // Reiskosten: SRD 25 per km (heen en terug is niet meegerekend, 
            // wil je SRD 25 per km voor de totale rit of alleen enkele reis?)
            transport = Math.round(distance * 100); 
        } else {
            alert("Locatie niet gevonden. Probeer: Straatnaam, Wijk.");
            return;
        }

        let serviceTotal = 0;
        let serviceList = [];
        selectedServices.forEach(cb => {
            const serviceName = cb.getAttribute('data-name').toLowerCase();
            // Vaste prijs voor movie/reclame, anders per uur
            if (serviceName.includes('movie') || serviceName.includes('reclame')) {
                serviceTotal += parseFloat(cb.value);
            } else {
                serviceTotal += parseFloat(cb.value) * (hours || 1);
            }
            serviceList.push(cb.getAttribute('data-name'));
        });

        const finalTotal = serviceTotal + transport;

        window.currentBooking = { 
            name, phone, location, 
            services: serviceList.join(", "), 
            hours, total: finalTotal 
        };

        document.getElementById("result").innerHTML = `
            <strong>Totaal geschat: SRD ${finalTotal},-</strong><br>
            <span style="font-size: 0.8rem; color: #aaa;">(Diensten: SRD ${serviceTotal} + Reiskosten: SRD ${transport})</span>
        `;
        
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