const github = require('./github');
const pkg = require('./package');
const http = require('./http');
const app = require('fastify')();
const crypto = require('crypto');

// Utils
const { getRandColor, getID, loadPage, event } = require('./utils');
app.decorateReply('event', event);
app.register(require('fastify-static'), { root: __dirname + '/public' });

// Authentication routes
let sessions = {};
app.get('/api/get-id', (req, res) => {
	const id = getID();
	sessions[id] = { token: req.query.token };
	res.event('tmpID', id);
	res.event('end');
});

app.get('/api/start-auth', (req, res) => {
	const id = getID();
	res.event('tmpID', id);
	sessions[id] = {
		resolveToken (token) {
			this.token = token;
			res.event('token', token);


			res.event('end');
			delete this.resolveToken;
		}
	};
});

app.get('/api/proceed-auth', (req, res) => {
	res.header('Set-Cookie', 'tmpID=' + req.query.tmpID);
	res.redirect(github.getLink());
});

app.get('/api/auth', async (req, res) => {
	const { access_token } = await github.getToken(req.query.code);
	let id = req.headers.cookie.slice(req.headers.cookie.indexOf('tmpID=') + 6);
	const idEnd = id.indexOf(';');
	if (~idEnd) id = id.slice(0, idEnd);

	sessions[id].resolveToken(access_token);
	res.header('Set-Cookie', 'tmpID=; expires=Thu, 01 Jan 1970 00:00:00 GMT;');

	const user = await github.api('/user', access_token);
	loadPage(res, 'authed', {
		username: user.name,
		version: pkg.version
	});
});

// Profile routes
app.get('/api/get-profile', async (req, res) => {
	const access_token = req.query.token || sessions[req.query.tmpID].token;
	const user = await github.api('/user', access_token);
	let gist = await github.api('/gists', access_token);
	gist = gist.find(item => item.description == 'dc-collab-settings');

	let result;
	if (gist) {
		result = await http.json(gist.files['account.json'].raw_url);
	} else {
		result = { color: getRandColor(), nick: user.name };
		github.api('/gists', access_token, {
			description: 'dc-collab-settings',
			public: false,
			files: {
				'account.json': { content: JSON.stringify(result) }
			}
		});
	}

	const hash = crypto.createHash('sha256');
	hash.write(user.id + user.created_at);
	result.id = hash.digest().toString('hex');

	result.avatar = user.avatar_url;
	res.send(result);
});

app.post('/api/save-profile', async (req, res) => {
	const access_token = req.query.token;
	let gist = await github.api('/gists', access_token);
	gist = gist.find(item => item.description == 'dc-collab-settings');

	if (gist) {
		github.patch('/gists/' + gist.id, access_token, {
			description: 'dc-collab-settings',
			files: {
				'account.json': { content: req.body }
			}
		});
	} else {
		github.api('/gists', access_token, {
			description: 'dc-collab-settings',
			public: false,
			files: {
				'account.json': { content: req.body }
			}
		});
	}

	res.send('success');
});

app.get('/api/remove-profile', async (req, res) => {
	const access_token = req.query.token;
	const gist = await github.api('/gists', access_token);
	gist = gist.find(item => item.description == 'dc-collab-settings');

	if (gist) github.delete('/gists/' + gist.id, access_token);
	res.send('success');
});

// Listen provided port
app.listen(process.env.PORT, '0.0.0.0', (err, address) => {
	if (err) throw err;
	console.log(`Server listening on ${address}!`)
});
