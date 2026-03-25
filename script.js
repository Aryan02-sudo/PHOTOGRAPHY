// --- 1. NAVIGATIE TUSSEN SECTIES ---
function showPage(pageId) {
    const pages = document.querySelectorAll(".page");
    const buttons = document.querySelectorAll(".bottom-nav button");

    // Verberg alle pagina's en zet animatie klaar
    pages.forEach(p => {
        p.classList.remove("active");
        p.classList.remove("reveal", "active"); // Reset voor scroll effect
    });
    
    // Deactiveer alle knoppen
    buttons.forEach(b => b.classList.remove("active"));

    // Toon de gekozen pagina
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add("active");
        window.scrollTo({top: 0, behavior: 'smooth'});
    }

    // Zet de juiste knop op active (op basis van onclick)
    const activeBtn = document.querySelector(`.bottom-nav button[onclick="showPage('${pageId}')"]`);
    if (activeBtn) activeBtn.classList.add("active");
}

// --- 2. PRIJS LOGICA ---
function getPrice(service, hours) {
    const h = parseFloat(hours) || 1;
    const rates = {
        "feest": 500 * h,
        "shoot": 750 * h,
        "huwelijk": 450 * h,
        "video": 500 * h,
        "short": 1500,
        "commercial": 2000
    };
    return rates[service] || 0;
}

// --- 3. LOCATIE & AFSTAND (Paramaribo Basis) ---
const baseLat = 5.8520; 
const baseLng = -55.2038;

async function calculate() {
    const name = document.getElementById("name").value;
    const location = document.getElementById("location").value;
    const service = document.getElementById("service").value;
    const hours = document.getElementById("hours").value;
    const phone = document.getElementById("phone").value;

    if (!location || !name) {
        alert("Vul a.u.b. je naam en locatie in voor een berekening.");
        return;
    }

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
        const data = await res.json();
        
        if (data.length === 0) {
            alert("Locatie niet gevonden. Probeer een bekendere straat of buurt.");
            return;
        }

        const lat2 = parseFloat(data[0].lat);
        const lon2 = parseFloat(data[0].lon);

        // Haversine formule voor afstand
        const R = 6371;
        const dLat = (lat2 - baseLat) * Math.PI / 180;
        const dLon = (lon2 - baseLng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(baseLat * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) ** 2;
        const distance = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

        const basePrice = getPrice(service, hours);
        const transport = Math.round(distance) * 25; // SRD 25 per km
        const total = basePrice + transport;

        window.currentBooking = { name, phone, location, service, hours, total };
        document.getElementById("result").innerText = `Totaal: SRD ${total},-`;
        
    } catch (error) {
        console.error("Fout bij berekenen:", error);
    }
}

// --- 4. WHATSAPP VERSTUREN ---
function sendWhatsApp() {
    const b = window.currentBooking;
    if (!b) {
        alert("Bereken eerst de prijs!");
        return;
    }

    let msg = `*NIEUWE BOEKING BL4CKEYE*%0A` +
              `--------------------------%0A` +
              `*Klant:* ${b.name}%0A` +
              `*Telefoon:* ${b.phone}%0A` +
              `*Service:* ${b.service}%0A` +
              `*Locatie:* ${b.location}%0A` +
              `*Duur:* ${b.hours} uur%0A%0A` +
              `*Totaalprijs:* SRD ${b.total},-`;
    
    window.open(`https://wa.me/5978909628?text=${msg}`);
}

// --- 5. SCROLL EFFECTS & BACK TO TOP ---
window.addEventListener('scroll', () => {
    // Reveal animatie
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(r => {
        let windowHeight = window.innerHeight;
        let revealTop = r.getBoundingClientRect().top;
        if (revealTop < windowHeight - 100) {
            r.classList.add('active');
        }
    });

    // Back to Top knop tonen
    const btt = document.getElementById("backToTop");
    if (window.scrollY > 400) {
        btt.style.display = "block";
    } else {
        btt.style.display = "none";
    }
});

document.getElementById("backToTop").onclick = () => {
    window.scrollTo({top: 0, behavior: 'smooth'});
};
var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'nl',
    // Verwijder 'contentHeight' en gebruik 'aspectRatio'
    handleWindowResize: true,
    expandRows: true, // Zorgt dat rijen de ruimte opvullen
    height: 'auto',   // Laat de kalender zijn natuurlijke hoogte pakien
    headerToolbar: { 
        left: 'prev,next', 
        center: 'title', 
        right: '' 
    },
    // ... je events
});