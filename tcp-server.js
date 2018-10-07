const net = require('net');
const fs = require('fs');
const child_process = require("child_process");

let WorkerTCP = function(id, startedOn, numbers) {
	this.id = id;
	this.startedOn = startedOn;
	this.numbers = numbers;
};



const server = net.createServer((client) => {
	console.log('Client connected');
	let max = 10000;
	client.identifier = Math.floor(Math.random() * max); // unique id
	let filename = `client_${client.identifier}.json`;
	fs.writeFile(filename, "", (err) => {
		if (err)
		{
			throw "Error found: " + err;
		}
	});

	client.setEncoding('utf8');
	let isConnected = false;
	let workers = [];

	client.on('end', () => console.log('Client disconnected\r\n'));
	client.on('data', (data) => {
		fs.appendFile(filename, data + "\r\n", (err) => {
			if (err)
			{
				throw "Error found: " + err;
			}
		});
		if (isConnected)
		{
			if (data === 'ERR')
			{
				console.log("err end");
				client.end();
				counterOfClients -= 1;
			}
			else
			{
				let randomID = Math.floor(Math.random() * max);
				let currentDate = new Date();
				// let newWorker = new WorkerTCP(randomID, currentDate,)
				child_process.exec("node worker.js " + filename + " " + data, (err, sysout) =>
				{
					if (err)
					{
						console.error(err);
						return;
					}
					console.log(sysout);
				});
				client.end();
			}
		}
		else
		{
			let message = "";
			if (data === 'ID')
			{
				isConnected = true;
				message = "ACK";
				client.write(message);
			}
			else
			{
				message = "DEC";
				console.log("disconnect.");
				client.write(message);
				client.end();
			}
			fs.appendFile(filename, message + "\r\n",  (err) => {
				if (err)
				{
					throw "Error found: " + err;
				}
			});
		}
	});
});

server.listen(port, () => {
	console.log(`Server listening on localhost:${port}`);
});
