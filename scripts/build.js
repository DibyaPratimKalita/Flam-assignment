const path = require('path');
const fs = require('fs-extra');
const { minify: minifyHtml } = require('html-minifier-terser');
const CleanCSS = require('clean-css');
const terser = require('terser');
const glob = require('glob');

async function build() {
	const root = path.join(__dirname, '..');
	const client = path.join(root, 'client');
	const dist = path.join(root, 'dist');

	await fs.emptyDir(dist);

	await fs.copy(client, dist);

	const htmlFiles = glob.sync('**/*.html', { cwd: dist, nodir: true });
	for (const file of htmlFiles) {
		const p = path.join(dist, file);
		const src = await fs.readFile(p, 'utf8');
		const out = await minifyHtml(src, {
			removeComments: true,
			collapseWhitespace: true,
			minifyCSS: true,
			minifyJS: true
		});
		await fs.writeFile(p, out, 'utf8');
	}

	const cssFiles = glob.sync('**/*.css', { cwd: dist, nodir: true });
	for (const file of cssFiles) {
		const p = path.join(dist, file);
		const src = await fs.readFile(p, 'utf8');
		const out = new CleanCSS({ level: 2 }).minify(src).styles;
		await fs.writeFile(p, out, 'utf8');
	}

	const jsFiles = glob.sync('**/*.js', { cwd: dist, nodir: true });
	for (const file of jsFiles) {
		const p = path.join(dist, file);
		const src = await fs.readFile(p, 'utf8');
		const result = await terser.minify(src, {
			compress: true,
			mangle: true,
			format: { comments: false }
		});
		if (result.error) throw result.error;
		await fs.writeFile(p, result.code, 'utf8');
	}

	console.log('Built to dist/');
}

build().catch((err) => {
	console.error(err);
	process.exit(1);
});


