const express = require('express');
const axios = require('axios');
const app = express();

app.get('/scores', async (req, res) => {
    try {
        const response = await axios.get("https://api-espn.com");
        const events = response.data.events || [];
        let simplifiedGames = {};

        events.forEach(game => {
            const gameID = "Game_" + game.id;
            const status = game.status?.type?.detail || "Unknown";
            const isFinished = game.status?.type?.completed || false;
            const competitors = game.competitions?.[0]?.competitors || [];
            
            const homeData = competitors.find(c => c.homeAway === 'home');
            const awayData = competitors.find(c => c.homeAway === 'away');

            if (homeData && awayData) {
                simplifiedGames[gameID] = {
                    home: homeData.team.displayName,
                    homeScore: homeData.score,
                    away: awayData.team.displayName,
                    awayScore: awayData.score,
                    status: status,
                    isFinished: isFinished,
                    winner: isFinished ? (parseInt(homeData.score) > parseInt(awayData.score) ? homeData.team.displayName : awayData.team.displayName) : "None"
                };
            }
        });
        res.json(simplifiedGames);
    } catch (error) {
        res.status(500).json({ error: "Failed", details: error.message });
    }
});

app.listen(process.env.PORT || 3000);
