const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Uses ?dates=20250907 to force ESPN to fetch Week 1 games from last season for off-season testing
const ESPN_URL = "https://api-espn.com";

app.get('/scores', async (req, res) => {
    try {
        const response = await axios.get(ESPN_URL);
        const events = response.data.events || [];
        let simplifiedGames = {};

        if (events.length === 0) {
            return res.json({ message: "No games found for this date parameter." });
        }

        events.forEach(game => {
            const gameID = "Game_" + game.id;
            
            // Safely fetch status and match data using valid optional chaining (?.)
            const status = game.status && game.status.type ? game.status.type.detail : "Unknown";
            const isFinished = game.status && game.status.type ? game.status.type.completed : false;
            
            const competitions = game.competitions || [];
            const competitors = competitions[0] ? competitions[0].competitors : [];
            
            if (!competitors || competitors.length < 2) return;

            const homeData = competitors.find(c => c.homeAway === 'home');
            const awayData = competitors.find(c => c.homeAway === 'away');

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
        console.error("Internal Server Logs:", error.message);
        res.status(500).json({ error: "Failed to fetch ESPN data", details: error.message });
    }
});

app.listen(PORT, () => console.log(`Server is running smoothly on port ${PORT}`));
