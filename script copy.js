// ---------- Grab the elements we need from the HTML ----------
const welcomeScreen  = document.getElementById("welcome-screen");
const birthdayScreen = document.getElementById("birthday-screen");
const mainSite       = document.getElementById("main-site");

const keypad       = document.getElementById("keypad");
const pinDots      = document.getElementById("pin-dots");
const dots         = pinDots.querySelectorAll(".dot");
const errorMessage = document.getElementById("error-message");
const enterButton  = document.getElementById("enter-button");

// Elements for the envelope and the letter
const envelopeView       = document.getElementById("envelope-view");
const envelopeButton     = document.getElementById("envelope-button");
const letterView         = document.getElementById("letter-view");
const closeLetterButtons = document.querySelectorAll(".close-letter-button");

// The whole music player (it sits outside the screens, see index.html)
const musicPlayer = document.getElementById("music-player");

// ---------- PIN settings ----------
const CORRECT_PIN = "141125"; // the correct six-digit PIN
const PIN_LENGTH  = 6;        // how many digits are allowed

// This variable holds the digits typed so far, for example "141".
let currentPin = "";

// While the "wrong PIN" shake is playing, we ignore extra key presses.
let isLocked = false;

// ---------- Show one screen and hide the others ----------
function showScreen(screenToShow) {
  welcomeScreen.hidden  = true;
  birthdayScreen.hidden = true;
  mainSite.hidden       = true;

  screenToShow.hidden = false;

  // The music player stays hidden on the PIN screen and appears on every
  // screen after it. We only hide/show it. We never rebuild it, so the
  // music keeps playing when the screen changes.
  musicPlayer.hidden = (screenToShow === welcomeScreen);

  // Move keyboard/screen-reader focus to the new screen's heading
  // so people know the page changed.
  const heading = screenToShow.querySelector("h1");
  heading.focus();
 
  // NEW: kembang api hanya jalan di layar birthday, berhenti di layar lain
  if (window.NoraFireworks) {
    if (screenToShow === birthdayScreen) {
      window.NoraFireworks.start();
    } else {
      window.NoraFireworks.stop();
    }
  }
}


// ---------- Update the six dots to match the typed digits ----------
function updateDots() {
  dots.forEach(function (dot, index) {
    // Dot number "index" is filled if we have typed more than "index" digits
    dot.classList.toggle("filled", index < currentPin.length);
  });

  // Tell screen readers how many digits have been entered
  pinDots.setAttribute(
    "aria-label",
    currentPin.length + " of " + PIN_LENGTH + " digits entered"
  );
}

// ---------- Add one digit (called by the number buttons) ----------
function addDigit(digit) {
  if (isLocked) return;                       // ignore taps during the shake
  if (currentPin.length >= PIN_LENGTH) return; // already six digits

  errorMessage.textContent = "";               // clear any old error
  currentPin += digit;
  updateDots();
}

// ---------- Remove the last digit (backspace button) ----------
function removeDigit() {
  if (isLocked) return;

  errorMessage.textContent = "";
  currentPin = currentPin.slice(0, -1); // cut off the last character
  updateDots();
}

// ---------- Show a gentle error and shake the dots ----------
function showError(message, shouldClear) {
  errorMessage.textContent = message;

  // Restart the shake animation every time
  pinDots.classList.remove("shake");
  void pinDots.offsetWidth; // forces the browser to "reset" the animation
  pinDots.classList.add("shake");

  if (shouldClear) {
    // Wait for the shake to finish, then clear the dots so she can retry
    isLocked = true;
    setTimeout(function () {
      currentPin = "";
      updateDots();
      pinDots.classList.remove("shake");
      isLocked = false;
    }, 450);
  }
}

// ---------- Check the PIN (confirm button) ----------
function checkPin() {
  if (isLocked) return;

  // Not all six digits yet: gentle reminder, keep what was typed
  if (currentPin.length < PIN_LENGTH) {
    showError("Please enter all six digits.", false);
    return;
  }

  if (currentPin === CORRECT_PIN) {
    // Correct: reset the keypad and show the birthday screen
    errorMessage.textContent = "";
    currentPin = "";
    updateDots();
    showScreen(birthdayScreen);
  } else {
    // Wrong: gentle message, shake, then clear
    showError("Not quite. Try again.", true);
  }
}

// ---------- Listen for taps on the keypad ----------
// One listener on the whole keypad handles every button ("event delegation").
keypad.addEventListener("click", function (event) {
  // Find the button that was clicked (even if the click landed on its inner symbol)
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.digit !== undefined) {
    addDigit(button.dataset.digit);
  } else if (button.dataset.action === "backspace") {
    removeDigit();
  } else if (button.dataset.action === "confirm") {
    checkPin();
  }
});

// ---------- Optional: physical keyboard support on a computer ----------
// Only digits, Backspace and Enter are accepted. No text is ever typed.
// To turn this off, delete this whole block.
document.addEventListener("keydown", function (event) {
  // Only work while the welcome screen is visible
  if (welcomeScreen.hidden) return;

  if (event.key >= "0" && event.key <= "9" && event.key.length === 1) {
    addDigit(event.key);
  } else if (event.key === "Backspace") {
    removeDigit();
  } else if (event.key === "Enter" && event.target.tagName !== "BUTTON") {
    // If a button has focus, pressing Enter already clicks it, so we skip that case
    checkPin();
  }
});

// ---------- "Enter" button goes to the "A Message for You" section ----------
enterButton.addEventListener("click", function () {
  showScreen(mainSite);
});

// ---------- Envelope and letter ----------

// Does the person's device ask for less motion? (true or false)
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

// Stops people from clicking the envelope twice while it is opening
let isOpeningEnvelope = false;

// Step 1: play the opening animation, then show the letter
function openEnvelope() {
  if (isOpeningEnvelope) return;
  isOpeningEnvelope = true;

  // Adding this class starts the CSS animation (flap opens, paper slides up)
  envelopeButton.classList.add("is-opening");
  envelopeButton.setAttribute("aria-expanded", "true");

  // Wait for the animation to finish. With "reduce motion" there is no waiting.
  const waitTime = reducedMotionQuery.matches ? 0 : 1700;
  setTimeout(showLetter, waitTime);
}

// Step 2: swap the envelope for the letter
function showLetter() {
  envelopeView.hidden = true;
  letterView.hidden = false;

  // Start reading from the top of the page
  window.scrollTo({
    top: 0,
    behavior: reducedMotionQuery.matches ? "auto" : "smooth"
  });

  // Move focus to the letter so keyboard and screen-reader users land on it
  letterView.focus({ preventScroll: true });

  isOpeningEnvelope = false;
}

// Close the letter and go back to a fresh, closed envelope
function closeLetter() {
  letterView.hidden = true;

  // Reset the envelope drawing to its closed state
  envelopeButton.classList.remove("is-opening");
  envelopeButton.setAttribute("aria-expanded", "false");
  envelopeView.hidden = false;

  // Put keyboard focus back on the envelope
  envelopeButton.focus();
}

// Clicking (or pressing Enter/Space on) the envelope opens it
envelopeButton.addEventListener("click", openEnvelope);

// Both "Close letter" buttons (top and bottom) do the same thing
closeLetterButtons.forEach(function (button) {
  button.addEventListener("click", closeLetter);
});

// Pressing the Escape key also closes the letter
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && !letterView.hidden) {
    closeLetter();
  }
});

// ---------- Music player ----------

// The playlist. To add a song later, add one more line here.
// The "src" must match the real file name inside assets/audio/ exactly
// (capital letters and spaces included).
// The voice note is NOT part of this list on purpose.
// title and artist = what is SHOWN in the player.
// src = the REAL file name inside assets/audio/. Never change it (spaces, "!" and
// the Korean letters in song 7 must stay exactly as they are).
const tracks = [
  { title: "Biru",                  artist: "Gabriella Fernaldi", src: "assets/audio/Biru - Gabriella Fernaldi.mp3" },
  { title: "anything 4 u",          artist: "LANY",               src: "assets/audio/LANY - anything 4 u.mp3" },
  { title: "Little Things",         artist: "One Direction",      src: "assets/audio/One Direction - Little Things.mp3" },
  { title: "Drowning",              artist: "Backstreet Boys",    src: "assets/audio/Backstreet Boys - Drowning (Lyrics).mp3" },
  { title: "Nothing",               artist: "Bruno Major",        src: "assets/audio/Bruno Major - Nothing (Lyrics).mp3" },
  { title: "Count on Me",           artist: "Bruno Mars",         src: "assets/audio/Bruno Mars - Count on Me.mp3" },
  { title: "Star",                  artist: "Colde",              src: "assets/audio/Colde (콜드) - Star.mp3" },
  { title: "UNDERSTAND",            artist: "keshi",              src: "assets/audio/keshi - UNDERSTAND.mp3" },
  { title: "live it down",          artist: "LANY",               src: "assets/audio/LANY - live it down.mp3" },
  { title: "pink skies",            artist: "LANY",               src: "assets/audio/LANY - pink skies.mp3" },
  { title: "Stuck",                 artist: "LANY",               src: "assets/audio/LANY - Stuck.mp3" },
  { title: "you!",                  artist: "LANY",               src: "assets/audio/LANY - you!.mp3" },
  { title: "Make You Feel My Love", artist: "Shane Filan",        src: "assets/audio/Make You Feel My Love - Shane Filan.mp3" },
  { title: "This Town",             artist: "Niall Horan",        src: "assets/audio/Niall Horan - This Town (Official Lyric Video).mp3" },
  { title: "I Lay My Love on You",  artist: "Westlife",           src: "assets/audio/Westlife - I Lay My Love on You.mp3" },
  { title: "lemonade",              artist: "Jeremy Passion",     src: "assets/audio/Jeremy Passion - lemonade.mp3" },
  { title: "Alonica",               artist: "LANY",               src: "assets/audio/LANY - Alonica.mp3" },
  { title: "Cahaya",                artist: "TULUS",              src: "assets/audio/TULUS - Cahaya.mp3" },
  { title: "Vibes",                 artist: "Chase Atlantic",     src: "assets/audio/Vibes - Chase Atlantic.mp3" }
];

