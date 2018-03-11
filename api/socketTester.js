const socketIoClient = require("socket.io-client");
const stdin = process.openStdin();

const socketIoEndpoint = "http://localhost:8000";
const garageDoorId = "00000000-0000-0000-0000-000000000000";

const socket = socketIoClient(socketIoEndpoint);

let status = 1;


function logStatus() {
    if (status === 1) {
        console.log("closed");
    } else if (status === 0) {
        console.log("open");
    }
}

socket.on("connect", () => {
    console.log("socket.io connected");
    socket.emit("registerGarageDoorOpener", garageDoorId);

    logStatus();
    console.log("?");
    stdin.addListener("data", d => {
        const parsedData = d.toString().trim();
        if (parsedData.toLowerCase() === "open") {
            status = 0;
            socket.emit("garageDoorStatus", status);
        } else if (parsedData.toLowerCase() === "close") {
            status = 1;
            socket.emit("garageDoorStatus", status);
        }
        logStatus();
        console.log("?");
    });
});

socket.on("getGarageDoorStatus", (message, callback) => {
    callback(status);
});