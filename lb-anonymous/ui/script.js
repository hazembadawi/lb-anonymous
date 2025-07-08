let playerId = null;
let notificationContainer = null;
let currentNameColor = "#00ffff";

function sendCurrentChatMessage() {
  if (!chatInput) return;
  const text = chatInput.value.trim();
  if (text === "") return;
  fetchNui("sendChatMessage", {
    playerId: playerId || "Unknown",
    color: currentNameColor,
    message: text,
  });
  chatInput.value = "";
  const box = getChatMessagesElement();
  if (box) box.scrollTop = box.scrollHeight;
}
function mapTileURL(x, y, zoom = 4) {
  const u = (x + 4096) / 8192;
  const v = 1 - (y + 4096) / 8192;
  return `https://maptiles.lb-phone.dev/grey/${zoom}/${Math.floor(u*2**zoom)}/${Math.floor(v*2**zoom)}.png`;
}

function createNotificationContainer() {
  notificationContainer = document.createElement("div");
  notificationContainer.style.position = "fixed";
  notificationContainer.style.top = "20px";
  notificationContainer.style.right = "20px";
  notificationContainer.style.width = "300px";
  notificationContainer.style.zIndex = "9999";
  notificationContainer.style.fontFamily = "Arial, sans-serif";
  document.body.appendChild(notificationContainer);
}
if (!notificationContainer) createNotificationContainer();

window.addEventListener("message", (e) => {
  if (e.data.action === "open") document.body.style.visibility = "visible";
  if (e.data.action === "close") document.body.style.visibility = "hidden";
});

function showNotification(title) {
  const notif = document.createElement("div");
  notif.textContent = title;
  notif.style.background = "#132C48";
  notif.style.color = "white";
  notif.style.padding = "10px 20px";
  notif.style.marginBottom = "10px";
  notif.style.borderRadius = "8px";
  notif.style.boxShadow = "0 2px 8px rgba(0,0,0,0.25)";
  notif.style.opacity = "0";
  notif.style.transition = "opacity 0.3s ease";
  notificationContainer.appendChild(notif);
  notif.classList.add("notif-glitch");
  requestAnimationFrame(() => {
    notif.style.opacity = "1";
  });
  setTimeout(() => {
    notif.style.opacity = "0";
    notif.addEventListener("transitionend", () => {
      notif.remove();
    });
  }, 5000);
}

window.sendGlobalNotification = function (data) {
  showNotification(data.title);
};

function getChatMessagesElement() {
  let el = document.getElementById("chatMessages");
  if (!el) el = document.querySelector(".chat-messages");
  if (el) el.style.display = "block";
  return el;
}

window.addEventListener("message", (event) => {
  if (event.data.action === "setPlayerId") playerId = event.data.playerId;
  if (event.data.type === "sendGlobalNotification") showNotification(event.data.title);
  if (event.data.type === "updateDirection") {
    const dirEl = document.getElementById("direction");
    if (dirEl) dirEl.innerText = event.data.direction;
  }
  if (event.data.type === "broadcastAnonymousChat") {
    const wrap = document.getElementById("phone-wrapper");
    if (wrap) wrap.style.display = "block";
    const chatBox = getChatMessagesElement();
    if (chatBox) appendChatMessage(event.data.playerId, event.data.message, event.data.color);
  }
});

const contextBtn = document.getElementById("context");
if (contextBtn) {
  contextBtn.onclick = () => {
    const notificationText =
      document.getElementById("notificationText").value || "Notification text";
    setContextMenu({
      title: "Notification",
      buttons: [
        {
          title: "Send Notification",
          color: "blue",
          cb: () => {
            const text =
              document.getElementById("notificationText").value ||
              "Notification text";
            fetchNui("sendGlobalNotification", { title: text });
          },
        },
      ],
    });
  };
}

const galleryBtn = document.getElementById("gallery");
if (galleryBtn) {
  galleryBtn.onclick = () => {
    selectGallery({
      includeVideos: false,
      includeImages: true,
      cb: (data) => {
        const msg = data.isVideo
          ? { isVideo: true, thumb: data.thumbnail, video: data.src }
          : { isVideo: false, src: data.src };
  
        fetchNui("sendChatMessage", {
          playerId: playerId || "Unknown",
          color   : currentNameColor,
          message : msg
        });
      }
    });
  
};
}

const emojiBtn = document.getElementById("emoji");
if (emojiBtn) {
  emojiBtn.onclick = () => {
    selectEmoji((emoji) => {
      const chatInput = document.getElementById("chatInput");
      if (chatInput) {
        const start = chatInput.selectionStart;
        const end = chatInput.selectionEnd;
        const text = chatInput.value;
        chatInput.value = text.slice(0, start) + emoji + text.slice(end);
        chatInput.selectionStart = chatInput.selectionEnd = start + emoji.length;
        chatInput.focus();
      }
    });
  };
}

