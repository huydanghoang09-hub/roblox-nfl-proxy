const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const ESPN_URL = "https://api-espn.com";

app.get('/scores', async (req, res) => {
    try {
        const response = await axios.get(ESPN_URL);
        const events = response.data.events || [];
        let simplifiedGames = {};

        events.forEach(game => {
            const gameID = "Game_" + game.id;
            const status = game.status.type.detail; 
            const isFinished = game.status.type.completed;

            const competitors = game.competitions[0].competitors;
            const homeData = competitors.find(c => c.homeAway === 'home');
            const awayData = competitors.find(c => c.homeAway === 'away');

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
        res.status(500).json({ error: "Failed to fetch ESPN data" });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
