const net = require('net');
const fs = require('fs');

const server = net.createServer((client) => {
	console.log('Client connected');
	client.identifier = Date.now() + seed++; // unique id
	let filename = `log/client_${client.identifier}.log`;
	fs.writeFile(filename, "", (err) => {
		if (err)
		{
			throw "Error found: " + err;
		}
	});

	client.setEncoding('utf8');
	let isConnected = false;
	let isFiles = false;
	let isRemote = false;
	client.on('end', () => console.log('Client disconnected\r\n'));
	client.on('data', (data) => {
		// client.on('end', () => console.log('Client disconnected\r\n'));
		fs.appendFile(filename, data + "\r\n", (err) => {
			if (err)
			{
				throw "Error found: " + err;
			}
		});
		if (isConnected)
		{
			if (isFiles)
			{
				if (data === 'END')
				{
					client.end();
					counterOfClients -= 1;
					console.log("end");
				}
				else if (data === 'ERR')
				{
					console.log("err end");
					client.end();
					counterOfClients -= 1;
				}
				else
				{
					let filePath = defaultDir + "\\" + client.identifier + "\\" + JSON.parse(data)[1];
					fs.appendFile(filePath, JSON.parse(data)[0] + "\r\n", (err) => {
						if (err)
						{
							throw "Error found: " + err;
						}
					});
					client.write("NEXT");
				}
			}
			else if (isRemote)
			{
				let dataArray = data.split(' \"');
				console.log(dataArray);
				dataArray[1] = dataArray[1].replace('\"', "");
				dataArray[2] = dataArray[2].replace('\" ', "");
				console.log(dataArray);
				let readFileStream = fs.createReadStream(dataArray[1]);
				let writeFileStream = fs.createWriteStream(dataArray[2]);
				if (dataArray[0] === 'COPY')
				{
					readFileStream.pipe(writeFileStream);
					client.write("DONE CLONE");
					console.log("copied");
				}
				else if (dataArray[0] === 'ENCODE')
				{
					let cryptoStream = crypto.createCipher(algorithm, dataArray[3]);
					readFileStream.pipe(cryptoStream).pipe(writeFileStream);
					console.log("encoded");
				}
				else if (dataArray[0] === 'DECODE')
				{
					let cryptoStream = crypto.createDecipher(algorithm, dataArray[3]);
					readFileStream.pipe(cryptoStream).pipe(writeFileStream);
					console.log("decoded");
				}
				isRemote = false;
				client.end();
			}
			else
			{
				let max = questionAndAnswers.length;

				let rand = max * Math.random();
				rand = Math.floor(rand);

				console.log(data + " " + questionAndAnswers[rand].answer + "\r\n");
				let message = '' + questionAndAnswers[rand].answer;
				client.write(message);
				fs.appendFile(filename, message + "\r\n", (err) => {
					if (err)
					{
						throw "Error found: " + err;
					}
				});
			}
		}
		else
		{
			let message = "";
			if (data === 'QA' || data === 'FILES' || data === 'REMOTE')
			{
				if (data === 'FILES') {
					isFiles = true;
					if (counterOfClients <= maxClients)
					{
						counterOfClients += 1;
					}
					else
					{
						client.end();
					}
					fs.mkdir(defaultDir + "\\" + client.identifier, (err) =>
					{
						console.log(err);
					});
				}
				if (data === 'REMOTE')
				{
					isRemote = true;
				}
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
