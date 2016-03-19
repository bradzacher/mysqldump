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
	ifNotExist:true, // Create table if not exist
	dest:'./data.sql' // destination file
},function(err){
	// create data.sql file;
})
```


## Options


#### Host

Type: `String`

Url to Mysql host. `Default: localhost`

#### Port

Type: `String`

Port to Mysql host. `Default: 3306`

#### User

Type: `String`

The MySQL user to authenticate as.

#### Password

Type: `String`

The password of that MySQL user

#### Database

Type: `String`

Name of the database to dump.

#### Tables 

Type: `Array`

Array of tables that you want to backup.

Leave Blank for All. `Default: [] ALL`

#### Schema 

Type: `Boolean`

Output table structure `Default: true`;

#### Data 

Type: `Boolean`

Output table data `Default: true`;

#### ifNotExist 

Type: `Boolean`

Create tables if not exist method `Default: true`;

#### Dest 

Type: `String`

Output filename with directories `Default: './data.sql'`;

#### SocketPath

Type: `String`

Path to a unix domain socket to connect to. When used `host` and `port` are ignored.

[![npm](https://nodei.co/npm/mysqldump.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/mysqldump)

---------------------------------

The MIT [License](https://raw.githubusercontent.com/webcaetano/mysqldump/master/LICENSE.md)
