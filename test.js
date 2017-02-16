var expect = require('chai').expect;
var async = require('async');
var mysql = require('mq-node');
var fs = require('fs');
var mysqlDump = require('./');

const MYSQL_HOST = 'localhost'
const MYSQL_USER = 'root'
const MYSQL_PASS = ''

describe('mysql test', function() {
	var dbTest = 'dump_test';
	var restrictedUsers = ['user1', 'user2'];
	var connection = {
		host: MYSQL_HOST,
		user: MYSQL_USER,
		password: MYSQL_PASS
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
			"(4, 'Distillers 42', 1, NULL, 'br', 1, 1442441956, 1442441956),"+
			"(5, 'Distillers 904', 0, NULL, 'br', 1, 1442442042, 1442442042),"+
			"(6, 'Distillers 302', 0, NULL, 'br', 1, 1442442295, 1442442295),"+
			"(7, 'Distillers 345', 1, '3', 'br', 1, 1442443725, 1442680916),"+
			"(8, 'Distillers', 0, NULL, 'br', 1, 1442550731, 1442550731),"+
			"(9, 'Distillers 886', 0, NULL, 'br', 1, 1442550731, 1442550731),"+
			"(11, 'Distillers 17', 0, NULL, 'br', 1, 1442550761, 1442550761),"+
			"(12, 'Distillers 444', 0, NULL, 'br', 1, 1442551137, 1442551137),"+
			"(13, 'Distillers 10', 0, NULL, 'br', 1, 1442551209, 1442551209),"+
			"(14, 'Distillers 236', 1, NULL, 'br', 1, 1442551209, 1442551209),"+
			"(15, 'Distillers 340', 1, NULL, 'br', 1, 1442551267, 1442551267),"+
			"(16, 'Distillers 280', 1, NULL, 'br', 1, 1442551268, 1442551268);",callback);
		});

		run.push(function(callback){
			mysql.query("DROP TABLE IF EXISTS `dump_test`.`data_types`;",callback)
		});

		run.push(function(callback){
			mysql.query("CREATE TABLE `dump_test`.`data_types` ("+
				"  `id` INT NOT NULL AUTO_INCREMENT,"+
				"  `_int` INT NULL,"+
				"  `_tinyint` TINYINT NULL,"+
				"  `_smallint` SMALLINT NULL,"+
				"  `_mediumint` MEDIUMINT NULL,"+
				"  `_bigint` BIGINT NULL,"+
				"  `_decimal` DECIMAL(6,2) NULL,"+
				"  `_double` DOUBLE NULL,"+
				"  `_float` FLOAT NULL,"+
				"  `_real` REAL NULL,"+
				"  `_varchar` VARCHAR(128) NULL,"+
				"  `_char` CHAR NULL,"+
				"  `_blob` BLOB NULL,"+
				"  `_binary` BINARY NULL,"+
				"  `_varbinary` VARBINARY(64) NULL,"+
				"  `_date` DATE NULL,"+
				"  `_datetime` DATETIME NULL,"+
				"  `_time` TIME NULL,"+
				"  `_timestamp` TIMESTAMP NULL,"+
				"  `_year` YEAR NULL,"+
				"  `_point` POINT NULL,"+
				"  `_linestring` LINESTRING NULL,"+
				"  `_polygon` POLYGON NULL,"+
				"  `_multipoint` MULTIPOINT NULL,"+
				"  `_multilinestring` MULTILINESTRING NULL,"+
				"  `_multipolygon` MULTIPOLYGON NULL,"+
				"  `_geometrycollection` GEOMETRYCOLLECTION NULL,"+
				// "  `_json` JSON NULL,"+
				"  `_text` TEXT NULL,"+
				"  `_bit` BIT(6) NULL,"+
				"  `_enum` ENUM('red', 'green', 'blue') NULL,"+
				"  `_set` SET('a', 'b', 'c', 'd') NULL,"+
				"  PRIMARY KEY (`id`));",callback)
		});

		run.push(function(callback){
			mysql.query("INSERT INTO `dump_test`.`data_types` ("+
				"  `_int`, "+
				"  `_tinyint`, "+
				"  `_smallint`, "+
				"  `_mediumint`, "+
				"  `_bigint`, "+
				"  `_decimal`, "+
				"  `_double`, "+
				"  `_float`, "+
				"  `_real`, "+
				"  `_varchar`, "+
				"  `_char`, "+
				"  `_blob`, "+
				"  `_binary`, "+
				"  `_varbinary`, "+
				"  `_date`, "+
				"  `_datetime`, "+
				"  `_time`, "+
				"  `_timestamp`, "+
				"  `_year`, "+
				"  `_point`, "+
				"  `_linestring`, "+
				"  `_polygon`, "+
				"  `_multipoint`, "+
				"  `_multilinestring`, "+
				"  `_multipolygon`, "+
				"  `_geometrycollection`, "+
				// "  `_json`, "+
				"  `_text`, "+
				"  `_bit`, "+
				"  `_enum`, "+
				"  `_set`) "+
				"VALUES ("+
				"  '1', "+
				"  '2', "+
				"  '255', "+
				"  '65000', "+
				"  '1000000', "+
				"  '9999.99', "+
				"  '3.141592653589793', "+
				"  '3.141592653589793', "+
				"  '3.141592653589793', "+
				"  'hello', "+
				"  'x', "+
				"  X'1234', "+
				"  X'ff', "+
				"  X'abcdef', "+
				"  '2017-01-24', "+
				"  '2017-01-24 17:23', "+
				"  '17:23', "+
				"  '2017-01-24 17:23', "+
				"  2016, "+
				"  GeomFromText('POINT(1 2)'), "+
				"  GeomFromText('LINESTRING(0 0,1 1,2 2)'), "+
				"  GeomFromText('POLYGON((0 0,10 0,10 10,0 10,0 0),(5 5,7 5,7 7,5 7, 5 5))'), "+
				"  GeomFromText('MULTIPOINT(0 0,1 1,2 2)'), "+
				"  GeomFromText('MULTILINESTRING((0 0,1 1,2 2),(0 0,1 1,2 2))'), "+
				"  GeomFromText('MULTIPOLYGON(((0 0,10 0,10 10,0 10,0 0),(5 5,7 5,7 7,5 7, 5 5)),((0 0,10 0,10 10,0 10,0 0),(5 5,7 5,7 7,5 7, 5 5)))'), "+
				"  GeomFromText('GEOMETRYCOLLECTION(POINT(1 1),LINESTRING(0 1,2 3,4 5), POLYGON((0 0,10 0,10 10,0 10,0 0),(5 5,7 5,7 7,5 7, 5 5)))'), " +
				// "  '{\"key1\": \"value1\", \"key2\": \"value2\"}', "+
				"  '\"lorem ipsum\"', "+
				"  b'100001', "+
				"  'red', "+
				"  'a');",callback)
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
			host: MYSQL_HOST,
			user: MYSQL_USER,
			password: MYSQL_PASS,
			database: dbTest,
			data:false,
			dest:dest
		},function(err){
			expect(err).to.be.null;
			var file = String(fs.readFileSync(dest));
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
			host: MYSQL_HOST,
			user: MYSQL_USER,
			password: MYSQL_PASS,
			database: dbTest,
			schema:false,
			dest:dest
		},function(err){
			expect(err).to.be.null;
			var file = String(fs.readFileSync(dest));
			expect(file).not.to.be.null;
			expect(file).to.contain("INSERT INTO ");
			expect(file).to.not.contain("CREATE TABLE ");
			fs.unlinkSync(dest);
			done();
		})
	});

	it('should create a dump file with data using where', function(done) {
		this.timeout(8000);
		var dest = './data.sql';

		mysqlDump({
			host: MYSQL_HOST,
			user: MYSQL_USER,
			password: MYSQL_PASS,
			database: dbTest,
			where:{
				players:'id<10 AND gender=1'
			},
			schema:false,
			dest:dest
		},function(err){
			expect(err).to.be.null;
			var file = String(fs.readFileSync(dest));
			expect(file).not.to.be.null;

			expect(file.match(/INSERT INTO `players`/g)).to.have.length.below(3);
			expect(file).to.contain("INSERT INTO ");
			expect(file).to.not.contain("CREATE TABLE ");
			fs.unlinkSync(dest);
			done();
		})
	});

	it('should return a dump as raw data on callback', function(done) {
		this.timeout(8000);
		var dest = './data.sql';

		mysqlDump({
			host: MYSQL_HOST,
			user: MYSQL_USER,
			password: MYSQL_PASS,
			database: dbTest,
			schema:false,
			getDump:true,
			dest:dest
		},function(err,file){
			expect(err).to.be.null;
			expect(file).not.to.be.null;
			expect(file).to.contain("INSERT INTO ");
			expect(file).to.not.contain("CREATE TABLE ");
			done();
		})
	});

	it('should create a dump file with schema and data', function(done) {
		this.timeout(8000);
		var dest = './data.sql';

		mysqlDump({
			host: MYSQL_HOST,
			user: MYSQL_USER,
			password: MYSQL_PASS,
			database: dbTest,
			dest:dest
		},function(err){
			expect(err).to.be.null;
			var file = String(fs.readFileSync(dest));
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
			host: MYSQL_HOST,
			user: MYSQL_USER,
			password: MYSQL_PASS,
			database: dbTest,
			tables:['players'],
			ifNotExist:true,
			dest:dest
		},function(err){
			expect(err).to.be.null;
			var file = String(fs.readFileSync(dest));
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
			host: MYSQL_HOST,
			user: MYSQL_USER,
			password: MYSQL_PASS,
			database: dbTest,
			autoIncrement:false,
			ifNotExist:true,
			dest:dest
		},function(err){
			expect(err).to.be.null;
			var file = String(fs.readFileSync(dest));
			expect(file).not.to.be.null;
			expect(file).to.not.contain(" AUTO_INCREMENT=");
			fs.unlinkSync(dest);
			done();
		})
	});

	it('should propagate ER_TABLEACCESS_DENIED_ERROR from SELECT calls', function(done) {
		this.timeout(8000);
		var dest = './data.sql';

		mysqlDump({
			host: MYSQL_HOST,
			user: restrictedUsers[0],
			password: MYSQL_PASS,
			database: dbTest,
			data:true,
			dest:dest
		},function(err){
			expect(err).not.to.be.null;
			expect(err.code).not.to.be.null;
			expect(err.code).to.contain('_ERROR')
			done();
		})
	});

	it('should propagate ER_DBACCESS_DENIED_ERROR from SHOW TABLES calls', function(done) {
		this.timeout(8000);
		var dest = './data.sql';

		mysqlDump({
			host: MYSQL_HOST,
			user: restrictedUsers[1],
			password: MYSQL_PASS,
			database: dbTest,
			data:true,
			dest:dest
		},function(err){
			expect(err).not.to.be.null;
			expect(err.code).not.to.be.null;
			expect(err.code).to.contain('_ERROR')
			done();
		})
	});

	it('should propagate ER_DBACCESS_DENIED_ERROR from SHOW CREATE TABLE calls', function(done) {
		this.timeout(8000);
		var dest = './data.sql';

		mysqlDump({
			host: MYSQL_HOST,
			user: restrictedUsers[1],
			password: MYSQL_PASS,
			database: dbTest,
			tables:['players'],
			ifNotExist:true,
			dest:dest
		},function(err){
			expect(err).not.to.be.null;
			expect(err.code).not.to.be.null;
			expect(err.code).to.contain('_ERROR')
			done();
		})
	});

	it('should dump all the fancy data types correctly', function(done) {
		this.timeout(8000);
		var dest = './data.sql';

		mysqlDump({
			host: MYSQL_HOST,
			user: MYSQL_USER,
			password: MYSQL_PASS,
			database: dbTest,
			schema:false,
			tables:['data_types'],
			dest:dest
		},function(err){

			expect(err).to.be.null;
			var file = String(fs.readFileSync(dest));
			expect(file).not.to.be.null;

			file = file.replace("VALUES (1,", "VALUES (2,");

			var connection = require('mq-node')({
				host: MYSQL_HOST,
				user: MYSQL_USER,
				password: MYSQL_PASS,
				database: dbTest
			});

			connection.query(file, function(error) {

				expect(error).to.be.null;

				connection.query("SELECT * FROM data_types", function(error, result) {
	
					expect(error).to.be.null;
					expect(result.length).to.be.equal(2);
					for (var key in result[0]) {
						if (key === "id") continue;
						expect(result[1][key]).not.to.be.null;
						expect(result[0][key].toString()).to.be.equal(result[1][key].toString());
					}
					done();

				})
			})
		})
	});

});