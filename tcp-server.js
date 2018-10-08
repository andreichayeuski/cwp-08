const net = require('net');
const fs = require('fs');
const child_process = require("child_process");

let WorkerTCP = function(id, startedOn, filename) {
	this.id = id;
	this.startedOn = startedOn;
	this.filename = filename;
};

let port = 8124;
let childProcesses = [];
let workers = [];

const server = net.createServer((client) => {
	console.log('Client connected');


	client.setEncoding('utf8');

	client.on('end', () => console.log('Client disconnected\r\n'));
	client.on('data', (data) => {
		console.log(data);
		if (data === 'ERR') {
			console.log("err end");
			client.end();
		}
		else {
			let dataArray = JSON.parse(data);
			if (dataArray[0] === "NEW") {
				let max = 10000;
				client.identifier = Math.floor(Math.random() * max); // unique id
				let filename = `client_${client.identifier}.json`;
				fs.writeFile(filename, "", (err) => {
					if (err) {
						throw "Error found: " + err;
					}
				});
				let myProcess = [];
				let myChildProcess = child_process.spawn("node", [ "worker.js", filename, dataArray[1]]);

				let randomID = Math.floor(Math.random() * max);
				let currentDate = new Date();
				let newWorker = new WorkerTCP(randomID, currentDate, filename);
				workers.push(newWorker);
				let dataToHTTP = [];
				dataToHTTP.push(newWorker.id, newWorker.startedOn);
				console.log(dataToHTTP);
				client.write(JSON.stringify(dataToHTTP));


				myProcess.push(randomID);
				myProcess.push(myChildProcess);
				childProcesses.push(myProcess);
			}
			else if (dataArray[0] === "DEL") {
				let needRemoveId = 0;
				for (let i = 0; i < childProcesses.length; i++)
				{
					if (childProcesses[i][0] = dataArray[1])
					{
						childProcesses[i][1].kill(0);
						needRemoveId = i;
						break;
					}
				}
				childProcesses.splice(needRemoveId, 1);

				needRemoveId = 0;
				for (let i = 0; i < workers.length; i++)
				{
					console.log(workers[i].id);
					console.log(dataArray[1]);
					if (workers[i].id === dataArray[1])
					{
						console.log(i);
						needRemoveId = i;
						break;
					}
				}
				workers[needRemoveId].numbers = JSON.parse(fs.readFileSync(workers[needRemoveId].filename));
				client.write(JSON.stringify(workers[needRemoveId]));
				workers.splice(needRemoveId, 1);
			}
			else if (dataArray[0] === "GET") {
				console.log("GET");
				workers.forEach((worker) => {
					console.log('num');
					let fileData = fs.readFileSync(worker.filename);
					worker.numbers = JSON.parse(fileData);
					console.log('num1');
				});
				client.write(JSON.stringify(workers));
			}
			else {
				message = "DEC";
				console.log("disconnect.");
				client.write(message);
				client.end();
			}
		}
	});
});

server.listen(port, () => {
	console.log(`Server listening on localhost:${port}`);
});