// Grab the player's parts from the HTML
const playerToggle  = document.getElementById("player-toggle");
const playerPanel   = document.getElementById("player-panel");
const audio         = document.getElementById("audio-element");
const trackTitle    = document.getElementById("track-title");
const trackArtist   = document.getElementById("track-artist");
const progress      = document.getElementById("progress");
const timeCurrent   = document.getElementById("time-current");
const timeDuration  = document.getElementById("time-duration");
const prevButton    = document.getElementById("prev-button");
const playButton    = document.getElementById("play-button");
const nextButton    = document.getElementById("next-button");
const playlistEl    = document.getElementById("playlist");
const playerMessage = document.getElementById("player-message");

// The volume controls (NEW)
const volumeRow    = document.getElementById("volume-row");
const volumeSlider = document.getElementById("volume-slider");
const volumeValue  = document.getElementById("volume-value");

// Which song (position in the list above) is loaded right now. 0 = the first song.
let currentIndex = 0;

// Turn seconds into text like "3:07"
// (the voice note below also uses this small helper; it only formats numbers)
function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return minutes + ":" + (secs < 10 ? "0" : "") + secs;
}

// Refresh the progress bar and the two time labels
function updateProgressDisplay() {
  // Before the file is loaded the duration is unknown, so we treat it as 0
  const duration = isFinite(audio.duration) ? audio.duration : 0;
  const current  = audio.currentTime;

  progress.max   = duration;   // set max first, so the value is not cut off
  progress.value = current;

  // The pink fill of the bar (a percentage, used by the CSS variable --progress)
  const percent = duration > 0 ? (current / duration) * 100 : 0;
  progress.style.setProperty("--progress", percent + "%");

  timeCurrent.textContent  = formatTime(current);
  timeDuration.textContent = formatTime(duration);

  // Screen readers hear "1:05 of 3:30" instead of a raw number
  progress.setAttribute(
    "aria-valuetext",
    formatTime(current) + " of " + formatTime(duration)
  );
}

// Show the right icon and label on the Play/Pause button
function setPlayingState(isPlaying) {
  // The CSS uses this class to swap the icon and pulse the round button
  musicPlayer.classList.toggle("is-playing", isPlaying);
  playButton.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
}

// Highlight the current song in the playlist
function updatePlaylistHighlight() {
  const items = playlistEl.querySelectorAll(".playlist-item");

  items.forEach(function (item, index) {
    const isCurrent = index === currentIndex;
    item.classList.toggle("is-current", isCurrent);

    if (isCurrent) {
      item.setAttribute("aria-current", "true");
    } else {
      item.removeAttribute("aria-current");
    }
  });

  scrollCurrentTrackIntoView();
}

// Keep the current song visible inside the scrolling playlist
function scrollCurrentTrackIntoView() {
  if (playerPanel.hidden) return;   // nothing to scroll while the panel is collapsed

  const current = playlistEl.querySelector(".playlist-item.is-current");
  if (!current) return;

  const listBox = playlistEl.getBoundingClientRect();
  const itemBox = current.getBoundingClientRect();

  if (itemBox.top < listBox.top) {
    playlistEl.scrollTop -= listBox.top - itemBox.top;
  } else if (itemBox.bottom > listBox.bottom) {
    playlistEl.scrollTop += itemBox.bottom - listBox.bottom;
  }
}

// Friendly message for visitors, technical details only in the console (F12)
function showPlayerError(technicalDetails) {
  playerMessage.textContent =
    "Sorry, this song can't be played right now. Please try another one from the playlist.";
  setPlayingState(false);

  // This line is for YOU: it tells you which file had a problem.
  console.warn("Music player: could not load or play", tracks[currentIndex].src, technicalDetails);
}

// Start playing the loaded song
function playAudio() {
  // audio.play() gives back a "promise"; .catch() handles the case where it fails
  const attempt = audio.play();

  if (attempt !== undefined) {
    attempt.catch(function (error) {
      // AbortError just means a different song was chosen very quickly. Not a real problem.
      if (error.name === "AbortError") return;
      showPlayerError(error);
    });
  }
}

// Load a song. If shouldPlay is true it also starts playing.
// (The volume belongs to the <audio> element, so it stays the same when the song changes.)
function loadTrack(index, shouldPlay) {
  // Wrap around: after the last song comes the first, before the first comes the last
  currentIndex = (index + tracks.length) % tracks.length;
  const track = tracks[currentIndex];

  playerMessage.textContent = "";          // clear any old error message
  trackTitle.textContent  = track.title;
  trackArtist.textContent = track.artist;

  // encodeURI turns spaces into %20 so file names with spaces work everywhere
  audio.src = encodeURI(track.src);

  updateProgressDisplay();                 // reset the bar to 0:00
  updatePlaylistHighlight();

  if (shouldPlay) {
    playAudio();
  }
}

// Play/Pause button
function togglePlay() {
  // If the last attempt failed, pressing Play tries to load the song again
  if (audio.error) {
    loadTrack(currentIndex, true);
    return;
  }

  if (audio.paused) {
    playAudio();
  } else {
    audio.pause();
  }
}

// Open or collapse the panel. This only shows/hides the panel.
// The <audio> element is outside the panel, so the music is never interrupted.
function setPanelOpen(isOpen) {
  playerPanel.hidden = !isOpen;
  playerToggle.setAttribute("aria-expanded", String(isOpen));

  if (isOpen) {
    scrollCurrentTrackIntoView();   // show the current song when the panel is opened
  }
}

// Build the playlist buttons ONE time, when the page loads
function buildPlaylist() {
  tracks.forEach(function (track, index) {
    const listItem = document.createElement("li");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "playlist-item";
    button.dataset.index = index;          // remember which song this button is for

    const title = document.createElement("span");
    title.className = "playlist-title";
    title.textContent = track.title;

    const artist = document.createElement("span");
    artist.className = "playlist-artist";
    artist.textContent = track.artist;

    button.appendChild(title);
    button.appendChild(artist);
    listItem.appendChild(button);
    playlistEl.appendChild(listItem);
  });
}

// ----- Button listeners -----

// The round music button opens/collapses the panel
playerToggle.addEventListener("click", function () {
  setPanelOpen(playerPanel.hidden);
});

// Pressing Escape inside the player collapses the panel.
// stopPropagation() keeps this Escape from also closing the letter.
musicPlayer.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && !playerPanel.hidden) {
    setPanelOpen(false);
    playerToggle.focus();
    event.stopPropagation();
  }
});

playButton.addEventListener("click", togglePlay);

// Next song. If the music was paused, the next song loads but stays paused.
nextButton.addEventListener("click", function () {
  const wasPlaying = !audio.paused;
  loadTrack(currentIndex + 1, wasPlaying);
});

// Previous song. After the first 3 seconds, it restarts the current song instead
// (this is how most music apps behave).
prevButton.addEventListener("click", function () {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    updateProgressDisplay();
    return;
  }

  const wasPlaying = !audio.paused;
  loadTrack(currentIndex - 1, wasPlaying);
});

// Choosing a song in the playlist (one listener for the whole list)
playlistEl.addEventListener("click", function (event) {
  const button = event.target.closest("button");
  if (!button) return;

  const index = Number(button.dataset.index);

  if (index === currentIndex && !audio.error) {
    togglePlay();            // tapping the current song plays/pauses it
  } else {
    loadTrack(index, true);  // tapping another song plays that song
  }
});

// Dragging the progress bar (or using the arrow keys on it) jumps to that moment
progress.addEventListener("input", function () {
  if (!isFinite(audio.duration) || audio.duration <= 0) return; // file not loaded yet

  audio.currentTime = Number(progress.value);
  updateProgressDisplay();
});

// ----- Audio listeners (the <audio> element tells us what is happening) -----
audio.addEventListener("loadedmetadata", updateProgressDisplay); // duration is known
audio.addEventListener("durationchange", updateProgressDisplay);
audio.addEventListener("timeupdate", updateProgressDisplay);     // runs while playing
audio.addEventListener("emptied", updateProgressDisplay);        // a new file is being loaded

audio.addEventListener("play",  function () { setPlayingState(true); });
audio.addEventListener("pause", function () { setPlayingState(false); });

// When a song finishes, go to the next one and keep playing
audio.addEventListener("ended", function () {
  loadTrack(currentIndex + 1, true);
});

// The file is missing, misspelled, or in a format the browser can't play
audio.addEventListener("error", function () {
  showPlayerError(audio.error);
});

// ----- Music volume (NEW) -----
// This controls ONLY the music's <audio> element ("audio" above).
// The voice note has its own <audio> element, so its volume is never touched.

// The music starts quietly. 25 means 25%. Change this number if you want it
// louder or softer by default.
const INITIAL_MUSIC_VOLUME = 25;

// Some devices (iPhone and iPad) do not allow a website to change the volume.
// This test tries it: if the volume really changes, the slider will work.
function musicVolumeCanBeChanged() {
  const originalVolume = audio.volume;

  audio.volume = 0.5;
  const itWorked = (audio.volume === 0.5);

  audio.volume = originalVolume;
  return itWorked;
}

// Make the slider, the percentage and the speaker icon match the real volume
function updateVolumeDisplay() {
  // audio.volume is a number from 0 to 1, so we turn it into 0 to 100
  const percent = Math.round(audio.volume * 100);

  volumeSlider.value = percent;
  volumeSlider.style.setProperty("--progress", percent + "%");  // pink fill of the bar
  volumeValue.textContent = percent + "%";
  volumeSlider.setAttribute("aria-valuetext", percent + " percent");

  // Pick the speaker icon: crossed out, one wave, or two waves
  let level = "high";
  if (percent === 0) {
    level = "mute";
  } else if (percent < 50) {
    level = "low";
  }
  volumeRow.dataset.level = level;
}

