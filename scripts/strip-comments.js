const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const glob = require('glob');
const terser = require('terser');
const CleanCSS = require('clean-css');
const { minify: minifyHtml } = require('html-minifier-terser');

const root = path.join(__dirname, '..');

const includeNodeModules = process.env.INCLUDE_NODE_MODULES === 'true';

function isTextFile(filePath) {
	const textExts = ['.js', '.mjs', '.cjs', '.ts', '.css', '.html', '.htm'];
	return textExts.includes(path.extname(filePath).toLowerCase());
}

async function stripJs(filePath) {
	const code = await fsp.readFile(filePath, 'utf8');
	const result = await terser.minify(code, {
		compress: false,
		mangle: false,
		format: { comments: false, beautify: true }
	});
	if (result.error) throw result.error;
	await fsp.writeFile(filePath, result.code, 'utf8');
}

async function stripCss(filePath) {
	const code = await fsp.readFile(filePath, 'utf8');
	const out = new CleanCSS({ level: { 1: { specialComments: 0 } } }).minify(code).styles;
	await fsp.writeFile(filePath, out, 'utf8');
}

async function stripHtml(filePath) {
	const code = await fsp.readFile(filePath, 'utf8');
	const out = await minifyHtml(code, {
		removeComments: true,
		collapseWhitespace: false,
		minifyCSS: true,
		minifyJS: false
	});
	await fsp.writeFile(filePath, out, 'utf8');
}

async function processFile(filePath) {
	const ext = path.extname(filePath).toLowerCase();
	if (ext === '.js' || ext === '.mjs' || ext === '.cjs' || ext === '.ts') {
		return stripJs(filePath);
	}
	if (ext === '.css') {
		return stripCss(filePath);
	}
	if (ext === '.html' || ext === '.htm') {
		return stripHtml(filePath);
	}
}

async function run() {
	const ignore = [
		'**/dist/**',
		'**/.git/**',
		'**/.vscode/**',
		'**/.idea/**'
	];
	if (!includeNodeModules) ignore.push('**/node_modules/**');

	const files = glob.sync('**/*.*', {
		cwd: root,
		nodir: true,
		ignore
	}).filter(isTextFile);

	for (const rel of files) {
		const p = path.join(root, rel);
		try {
			await processFile(p);
			console.log('Stripped comments:', rel);
		} catch (e) {
			console.warn('Skipped (error):', rel, e && e.message);
		}
	}
	console.log('Done stripping comments.');
}

run().catch((e) => {
	console.error(e);
	process.exit(1);
});


