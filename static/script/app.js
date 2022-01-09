const socket = io();

const call = document.getElementById("call");
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const chatList = document.getElementById("chatList");
const chatForm = document.getElementById("chatForm");
const chat = document.getElementById("chat");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName = "";
let myPeerConnection;
let dataChannel;
let screenId = "";

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      option.id = "camera";
      if (currentCamera.label == camera.label) {
        option.selected = true;
      }
      cameraSelect.appendChild(option);
    });
  } catch (error) {
    console.log(error);
    console.log("1234");
  }
}

async function getScreens() {
  const screen = await navigator.mediaDevices.getUserMedia({
    video: { mediaSource: "screen" }
  });
  screenId = screen.id;
  const option = document.createElement("option");
  option.value = screenId;
  option.id = "screen";
  option.innerText = "Screen Share";
  cameraSelect.appendChild(option);
}

async function getMedia(deviceId, id) {
  const initialConstraints = {
    audio: true,
    video: { facingMode: "user" }
  };
  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } }
  };

  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      id === "camera" ? cameraConstraints : initialConstraints
    );

    if (id === "screen") {
      myStream = await navigator.mediaDevices.getDisplayMedia({
        cursor: true,
        audio: true,
        video: true
      });
    }

    myFace.srcObject = myStream;

    if (!deviceId) {
      await getCameras();
      await getScreens();
    }
  } catch (error) {
    console.log(error);
  }
}

function handleMuteBtn() {
  myStream.getAudioTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });
  const audiosender = myPeerConnection
    .getSenders()
    .find((sender) => sender.track.kind === "audio");

  if (!audiosender.muted) {
    muteBtn.innerText = "Unmute";
    audiosender.muted = true;
  } else {
    muteBtn.innerText = "Mute";
    audiosender.muted = false;
  }
}
function handleCameraBtn() {
  myStream.getVideoTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });
  if (cameraOff) {
    cameraBtn.innerText = "CameraOff";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "CameraOn";
    cameraOff = true;
  }
}

async function handleCameraSelect() {
  try {
    const id = cameraSelect.options[cameraSelect.selectedIndex].id;
    await getMedia(cameraSelect.value, id);

    if (myPeerConnection) {
      const videosender = myPeerConnection
        .getSenders()
        .find((sender) => sender.track.kind === "video");
      const videoTrack = myStream.getVideoTracks()[0];
      videosender.replaceTrack(videoTrack);
    }
  } catch (error) {
    console.log(error);
  }
}

muteBtn.addEventListener("click", handleMuteBtn);
cameraBtn.addEventListener("click", handleCameraBtn);
cameraSelect.addEventListener("input", handleCameraSelect);

//Welcome Form
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnections();
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcome.querySelector("input");
  await initCall();

  //join Room
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// chat

function handleChatSubmit(event) {
  event.preventDefault();
  const input = chatForm.querySelector("input");
  const message = input.value;
  const span = document.createElement("span");
  span.innerText = message;
  span.className = "myMessage";
  chatList.appendChild(span);
  input.value = "";
  chatList.scrollTop = chatList.scrollHeight;
  dataChannel.send(message);
}

function handleRecievedMessage(message) {
  const span = document.createElement("span");
  span.innerText = message;
  span.className = "othersMessage";
  chatList.appendChild(span);
  chatList.scrollTop = chatList.scrollHeight;
}

chatForm.addEventListener("submit", handleChatSubmit);

// 소켓
socket.on("welcome", async () => {
  dataChannel = myPeerConnection.createDataChannel("chat");
  dataChannel.addEventListener("message", (event) => {
    handleRecievedMessage(event.data);
  });
  console.log("made data channel");
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomName);
  console.log("sent offer");
});

socket.on("offer", async (offer) => {
  myPeerConnection.addEventListener("datachannel", (event) => {
    dataChannel = event.channel;
    dataChannel.addEventListener("message", (event) => {
      handleRecievedMessage(event.data);
    });
  });
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
  console.log("recieved offer");
  console.log("sent answer");
});

socket.on("answer", (answer) => {
  myPeerConnection.setRemoteDescription(answer);
  console.log("recieved answer");
});

socket.on("ice", (ice) => {
  myPeerConnection.addIceCandidate(ice);
  console.log("recieved candidate");
});

// RTC
function makeConnections() {
  console.log("makeConnections");
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302"
        ]
      }
    ]
  });

  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
  const peersFace = document.getElementById("peersFace");
  peersFace.srcObject = data.stream;
}