const colorPickerBtn = document.getElementById("colorpicker");
if (colorPickerBtn) {
  colorPickerBtn.onclick = () => {
    colorPicker((color) => {
      currentNameColor = color;
      setPopUp({
        title: "Selected color",
        description: color,
        buttons: [{ title: "OK" }],
      });
    });
  };
}

const cameraBtn = document.getElementById("cameracomponent");
if (cameraBtn) {
  cameraBtn.onclick = () => {
    useCamera(
      (url) => {
        setPopUp({
          title: "Media taken",
          attachment: { src: url },
          buttons: [
            {
              title: "Send",
              color: "blue",
              cb: () => {
                fetchNui("sendChatMessage", {
                  playerId: playerId || "Unknown",
                  color   : currentNameColor,
                  message : { isVideo: false, src: url }   
                });
              }
            },
            { title: "Discard" }
          ]
        });
      },
      {
        default: { type: "Photo", flash: false, camera: "rear" },
        permissions: {
          toggleFlash: true,
          flipCamera: true,
          takePhoto: true,
          takeVideo: true,
          takeLandscapePhoto: true
        }
      }
    );
  };

}
const locationBtn = document.getElementById("locationBtn");
if (locationBtn) {
  locationBtn.onclick = () => {
    fetchNui("requestPlayerCoords").then((coords) => {
      fetchNui("sendChatMessage", {
        playerId: playerId || "Unknown",
        color   : currentNameColor,
        message : { type: "location", coords: coords }
      });
    });
  };
}

if (typeof onSettingsChange === "function") {
  onSettingsChange((settings) => {
    const appEl = document.getElementsByClassName("app")[0];
    if (appEl) appEl.dataset.theme = settings.display.theme;
  });
}
if (typeof getSettings === "function") {
  getSettings().then((settings) => {
    const appEl = document.getElementsByClassName("app")[0];
    if (appEl) appEl.dataset.theme = settings.display.theme;
  });
}

const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

const sendBtn = document.getElementById("sendBtn");
if (sendBtn) sendBtn.addEventListener("click", sendCurrentChatMessage);

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) logoutBtn.addEventListener("click", () => {
  document.getElementById("passwordScreen").style.display = "flex";
  if (document.getElementById("admin-wrapper")) document.getElementById("admin-wrapper").style.display = "none";
  if (document.getElementById("phone-wrapper")) document.getElementById("phone-wrapper").style.display = "none";
  document.body.style.visibility = "hidden";
});

if (chatInput) {
  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendCurrentChatMessage();
    }
  });
}

function appendChatMessage(pid, message, color) {
  const el    = document.createElement("div");
  const label = `<span style="color:${color};">Anonymous #${pid}:</span><br>`;

  if (typeof message === "object") {

    if (message.type === "location") {
      const { x, y } = message.coords;
      el.innerHTML =
        `${label}
         <button style="
            margin-top:4px;
            padding:6px 12px;
            background:##112943;
            color:#fff;
            border:none;
            border-radius:6px;
            cursor:pointer;">
           📍 Set GPS
         </button>`;
      el.querySelector("button").addEventListener("click", () => {
        fetchNui("setWaypoint", { x, y });
      });

    } else if (message.isVideo) {
      el.innerHTML =
        label +
        `<div style="position:relative;display:inline-block;">
           <img src="${message.thumb}" style="max-width:100%;border-radius:6px;cursor:pointer;">
           <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                        font-size:32px;color:white;text-shadow:0 0 4px black;">▶</span>
         </div>`;
      el.querySelector("img").addEventListener("click", () => {
        if (typeof openMedia === "function") openMedia({ src: message.video });
      });

    } else if (message.src) {
      el.innerHTML =
        label +
        `<img src="${message.src}" style="max-width:100%;border-radius:6px;">`;
    }

  } else {
    el.innerHTML = `${label}${message}`;
  }

  const box = getChatMessagesElement();
  if (box) {
    box.appendChild(el);
    box.scrollTop = box.scrollHeight;
  }
}



setTimeout(() => {
  if (!playerId) {
    fetchNui("getPlayerId").then((id) => {
      playerId = id;
    });
  }
}, 500);

window.addEventListener("message", (e) => {
  if (e.data.action === "anonymous:open") document.body.style.visibility = "visible";
  if (e.data.action === "anonymous:close") document.body.style.visibility = "hidden";
});
