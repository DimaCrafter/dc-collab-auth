const config = require('./config');
const http = require('./http');
const pkg = require('./package');

function send (method, path, token, data) {
	return http.json('https://api.github.com' + path, {
		method,
		headers: {
			host: 'api.github.com',
			accept: 'application/json',
			authorization: 'Bearer ' + token,
			'user-agent': pkg.name + '/' + pkg.version,
			'content-type': 'application/json'
		},
		data
	});
}

module.exports = {
	getLink: () => `https://github.com/login/oauth/authorize?client_id=${config.github.id}&scope=gist`,
	async getToken (code) {
		return await http.json('https://github.com/login/oauth/access_token', {
			headers: {
				host: 'github.com',
				accept: 'application/json',
				'user-agent': pkg.name + '/' + pkg.version
			},
			data: `client_id=${config.github.id}&client_secret=${config.github.secret}&code=${code}`
		});
	},

	api: (path, token, data) => send(null, path, token, data),
	patch: (path, token, data) => send('PATCH', path, token, data),
	delete: (path, token, data) => send('DELETE', path, token, data)
};
