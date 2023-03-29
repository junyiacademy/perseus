import * as fs from "fs";
import * as path from "path";

import * as fglob from "fast-glob";
import {compiler, beautify} from "flowgen";

const rootDir = path.join(__dirname, "..", "..");
const files = fglob.sync("packages/*/dist/**/*.d.ts", {
    cwd: rootDir,
});

if (files.length) {
    console.log(`found ${files.length} files`);
} else {
    throw new Error("no typescript type definitions found");
}

// The node API for `flowgen` doesn't have an option to add a flow header
// so we need to do it ourselves.
const HEADER = `/**
 * Flowtype definitions for data
 * Generated by Flowgen from a Typescript Definition
 * Flowgen v1.21.0
 * @flow
 */
`;

let errorCount = 0;

for (const inFile of files) {
    const outFile = inFile.replace(".d.ts", ".js.flow");

    const overrideFile = outFile.replace("/dist/", "/src/");
    if (fs.existsSync(overrideFile)) {
        console.log(`copying\nfrom: ${overrideFile}\nto:   ${outFile}`);
        fs.cpSync(
            path.join(rootDir, overrideFile),
            path.join(rootDir, outFile),
        );
        continue;
    }

    try {
        const source = fs.readFileSync(path.join(rootDir, inFile), "utf-8");
        const options = {inexact: false};
        let contents: string = compiler.compileDefinitionString(
            source,
            options,
        );
        contents = beautify(contents);

        // `flowgen` sometimes outputs code that uses `mixins` instead of `extends`
        // so we do some post-processing on the files to clean that up.
        if (contents.includes(" mixins ")) {
            contents = contents.replace(/ mixins /g, " extends ");
            console.log("replacing 'mixins' with 'extends'");
        }
        if (contents.includes("React.Element<>")) {
            contents = contents.replace(
                /React.Element<>/g,
                "React.Element<any>",
            );
            console.log(
                "replacing 'React.Element<>' with 'React.Element<any>'",
            );
        }
        if (contents.includes("JSX.LibraryManagedAttributes")) {
            contents = contents.replace(
                /JSX\.LibraryManagedAttributes<\s+([^,]+),\s+React\.(Element|Component)Props<[^>]+>\s+>/gm,
                (substr, group) => {
                    const replacement = `React.ElementConfig<${group}>`;
                    console.log(`replacing '${substr}' with '${replacement}'`);
                    return replacement;
                },
            );
        }
        if (/React\.Element<\s*React\.ElementProps</.test(contents)) {
            contents = contents.replace(
                /React\.Element<\s*(React\.ElementProps<\s*([^>]+)>\s*)>/gm,
                (substr, group1, group2) => {
                    const replacement = `React.Element<${group2.trim()}>`;
                    console.log(`replacing '${substr}' with '${replacement}'`);
                    return replacement;
                },
            );
        }

        fs.writeFileSync(
            path.join(rootDir, outFile),
            HEADER + contents,
            "utf-8",
        );
        console.log(`✅ wrote: ${outFile}`);
    } catch (e) {
        errorCount += 1;
        console.log(`❌ error processing: ${inFile}: ${e}`);
    }
}

// Fail the build step if there were any files we couldn't process
process.exit(errorCount);
