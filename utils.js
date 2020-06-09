const fs = require('fs');
module.exports = {
	// Common utils
	getRandColor () {
		const letters = '0123456789ABCDEF';
		let color = '#';
		for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
		return color;
	},
	getID () {
		return Date.now().toString(16) + (~~(Math.random() * 15)).toString(16);
	},
	loadPage (res, page, vars) {
		fs.readFile(`${__dirname}/public/${page}.html`, (err, page) => {
			page = page.toString();
			page = page.replace(/\${(\w+)}/g, (_, name) => vars[name]);
			res.header('Content-Type', 'text/html');
			res.send(page);
		});
	},

	// Fastify utils
	event (name, value) {
		if (name == 'end') this.res.end();
		else this.res.write(`${name}:${value}\n`);
	}
};
