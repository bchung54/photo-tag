import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection,
  addDoc, getDocs,
  query, orderBy,
} from 'firebase/firestore';
import Timer from './timer';
import './reset.css';
import './styles.css';

// DOM Elements
// Header
const checklist = document.querySelector('.checklist'); // checklist of items to find
const timerElement = document.getElementById('time'); // timer display
// Image
const box = document.querySelector('.box'); // box containing image
const optionsBox = document.getElementById('target-box'); // box for choosing item to tag
// Leaderboard
const bgModal = document.querySelector('.bg-modal'); // leaderboard background
const modalClose = document.querySelector('.close'); // close for leaderboard
// Leaderboard Form
const playerRankElement = document.getElementById('player-rank'); // element in form displaying player's rank
const playerTimeElement = document.getElementById('player-time'); // element in form displaying player's time

// Firebase Setup
const firebaseConfig = {
  apiKey: 'AIzaSyBpthc_CcJEx33dGywWgHNc004qVP_dB9E',
  authDomain: 'phototag-4aa93.firebaseapp.com',
  projectId: 'phototag-4aa93',
  storageBucket: 'phototag-4aa93.appspot.com',
  messagingSenderId: '194342923640',
  appId: '1:194342923640:web:7b58eb9cab51ea2b6dec8d',
};
// init firebase app
initializeApp(firebaseConfig);
// init services
const db = getFirestore();
// collection references
const colImg = collection(db, 'images');
const colLeader = collection(db, 'leaders');
// query to order player stats by time
const queryLeaders = query(colLeader, orderBy('time', 'asc'));
// get collection data
const images = [];
const leaders = [];

// Populate checklist
const populateChecklist = (imageData) => {
  while (checklist.firstChild) {
    checklist.removeChild(checklist.firstChild);
  }
  imageData.forEach((object) => {
    const item = document.createElement('span');
    item.classList.add('item');
    item.textContent = object.name.slice(0, 1).toUpperCase() + object.name.slice(1);
    checklist.appendChild(item);
  });
};

getDocs(colImg)
  .then((snapshot) => {
    snapshot.docs.forEach((doc) => {
      images.push({ ...doc.data(), id: doc.id });
    });
    populateChecklist(images);
  });

getDocs(queryLeaders)
  .then((snapshot) => {
    snapshot.docs.forEach((doc) => {
      leaders.push({ ...doc.data(), id: doc.id });
    });
  });

// Highlight Box
// Position variables
let xpos = 0;
let ypos = 0;
let leftmargin = 0;
// Functions
const inBetween = (x, min, max) => x >= min && x <= max;
const showHighlightBox = (obj) => {
  const highlightBox = document.createElement('div');
  highlightBox.classList.add('highlight');
  highlightBox.style.height = `${obj.Yrange[1] - obj.Yrange[0]}px`;
  highlightBox.style.width = `${obj.Xrange[1] - obj.Xrange[0]}px`;
  highlightBox.style.left = `${obj.Xrange[0] + leftmargin}px`;
  highlightBox.style.top = `${obj.Yrange[0]}px`;
  box.append(highlightBox);
};

// Timer
const timer = new Timer();
timer.start();
// Millisecond to clock display conversion
const convertMsToMinSec = (milliseconds) => {
  const tenths = Math.floor((milliseconds / 100) % 10).toString().padEnd(1, '0');
  const seconds = Math.floor((milliseconds / 1000) % 60).toString().padStart(2, '0');
  const minutes = Math.floor(milliseconds / 60000).toString().padStart(2, '0');
  return `${minutes}:${seconds}.${tenths}`;
};
// Update time display
setInterval(() => {
  timerElement.textContent = convertMsToMinSec(timer.getTime());
}, 50);

