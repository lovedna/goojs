'use strict';

var dogma = require('./dogma');
var util = require('./util');


var typesRegex;
var compileTypesRegex = function (types) {
	var regexStr = '\\b(' + types.join('|') + ')\\b';
	return new RegExp(regexStr, 'g');
};

var linkTypes = function (string) {
	return string.replace(typesRegex, '<a href="$1-doc.html">$1</a>');
};

var urlRegex1 = /\[(.+?)\]\{@link (.+?)\}/g;
var urlRegex2 = /\{@linkplain (\S+) ([^\}]+)\}/g;
var linkUrls = function (string) {
	var tmp = string;
	tmp = tmp.replace(urlRegex1, '<a href="$2">$1</a>');
	tmp = tmp.replace(urlRegex2, '<a href="$1">$2</a>');
	return tmp;
};

// just concerned about < and > which might appear in type expressions
var escapeType = function (string) {
	return string.replace('>', '&gt;').replace('<', '&lt;');
};

var link = function (comment) {
	if (!comment) { return; }

	if (comment.description) {
		comment.description = comment.description.map(linkUrls);
	}

	if (comment.param) {
		comment.param.forEach(function (param) {
			param.type = escapeType(param.type);
			param.type = linkTypes(param.type);
			param.description = linkUrls(param.description);
		});
	}

	if (comment.returns) {
		comment.returns.type = escapeType(comment.returns.type);
		comment.returns.type = linkTypes(comment.returns.type);
		comment.returns.description = linkUrls(comment.returns.description);
	}

	if (comment.type) {
		comment.type.type = escapeType(comment.type.type);
		comment.type.type = linkTypes(comment.type.type);
	}
};

var hasParamData = function (params) {
	return params.some(function (param) {
		return !!param.description || !!param.type;
	});
};

var compileComment = function (rawComment) {
	// parse the raw comment
	var parsed = dogma.extract(rawComment);

	var comment = {};
	comment.description = parsed.description;

	if (parsed['@param']) {
		comment.param = parsed['@param'];

		// if there's nothing interesting then don't bother
		if (!hasParamData(comment.param)) {
			comment.param = [];
		}
	}

	if (parsed['@returns']) {
		comment.returns = parsed['@returns'];
	}

	if (parsed['@example']) {
		comment.example = parsed['@example'];
	}

	if (parsed['@example-link']) {
		comment.exampleLink = parsed['@example-link'];
	}

	// properties declared inside the constructor may have the @type tag
	if (parsed['@type']) {
		comment.type = parsed['@type'];
	}

	// properties declared inside the constructor may have the @default tag
	if (parsed['@default']) {
		comment.default_ = parsed['@default'];
	}

	if (parsed['@private']) {
		comment.private = !!parsed['@private'];
	}

	if (parsed['@hidden']) {
		comment.hidden = !!parsed['@hidden'];
	}

	if (parsed['@readonly']) {
		comment.readonly = !!parsed['@readonly'];
	}

	if (parsed['@deprecated']) {
		comment.deprecated = parsed['@deprecated'];
	}

	if (parsed['@property']) {
		comment.property = parsed['@property'];
	}

	if (parsed['@extends']) {
		comment.extends = parsed['@extends'];
	}

	if (parsed['@target-class']) {
		comment.targetClass = parsed['@target-class'];
	}

	return comment;
};

var inject = function (data) {
	if (!data.rawComment) { return; }

	data.comment = compileComment(data.rawComment);
};

var all = function (jsData, files) {
	if (!typesRegex) {
		var types = files.map(util.getFileName);
		typesRegex = compileTypesRegex(types);
	}

	inject(jsData.constructor);
	jsData.methods.forEach(inject);
	jsData.staticMethods.forEach(inject);
	jsData.staticMembers.forEach(inject);
	jsData.members.forEach(inject);

	// jsData.extraComments

	link(jsData.constructor.comment);
	jsData.methods.forEach(function (method) { link(method.comment); });
	jsData.staticMethods.forEach(function (staticMethod) { link(staticMethod.comment); });
	jsData.staticMembers.forEach(function (staticMember) { link(staticMember.comment); });
	jsData.members.forEach(function (member) { link(member.comment); });
};


exports.all = all;
exports.compileComment = compileComment;
exports.link = link;