// Moving the slider (with mouse, finger or arrow keys) changes the music volume
volumeSlider.addEventListener("input", function () {
  audio.volume = Number(volumeSlider.value) / 100;  // 0 to 1, as the audio element expects
  updateVolumeDisplay();
});

// If the volume changes for any other reason, keep the slider in sync
audio.addEventListener("volumechange", updateVolumeDisplay);

// ----- Start up (runs once when the page loads) -----
buildPlaylist();
loadTrack(0, false);   // loads the first song's info, but does NOT play it

if (musicVolumeCanBeChanged()) {
  audio.volume = INITIAL_MUSIC_VOLUME / 100;   // start softly
  updateVolumeDisplay();
} else {
  // This device controls volume only with its own buttons, so hide the slider
  volumeRow.hidden = true;
  console.info("Music volume slider hidden: this device does not let websites change volume.");
}

// ---------- Voice note player ----------
// This is completely separate from the music player above:
// it has its own <audio> element and its own variables (all start with "voice"),
// so pressing buttons here never touches the music, and the other way around.

// OPTIONAL: set this to true if you want the music to pause automatically
// when the voice note starts. It is false, so the two players stay fully independent.
const PAUSE_MUSIC_WHILE_VOICE_NOTE = false;

// Grab the voice note's parts from the HTML
const voiceNote             = document.getElementById("voice-note");
const voiceAudio            = document.getElementById("voice-audio");
const voicePlayButton       = document.getElementById("voice-play-button");
const voiceProgress         = document.getElementById("voice-progress");
const voiceTimeCurrent      = document.getElementById("voice-time-current");
const voiceTimeDuration     = document.getElementById("voice-time-duration");
const voiceMessage          = document.getElementById("voice-message");
const voiceTranscriptToggle = document.getElementById("voice-transcript-toggle");
const voiceTranscript       = document.getElementById("voice-transcript");

// Refresh the voice note's progress bar and time labels
function updateVoiceProgress() {
  // Before the file is loaded the duration is unknown, so we treat it as 0
  const duration = isFinite(voiceAudio.duration) ? voiceAudio.duration : 0;
  const current  = voiceAudio.currentTime;

  voiceProgress.max   = duration;   // set max first, so the value is not cut off
  voiceProgress.value = current;

  // The pink fill of the bar (a percentage, used by the CSS variable --progress)
  const percent = duration > 0 ? (current / duration) * 100 : 0;
  voiceProgress.style.setProperty("--progress", percent + "%");

  voiceTimeCurrent.textContent  = formatTime(current);
  voiceTimeDuration.textContent = formatTime(duration);

  // Screen readers hear "0:12 of 1:30" instead of a raw number
  voiceProgress.setAttribute(
    "aria-valuetext",
    formatTime(current) + " of " + formatTime(duration)
  );
}

// Show the right icon and label on the voice note's Play/Pause button
function setVoicePlayingState(isPlaying) {
  // The CSS uses this class to swap the play and pause icons
  voiceNote.classList.toggle("is-playing", isPlaying);
  voicePlayButton.setAttribute(
    "aria-label",
    isPlaying ? "Pause voice note" : "Play voice note"
  );
}

// Friendly message for visitors, technical details only in the console (F12)
function showVoiceError(technicalDetails) {
  voiceMessage.textContent =
    "Sorry, the voice note can't be played right now. Please try again in a moment.";
  setVoicePlayingState(false);

  // This line is for YOU: it shows which file had a problem.
  console.warn("Voice note: could not load or play", voiceAudio.getAttribute("src"), technicalDetails);
}

// Start playing the voice note (only called after the visitor presses Play)
function playVoice() {
  const attempt = voiceAudio.play();

  if (attempt !== undefined) {
    attempt.catch(function (error) {
      if (error.name === "AbortError") return; // not a real problem
      showVoiceError(error);
    });
  }
}

// Play/Pause button
function toggleVoice() {
  // If the last attempt failed, pressing Play tries to load the file again
  if (voiceAudio.error) {
    voiceMessage.textContent = "";
    voiceAudio.load();
  }

  if (voiceAudio.paused) {
    playVoice();
  } else {
    voiceAudio.pause();
  }
}

voicePlayButton.addEventListener("click", toggleVoice);

// Dragging the progress bar (or using the arrow keys on it) jumps to that moment
voiceProgress.addEventListener("input", function () {
  if (!isFinite(voiceAudio.duration) || voiceAudio.duration <= 0) return; // not loaded yet

  voiceAudio.currentTime = Number(voiceProgress.value);
  updateVoiceProgress();
});

// "Read the transcript" / "Hide transcript" button
voiceTranscriptToggle.addEventListener("click", function () {
  const willOpen = voiceTranscript.hidden;   // hidden now means it will open

  voiceTranscript.hidden = !willOpen;
  voiceTranscriptToggle.setAttribute("aria-expanded", String(willOpen));
  voiceTranscriptToggle.textContent = willOpen ? "Hide transcript" : "Read the transcript";
});

// ----- Voice note audio listeners -----
voiceAudio.addEventListener("loadedmetadata", updateVoiceProgress); // duration is known
voiceAudio.addEventListener("durationchange", updateVoiceProgress);
voiceAudio.addEventListener("timeupdate", updateVoiceProgress);     // runs while playing

voiceAudio.addEventListener("play", function () {
  setVoicePlayingState(true);

  // Only runs if you switched the option above to true
  if (PAUSE_MUSIC_WHILE_VOICE_NOTE && !audio.paused) {
    audio.pause();
  }
});

voiceAudio.addEventListener("pause", function () {
  setVoicePlayingState(false);
});

voiceAudio.addEventListener("ended", function () {
  setVoicePlayingState(false);
});

// The file is missing, misspelled, or in a format the browser can't play
voiceAudio.addEventListener("error", function () {
  showVoiceError(voiceAudio.error);
});

// ---------- "Our 19 Moments" gallery (NEW: gallery) ----------

// The folder that holds all the photos and the video.
const MOMENTS_FOLDER = "assets/images/Our Moment/";

// OPTIONAL: set this to true if you want the music and the voice note to pause
// automatically when the video starts (the video has its own sound).
// It is false, so everything stays independent.
const PAUSE_AUDIO_WHILE_VIDEO = false;

