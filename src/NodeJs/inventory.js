const express = require("express");
const app = express();

app.use(express.json());

// test route
app.get("/", (req, res) => {
    res.send("Server is working");
});

app.listen(3000, () => {
    console.log("http://localhost:3000");
});


const TCGdex = require('@tcgdex/sdk').default;

const tcgdex = new TCGdex('en');

(async () => {
    //const card = await tcgdex.card.get('swsh3-136');
    //console.log(card.name);

    const set = await tcgdex.fetch('sets', 'base1', '1');
    console.log(set.name);
    console.log(set.image);
})();

async function loadCard() {
            const cardId = "swsh3-136"; // hardcoded for now

            const res = await fetch(`http://localhost:3000/card/${cardId}`);
            const data = await res.json();

            document.getElementById("name").innerText = data.name;
            document.getElementById("image").src = data.image;
        }

        window.onload = loadCard;