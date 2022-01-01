const socket = io()

const myFace = document.getElementById("myFace")
const muteBtn = document.getElementById("mute")
const cameraBtn = document.getElementById("camera")
const cameraSelect = document.getElementById("cameras")

let myStream
let muted = false
let cameraOff = false

async function getCameras(){
    try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const cameras = devices.filter(device => device.kind === "videoinput")
        const currentCamera = myStream.getVideoTracks()[0]
        cameras.forEach((camera) => {
            const option = document.createElement('option')
            option.value = camera.deviceId
            option.innerText = camera.label
            if(currentCamera.label == camera.label){
                option.selected =true
            }
            cameraSelect.appendChild(option)
        })
    } catch (error) {
        console.log(error)
    }
}

async function getMedia(deviceId) {
    const initialConstraints = {
        audio : true,
        video : {facingMode: "user"}
    }
    const cameraConstraints = {
        audio : true,
        video: {deviceId: { exact: deviceId} }
    }
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId? cameraConstraints : initialConstraints
        )
        myFace.srcObject = myStream
        if(!deviceId) {
            await getCameras()
        }
    } catch (error) {
        console.log(error)
    }
}

getMedia()

function handleMuteBtn(){
    myStream.getAudioTracks().forEach((track) => {track.enabled = !track.enabled})
    if(!muted){
        muteBtn.innerText = "Unmute"
        muted = true
    }else{
        muteBtn.innerText = "Mute"
        muted = false
    }
}
function handleCameraBtn(){
    myStream.getVideoTracks().forEach((track)=>{track.enabled = !track.enabled})
    if(cameraOff){
        cameraBtn.innerText = "CameraOff"
        cameraOff = false
    }else{
        cameraBtn.innerText = "CameraOn"
        cameraOff = true
    }
}

async function handleCameraSelect(){
    await getMedia(cameraSelect.value)
}

muteBtn.addEventListener('click', handleMuteBtn)
cameraBtn.addEventListener('click', handleCameraBtn)
cameraSelect.addEventListener('input', handleCameraSelect)