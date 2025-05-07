const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const outputText = document.getElementById('output');
const clickbutton = document.getElementById('clickbutton');

const gestureGradients = {
    '✌️ Peace': 'linear-gradient(to bottom, #ffffff, #d4fc79, #96e6a1)',
    '✊ Faust': 'linear-gradient(to bottom, #ffffff, #f7797d, #FBD786)',
    '✋ Offene Hand': 'linear-gradient(to bottom, #ffffff, #6dd5ed, #2193b0)',
    '👆 Zeigefinger': 'linear-gradient(to bottom, #ffffff, #ffecd2, #fcb69f)',
    '🤙 Shaka': 'linear-gradient(to bottom, #ffffff, #fbc2eb, #a6c1ee)',
    '🤘 Rock': 'linear-gradient(to bottom, #ffffff, #fbd3e9, #bb377d)',
    '🖕 Mittelfinger': 'linear-gradient(to bottom, #ffffff, #e96443, #904e95)',
    '👉 Zeigefinger + Daumen': 'linear-gradient(to bottom, #ffffff, #c2e9fb, #81a4fd)'
  };  

// Globale Variablen
let currentGesture = null;
let gestureStartTime = null;
let lastDisplayedGesture = null;
const GESTURE_HOLD_DURATION = 1000; // in Millisekunden (2 Sekunden)


function isExtended(tip, pip, landmarks) {
  return landmarks[tip].y < landmarks[pip].y;
}

function isBent(tip, pip, landmarks) {
  return landmarks[tip].y > landmarks[pip].y;
}

function distance(i, j, landmarks) {
  const dx = landmarks[i].x - landmarks[j].x;
  const dy = landmarks[i].y - landmarks[j].y;
  return Math.sqrt(dx * dx + dy * dy);
}

function detectGesture(landmarks) {
  const extended = (i, j) => isExtended(i, j, landmarks);
  const bent = (i, j) => isBent(i, j, landmarks);
  const dist = (i, j) => distance(i, j, landmarks);

  if (
    extended(8, 6) &&    // Zeigefinger gestreckt
    extended(12, 10) &&  // Mittelfinger gestreckt
    bent(16, 14) &&      // Ringfinger gebeugt
    bent(20, 18)         // Kleiner Finger gebeugt
  ) return '✌️ Peace';

  if (
    bent(8, 6) &&
    bent(12, 10) &&
    bent(16, 14) &&
    bent(20, 18)
  ) return '✊ Faust';

  if (
    extended(8, 6) &&
    extended(12, 10) &&
    extended(16, 14) &&
    extended(20, 18)
  ) return '✋ Offene Hand';

  if (
    extended(8, 6) &&
    bent(12, 10) &&
    bent(16, 14) &&
    bent(20, 18)
  ) return '👆 Zeigefinger';

  if (
    extended(4, 2) &&
    bent(8, 6) &&
    bent(12, 10) &&
    bent(16, 14) &&
    extended(20, 18)
  ) return '🤙 Shaka';

  if (
    extended(8, 6) &&
    bent(12, 10) &&
    bent(16, 14) &&
    extended(20, 18)
  ) return '🤘 Rock';

  if (
    bent(8, 6) &&
    extended(12, 10) &&
    bent(16, 14) &&
    bent(20, 18)
  ) return '🖕 Mittelfinger';

  if (
    extended(8, 6) &&
    bent(12, 10) &&
    bent(16, 14) &&
    bent(20, 18) &&
    extended(4, 2)
  ) return '👉 Zeigefinger + Daumen';

  return null;
}

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks.length > 0) {
    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
      drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', radius: 1 });

      const gesture = detectGesture(landmarks);

      const now = Date.now();
      
      if (gesture !== currentGesture) {
        // Neue Geste erkannt → Timer zurücksetzen
        currentGesture = gesture;
        gestureStartTime = now;
      } else if (gesture && (now - gestureStartTime >= GESTURE_HOLD_DURATION)) {
        // Geste stabil genug → nur reagieren, wenn sie noch nicht angezeigt wurde
        if (gesture !== lastDisplayedGesture) {
            outputText.innerText = `${gesture} erkannt!`;
            lastDisplayedGesture = gesture;
          
            // Setze den passenden Gradient
            const gradient = gestureGradients[gesture] || 'linear-gradient(to bottom, #ffffff, #dddddd)';
            document.documentElement.style.background = gradient;
          }
          
      } else if (!gesture) {
        // Keine Geste erkannt → zurücksetzen
        currentGesture = null;
        gestureStartTime = null;
        lastDisplayedGesture = null;
        outputText.innerText = '🖐️ Hand erkannt, aber keine definierte Geste';
        document.documentElement.style.background = 'linear-gradient(to bottom, #ffffff, #6DD5FA, #2980B9)';
        
      }
      
    }
  } else {
    outputText.innerText = '❌ Keine Hand erkannt';
    // document.body.style.backgroundColor = 'white';
  }

  canvasCtx.restore();
}

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.5
});
hands.onResults(onResults);

// document.addEventListener('click', () => {
//     const camera = new Camera(videoElement, {
//     onFrame: async () => await hands.send({ image: videoElement }),
//     width: 640,
//     height: 480
//     });
//     camera.start();
// });

clickbutton.addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        videoElement.srcObject = stream;
  
        const camera = new Camera(videoElement, {
          onFrame: async () => await hands.send({ image: videoElement }),
          width: 640,
          height: 480
        });
  
        camera.start();
        console.log("✅ Kamera erlaubt");
        output_canvas.style.display = 'block';
        clickbutton.style.display = 'none';
        document.getElementById('subheadline').style.display = 'none';
        outputText.style.display = 'block';
        // document.body.style.backgroundColor = "#ffffff";
      })
      .catch((error) => {
        console.warn("❌ Kamera-Zugriff verweigert oder fehlgeschlagen:", error);
        document.getElementById('subheadline').innerText = 'Du musst den Zugriff schon gewähren!';
        document.body.style.backgroundColor = "#ffcccc";
      });
  });
