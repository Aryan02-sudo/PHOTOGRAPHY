// --- 1. NAVIGATIE TUSSEN SECTIES ---
function showPage(pageId) {
    const pages = document.querySelectorAll(".page");
    const buttons = document.querySelectorAll(".bottom-nav button");
    const hero = document.getElementById("home");

    if (pageId === 'home') {
        hero.style.display = "flex";
        hero.classList.add("active");
    } else {
        hero.style.display = "none";
        hero.classList.remove("active");
    }

    pages.forEach(p => {
        p.classList.remove("active");
        p.style.display = "none";
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage && pageId !== 'home') {
        targetPage.style.display = "block";
        setTimeout(() => targetPage.classList.add("active"), 10);
    }

    buttons.forEach(b => b.classList.remove("active"));
    const activeBtn = document.querySelector(`.bottom-nav button[onclick="showPage('${pageId}')"]`);
    if (activeBtn) activeBtn.classList.add("active");

    window.scrollTo({top: 0, behavior: 'smooth'});
}

// --- 2. LOCATIE & PRIJS LOGICA ---
const baseLat = 5.7698; 
const baseLng = -55.2015; 
let map; 
let marker; 
let currentTransportCosts = 0; // Onthoudt de laatste vervoerskosten

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentVal = Math.floor(progress * (end - start) + start);
        obj.innerHTML = currentVal + " SRD";
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

async function calculate(isAuto = false) {
    const name = document.getElementById("name").value;
    const location = document.getElementById("location").value;
    const hours = parseFloat(document.getElementById("hours").value) || 0;
    const phone = document.getElementById("phone").value;
    const startTime = document.getElementById("start-time").value;
    const endTime = document.getElementById("end-time").value;
    const selectedServices = document.querySelectorAll('input[name="service"]:checked');

    // Stop als er geen diensten zijn geselecteerd
    if (selectedServices.length === 0) {
        document.getElementById('total-display').innerText = "0 SRD";
        document.getElementById("result").innerHTML = "";
        return;
    }

    // Alleen alerts tonen als de gebruiker echt op de knop drukt
    if (!isAuto && (!location || !name)) {
        alert("Vul a.u.b. je naam en locatie in.");
        return;
    }

    // 1. REISKOSTEN BEREKENEN (Alleen als locatie lang genoeg is)
    if (location.length > 4) {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location + ", Suriname")}`);
            const data = await res.json();
            
            if (data && data.length > 0) {
                const lat2 = parseFloat(data[0].lat);
                const lon2 = parseFloat(data[0].lon);

                // Map updaten
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

                // Afstand berekenen
                const R = 6371;
                const dLat = (lat2 - baseLat) * Math.PI / 180;
                const dLon = (lon2 - baseLng) * Math.PI / 180;
                const a = Math.sin(dLat / 2) ** 2 + Math.cos(baseLat * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
                const distance = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
                
                currentTransportCosts = Math.round(distance * 50); 
            }
        } catch (error) {
            console.error("Locatie fout:", error);
        }
    }

    // 2. DIENSTEN BEREKENEN
    let serviceTotal = 0;
    let serviceNames = [];
    selectedServices.forEach(cb => {
        const val = parseFloat(cb.value);
        const sName = cb.getAttribute('data-name');
        if (val >= 1500) {
            serviceTotal += val; // Vaste prijs
        } else {
            serviceTotal += val * (hours || 1); // Uurprijs
        }
        serviceNames.push(sName);
    });

    // 3. TOTAAL DISPLAY & GLOW
    const finalTotal = serviceTotal + currentTransportCosts;
    const displayElement = document.getElementById('total-display');
    const oldTotal = parseInt(displayElement.innerText) || 0;

    // Glow animatie triggeren
    displayElement.classList.remove('price-glow');
    void displayElement.offsetWidth; 
    displayElement.classList.add('price-glow');

    // Getal animeren
    animateValue("total-display", oldTotal, finalTotal, 800);

    // Splitsing tonen
    document.getElementById("result").innerHTML = `
        <span style="font-size: 0.85rem; color: #2ecc71; font-weight: 600;">
            Diensten: SRD ${serviceTotal} + Vervoer: SRD ${currentTransportCosts}
        </span>
    `;

    // Data opslaan voor WhatsApp
    window.currentBooking = { 
        name, phone, location, services: serviceNames.join(", "), 
        hours, startTime, endTime, transport: currentTransportCosts, 
        serviceTotal, total: finalTotal 
    };
}

// --- 3. WHATSAPP VERSTUREN ---
function sendWhatsApp() {
    const b = window.currentBooking;
    if (!b || b.total === 0) { alert("Vul eerst je gegevens in!"); return; }

    const timeInfo = (b.startTime && b.endTime) ? `⏰ *Tijd:* ${b.startTime} - ${b.endTime}%0A` : "";

    const msg = `*NIEUWE BOEKING: BL4CKEYE*%0A%0A` +
                `👤 *Klant:* ${b.name}%0A` +
                `📞 *Telefoon:* ${b.phone}%0A` +
                `📍 *Locatie:* ${b.location}%0A` +
                `${timeInfo}` +
                `📸 *Diensten:* ${b.services}%0A` +
                `⏳ *Duur:* ${b.hours} uur%0A%0A` +
                `*PRIJSOPGAVE:*%0A` +
                `• Diensten: SRD ${b.serviceTotal}%0A` +
                `• Vervoer: SRD ${b.transport}%0A` +
                `💰 *TOTAAL: SRD ${b.total},-*`;
    
    window.open(`https://wa.me/5978909628?text=${msg}`);
}

