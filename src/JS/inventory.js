// frontend
const TCGdex = require('@tcgdex/sdk').default;

const tcgdex = new TCGdex('en');

async function loadCard(cardId) {

            //const res = await fetch(`http://localhost:3000/card/${cardId}`);
            //const data = await res.json();

            const data = await tcgdex.fetch('sets', 'base1', cardId);

            document.getElementById("name").innerText = data.name;
            document.getElementById("image").src = data.image;
        }

        window.onload = loadCard;


<script>
function light(sw) {
  var pic;
  if (sw == 0) {
    pic = "pic_bulboff.gif"
  } else {
    pic = "pic_bulbon.gif"
  }
  document.getElementById('myImage').src = pic;
}
</script>

<img id="myImage" src="pic_bulboff.gif" width="100" height="180">

<p>
<button type="button" onclick="light(1)">Light On</button>
<button type="button" onclick="light(0)">Light Off</button>
</p>

</body>
</html>
