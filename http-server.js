const http = require("http");
const net = require('net');
const portTCP = 8124;
const ErrorObject = { code: 400, message: 'Invalid request' };

const client = new net.Socket();
client.setEncoding('utf8');

client.connect(portTCP, function (err) {
	if (err) {
		throw err;
	}
});

const hostname = "localhost";
const portHTTP = 3000;

const handlers = {
	'/workers' : getAllWorkers,
	'/workers/add' : addTheWorker,
	'/workers/remove' : removeTheWorker
};

const server = http.createServer((req, res) => {
	let handler = getHandler(req.url);
	console.log(req.method);

	parseBodyJson(req, (err, payload) => {
		handler(req, res, payload, (err, result) => {
			if (err) {
				res.statusCode = err.code;
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(err));
				return;
			}

			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			let message = [];

			message.push(result);
			if (result === "NEW")
			{
				message.push(payload.X);
			}
			else if (result === "DEL")
			{
				message.push(payload.id);
			}


			if (result === "ERR")
			{
				message.push(ErrorObject);
				res.end(JSON.stringify(message));
			}
			else {
				client.write(JSON.stringify(message));

				client.on('data', function (dataFromTCP) {
					console.log("Received from server: " + dataFromTCP);
					console.log("workers");
					res.end(dataFromTCP);
				});
			}
		});
	});

});

server.listen(portHTTP, hostname, () => {
	console.log(`Server running at http://${hostname}:${portHTTP}/`);
});

function getHandler(url) {
	return handlers[url] || notFound;
}

function getAllWorkers(req, res, payload, cb) {
	console.log(JSON.stringify(payload));
	if (JSON.stringify(payload) === "{}")
	{
		cb(null, "GET");
	}
	else
	{
		cb(null, "ERR");
	}
}

function addTheWorker(req, res, payload, cb) {
	if (payload.X !== undefined)
	{
		cb(null, "NEW");
	}
	else
	{
		cb(null, "ERR");
	}
}

function removeTheWorker(req, res, payload, cb) {
	if (payload.id !== undefined)
	{
		cb(null, "DEL");
	}
	else
	{
		cb(null, "ERR");
	}
}

function notFound(req, res, payload, cb) {
	cb({ code: 404, message: 'Not found'});
}

function parseBodyJson(req, cb) {
	let body = [];

	req.on('data', function(chunk) {
		body.push(chunk);
	}).on('end', function() {
		body = Buffer.concat(body).toString();
		console.log(body);
		if (body !== "")
		{
			let params = JSON.parse(body);
			cb(null, params);
		}
		else
		{
			cb(null, null);
		}
	});
}

client.on('close', function () {
	console.log('Connection closed');
});