// Leaderboard
// Fill leaderboard after top 3
const fillLeaderboard = (playerName) => {
  const leaderTable = document.querySelector('.leaderboard');
  leaders.slice(3)
    .forEach((player, index) => {
      const newRow = leaderTable.insertRow(-1);
      const newCellRank = newRow.insertCell(0);
      const newCellName = newRow.insertCell(1);
      const newCellTime = newRow.insertCell(2);
      newRow.classList.add('player-stat');
      newCellRank.textContent = `No. ${index + 4}`;
      newCellName.textContent = `${player.name}`;
      newCellTime.textContent = `${convertMsToMinSec(player.time)}`;
      if (player.name === playerName) {
        newCellName.classList.add('current-player');
      }
    });
};
// Populate Top 3 in leaderboard
const top3Leaderboard = (playerName) => {
  leaders.slice(0, 3).forEach((leader, index) => {
    const row = document.getElementById(`leader${index + 1}`);
    Array.from(row.children).forEach((child) => {
      if (child.classList.contains('name')) {
        child.textContent = leader.name;
        if (leader.name === playerName) {
          child.classList.add('current-player');
        }
      }
      if (child.classList.contains('time')) {
        child.textContent = convertMsToMinSec(leader.time);
      }
    });
  });
};
// Populate player info for form
const popPlayerInfo = () => {
  const playersAhead = leaders.filter((element) => element.time < timer.getTime());
  playerRankElement.textContent += playersAhead.length + 1;
  playerTimeElement.textContent = timerElement.textContent;
};

// End game once all objects are found
const endGame = () => {
  const addLeaderForm = document.querySelector('form');
  addLeaderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const playerName = addLeaderForm.playername.value;
    leaders.push({
      name: playerName,
      time: timer.getTime(),
    });
    leaders.sort((a, b) => a.time - b.time);
    top3Leaderboard(playerName);
    fillLeaderboard(playerName);
    addLeaderForm.style.display = 'none';
    addDoc(colLeader, {
      name: playerName,
      time: timer.getTime(),
    });
  });
  timer.stop();
  bgModal.style.display = 'flex';
  top3Leaderboard(undefined);
  popPlayerInfo();
};

const targetBox = () => {
  const targetBoxToggle = () => {
    if (optionsBox.style.display === 'block') {
      optionsBox.style.display = 'none';
    } else {
      optionsBox.style.display = 'block';
    }
  };

  const checkSelection = (event) => {
    const obj = images.find(
      (element) => element.name === event.target.textContent.toLowerCase(),
    );
    if (inBetween(xpos, obj.Xrange[0], obj.Xrange[1])
        && inBetween(ypos, obj.Yrange[0], obj.Yrange[1])) {
      // Set object found to true
      obj.found = true;

      // Display highlight box for object in the picture
      showHighlightBox(obj);

      // Strike off item from checklist
      const item = Array.from(checklist.childNodes)
        .find((element) => element.textContent.toLowerCase() === obj.name);
      item.classList.add('checkfound');

      // End game if all objects found
      if (!images.find((element) => element.found === false)) {
        endGame();
      }
    }
    optionsBox.style.display = 'none';
  };

  const targetDisplay = (event) => {
    // Set highlight box coordinates
    xpos = event.offsetX;
    ypos = event.offsetY;
    leftmargin = event.pageX - event.offsetX;

    // Set target box coordinates
    optionsBox.style.left = `${event.pageX}px`;
    optionsBox.style.top = `${event.pageY}px`;

    while (optionsBox.firstChild) {
      optionsBox.removeChild(optionsBox.firstChild);
    }

    // Populate target box with unfound objects
    images.forEach((object) => {
      if (!object.found) {
        const option = document.createElement('div');
        option.classList.add('option');
        option.textContent = object.name.slice(0, 1).toUpperCase() + object.name.slice(1);
        option.addEventListener('click', checkSelection);
        optionsBox.append(option);
      }
    });

    // Toggle target box display
    targetBoxToggle();
  };

  // Add Eventlistener to display options when picture is clicked
  box.addEventListener('click', targetDisplay);
};

modalClose.addEventListener('click', () => {
  bgModal.style.display = 'none';
});

// populateChecklist();
targetBox();
