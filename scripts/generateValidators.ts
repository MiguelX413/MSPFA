// This script automatically generates API request validation schemas based on the default export type of any TS file under `pages/api` (given the file has no TS errors).
// This is awful. But that's okay because it's funny. Oh, and also useful.

import { createGenerator } from 'ts-json-schema-generator';
import type { SchemaGenerator } from 'ts-json-schema-generator';
import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import c from 'ansi-colors';
import type { integer } from 'lib/types';

const run = (command: string) => new Promise(resolve => {
	exec(command).once('exit', resolve);
});

/** All `.ts` files to generate validators for. */
const sourcePaths: string[] = [];
/** All old `.validate.ts` files to be deleted. */
const validatorPaths: string[] = [];

/** The path of the file from which the validator types are read. */
const inputPath = '__validators.ts';
/** The lines of code to be written to the input path. */
const inputLines: string[] = [];

/** The schema generator used to generate the validators for both request methods and request bodies. */
let generator: SchemaGenerator;

const findValidatorPaths = async (dir: string) => {
	for (const dirent of await fs.readdir(dir, { withFileTypes: true })) {
		const direntPath = path.join(dir, dirent.name);
		if (dirent.isDirectory()) {
			await findValidatorPaths(direntPath);
		} else if (direntPath.endsWith('.ts')) {
			if (direntPath.endsWith('.validate.ts')) {
				validatorPaths.push(direntPath);
			} else {
				sourcePaths.push(direntPath);
			}
		}
	}
};

const getMetadata = (
	/** The TS file to generate a validator for. */
	sourcePath: string
) => {
	const sourcePathNoExtension = sourcePath.slice(0, -3);
	const sourcePathModule = sourcePathNoExtension.split(path.sep).join('/');
	const outputPath = `${sourcePathNoExtension}.validate.ts`;

	return { sourcePathModule, outputPath };
};

const initializeValidator = async (
	/** The TS file to generate a validator for. */
	sourcePath: string,
	index: integer
) => {
	const { sourcePathModule, outputPath } = getMetadata(sourcePath);

	// This is necessary so validator imports don't throw errors and prevent TS compilation.
	await fs.writeFile(
		outputPath,
		'export default {} as any;\n'
	);

	inputLines.push(
		`import type Handler${index} from '${sourcePathModule}';`,
		`export type Request${index} = NonNullable<typeof Handler${index}['Request']>;`,
		`export type RequestMethod${index} = Request${index}['method'];`,
		''
	);
};

const generateValidator = async (
	/** The TS file to generate a validator for. */
	sourcePath: string,
	index: integer
) => {
	const { sourcePathModule, outputPath } = getMetadata(sourcePath);

	console.info(
		c.gray(sourcePathModule)
		+ ' '
		+ c.blue('Generating...')
		+ ' '
		+ c.gray(`(${index + 1}/${sourcePaths.length})`)
	);

	const methodSchemaString = JSON.stringify(
		generator.createSchema(`RequestMethod${index}`),
		null,
		'\t'
	).replace(new RegExp(`(RequestMethod)${index}`, 'g'), '$1');

	const schemaString = JSON.stringify(
		generator.createSchema(`Request${index}`),
		null,
		'\t'
	).replace(new RegExp(`(Request)${index}`, 'g'), '$1');

	await fs.writeFile(
		outputPath,
		'// This file is automatically generated by `scripts/generate-validators`. Do not edit directly.\n'
		+ '\n'
		+ 'import createAPIValidator from \'lib/server/api/createAPIValidator\';\n'
		+ '\n'
		+ `export default createAPIValidator(${methodSchemaString}, ${schemaString});\n`
	);

	console.info(`${c.gray(sourcePathModule)} ${c.green('Success!')}`);
};

(async () => {
	console.info(c.blue('Deleting old validators...'));
	await findValidatorPaths(path.normalize('pages/api'));
	await Promise.all(
		validatorPaths.map(fs.unlink)
	);

	// Initialize validators in parallel.
	console.info(c.blue('Initializing validators...'));
	await Promise.all(sourcePaths.map(initializeValidator));

	// Instantiate the schema generator.
	await fs.writeFile(
		inputPath,
		inputLines.join('\n')
	);

	try {
		generator = createGenerator({
			path: inputPath,
			tsconfig: 'tsconfig.json',
			// This is `false` so the server can trust that the client isn't adding any invalid properties to objects in the request body.
			additionalProperties: false,
			skipTypeCheck: true
		});
	} catch (error: any) {
		for (const diagnostic of error.diagnostics) {
			let lineIndex = 0;
			let charIndex = 0;

			if (diagnostic.file.lineMap) {
				for (let i = diagnostic.file.lineMap.length - 1; i >= 0; i--) {
					if (diagnostic.start >= diagnostic.file.lineMap[i]) {
						lineIndex = i;
						break;
					}
				}

				charIndex = diagnostic.start - diagnostic.file.lineMap[lineIndex];
			}

			console.info(
				c.gray(`${diagnostic.file.fileName}:${lineIndex + 1}:${charIndex + 1}`)
				+ ' '
				+ c.red('Error:')
			);
			console.info(diagnostic.messageText);
		}

		await fs.unlink(inputPath);
		process.exit();
	}

	// Generate validators in series.
	for (let i = 0; i < sourcePaths.length; i++) {
		await generateValidator(sourcePaths[i], i);
	}

	// Finish validators.
	console.info(c.blue('Finishing...'));
	await run(`npx eslint --fix ${
		sourcePaths.map(
			sourcePath => getMetadata(sourcePath).outputPath
		).join(' ')
	}`);
	await fs.unlink(inputPath);

	console.info(c.green('Done!'));
	process.exit();
})();
