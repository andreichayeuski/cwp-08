const fs = require("fs");

setInterval(() =>
{
	let max = 10000;
	let rand = Math.floor(Math.random() * max);
	let arrayFromFile = fs.readFile(process.argv[2], (err) =>
	{
		if (err)
		{
			console.log(err);
		}
	});
	let resultArray = JSON.parse(arrayFromFile).push(rand);
	fs.writeFileSync(process.argv[2], JSON.stringify(resultArray));
}, process.argv[3]);

