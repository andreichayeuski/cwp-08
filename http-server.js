const http = require("http");
const path = require("path");
const net = require('net');

const portTCP = 8124;

const client = new net.Socket();
client.setEncoding('utf8');

client.connect(portTCP, function (err) {
	if (err) {
		throw err;
	}
	console.log('Connected');
	client.write("REMOTE");
});

let isConnected = false;
client.on('data', function (data) {
	console.log("Received from server: " + data);
	if (isConnected) {
	}
	else {
		if (data === "ACK") {
			isConnected = true;
			console.log(`${process.argv[2]} \"${process.argv[3]}\" \"${process.argv[4]}\" ${process.argv[5] === undefined ? "" : process.argv[5]}`);
			client.write(`${process.argv[2]} \"${process.argv[3]}\" \"${process.argv[4]}\" ${process.argv[5] === undefined ? "" : process.argv[5]}`);
		}
		else {
			client.destroy();
			process.exit(0);
		}
	}
});

client.on('close', function () {
	console.log('Connection closed');
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
	if (req.method === "GET")
	{
		let extension = path.extname(req.url);
		console.log(req.url);
		console.log("Ext: " + extension);
		if (extension === ".html" || extension === ".js" || extension === ".css" || req.url === "/")
		{
			let data = publicHandler.getFile(req.url);
			payload = null;
			res.statusCode = 200;
			res.setHeader(data[0], data[1]);
			res.end(data[2]);
		}
		else if (extension === ".ico")
		{
			res.writeHead(200, {'Content-Type': 'image/x-icon'} );
			res.end();
			console.log('favicon requested');
		}
		else
		{
			res.end("<html><head></head><body>err</body></html>");
		}
	}
	else {
		parseBodyJson(req, (err, payload) => {
			handler(req, res, payload, (err, result) => {
				if (err) {
					res.statusCode = err.code;
					res.setHeader('Content-Type', 'application/json');
					res.end(JSON.stringify(err));
					return;
				}

				if (!(req.url.indexOf('api') + 1)) {
					console.log("not api");
					res.statusCode = 200;
					res.setHeader("Content-Type", "text/html");
					res.end(result);
				}
				else {
					console.log("api");
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.end(JSON.stringify(result));
				}
			});
		});
	}
});

server.listen(portHTTP, hostname, () => {
	console.log(`Server running at http://${hostname}:${portHTTP}/`);
});

function getHandler(url) {
	return handlers[url] || notFound;
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