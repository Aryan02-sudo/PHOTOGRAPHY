const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(cors());

// Dit is het pad naar je Frontend map (één map omhoog en dan Frontend)
const frontendPath = path.join(__dirname, '../Frontend');

// 1. Zorg dat de server de map Frontend kan bereiken
app.use(express.static(frontendPath));

// 2. VERWIJDER ELKE ANDERE app.get('/') DIE JE HAD. 
// Gebruik alleen deze:
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// 3. Boekingen opslaan
app.post("/bookings", (req, res) => {
    try {
        const dbPath = path.join(__dirname, 'db.json');
        let data = [];
        if (fs.existsSync(dbPath)) {
            data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
        }
        data.push(req.body);
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        res.status(201).send("Boeking opgeslagen!");
    } catch (err) {
        res.status(500).send("Fout op de server");
    }
});

const PORT = 3003; // Verander dit van 3000 naar 3001
app.listen(PORT, () => {
    console.log(`🚀 NU MOET HET WERKEN OP: http://localhost:${PORT}`);
});

// 3. Boekingen opslaan (Verbeterde versie voor punt 4)
app.post("/bookings", (req, res) => {
    try {
        const { name, phone, location, service, hours, total, date } = req.body;

        // CONTROLE: Is alles ingevuld? 
        // Dit voorkomt dat er "lege" boekingen in je db.json komen als iemand op de knop klikt zonder te typen.
        if (!name || !phone || !location || !service || !hours) {
            return res.status(400).send("Oeps! Je bent vergeten enkele velden in te vullen.");
        }

        const dbPath = path.join(__dirname, 'db.json');
        let data = [];
        if (fs.existsSync(dbPath)) {
            data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
        }

        // OPTIONEEL: Veiligheidscheck op de prijs
        // Hier zou je kunnen checken of 'total' wel logisch is bij de 'hours', 
        // zodat niemand de prijs handmatig naar 1 SRD verandert in de browser.

        // Voeg de nieuwe boeking toe aan de lijst
        data.push({
            name,
            phone,
            location,
            service,
            hours,
            total,
            date: date || new Date().toLocaleString(), // Gebruik meegegeven datum of de huidige tijd
            status: "pending" // Handig voor later: zo weet je welke je nog moet bellen/mailen
        });

        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        
        console.log(`✅ Nieuwe boeking van ${name} voor ${service} opgeslagen!`);
        res.status(201).send("Boeking succesvol opgeslagen!");

    } catch (err) {
        console.error("Fout bij opslaan:", err);
        res.status(500).send("Er is een fout opgetreden op de server.");
    }
});