#!/usr/bin/env node

const { stdin } = process;
const fs = require("fs");
const program = require("commander");
const { version } = require("./package.json");
const convert = require("./lib/convert");

const chunks = [];

program
  .version(version)
  .option(
    "-o, --out <path>",
    "output filename, defaults to gl-dependency-scanning-report.json"
  )
  .parse(process.argv);

const filename = program.opts().out || "gl-dependency-scanning-report.json";

stdin.setEncoding("utf8");

stdin.on("data", (chunk) => {
  chunks.push(chunk);
});

stdin.on("end", () => {
  const inputJSON = chunks.join("");
  try {
    const outputJSON = convert(inputJSON);
    fs.writeFile(filename, `${outputJSON}\n`, (err) => {
      if (err) {
        console.log(err);
        return;
      }

      console.log(`The file was saved as ${filename}!`);
    });
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
});
