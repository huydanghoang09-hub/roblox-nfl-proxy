const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Adding historical parameters (?dates=2025) forces ESPN to return real match data during the summer off-season
const ESPN_URL = "https://api-espn.com";

app.get('/scores', async (req, res) => {
    try {
        const response = await axios.get(ESPN_URL);
        const events = response.data.events || [];
        let simplifiedGames = {};

        // If there are no games at all, return an empty object instead of crashing
        if (events.length === 0) {
            return res.json({ message: "No active games found for this period." });
        }

        events.forEach(game => {
            const gameID = "Game_" + game.id;
            const status = game.status?.type?.detail || "Unknown"; 
            const isFinished = game.status?.type?.completed || false;
            
            const competitors = game.competitions?.[0]?.competitors || [];
            const homeData = competitors.find(c => c.homeAway === 'home');
            const awayData = competitors.find(c => c.homeAway === 'away');

            // Skip this specific game loop entry if team data structure is missing
            if (!homeData || !awayData) return;

            let winner = "None";
            if (isFinished) {
                winner = (parseInt(homeData.score) > parseInt(awayData.score)) ? homeData.team.displayName : awayData.team.displayName;
            }

            simplifiedGames[gameID] = {
                home: homeData.team.displayName,
                homeScore: homeData.score,
                away: awayData.team.displayName,
                awayScore: awayData.score,
                status: status,
                isFinished: isFinished,
                winner: winner
            };
        });

        res.json(simplifiedGames);
    } catch (error) {
        console.error("Internal Error Log:", error.message);
        res.status(500).json({ error: "Failed to fetch ESPN data", details: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