// THE LIST OF MOMENTS, in the order you gave. This is the only place you edit.
//   file    = the exact file name (double extensions included). Do not rename files.
//   type    = "image" or "video"
//   date    = the date exactly as it should appear (leave "" for no date)
//   isoDate = the same date as year-month-day, only used by browsers (leave "" if no date)
//   caption = the caption exactly as you wrote it (leave "" for no caption)
// An empty date or caption is simply not shown.
// To write a caption on several lines, put it between backticks ` ` instead of quote marks.
const moments = [
  {
    file: "moment-01.jpg.jpeg",
    type: "image",
    date: "22 November 2025",
    isoDate: "2025-11-22",
    caption: `INI TU MOMEN PADA SAAT AKU PERTAMA KALI KITA MAIN BARENGG, sumpah itu aku seneng bangett. dan yang masi aku ga nyangka adalah kita sama sama pesen red velvett😭 padahal kan ga janjian yak`
  },
  {
    file: "moment-02.jpg.jpeg",
    type: "image",
    date: "26 November 2025",
    isoDate: "2025-11-26",
    caption: `WKWWKWK KADANG MASI LUCU AJA KALO AKU KEINGET INI, lagi main roblox ketiduran HAHAHA`
  },
  {
    file: "moment-03.jpg.jpeg",
    type: "image",
    date: "6 Desember 2025",
    isoDate: "2025-12-06",
    caption: `nah ini sengaja aku foto karena itu adalah call pertama kali dari kita yang lama bngt yaitu sampe 12 jam! BAYANGIN 12 JAM LOHH`
  },
  {
    file: "moment-04.jpg.jpeg",
    type: "image",
    date: "12 Desember 2025",
    isoDate: "2025-12-12",
    caption: `ini tuu disaat kita maljang yang kedua kalinyaaa. inget ga yang si pais main uno no mercy sampe banyak banget kartunya😭`
  },
  {
    file: "moment-05.jpg.jpeg",
    type: "image",
    date: "14 Desember 2025",
    isoDate: "2025-12-14",
    caption: `SUMPAH AKU BERTERIMAKASI BANGET SAMA KIVLAN KRNA UDAH MOTOIN DARI BELAKANG, nah kalau ini tu disaat kita habis dari dagal utk main robloxx, inget tidaaa? dan habis itu kita ada tugas utk roleplay di kelasss`
  },
  {
    file: "moment-06.jpg.jpeg",
    type: "image",
    date: "15 Desember 2025",
    isoDate: "2025-12-15",
    caption: `ini itu disaat kita mabar roblox sama jei dan patihh`
  },
  {
    file: "moment-07.jpg.jpeg",
    type: "image",
    date: "22 November 2025",
    isoDate: "2025-11-22",
    caption: `INI MOMEN PERTAMA KALI KITA NGOBROL DI TIKTOK AHHAHAH, dan obrolannya adalah ikan kokiiii`
  },
  {
    file: "moment-08.jpg.jpeg",
    type: "image",
    date: "8 Maret 2026",
    isoDate: "2026-03-08",
    caption: `ini aku iseng bgt foto kamu disaat kita lagi nobar. aku ngerasa waktu itu tu kita masi jarang vc gitu lohhh, makanya ku foto dehh`
  },
  {
    file: "moment-09.jpg.jpeg",
    type: "image",
    date: "9 Maret 2026",
    isoDate: "2026-03-09",
    caption: `YAP KITA BESOKNYA TEAMS LAGII, dan pada teams kali itu aku fotoin kamu lagiii wle, dan ini menjadi salah satu foto yang paling aku suka btw hehe`
  },
  {
    file: "moment-010.jpg.jpeg",
    type: "image",
    date: "13 Maret 2026",
    isoDate: "2026-03-13",
    caption: `DAN YAP INI FIRST TIME KITA PHOTOBOOTH DI ROBLOXX WKWKWK, lucu bngt dah posenya`
  },
  {
    file: "moment-011.jpg.jpeg",
    type: "image",
    date: "14 Maret 2026",
    isoDate: "2026-03-14",
    caption: `DISINI AKU SENENG BGT SUMPAH, karna aku pertama kali bgt sleepcall sama kamu dan liat kamu bobooo, gatau rasanya seneng sm nyaman aja`
  },
  {
    file: "moment-012.jpg.jpeg",
    type: "image",
    date: "9 April 2026",
    isoDate: "2026-04-09",
    caption: `ini kita lagi belajar barengg di oplibbb. HAHAH AKU SENENG BANGETTT, disitu juga kita ngobrol banyakkk. dan di hari ini juga kita photobooth di website WKWKWKWK lucuuu bgt`
  },
  {
    file: "moment-013.jpg.jpeg",
    type: "image",
    date: "17 April 2026",
    isoDate: "2026-04-17",
    caption: `NAH INI NII. FOR THE FIRST TIME KAMU MENCOBA SKB. pada saat itu si kamu bilangnya biasa aja, tapi aku yakin bgt one day kamu bakalan suka.. DAN YAP BENER AHHAHA. ibarat mah aku beli bitcoin di taun 2011`
  },
  {
    file: "moment-014.jpg.jpeg",
    type: "image",
    date: "23 Juni 2026",
    isoDate: "2026-06-23",
    caption: `dan ini yang kesekian kalinya kita photobooth di robloxxx, INI JUGA GA KALAH LUCU POSENYAA`
  },
  {
    file: "moment-015.jpg.jpeg",
    type: "image",
    date: "24 Juni 2026",
    isoDate: "2026-06-24",
    caption: `INI SALAH SATU FOTO ROBLOX TERBAGUSNYA KITAAA, WKWKW AKU MASI INGET BGT REAKSI KAMU YG SENENG BGT LIAT AKU BELI SKIN PANCINGANN. EMANG BAGUS SIH`
  },
  {
    file: "moment-016.jpg.jpeg",
    type: "image",
    date: "25 Juni 2026",
    isoDate: "2026-06-25",
    caption: `INI SERU BANGETTT. kita ngobrolin banyak hal disiniii, ini tu kalo gasalah habis ujian praktek bahasa inggris dehh yang aku anterin kamu ituu HAHAHAH, mau ulang lagi deh`
  },
  {
    file: "moment-017.mp4.mp4",
    type: "video",
    date: "30 Juni 2026",
    isoDate: "2026-06-30",
    caption: `GILAKKK INI SERU BANGETTT. aku seneng banget bisa punya banyak waktu bareng kamu di hari itu. boleh jujur ga hehe, kurasa seluruh alam semesta pun setuju denganku bahwa Jesslyn Annora Lisa Sirait yang akrab dipanggil nora, sangat cantik pada hari itu.`
  },
  {
    file: "moment-018.jpg.jpeg",
    type: "image",
    date: "12 September 2026",
    isoDate: "2026-09-12",
    caption: `aku gatau kenapa kalo kita bobo sambil vc, hati aku tenang bngtt. KAMU KALO BOBO LUCUU`
  },
  {
    file: "moment-019.jpg.jpeg",
    type: "image",
    date: "2 Oktober 2026",
    isoDate: "2026-10-02",
    caption: `AKU RASA KITA DI FOTO INI LUCU BANGETTT. kek orang pacaran mungkin?! YA GITU LAH POKONYA ADANSJFNJANUENGSU`
  }
];

// Grab the gallery's parts from the HTML
const momentsList     = document.getElementById("moments-list");
const lightbox        = document.getElementById("lightbox");
const lightboxImage   = document.getElementById("lightbox-image");
const lightboxMeta    = document.getElementById("lightbox-meta");
const lightboxText    = document.getElementById("lightbox-text");
const lightboxClose   = document.getElementById("lightbox-close");
const pageMain        = document.querySelector("main");

// Remembers which photo was tapped, so focus can go back to it when the viewer closes
let lastFocusedElement = null;

// Show a friendly message in place of a photo or video that can't be loaded
function showMomentError(photoBox, elementToHide, moment) {
  elementToHide.hidden = true;
  photoBox.classList.add("has-error");

  const note = document.createElement("p");
  note.className = "moment-error";
  note.textContent =
    "Sorry, this " + (moment.type === "video" ? "video" : "photo") + " can't be shown right now.";
  photoBox.appendChild(note);

  // This line is for YOU: it shows which file had a problem.
  console.warn("Gallery: could not load", MOMENTS_FOLDER + moment.file);
}

// Build one polaroid card
function createMomentCard(moment, index) {
  const number   = String(index + 1).padStart(2, "0");  // 1 becomes "01"
  const mediaUrl = encodeURI(MOMENTS_FOLDER + moment.file); // spaces become %20

  const item = document.createElement("li");
  item.className = "moment";

  const figure = document.createElement("figure");
  figure.className = "moment-figure";

  const photoBox = document.createElement("div");
  photoBox.className = "moment-photo";

  if (moment.type === "video") {
    // The video plays right in the card, with its own controls. No autoplay.
    const video = document.createElement("video");
    video.className = "moment-video";
    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;
    video.setAttribute("aria-label", "Moment " + number + " video");
    video.src = mediaUrl + "#t=0.1";   // "#t=0.1" makes phones show the first picture
    video.textContent = "Your browser can't play this video.";  // only shown by very old browsers

    video.addEventListener("loadedmetadata", function () {
      photoBox.classList.add("is-loaded");
    });

    video.addEventListener("error", function () {
      showMomentError(photoBox, video, moment);
    });

    video.addEventListener("play", function () {
      // Only runs if you switched PAUSE_AUDIO_WHILE_VIDEO to true
      if (PAUSE_AUDIO_WHILE_VIDEO) {
        if (!audio.paused) audio.pause();
        if (!voiceAudio.paused) voiceAudio.pause();
      }
    });

    photoBox.appendChild(video);
  } else {
    // A photo: the whole photo is a button that opens the big viewer
    const button = document.createElement("button");
    button.type = "button";
    button.className = "moment-photo-button";
    button.setAttribute("aria-label", "View moment " + number + " larger");

    const image = document.createElement("img");
    image.className = "moment-image";
    image.src = mediaUrl;
    image.alt = "Moment " + number + " photo";
    image.loading = "lazy";      // the photo loads only when it is near the screen
    image.decoding = "async";

    image.addEventListener("load", function () {
      photoBox.classList.add("is-loaded");
    });

    image.addEventListener("error", function () {
      showMomentError(photoBox, button, moment);
    });

    button.addEventListener("click", function () {
      openLightbox(moment, number, mediaUrl, button);
    });

    button.appendChild(image);
    photoBox.appendChild(button);
  }

  // The writing under the photo: number, date, caption
  const caption = document.createElement("figcaption");
  caption.className = "moment-caption";

  const numberBadge = document.createElement("span");
  numberBadge.className = "moment-number";

  const numberWord = document.createElement("span");
  numberWord.className = "visually-hidden";
  numberWord.textContent = "Moment ";   // read aloud by screen readers, not shown

  numberBadge.appendChild(numberWord);
  numberBadge.appendChild(document.createTextNode(number));
  caption.appendChild(numberBadge);

  if (moment.date) {
    const date = document.createElement("time");
    date.className = "moment-date";
    if (moment.isoDate) {
      date.dateTime = moment.isoDate;
    }
    date.textContent = moment.date;
    caption.appendChild(date);
  }

  if (moment.caption) {
    const text = document.createElement("p");
    text.className = "moment-text";
    text.textContent = moment.caption;   // textContent keeps your words exactly as written
    caption.appendChild(text);
  }

  figure.appendChild(photoBox);
  figure.appendChild(caption);
  item.appendChild(figure);
  return item;
}

// Make each card fade in softly the first time it scrolls into view
function setUpReveal() {
  // No animation if the device asks for less motion or the browser is too old:
  // the cards are simply visible.
  if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
    return;
  }

  const cards = momentsList.querySelectorAll(".moment");

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);   // do it only once per card
      }
    });
  }, { threshold: 0.12 });

  cards.forEach(function (card) {
    card.classList.add("reveal-ready");
    observer.observe(card);
  });
}

// ----- The big photo viewer (lightbox) -----

function openLightbox(moment, number, mediaUrl, triggerButton) {
  lastFocusedElement = triggerButton;

  lightboxImage.src = mediaUrl;
  lightboxImage.alt = "Moment " + number + " photo";

  lightboxMeta.textContent = "Moment " + number + (moment.date ? " · " + moment.date : "");

  lightboxText.textContent = moment.caption;
  lightboxText.hidden = !moment.caption;     // no empty space if there is no caption

  lightbox.hidden = false;
  document.body.classList.add("lightbox-open");  // the page behind stops scrolling
  pageMain.inert = true;                         // the page behind can't be reached with Tab

  lightboxClose.focus();                         // keyboard users start on the close button
}

