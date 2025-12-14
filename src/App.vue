<template>
  <div class="popup">
    <h1>Color de fondo aleatorio</h1>
    <button @click="changeBackgroundColor">Cambiar color</button>
  </div>
</template>

<script setup>
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function changeBackgroundColor() {
  const color = getRandomColor();
  // Inyectamos un script para cambiar el fondo de la pestaña activa
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: (color) => {
          document.body.style.backgroundColor = color;
        },
        args: [color],
      });
    }
  });
}
</script>

<style>
.popup {
  padding: 20px;
  width: 200px;
}
button {
  padding: 10px;
  cursor: pointer;
}
</style>
