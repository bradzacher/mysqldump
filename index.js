var async = require('async');
var mqNode = require('mq-node');
var _ = require('lodash');
var fs = require('fs');
var mysql;

var extend = function(obj) {
	for (var i = 1; i < arguments.length; i++) for (var key in arguments[i]) obj[key] = arguments[i][key];
	return obj;
}

var escapeUnquoted = function(val){
	return mysql.escape(val).slice(0, -1).substr(1);
}

// var addslashes = function(str){
// 	return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
// }

var isset = function(){
	var a = arguments;
	var l = a.length;
	var i = 0;
	var undef;

	if (l === 0) throw new Error('Empty isset');

	while (i!==l) {
		if(a[i]===undef || a[i]===null) return false;
		++i;
	}
	return true;
}

var buildInsert = function(rows,table,cols){
	var cols = _.keys(rows[0]);
	var sql = [];
	for(var i in rows){
		var values=[];
		for(var k in rows[i]){
			if(typeof rows[i][k]==='function') continue;
			if(!isset(rows[i][k])){
				if(rows[i][k]==null){
					values.push("NULL");
				} else {
					values.push(" ");
				}
			} else if  (rows[i][k]!=='') {
				if(typeof rows[i][k] === 'number'){
					// values.push(addslashes(rows[i][k]));
					values.push(rows[i][k]);
					// values.push(rows[i][k]);
				} else {
					// values.push("'"+rows[i][k]+"'");
					values.push("'"+escapeUnquoted(rows[i][k])+"'");
					// values.push("'"+addslashes(rows[i][k])+"'");
				}
			} else {
				values.push("''");
			}
		}
		sql.push("INSERT INTO `"+table+"` (`"+cols.join("`,`")+"`) VALUES ("+values.join()+");");
	}
	return sql.join('\n');
}

module.exports = function(options,done){
	var defaultConnection = {
		host: 'localhost',
		user: 'root',
		password: '',
		database: 'test'
	};

	var defaultOptions = {
		tables:null,
		schema:true,
		data:true,
		ifNotExist:true,
		dest:'./data.sql',
	}

	mysql = mqNode(extend({},defaultConnection,{
		host:options.host,
		user:options.user,
		password:options.password,
		database:options.database,
	}));

	console.time('mysql dump');

	options = extend({},defaultConnection,defaultOptions,options);
	if(!options.database) throw new Error('Database not specified');

	async.auto({
		getTables:function(callback){
			if(!options.tables || !options.tables.length){ // if not especifed, get all
				mysql.query("SHOW TABLES FROM "+options.database,function(err,data){
					var resp = [];
					for(var i=0;i<data.length;i++) resp.push(data[i]['Tables_in_'+options.database]);
					callback(err,resp);
				});
			} else {
				callback(null,options.tables);
			}
		},
		createSchemaDump:['getTables',function(callback,results){
			if(!options.schema) {
				callback();
				return;
			}
			var run = [];
			results.getTables.forEach(function(table){
				run.push(function(callback){
					mysql.query("SHOW CREATE TABLE "+table,callback);
				})
			})
			async.parallel(run,function(err,data){
				var resp = [];
				for(var i in data){
					var r = data[i][0]['Create Table']+";";
					resp.push(options.ifNotExist ? r.replace(/CREATE TABLE `/,'CREATE TABLE IF NOT EXISTS `') : r)
				}
				callback(err,resp);
			});
		}],
		createDataDump:['createSchemaDump',function(callback,results){
			if(!options.data) {
				callback();
				return;
			}
			var run = [];
			results.getTables.forEach(function(table){
				run.push(function(callback){
					mysql.select({cols:'*',	from:table},function(err,data){
						callback(err,buildInsert(data,table));
					});
				});
			});
			async.parallel(run,callback)
		}],
		createFile:['createSchemaDump','createDataDump',function(callback,results){
			if(!results.createSchemaDump || !results.createSchemaDump.length) results.createSchemaDump=[];
			if(!results.createDataDump || !results.createDataDump.length) results.createDataDump=[];
			fs.writeFile(options.dest, results.createSchemaDump.concat(results.createDataDump).join("\n\n"), callback);
		}]
	},function(err,results){
		if(err) throw new Error(err);
		console.timeEnd('mysql dump');
		done(err);
	});
}
