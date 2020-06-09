const https = require('https');
module.exports = {
	json (url, options) {
		return new Promise(resolve => {
			if (!options) options = {};
			let data = options.data;
			delete options.data;

			if (data) {
				if (!options.method) options.method = 'POST';
				if (typeof data != 'string') data = JSON.stringify(data);
				if (!options.headers) options.headers = {};
				options.headers['content-length'] = data.length;
			}

			const fn = (options.method || 'GET') == 'GET' ? 'get' : 'request';
			const req = https[fn](url, options, res => {
				let body = '';
				res.on('data', chunk => body += chunk.toString());
				res.on('end', () => resolve(JSON.parse(body)));
			});

			if (data) {
				req.write(data);
				req.end();
			}
		});
	}
};
