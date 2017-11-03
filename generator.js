#!/usr/bin/env node

var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var directoryDict = {
	c: "templates/componentWithoutReducer",
	cr: "templates/componentWithReducer",
	s: "templates/service"
};
var pathInput = "";
var nameInput = "";
var categoryInput = "";
var camelizedNameInput = "";
var path = require("path");
var mkdirp = require('mkdirp');


var getFiles = function (directory) {
  return fs.readdirAsync(path.join(__dirname, directory));
};
var getContent = function (directory, filename) {
  return fs.readFileAsync(path.join(__dirname, directory + "/" + filename), "utf8");
};
var writeFile = function (targetPath, targetFilePath, content) {
	return mkdirp(targetPath, function (err) {
    if (err) return console.log("error:", err);
	fs.writeFileAsync(targetFilePath, content);
	if(targetFilePath.includes("scss")) {
		var styleIndexFolder = path.join(__dirname + "/.." + "/src/assets/stylesheets");
		console.log(styleIndexFolder);
		var styleIndexFile = styleIndexFolder + "/index.scss";
		var importPath = path.relative(styleIndexFolder, targetFilePath);
		importPath = importPath.replace(/\\/g, '/');
		fs.appendFileAsync(styleIndexFile, `@import "${importPath}";`);
	}
  });
}

var camelized = function (str) {
	return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
			return letter.toUpperCase();
	}).replace(/\s+|-/g, '');
}

process.argv.forEach((val, idx) => {
    if(idx === 2) {
        categoryInput = val;
        camelizedNameInput = camelized(val);
    } else if(idx === 3) {
        pathInput = val;
    } else if (idx === 4) {
		nameInput = val;
	}
});
console.log('nameInput', nameInput);
console.log('pathInput', pathInput);

getFiles(directoryDict[categoryInput]).map(function (filename) {
    return Promise.all([getContent(directoryDict[categoryInput], filename), filename]);
})
.then(function (results) {
	var promises = results.map(function(result) {
		var targetFilename = result[1].replace("sample", nameInput)
		var targetPath = path.join(__dirname, "../" + pathInput + "/" + nameInput);
		var targetFilePath = path.join(__dirname, "../" + pathInput + "/" + nameInput + "/" + targetFilename);
		var content = result[0].replace(new RegExp("sample", "g"), nameInput).replace(new RegExp("Sample", "g"), camelizedNameInput);
		writeFile(targetPath, targetFilePath, content);
	})
	return Promise.all(promises)
})
.then(function() {
	console.log("done generating files")
})
.catch(function rejected(err) {
	console.log("error:", err.stack);
	prompt.finish();
})
