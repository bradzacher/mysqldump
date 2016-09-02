# Mysql Dump

[![npm version](https://badge.fury.io/js/mysqldump.svg)](http://badge.fury.io/js/mysqldump) [![Build Status](https://travis-ci.org/webcaetano/mysqldump.svg?branch=master)](https://travis-ci.org/webcaetano/mysqldump)

Create a backup from MySQL

## Installation

```
npm install mysqldump
```

Example 
```javascript
var mysqlDump = require('mysqldump');

mysqlDump({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'test',
	dest:'./data.sql' // destination file
},function(err){
	// create data.sql file;
})
```

Full Options Example :

```javascript
var mysqlDump = require('mysqldump');

mysqlDump({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'test',
	tables:['players'], // only these tables
	where: {'players': 'id < 1000'}, // Only test players with id < 1000
	ifNotExist:true, // Create table if not exist
	dest:'./data.sql' // destination file
},function(err){
	// create data.sql file;
})
```


## Options


#### host

Type: `String`

Url to Mysql host. `Default: localhost`

#### port

Type: `String`

Port to Mysql host. `Default: 3306`

#### user

Type: `String`

The MySQL user to authenticate as.

#### password

Type: `String`

The password of that MySQL user

#### database

Type: `String`

Name of the database to dump.

#### tables 

Type: `Array`

Array of tables that you want to backup.

Leave Blank for All. `Default: [] ALL`

#### schema 

Type: `Boolean`

Output table structure `Default: true`;

#### data 

Type: `Boolean`

Output table data for ALL tables `Default: true`;

#### where
Type: `Object`

Where clauses to limit dumped data `Example: where: {'users': 'id < 1000'}`

Combine with `data: false` to only dump tables with where clauses  `Default: null`;

#### ifNotExist 

Type: `Boolean`

Create tables if not exist method `Default: true`;

#### dropTable 

Type: `Boolean`

Drop tables if exist `Default: false`;

#### getDump 

Type: `Boolean`

Return dump as a raw data on callback instead of create file `Default: false`;

#### dest 

Type: `String`

Output filename with directories `Default: './data.sql'`;

#### socketPath

Type: `String`

Path to a unix domain socket to connect to. When used `host` and `port` are ignored.

[![npm](https://nodei.co/npm/mysqldump.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/mysqldump)

---------------------------------

The MIT [License](https://raw.githubusercontent.com/webcaetano/mysqldump/master/LICENSE.md)
