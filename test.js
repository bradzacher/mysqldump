var expect = require('chai').expect;
var async = require('async');
var mysql = require('mq-node');
var fs = require('fs');
var mysqlDump = require('./');


describe('mysql test', function() {
	var dbTest = 'dump_test';
	var connection = {
		host: 'localhost',
		user: 'root',
		password: ''
	};

	mysql = mysql(connection);


	it('should create data for using in test', function(done) {
		this.timeout(8000);
		var run = [];

		run.push(function(callback){
			mysql.query('CREATE DATABASE IF NOT EXISTS '+dbTest,callback)
		});

		run.push(function(callback){
			mysql.connection.changeUser({database:dbTest},callback);
		});

		run.push(function(callback){
			mysql.query("SHOW TABLES FROM "+dbTest,function(err,data){
				for(var i=0;i<data.length;i++) {
					if(data[i]['Tables_in_'+dbTest]=='players'){
						mysql.query('DROP TABLE `players`',callback)
						return;
					}
				}
				callback();
			});
		});

		run.push(function(callback){
			mysql.query("SHOW TABLES FROM "+dbTest,function(err,data){
				for(var i=0;i<data.length;i++) {
					if(data[i]['Tables_in_'+dbTest]=='teams'){
						mysql.query('DROP TABLE `teams`',callback)
						return;
					}
				}
				callback();
			});
		});

		run.push(function(callback){
			mysql.query("CREATE TABLE IF NOT EXISTS `players` ("+
			"  `id` int(10) unsigned NOT NULL,"+
			"  `name` varchar(32) NOT NULL,"+
			"  `gender` tinyint(3) unsigned NOT NULL,"+
			"  `team` varchar(32) DEFAULT NULL,"+
			"  `country` varchar(2) NOT NULL,"+
			"  `lvl` tinyint(3) unsigned NOT NULL DEFAULT '1',"+
			"  `cadtime` int(10) unsigned NOT NULL,"+
			"  `logtime` int(10) unsigned NOT NULL,"+
			"  PRIMARY KEY (`id`),"+
			"  UNIQUE KEY `name` (`name`)"+
			") ENGINE=InnoDB DEFAULT CHARSET=latin1;",callback);
		});

		run.push(function(callback){
			mysql.query("CREATE TABLE IF NOT EXISTS `teams` ("+
			"  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,"+
			"  `name` varchar(32) NOT NULL,"+
			"  `country` varchar(2) NOT NULL,"+
			"  `avatar` varchar(16) NOT NULL,"+
			"  `adm` int(32) unsigned NOT NULL,"+
			"  PRIMARY KEY (`id`)"+
			") ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;",callback);
		});

		run.push(function(callback){
			mysql.query("INSERT INTO `teams` (`id`, `name`, `country`, `avatar`, `adm`) VALUES"+
			"(2, 'Flamengo 203', 'br', 'C????CC??', 7),"+ // binary test
			"(3, 'Heroes Team', 'br', '??\0???CC', 7);",callback);
		});

		run.push(function(callback){
			mysql.query("INSERT INTO `players` (`id`, `name`, `gender`, `team`, `country`, `lvl`, `cadtime`, `logtime`) VALUES"+
			"(3, 'Distillers 530', 0, NULL, 'br', 1, 1442441886, 1442441886),"+
			"(4, 'Distillers 42', 0, NULL, 'br', 1, 1442441956, 1442441956),"+
			"(5, 'Distillers 904', 0, NULL, 'br', 1, 1442442042, 1442442042),"+
			"(6, 'Distillers 302', 0, NULL, 'br', 1, 1442442295, 1442442295),"+
			"(7, 'Distillers 345', 1, '3', 'br', 1, 1442443725, 1442680916),"+
			"(8, 'Distillers', 0, NULL, 'br', 1, 1442550731, 1442550731),"+
			"(9, 'Distillers 886', 0, NULL, 'br', 1, 1442550731, 1442550731),"+
			"(11, 'Distillers 17', 0, NULL, 'br', 1, 1442550761, 1442550761),"+
			"(12, 'Distillers 444', 0, NULL, 'br', 1, 1442551137, 1442551137),"+
			"(13, 'Distillers 10', 0, NULL, 'br', 1, 1442551209, 1442551209),"+
			"(14, 'Distillers 236', 0, NULL, 'br', 1, 1442551209, 1442551209),"+
			"(15, 'Distillers 340', 0, NULL, 'br', 1, 1442551267, 1442551267),"+
			"(16, 'Distillers 280', 0, NULL, 'br', 1, 1442551268, 1442551268);",callback);
		});

		async.series(run,function(err,data){
			expect(err).to.be.null;
			done();
		});
	});

	it('should create a dump file with only schema', function(done) {
		this.timeout(8000);
		var dest = './data.sql';

		mysqlDump({
			host: 'localhost',
			user: 'root',
			password: '',
			database: dbTest,
			data:false,
			dest:dest
		},function(err){
			var file = String(fs.readFileSync(dest));
			expect(err).to.be.null;
			expect(file).not.to.be.null;
			expect(file).to.not.contain("INSERT INTO ");
			expect(file).to.contain("CREATE TABLE ");
			fs.unlinkSync(dest);
			done();
		})
	});

	it('should create a dump file with only data', function(done) {
		this.timeout(8000);
		var dest = './data.sql';

		mysqlDump({
			host: 'localhost',
			user: 'root',
			password: '',
			database: dbTest,
			schema:false,
			dest:dest
		},function(err){
			var file = String(fs.readFileSync(dest));
			expect(err).to.be.null;
			expect(file).not.to.be.null;
			expect(file).to.contain("INSERT INTO ");
			expect(file).to.not.contain("CREATE TABLE ");
			fs.unlinkSync(dest);
			done();
		})
	});

	it('should create a dump file with schema and data', function(done) {
		this.timeout(8000);
		var dest = './data.sql';

		mysqlDump({
			host: 'localhost',
			user: 'root',
			password: '',
			database: dbTest,
			dest:dest
		},function(err){
			var file = String(fs.readFileSync(dest));
			expect(err).to.be.null;
			expect(file).not.to.be.null;
			expect(file).to.contain("INSERT INTO ");
			expect(file).to.contain("CREATE TABLE ");
			fs.unlinkSync(dest);
			done();
		})
	});

	it('should create a dump file with schema and data with tables and create if exist', function(done) {
		this.timeout(8000);
		var dest = './data.sql';

		mysqlDump({
			host: 'localhost',
			user: 'root',
			password: '',
			database: dbTest,
			tables:['players'],
			ifNotExist:true,
			dest:dest
		},function(err){
			var file = String(fs.readFileSync(dest));
			expect(err).to.be.null;
			expect(file).not.to.be.null;
			expect(file).to.not.contain("CREATE TABLE IF NOT EXISTS `teams`");
			expect(file).to.contain("CREATE TABLE IF NOT EXISTS `players`");
			fs.unlinkSync(dest);
			done();
		})
	});

	it('should remove auto increment', function(done) {
		this.timeout(8000);
		var dest = './data.sql';

		mysqlDump({
			host: 'localhost',
			user: 'root',
			password: '',
			database: dbTest,
			autoIncrement:false,
			ifNotExist:true,
			dest:dest
		},function(err){
			var file = String(fs.readFileSync(dest));
			expect(err).to.be.null;
			expect(file).not.to.be.null;
			expect(file).to.not.contain(" AUTO_INCREMENT=");
			fs.unlinkSync(dest);
			done();
		})
	});
});