// --- 4. CURSOR & INTERACTIE ---
const cursorOuter = document.querySelector(".cursor-outer");
const cursorInner = document.querySelector(".cursor-inner");

window.addEventListener("mousemove", (e) => {
    cursorOuter.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    cursorInner.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
});

document.querySelectorAll('a, button, input, .checkbox-group, .thumb').forEach(item => {
    item.addEventListener('mouseenter', () => cursorOuter.classList.add('cursor-expand'));
    item.addEventListener('mouseleave', () => cursorOuter.classList.remove('cursor-expand'));
});

// --- 5. INITIALISATIE ---
document.addEventListener('DOMContentLoaded', () => {
    // Luister naar alle inputs voor de automatische prijs
    const inputs = document.querySelectorAll('#booking input');
    inputs.forEach(input => {
        input.addEventListener('input', () => calculate(true));
    });
});

function selectService(serviceId) {
    // 1. Ga naar de boekingspagina
    showPage('booking');
    
    // 2. Zet alle vinkjes eerst uit
    document.querySelectorAll('input[name="service"]').forEach(cb => cb.checked = false);
    
    // 3. Zet het gekozen vinkje aan
    const checkbox = document.getElementById(serviceId);
    if (checkbox) {
        checkbox.checked = true;
        // 4. Update de prijs direct
        calculate(true);
    }
}

// --- LIGHTBOX LOGICA ---
function initLightbox() {
    const images = document.querySelectorAll('.grid img');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const captionText = document.getElementById('caption');

    images.forEach(img => {
        img.onclick = function() {
            lightbox.style.display = "block";
            lightboxImg.src = this.src;
            captionText.innerHTML = this.alt; // Gebruikt de 'alt' tekst als bijschrift
        }
    });
}

function closeLightbox() {
    document.getElementById('lightbox').style.display = "none";
}

// Zorg dat de lightbox wordt geïnitialiseerd bij het laden van de pagina
document.addEventListener('DOMContentLoaded', () => {
    initLightbox();
    // ... je andere init functies ...
});

document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'nl',
        height: 'auto',
        headerToolbar: { 
            left: 'prev,next', 
            center: 'title', 
            right: '' 
        },
        // Events uit je planning
        events: [
            { title: 'BEZET', start: '2026-03-28', backgroundColor: '#ff4d4d', borderColor: '#ff4d4d' },
            { title: 'HUWELIJK', start: '2026-04-11', backgroundColor: '#ff4d4d', borderColor: '#ff4d4d' },
            { title: 'SHOOT', start: '2026-04-26', backgroundColor: '#ff4d4d', borderColor: '#ff4d4d' }
        ],
        eventClick: function(info) {
            alert('Op deze datum is Bl4ckeye al geboekt voor: ' + info.event.title);
        }
    });
    calendar.render();
});