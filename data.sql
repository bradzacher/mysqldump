CREATE TABLE IF NOT EXISTS `players` (
  `id` int(10) unsigned NOT NULL,
  `name` varchar(32) NOT NULL,
  `gender` tinyint(3) unsigned NOT NULL,
  `team` varchar(32) DEFAULT NULL,
  `country` varchar(2) NOT NULL,
  `lvl` tinyint(3) unsigned NOT NULL DEFAULT '1',
  `cadtime` int(10) unsigned NOT NULL,
  `logtime` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `teams` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(32) NOT NULL,
  `country` varchar(2) NOT NULL,
  `avatar` varchar(16) NOT NULL,
  `adm` int(32) unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `players` (`id`,`name`,`gender`,`team`,`country`,`lvl`,`cadtime`,`logtime`) VALUES (3,'Distillers 530',0,NULL,'br',1,1442441886,1442441886);
INSERT INTO `players` (`id`,`name`,`gender`,`team`,`country`,`lvl`,`cadtime`,`logtime`) VALUES (4,'Distillers 42',0,NULL,'br',1,1442441956,1442441956);
INSERT INTO `players` (`id`,`name`,`gender`,`team`,`country`,`lvl`,`cadtime`,`logtime`) VALUES (5,'Distillers 904',0,NULL,'br',1,1442442042,1442442042);
INSERT INTO `players` (`id`,`name`,`gender`,`team`,`country`,`lvl`,`cadtime`,`logtime`) VALUES (6,'Distillers 302',0,NULL,'br',1,1442442295,1442442295);
INSERT INTO `players` (`id`,`name`,`gender`,`team`,`country`,`lvl`,`cadtime`,`logtime`) VALUES (7,'Distillers 345',1,'3','br',1,1442443725,1442680916);
INSERT INTO `players` (`id`,`name`,`gender`,`team`,`country`,`lvl`,`cadtime`,`logtime`) VALUES (8,'Distillers',0,NULL,'br',1,1442550731,1442550731);
INSERT INTO `players` (`id`,`name`,`gender`,`team`,`country`,`lvl`,`cadtime`,`logtime`) VALUES (9,'Distillers 886',0,NULL,'br',1,1442550731,1442550731);
INSERT INTO `players` (`id`,`name`,`gender`,`team`,`country`,`lvl`,`cadtime`,`logtime`) VALUES (11,'Distillers 17',0,NULL,'br',1,1442550761,1442550761);
INSERT INTO `players` (`id`,`name`,`gender`,`team`,`country`,`lvl`,`cadtime`,`logtime`) VALUES (12,'Distillers 444',0,NULL,'br',1,1442551137,1442551137);
INSERT INTO `players` (`id`,`name`,`gender`,`team`,`country`,`lvl`,`cadtime`,`logtime`) VALUES (13,'Distillers 10',0,NULL,'br',1,1442551209,1442551209);
INSERT INTO `players` (`id`,`name`,`gender`,`team`,`country`,`lvl`,`cadtime`,`logtime`) VALUES (14,'Distillers 236',0,NULL,'br',1,1442551209,1442551209);
INSERT INTO `players` (`id`,`name`,`gender`,`team`,`country`,`lvl`,`cadtime`,`logtime`) VALUES (15,'Distillers 340',0,NULL,'br',1,1442551267,1442551267);
INSERT INTO `players` (`id`,`name`,`gender`,`team`,`country`,`lvl`,`cadtime`,`logtime`) VALUES (16,'Distillers 280',0,NULL,'br',1,1442551268,1442551268);

INSERT INTO `teams` (`id`,`name`,`country`,`avatar`,`adm`) VALUES (2,'Flamengo 203','br','C????CC??',7);
INSERT INTO `teams` (`id`,`name`,`country`,`avatar`,`adm`) VALUES (3,'Heroes Team','br','\b?\b?\0???CC',7);