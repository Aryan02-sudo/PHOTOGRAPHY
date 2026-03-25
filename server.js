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