function closeLightbox() {
  if (lightbox.hidden) return;

  lightbox.hidden = true;
  lightbox.classList.remove("lightbox--tall");   // back to the normal viewer size
  document.body.classList.remove("lightbox-open");
  pageMain.inert = false;
  lightboxImage.removeAttribute("src");          // stop holding the big photo in memory

  // Put keyboard focus back on the photo that was tapped
  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

lightboxClose.addEventListener("click", closeLightbox);

// Clicking the dark area around the photo also closes the viewer
lightbox.addEventListener("click", function (event) {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

// Escape closes the viewer. The "true" at the end makes this run BEFORE the other
// Escape handlers (letter and music panel), so one key press only closes the viewer.
document.addEventListener("keydown", function (event) {
  if (lightbox.hidden) return;

  if (event.key === "Escape") {
    closeLightbox();
    event.stopPropagation();
  }
}, true);

// ----- Start up (runs once when the page loads) -----
moments.forEach(function (moment, index) {
  momentsList.appendChild(createMomentCard(moment, index));
});
setUpReveal();

// ---------- "Our Little Archive": 19 chat screenshots (NEW: archive) ----------

// The folder that holds the screenshots (all of them end in .jpeg).
const ARCHIVE_FOLDER = "assets/images/Your Word That I Like/";

// THE LIST OF SCREENSHOTS, oldest date first. This is the only place you edit.
//   file    = the exact file name, with .jpeg. Do not rename the files.
//   date    = the date exactly as it should appear on the tape
//   isoDate = the same date as year-month-day (only used by browsers, not shown)
//   part    = 2 marks the second screenshot of the same day (leave it out otherwise)
// To change the order, move whole lines up or down.
const archiveItems = [
  { file: "10 April 2026.jpeg",          date: "10 April 2026",     isoDate: "2026-04-10" },
  { file: "13 April 2026.jpeg",          date: "13 April 2026",     isoDate: "2026-04-13" },
  { file: "15 April 2026.jpeg",          date: "15 April 2026",     isoDate: "2026-04-15" },
  { file: "17 April 2026.jpeg",          date: "17 April 2026",     isoDate: "2026-04-17" },
  { file: "21 April 2026.jpeg",          date: "21 April 2026",     isoDate: "2026-04-21" },
  { file: "22 April 2026.jpeg",          date: "22 April 2026",     isoDate: "2026-04-22" },
  { file: "24 April 2026.jpeg",          date: "24 April 2026",     isoDate: "2026-04-24" },
  { file: "24 April 2026 - 2.jpeg",      date: "24 April 2026",     isoDate: "2026-04-24", part: 2 },
  { file: "26 April 2026.jpeg",          date: "26 April 2026",     isoDate: "2026-04-26" },
  { file: "27 April 2026.jpeg",          date: "27 April 2026",     isoDate: "2026-04-27" },
  { file: "12 Juni 2026.jpeg",           date: "12 Juni 2026",      isoDate: "2026-06-12" },
  { file: "14 Juni 2026.jpeg",           date: "14 Juni 2026",      isoDate: "2026-06-14" },
  { file: "7 September 2026.jpeg",       date: "7 September 2026",  isoDate: "2026-09-07" },
  { file: "11 September 2026.jpeg",      date: "11 September 2026", isoDate: "2026-09-11" },
  { file: "12 September 2026.jpeg",      date: "12 September 2026", isoDate: "2026-09-12" },
  { file: "12 September 2026 - 2.jpeg",  date: "12 September 2026", isoDate: "2026-09-12", part: 2 },
  { file: "14 September 2026.jpeg",      date: "14 September 2026", isoDate: "2026-09-14" },
  { file: "23 September 2026.jpeg",      date: "23 September 2026", isoDate: "2026-09-23" },
  { file: "10 Oktober 2026.jpeg",        date: "10 Oktober 2026",   isoDate: "2026-10-10" }
];

// The (empty) list in the HTML that we fill with the pieces
const archiveList = document.getElementById("archive-list");

// Show a friendly message in place of a screenshot that can't be loaded
function showArchiveError(photoBox, elementToHide, item) {
  elementToHide.hidden = true;

  const note = document.createElement("p");
  note.className = "archive-error";
  note.textContent = "Sorry, this screenshot can't be shown right now.";
  photoBox.appendChild(note);

  // This line is for YOU: it shows which file had a problem.
  console.warn("Archive: could not load", ARCHIVE_FOLDER + item.file);
}

// Show the big version of a screenshot in the SAME viewer the gallery uses.
// (It uses the existing closeLightbox() to close, so Escape, the X button,
// clicking outside and returning focus all work like in the gallery.)
function openArchiveViewer(item, description, mediaUrl, triggerButton) {
  lastFocusedElement = triggerButton;

  lightboxImage.src = mediaUrl;
  lightboxImage.alt = description;

  lightboxMeta.textContent = item.date;   // just the date: these screenshots have no caption
  lightboxText.textContent = "";
    lightboxText.hidden = true;

  lightbox.classList.add("lightbox--tall");      // taller picture, date above it (see style.css)
  lightbox.hidden = false;
  document.body.classList.add("lightbox-open");  // the page behind stops scrolling
  pageMain.inert = true;                         // the page behind can't be reached with Tab

  lightboxClose.focus();
}

// Build one pinned screenshot
function createArchiveCard(item) {
  const mediaUrl = encodeURI(ARCHIVE_FOLDER + item.file);   // spaces become %20
  const description = "Chat screenshot from " + item.date +
    (item.part > 1 ? " (second screenshot of that day)" : "");

  const listItem = document.createElement("li");
  listItem.className = "archive-item";

  const piece = document.createElement("figure");
  piece.className = "archive-piece";

  const photoBox = document.createElement("div");
  photoBox.className = "archive-photo";

  // The whole screenshot is a button that opens the big viewer
  const button = document.createElement("button");
  button.type = "button";
  button.className = "archive-photo-button";
  button.setAttribute("aria-label", "View larger: " + description);

  const image = document.createElement("img");
  image.className = "archive-image";
  image.src = mediaUrl;
  image.alt = description;
  image.loading = "lazy";      // the screenshot loads only when it is near the screen
  image.decoding = "async";

  image.addEventListener("load", function () {
    photoBox.classList.add("is-loaded");
  });

  image.addEventListener("error", function () {
    showArchiveError(photoBox, button, item);
  });

  button.addEventListener("click", function () {
    openArchiveViewer(item, description, mediaUrl, button);
  });

  button.appendChild(image);
  photoBox.appendChild(button);

  // The washi tape with the date written on it
  const tape = document.createElement("figcaption");
  tape.className = "archive-tape";

  const date = document.createElement("time");
  date.dateTime = item.isoDate;
  date.textContent = item.date;
  tape.appendChild(date);

  piece.appendChild(photoBox);
  piece.appendChild(tape);
  listItem.appendChild(piece);
  return listItem;
}

// ----- Start up (runs once when the page loads) -----
archiveItems.forEach(function (item) {
  archiveList.appendChild(createArchiveCard(item));
});

// ---------- Decorative stars and hearts ----------
// We create them with JavaScript so the HTML stays short.
// Math.random() gives a random number between 0 and 1.
function createStars(count) {
  const container = document.getElementById("stars");

  for (let i = 0; i < count; i++) {
    const star = document.createElement("span");
    star.className = "star";

    const size = 1 + Math.random() * 2; // 1px to 3px
    star.style.width  = size + "px";
    star.style.height = size + "px";
    star.style.left = Math.random() * 100 + "%";
    star.style.top  = Math.random() * 100 + "%";
    star.style.animationDuration = 2 + Math.random() * 4 + "s";
    star.style.animationDelay    = Math.random() * 4 + "s";

    container.appendChild(star);
  }
}

function createHearts(count) {
  const container = document.getElementById("hearts");

  for (let i = 0; i < count; i++) {
    const heart = document.createElement("span");
    heart.className = "heart";
    heart.textContent = "♥"; // a text character, not an image

    heart.style.left = Math.random() * 100 + "%";
    heart.style.fontSize = 10 + Math.random() * 14 + "px";
    heart.style.animationDuration = 10 + Math.random() * 10 + "s";
    heart.style.animationDelay    = Math.random() * 12 + "s";

    container.appendChild(heart);
  }
}

// Run these once when the page loads
createStars(60);
createHearts(12);

// ===== START: A Little Crossword About Us (NEW) =====
// Everything is wrapped in ( function () { ... } )() so its variable names can never
// clash with the music player, the gallery or anything else in this file.
(function () {

  // THE LIST OF ANSWERS. This is the only place you edit the crossword.
  //   n      = the clue number
  //   dir    = "across" (mendatar) or "down" (menurun)
  //   row/col = where the FIRST letter sits in the grid (counting from 0, top-left)
  //   answer = the answer, capital letters, no spaces
  // The grid size and the crossing letters are worked out from this list.
  // If two words ever disagree about a shared letter, the browser console (F12) says so.
  const CW_WORDS = [
    { n: 1, dir: "across", row: 1, col: 1,  answer: "MARET",      clue: "Aku lahir di bulan apa?" },
    { n: 2, dir: "across", row: 7, col: 6,  answer: "NADIA",      clue: "Nama adik aku yang perempuan siapa?" },
    { n: 3, dir: "across", row: 3, col: 0,  answer: "VANILLA",    clue: "Kita sama-sama suka rasa apa?" },
    { n: 4, dir: "across", row: 9, col: 3,  answer: "PISANG",     clue: "Buah kesukaan aku apa?" },
    { n: 5, dir: "down",   row: 0, col: 1,  answer: "EMPATBELAS", clue: "Tanggal berapa aku pertama kali nge-chat kamu? (jawab dengan huruf, tanpa spasi)" },
    { n: 6, dir: "down",   row: 0, col: 10, answer: "LIMABELAS",  clue: "Tanggal berapa kita ngobrol berkelompok di matkul Pengantar Akuntansi bareng Rendi dan Rosi? (jawab dengan huruf, tanpa spasi)" },
    { n: 7, dir: "down",   row: 2, col: 6,  answer: "BATMAN",     clue: "Siapa nama kucing hitamku dulu pas SMA?" },
    { n: 8, dir: "down",   row: 3, col: 8,  answer: "CILEDUG",    clue: "Aku tinggal di Cirebon mananya?" }
  ];

  // Grab the parts from the HTML
  const gridEl        = document.getElementById("cw-grid");
  if (!gridEl) return;                       // the section is not on the page: do nothing
  const activeClueEl  = document.getElementById("cw-active-clue");
  const prevClueBtn   = document.getElementById("cw-prev");
  const nextClueBtn   = document.getElementById("cw-next");
  const checkBtn      = document.getElementById("cw-check");
  const clearWordBtn  = document.getElementById("cw-clear-word");
  const resetBtn      = document.getElementById("cw-reset");
  const progressEl    = document.getElementById("cw-progress");
  const progressFill  = document.getElementById("cw-progress-fill");
  const messageEl     = document.getElementById("cw-message");
  const finishEl      = document.getElementById("cw-finish");
  const acrossListEl  = document.getElementById("cw-clues-across");
  const downListEl    = document.getElementById("cw-clues-down");

  const DIR_NAME = { across: "Mendatar", down: "Menurun" };
  const TOTAL = CW_WORDS.length;             // 8

  // ----- Step 1: work out every square from the word list -----
  const cells    = {};                       // "row,col" -> square
  const allCells = [];

  CW_WORDS.forEach(function (word) {
    word.cells = [];

    for (let i = 0; i < word.answer.length; i++) {
      const r = word.row + (word.dir === "down"   ? i : 0);
      const c = word.col + (word.dir === "across" ? i : 0);
      const key = r + "," + c;
      const letter = word.answer.charAt(i);

      let cell = cells[key];
      if (!cell) {
        cell = { r: r, c: c, expected: letter, letter: "", words: {}, number: null };
        cells[key] = cell;
        allCells.push(cell);
      } else if (cell.expected !== letter) {
        // This should never happen. If it does, two answers disagree on a crossing.
        console.error("Crossword: crossing mismatch at row " + r + ", column " + c +
          " (" + cell.expected + " vs " + letter + ") for clue " + word.n);
      }

      cell.words[word.dir] = word;
      word.cells.push(cell);
      if (i === 0) cell.number = word.n;
    }
  });

  const ROWS = Math.max.apply(null, allCells.map(function (cell) { return cell.r; })) + 1;
  const COLS = Math.max.apply(null, allCells.map(function (cell) { return cell.c; })) + 1;
  gridEl.style.setProperty("--cw-cols", COLS);

  // ----- Step 2: draw the grid -----
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = cells[r + "," + c];
      const box = document.createElement("div");
      box.className = "cw-cell";

      if (!cell) {
        box.classList.add("is-blank");       // not part of any answer
        box.setAttribute("aria-hidden", "true");
        gridEl.appendChild(box);
        continue;
      }

      const input = document.createElement("input");
      input.type = "text";
      input.autocomplete = "off";
      input.autocapitalize = "characters";
      input.spellcheck = false;
      input.setAttribute("autocorrect", "off");
      input.setAttribute("enterkeyhint", "next");
      input.setAttribute("aria-label", "Row " + (r + 1) + ", column " + (c + 1));
      input.tabIndex = -1;                   // only the active square can be reached with Tab

      cell.el = box;
      cell.input = input;
      box.appendChild(input);

      if (cell.number !== null) {
        const num = document.createElement("span");
        num.className = "cw-num";
        num.setAttribute("aria-hidden", "true");
        num.textContent = cell.number;
        box.appendChild(num);
      }

      gridEl.appendChild(box);
      wireCell(cell);
    }
  }

  // ----- Step 3: draw the clue lists -----
  CW_WORDS.forEach(function (word) {
    const item = document.createElement("li");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "cw-clue";

    const num = document.createElement("span");
    num.className = "cw-clue-num";
    num.textContent = word.n;

    const text = document.createElement("span");
    text.className = "cw-clue-text";
    text.textContent = word.clue + " (" + word.answer.length + " huruf)";

    button.appendChild(num);
    button.appendChild(text);
    button.addEventListener("click", function () {
      goToWord(word);
    });

    word.clueButton = button;
    item.appendChild(button);
    (word.dir === "across" ? acrossListEl : downListEl).appendChild(item);
  });

  // ----- The state: which word and which square are active -----
  let activeWord = CW_WORDS[0];
  let activeCell = CW_WORDS[0].cells[0];
  let lastCheckedCount = 0;
  let resetTimer = null;

  // Highlight the active word and square, and update the clue bar
  function render() {
    allCells.forEach(function (cell) {
      cell.el.classList.toggle("is-in-word", activeWord.cells.indexOf(cell) !== -1);
      cell.el.classList.toggle("is-active", cell === activeCell);
      cell.input.tabIndex = (cell === activeCell) ? 0 : -1;
    });

    CW_WORDS.forEach(function (word) {
      const isActive = word === activeWord;
      word.clueButton.classList.toggle("is-active", isActive);
      if (isActive) {
        word.clueButton.setAttribute("aria-current", "true");
      } else {
        word.clueButton.removeAttribute("aria-current");
      }
    });

    activeClueEl.textContent =
      activeWord.n + " " + DIR_NAME[activeWord.dir] + ": " + activeWord.clue;
  }

  // Make a square active. "dir" is the direction we would like (used for crossing squares).
  function activate(cell, dir) {
    activeCell = cell;
    activeWord = cell.words[dir] || cell.words.across || cell.words.down;
    render();
  }

  function activateAndFocus(cell, dir) {
    activate(cell, dir);
    cell.input.focus();
  }

  // Jump to a clue: go to its first empty square (or its first square if it is full)
  function goToWord(word) {
    const target = word.cells.find(function (cell) { return !cell.letter; }) || word.cells[0];
    activateAndFocus(target, word.dir);
  }

  function stepWord(step) {
    const index = CW_WORDS.indexOf(activeWord);
    goToWord(CW_WORDS[(index + step + TOTAL) % TOTAL]);
  }

  // ----- Typing -----
  function typeLetter(cell, letter) {
    cell.letter = letter;
    cell.input.value = letter;
    clearFeedback();
    moveAfterTyping(cell);
  }

  // After a letter: go to the next square of the same word. After the LAST square,
  // go to an empty square of this word if one is left, otherwise on to the next clue.
  function moveAfterTyping(cell) {
    const index = activeWord.cells.indexOf(cell);

    if (index < activeWord.cells.length - 1) {
      activateAndFocus(activeWord.cells[index + 1], activeWord.dir);
      return;
    }

    const anyEmpty = activeWord.cells.find(function (c) { return !c.letter; });
    if (anyEmpty) {
      activateAndFocus(anyEmpty, activeWord.dir);
    } else {
      stepWord(1);
    }
  }

  function clearCell(cell) {
    cell.letter = "";
    cell.input.value = "";
  }

  function backspace(cell) {
    if (cell.letter) {
      clearCell(cell);
      clearFeedback();
      return;
    }

    const index = activeWord.cells.indexOf(cell);
    if (index > 0) {
      const previous = activeWord.cells[index - 1];
      clearCell(previous);
      clearFeedback();
      activateAndFocus(previous, activeWord.dir);
    }
  }

  // Arrow keys: move to the neighbouring square, if there is one
  function moveByArrow(cell, rowStep, colStep) {
    const next = cells[(cell.r + rowStep) + "," + (cell.c + colStep)];
    if (!next) return;

    const wantedDir = (colStep !== 0) ? "across" : "down";
    activateAndFocus(next, next.words[wantedDir] ? wantedDir : activeWord.dir);
  }

  function wireCell(cell) {
    const input = cell.input;
    let wasActiveBeforePress = false;

    // Remember if this square was already active BEFORE the tap,
    // so tapping it a second time can switch between across and down.
    input.addEventListener("pointerdown", function () {
      wasActiveBeforePress = (activeCell === cell);
    });

    input.addEventListener("click", function () {
      if (wasActiveBeforePress && cell.words.across && cell.words.down) {
        activate(cell, activeWord.dir === "across" ? "down" : "across");
      } else {
        activate(cell, activeWord.dir);
      }
      wasActiveBeforePress = false;
      input.select();
    });

    // Reaching a square with the keyboard (Tab) also makes it active
    input.addEventListener("focus", function () {
      if (activeCell !== cell) {
        activate(cell, activeWord.dir);
      }
    });

    input.addEventListener("keydown", function (event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;   // keep shortcuts like copy/paste
      const key = event.key;

      if (key === "Backspace") {
        event.preventDefault();
        backspace(cell);
      } else if (key === "Delete") {
        event.preventDefault();
        clearCell(cell);
        clearFeedback();
      } else if (key === "ArrowRight") {
        event.preventDefault();
        moveByArrow(cell, 0, 1);
      } else if (key === "ArrowLeft") {
        event.preventDefault();
        moveByArrow(cell, 0, -1);
      } else if (key === "ArrowDown") {
        event.preventDefault();
        moveByArrow(cell, 1, 0);
      } else if (key === "ArrowUp") {
        event.preventDefault();
        moveByArrow(cell, -1, 0);
      } else if (key === "Enter") {
        event.preventDefault();
        stepWord(event.shiftKey ? -1 : 1);
      } else if (key.length === 1) {
        // One typed character. Letters (any case) are used; spaces, digits and
        // punctuation are ignored, so answers are always judged the same way.
        event.preventDefault();
        if (/^[a-z]$/i.test(key)) {
          typeLetter(cell, key.toUpperCase());
        }
      }
    });

    // Phone keyboards often do not send normal key events, so we also listen to "input".
    input.addEventListener("input", function (event) {
      if (event.isComposing) return;

      const raw = input.value;
      const letters = raw.toUpperCase().match(/[A-Z]/g);

      if (letters) {
        typeLetter(cell, letters[letters.length - 1]);
      } else if (raw === "") {
        if (cell.letter) {                       // the letter was deleted
          clearCell(cell);
          clearFeedback();
        }
      } else {
        input.value = cell.letter;               // a space, digit or symbol: ignore it
      }
    });

    // Backspace on an empty square (some phone keyboards report it only here)
    input.addEventListener("beforeinput", function (event) {
      if (event.inputType === "deleteContentBackward" && !cell.letter) {
        event.preventDefault();
        backspace(cell);
      }
    });

    // Pasting: only the letters are used, filling the current word from this square
    input.addEventListener("paste", function (event) {
      event.preventDefault();
      const text = (event.clipboardData || window.clipboardData).getData("text");
      const letters = text.toUpperCase().match(/[A-Z]/g);
      if (!letters) return;

      const start = activeWord.cells.indexOf(cell);
      let last = cell;
      letters.slice(0, activeWord.cells.length - start).forEach(function (letter, offset) {
        const target = activeWord.cells[start + offset];
        target.letter = letter;
        target.input.value = letter;
        last = target;
      });
      clearFeedback();
      moveAfterTyping(last);
    });
  }

  // ----- Feedback -----

  // Remove the green and red marks, the message and the final card
  function clearMarks() {
    allCells.forEach(function (cell) {
      cell.el.classList.remove("is-correct", "is-wrong");
    });
    CW_WORDS.forEach(function (word) {
      word.clueButton.classList.remove("is-done");
    });
    messageEl.textContent = "";
    finishEl.hidden = true;
  }

  function showProgress(count, isOutOfDate) {
    progressEl.textContent = "Correct answers: " + count + " of " + TOTAL +
      (isOutOfDate ? " (press Check answers to update)" : "");
    progressFill.style.setProperty("--cw-progress", (count / TOTAL * 100) + "%");
  }

  // Called whenever a letter changes: old marks are no longer true, so they are removed
  function clearFeedback() {
    clearMarks();
    showProgress(lastCheckedCount, lastCheckedCount > 0);
  }

  function checkAnswers() {
    clearMarks();

    let correct = 0;
    let wrong = 0;
    let empty = 0;

    CW_WORDS.forEach(function (word) {
      const isFull = word.cells.every(function (cell) { return cell.letter !== ""; });
      const isRight = isFull && word.cells.every(function (cell) {
        return cell.letter === cell.expected;
      });

      if (isRight) {
        correct++;
        word.clueButton.classList.add("is-done");
        word.cells.forEach(function (cell) { cell.el.classList.add("is-correct"); });
      } else if (isFull) {
        wrong++;
        // Only the squares with a wrong letter get the red mark. Nothing else is revealed.
        word.cells.forEach(function (cell) {
          if (cell.letter !== cell.expected) cell.el.classList.add("is-wrong");
        });
      } else {
        empty++;
      }
    });

    lastCheckedCount = correct;
    showProgress(correct, false);

    if (correct === TOTAL) {
      messageEl.textContent = "All 8 are right!";
      finishEl.hidden = false;
      finishEl.scrollIntoView({
        behavior: reducedMotionQuery.matches ? "auto" : "smooth",
        block: "nearest"
      });
    } else {
      const parts = [];
      if (wrong > 0) {
        parts.push(wrong + (wrong === 1 ? " answer is" : " answers are") + " not right yet");
      }
      if (empty > 0) {
        parts.push(empty + (empty === 1 ? " answer is" : " answers are") + " not finished");
      }
      messageEl.textContent = parts.join(", ") + ". Try again, you can do it!";
    }
  }

  function clearActiveWord() {
    activeWord.cells.forEach(clearCell);
    clearFeedback();
    goToWord(activeWord);
  }

  // "Start over" asks for a second tap, so nobody wipes the whole crossword by accident
  function resetCrossword() {
    if (!resetBtn.dataset.confirm) {
      resetBtn.dataset.confirm = "1";
      resetBtn.textContent = "Tap again to clear everything";
      resetTimer = setTimeout(cancelResetConfirm, 3500);
      return;
    }

    cancelResetConfirm();
    allCells.forEach(clearCell);
    lastCheckedCount = 0;
    clearMarks();
    showProgress(0, false);
    activate(CW_WORDS[0].cells[0], "across");
  }

  function cancelResetConfirm() {
    clearTimeout(resetTimer);
    delete resetBtn.dataset.confirm;
    resetBtn.textContent = "Start over";
  }

  // ----- Buttons -----
  checkBtn.addEventListener("click", checkAnswers);
  clearWordBtn.addEventListener("click", clearActiveWord);
  resetBtn.addEventListener("click", resetCrossword);
  prevClueBtn.addEventListener("click", function () { stepWord(-1); });
  nextClueBtn.addEventListener("click", function () { stepWord(1); });

  // ----- Start up (runs once when the page loads) -----
  // Highlights clue 1 but does NOT focus it, so the phone keyboard does not pop up by itself.
  render();
  showProgress(0, false);

})();
// ===== END: A Little Crossword About Us =====

// ===== START: Four new scrapbook sections (NEW) =====
(function () {

  const IMAGES_ROOT = "assets/images/";

  // Removes the file extension from a name (used for the Slander captions)
  const EXTENSION_AT_END = /\.(jpe?g|png|webp|gif)$/i;

  // The file names below are copied exactly from your folders. Do not rename the files.
  // prefix "scrap"   = small mini scrapbook
  // prefix "slander" = big cards, and the caption is the file name without its extension
  const SECTIONS = [
    {
      listId: "glimpses-list",
      folder: "Little Glimpses of Your Beauty/",
      title: "Little Glimpses of Your Beauty",
      prefix: "scrap",
      files: [
  // 5 foto pertama
  "WhatsApp Image 2026-10-15 at 21.44.16 (1).jpeg",
  "WhatsApp Image 2026-10-15 at 21.44.16.jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.37.jpeg",
  "WhatsApp Image 2026-10-15 at 21.44.15 (1).jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.32 (3).jpeg",
  // foto lainnya (urutan relatif lama dipertahankan)
  "WhatsApp Image 2026-10-15 at 19.49.29.jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.30 (1).jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.31 (2).jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.31.jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.32 (1).jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.32 (2).jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.32.jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.33 (1).jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.33 (2).jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.33.jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.34 (1).jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.34 (2).jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.34 (3).jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.34.jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.35 (1).jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.35 (2).jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.35.jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.36 (1).jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.36 (2).jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.36.jpeg",
  // 3 foto terakhir
  "Screenshot 2026-09-28 085730.png",
  "WhatsApp Image 2026-10-15 at 19.49.30.jpeg",
  "WhatsApp Image 2026-10-15 at 19.49.31 (1).jpeg"
]
    },
    {
      listId: "roblox-list",
      folder: "Our Roblox Gameplay/",
      title: "Our Little Roblox Adventures",
      prefix: "scrap",
      files: [
        "Screenshot 2026-06-17 151025.png",
        "Screenshot 2026-06-22 122043.png",
        "Screenshot 2026-06-22 132056.png",
        "Screenshot 2026-06-23 215607.png",
        "Screenshot 2026-06-23 215823.png",
        "Screenshot 2026-07-28 210451.png",
        "Screenshot 2026-07-30 232244.png"
      ]
    },
    {
      listId: "reminds-list",
      folder: "Somehow, It Reminds Me of You/",
      title: "Somehow, It Reminds Me of You",
      prefix: "scrap",
      files: [
        "WhatsApp Image 2026-10-15 at 21.44.15.jpeg",
        "WhatsApp Image 2026-10-15 at 19.51.20 (1).jpeg",
        "WhatsApp Image 2026-10-15 at 19.51.20.jpeg",
        "WhatsApp Image 2026-10-15 at 19.51.21 (1).jpeg",
        "WhatsApp Image 2026-10-15 at 19.51.21 (2).jpeg",
        "WhatsApp Image 2026-10-15 at 19.51.21 (3).jpeg",
        "WhatsApp Image 2026-10-15 at 19.51.21.jpeg",
        "WhatsApp Image 2026-10-15 at 19.51.22 (1).jpeg",
        "WhatsApp Image 2026-10-15 at 19.51.22 (2).jpeg",
        "WhatsApp Image 2026-10-15 at 19.51.22.jpeg",
        "WhatsApp Image 2026-10-15 at 19.51.23 (1).jpeg",
        "WhatsApp Image 2026-10-15 at 19.51.23 (2).jpeg",
        "WhatsApp Image 2026-10-15 at 19.51.23 (3).jpeg",
        "WhatsApp Image 2026-10-15 at 19.51.23.jpeg",
        "WhatsApp Image 2026-10-15 at 19.51.24 (1).jpeg",
        "WhatsApp Image 2026-10-15 at 19.51.24 (2).jpeg",
        "WhatsApp Image 2026-10-15 at 19.51.24.jpeg",
        "WhatsApp Image 2026-10-15 at 19.51.25 (1).jpeg",
        "WhatsApp Image 2026-10-15 at 19.51.25.jpeg",
        "WhatsApp Image 2026-10-15 at 19.51.26.jpeg"
      ]
    },
    {
      listId: "slander-list",
      folder: "Ragebait/",
      title: "The Nora Slander Department",
      prefix: "slander",
      captionFromName: true,
      stamps: ["ALLEGEDLY", "GUILTY?!", "1000% REALL"],
      files: [
        "disini aku lihat dengan mataku sendiri kamu lagi mabar roblox dengan entah siapa dia... sedih bgt.png",
        "ini ga expect bgt si... kamu abis ini mau foto keluarga kan sama pa herry makanya bajunya sama..jpeg",
        "ini tu momen pada saat kamu nembak aku dan ngasih aku bunga. tapi disitu aku belum bisa nerima kamu karena aku lagi ngejar cita cita untuk jadi ci i o WKWKWK.png"
      ]
    }
  ];

  // Open the EXISTING viewer (#lightbox) with one of these photos.
  // Closing is done by the existing closeLightbox(), so X, Escape and clicking outside all work.
  function openScrapViewer(url, alt, meta, text, triggerButton) {
    lastFocusedElement = triggerButton;

    lightbox.classList.remove("lightbox--tall");   // normal size (not the tall chat-screenshot mode)
    lightboxImage.src = url;
    lightboxImage.alt = alt;
    lightboxMeta.textContent = meta;
    lightboxText.textContent = text || "";
    lightboxText.hidden = !text;

    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    pageMain.inert = true;

    lightboxClose.focus();
  }

  // Friendly message in place of a photo that can't be loaded
  function showError(photoBox, elementToHide, prefix, url) {
    elementToHide.hidden = true;

    const note = document.createElement("p");
    note.className = prefix + "-error";
    note.textContent = "Sorry, this photo can't be shown right now.";
    photoBox.appendChild(note);

    // This line is for YOU: it shows which file had a problem.
    console.warn("Scrapbook: could not load", url);
  }

  function createCard(section, file, index) {
    const prefix  = section.prefix;
    const url     = encodeURI(IMAGES_ROOT + section.folder + file);   // spaces become %20
    const caption = section.captionFromName ? file.replace(EXTENSION_AT_END, "") : "";
    const number  = index + 1;
    const alt     = caption || ("Photo " + number + " in " + section.title);

    const item = document.createElement("li");
    item.className = prefix + "-item";

    const figure = document.createElement("figure");
    figure.className = prefix + "-frame";

    const photoBox = document.createElement("div");
    photoBox.className = prefix + "-photo";

    const button = document.createElement("button");
    button.type = "button";
    button.className = prefix + "-photo-button";
    button.setAttribute("aria-label", "View larger: " + alt);

    const image = document.createElement("img");
    image.className = prefix + "-image";
    image.src = url;
    image.alt = alt;
    image.loading = "lazy";
    image.decoding = "async";

    image.addEventListener("load", function () {
      photoBox.classList.add("is-loaded");
    });
    image.addEventListener("error", function () {
      showError(photoBox, button, prefix, url);
    });
    button.addEventListener("click", function () {
      openScrapViewer(url, alt, section.title, caption, button);
    });

    button.appendChild(image);
    photoBox.appendChild(button);
    figure.appendChild(photoBox);

    // Only the Slander cards have a caption (taken from the file name) and a stamp
    if (caption) {
      const figcaption = document.createElement("figcaption");
      figcaption.className = prefix + "-caption";

      const text = document.createElement("p");
      text.className = prefix + "-text";
      text.textContent = caption;      // textContent keeps the words exactly as in the file name
      figcaption.appendChild(text);
      figure.appendChild(figcaption);
    }

    if (section.stamps) {
      const stamp = document.createElement("span");
      stamp.className = prefix + "-stamp";
      stamp.setAttribute("aria-hidden", "true");
      stamp.textContent = section.stamps[index % section.stamps.length];
      figure.appendChild(stamp);
    }

    item.appendChild(figure);
    return item;
  }

  // ----- Start up (runs once when the page loads) -----
  SECTIONS.forEach(function (section) {
    const list = document.getElementById(section.listId);
    if (!list) return;                       // that section is not on the page: skip it

    section.files.forEach(function (file, index) {
      list.appendChild(createCard(section, file, index));
    });
  });

})();
// ===== END: Four new scrapbook sections =====

// ===== START: Birthday fireworks (NEW) =====
(function () {
  const canvas = document.getElementById("fireworks-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Warna (R, G, B): soft pink, pink, rose gold, putih, warm gold
  const SOFT_PINK = [255, 194, 217];
  const PINK      = [255, 143, 184];
  const ROSE_GOLD = [232, 168, 150];
  const WHITE     = [255, 248, 250];
  const GOLD      = [255, 214, 150];

  // Tiap ledakan memakai satu palet, supaya warnanya serasi
  const PALETTES = [
    [SOFT_PINK, WHITE],
    [PINK, SOFT_PINK],
    [ROSE_GOLD, WHITE],
    [PINK, GOLD],
    [SOFT_PINK, ROSE_GOLD],
    [WHITE, GOLD]
  ];

  const reduceQuery   = window.matchMedia("(prefers-reduced-motion: reduce)");
  const FRAME_MS      = 1000 / 60;
  const MAX_PARTICLES = 450;   // batas keamanan supaya tetap ringan

  let width = 0, height = 0, dpr = 1;
  let running = false, rafId = null;
  let lastTime = 0, clock = 0, nextLaunch = 0, lastX = 0.5;
  let rockets = [], particles = [];

  function rand(min, max) { return min + Math.random() * (max - min); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  // Samakan ukuran canvas dengan ukuran layar birthday (dibatasi 2x supaya ringan di HP)
  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width  = rect.width;
    height = rect.height;
    canvas.width  = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function onResize() {
    if (running) resize();
  }

  // Ledakan radial + glitter di titik (x, y)
  function explode(x, y) {
    const reduced = reduceQuery.matches;
    const palette = pick(PALETTES);
    const scale   = Math.min(Math.max(Math.min(width, height) / 700, 0.65), 1.15);
    const count   = reduced ? 24 : (width < 600 ? 48 : 72);
    const base    = (reduced ? 3.6 : 5) * scale;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rand(-0.06, 0.06);
      const speed = base * rand(0.55, 1);
      const life  = rand(1500, 2300);
      particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: life, maxLife: life,
        size: rand(1.2, 2.1),
        color: Math.random() < 0.7 ? palette[0] : palette[1],
        friction: 0.962,
        gravity: reduced ? 0 : 0.022,
        glitter: false, phase: 0
      });
    }

    // Glitter kecil yang berkelip dan turun pelan
    const glitterCount = reduced ? 0 : (width < 600 ? 10 : 18);
    for (let j = 0; j < glitterCount; j++) {
      const angle = rand(0, Math.PI * 2);
      const speed = base * rand(0.1, 0.6);
      const life  = rand(1800, 3000);
      particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: life, maxLife: life,
        size: rand(0.8, 1.5),
        color: Math.random() < 0.5 ? WHITE : GOLD,
        friction: 0.95,
        gravity: 0.012,
        glitter: true, phase: rand(0, Math.PI * 2)
      });
    }
  }

  // Satu kembang api: naik dulu (roket kecil), lalu meledak.
  // Kalau "reduce motion" aktif, langsung meledak tanpa roket.
  function launch() {
    if (particles.length > MAX_PARTICLES) return;

    // Hindari dua ledakan berturut-turut di posisi yang sama
    let xRatio = rand(0.12, 0.88);
    for (let tries = 0; tries < 5 && Math.abs(xRatio - lastX) < 0.2; tries++) {
      xRatio = rand(0.12, 0.88);
    }
    lastX = xRatio;

    const x = xRatio * width;
    const targetY = rand(0.14, 0.42) * height;   // di area atas, jauh dari tombol Enter

    if (reduceQuery.matches) {
      explode(x, targetY);
    } else {
      rockets.push({ x: x, y0: height + 8, y1: targetY, y: height + 8, t: 0, dur: rand(900, 1300) });
    }
  }

  function scheduleNext() {
    nextLaunch = clock + (reduceQuery.matches ? rand(3200, 5000) : rand(1500, 2900));
  }

  function update(step, dt) {
    // Roket
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.t += dt / r.dur;
      const eased = 1 - Math.pow(1 - Math.min(r.t, 1), 3);
      r.y = r.y0 + (r.y1 - r.y0) * eased;
      if (r.t >= 1) {
        explode(r.x, r.y);
        rockets.splice(i, 1);
      }
    }

    // Partikel
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vx *= Math.pow(p.friction, step);
      p.vy *= Math.pow(p.friction, step);
      p.vy += p.gravity * step;
      p.x  += p.vx * step;
      p.y  += p.vy * step;
      p.life -= dt;
      p.phase += 0.3 * step;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";   // cahaya menumpuk jadi lebih terang, terasa berkilau
    ctx.lineCap = "round";

    // Roket: garis tipis keemasan
    rockets.forEach(function (r) {
      ctx.beginPath();
      ctx.moveTo(r.x, r.y + 16);
      ctx.lineTo(r.x, r.y);
      ctx.strokeStyle = "rgba(255, 214, 150, 0.55)";
      ctx.lineWidth = 1.6;
      ctx.stroke();
    });

    // Partikel
    particles.forEach(function (p) {
      let alpha = Math.pow(Math.max(p.life / p.maxLife, 0), 1.4);
      if (p.glitter) alpha *= 0.55 + 0.45 * Math.sin(p.phase);   // berkelip
      if (alpha < 0.01) return;

      const c = p.color;

      // Cahaya lembut di sekeliling titik
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2.6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (alpha * 0.16) + ")";
      ctx.fill();

      if (p.glitter) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + alpha + ")";
        ctx.fill();
      } else {
        // Percikan dengan ekor pendek
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (alpha * 0.9) + ")";
        ctx.lineWidth = p.size;
        ctx.stroke();
      }
    });

    ctx.globalCompositeOperation = "source-over";
  }

  // Satu "putaran" animasi. Hanya ada SATU loop, dan berhenti sendiri kalau running = false.
  function frame(now) {
    if (!running) return;

    const dt   = lastTime ? Math.min(now - lastTime, 50) : FRAME_MS;  // dibatasi, supaya tidak "loncat" setelah tab tersembunyi
    const step = dt / FRAME_MS;
    lastTime = now;
    clock += dt;

    if (clock >= nextLaunch) {
      launch();
      scheduleNext();
    }

    update(step, dt);
    draw();
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;          // sudah jalan: jangan bikin loop kedua
    running = true;
    resize();
    rockets = [];
    particles = [];
    lastTime = 0;
    clock = 0;
    nextLaunch = 600;             // ledakan pertama muncul sebentar setelah layar tampil
    window.addEventListener("resize", onResize);
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    window.removeEventListener("resize", onResize);
    rockets = [];
    particles = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  window.NoraFireworks = { start: start, stop: stop };
})();
// ===== END: Birthday fireworks =====