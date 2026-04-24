BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "apps" (
	"id"	TEXT,
	"name"	TEXT NOT NULL,
	"version"	TEXT NOT NULL,
	"description"	TEXT,
	"icon"	TEXT,
	"category"	TEXT,
	"builtin"	INTEGER DEFAULT 0,
	"installed"	INTEGER DEFAULT 1,
	"permissions"	TEXT,
	"installed_at"	TEXT,
	"created_at"	TEXT NOT NULL,
	"storage_size_mb"	INTEGER DEFAULT 0,
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "fs_nodes" (
	"id"	INTEGER,
	"path"	TEXT NOT NULL UNIQUE,
	"parent"	TEXT NOT NULL,
	"node_type"	TEXT NOT NULL,
	"content"	TEXT,
	"size"	INTEGER DEFAULT 0,
	"owner"	TEXT DEFAULT 'user',
	"created_at"	TEXT NOT NULL,
	"modified_at"	TEXT NOT NULL,
	"attributes"	TEXT DEFAULT 'normal',
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "note_versions" (
	"id"	INTEGER,
	"path"	TEXT NOT NULL,
	"content"	TEXT NOT NULL,
	"created_at"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "notifications" (
	"id"	INTEGER,
	"title"	TEXT NOT NULL,
	"message"	TEXT NOT NULL,
	"type"	TEXT NOT NULL,
	"app_id"	TEXT,
	"created_at"	TEXT NOT NULL,
	"read"	INTEGER DEFAULT 0,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "recycle_bin_meta" (
	"recycle_path"	TEXT,
	"original_path"	TEXT NOT NULL,
	"deleted_at"	TEXT NOT NULL,
	"node_type"	TEXT NOT NULL,
	PRIMARY KEY("recycle_path")
);
CREATE TABLE IF NOT EXISTS "security_logs" (
	"id"	INTEGER,
	"timestamp"	TEXT NOT NULL,
	"event_type"	TEXT NOT NULL,
	"username"	TEXT NOT NULL,
	"action"	TEXT NOT NULL,
	"resource"	TEXT,
	"success"	INTEGER NOT NULL,
	"ip_address"	TEXT,
	"details"	TEXT,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "startup_processes" (
	"id"	INTEGER,
	"app_name"	TEXT NOT NULL UNIQUE,
	"enabled"	INTEGER DEFAULT 1,
	"created_at"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "system_events" (
	"id"	INTEGER,
	"timestamp"	TEXT NOT NULL,
	"level"	TEXT NOT NULL,
	"category"	TEXT NOT NULL,
	"source"	TEXT NOT NULL,
	"event_id"	INTEGER NOT NULL,
	"message"	TEXT NOT NULL,
	"username"	TEXT,
	"details"	TEXT,
	"stack_trace"	TEXT,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "update_history" (
	"id"	INTEGER,
	"version"	TEXT NOT NULL,
	"status"	TEXT NOT NULL,
	"notes"	TEXT,
	"applied_at"	TEXT NOT NULL,
	"requires_restart"	INTEGER DEFAULT 0,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "update_state" (
	"id"	INTEGER CHECK("id" = 1),
	"current_version"	TEXT NOT NULL,
	"latest_version"	TEXT NOT NULL,
	"update_available"	INTEGER DEFAULT 0,
	"last_checked"	TEXT,
	"channel"	TEXT NOT NULL,
	"status"	TEXT NOT NULL,
	"restart_required"	INTEGER DEFAULT 0,
	"progress"	INTEGER DEFAULT 0,
	"patch_notes"	TEXT,
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "users" (
	"id"	INTEGER,
	"username"	TEXT NOT NULL UNIQUE,
	"password_hash"	TEXT NOT NULL,
	"role"	TEXT NOT NULL,
	"home_dir"	TEXT NOT NULL,
	"created_at"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
INSERT INTO "apps" VALUES ('terminal','Terminal','1.0.0','Command line interface','Terminal','System',1,1,'filesystem,process',NULL,'2026-02-05T11:32:48.578516',45);
INSERT INTO "apps" VALUES ('files','File Explorer','1.0.0','Browse files and folders','Folder','System',1,1,'filesystem',NULL,'2026-02-05T11:32:48.579520',32);
INSERT INTO "apps" VALUES ('notes','Notes','1.0.0','Text editor and notes','FileText','Productivity',1,1,'filesystem',NULL,'2026-02-05T11:32:48.579520',12);
INSERT INTO "apps" VALUES ('settings','Settings','1.0.0','System configuration','Settings','System',1,1,'system',NULL,'2026-02-05T11:32:48.579520',8);
INSERT INTO "apps" VALUES ('monitor','System Monitor','1.0.0','View system resources','Activity','System',1,1,'system',NULL,'2026-02-05T11:32:48.579520',25);
INSERT INTO "apps" VALUES ('localfiles','Local Files','1.0.0','Access local computer files','HardDrive','System',1,1,'filesystem',NULL,'2026-02-05T11:32:48.579520',18);
INSERT INTO "apps" VALUES ('appstore','App Store','1.0.0','Install and manage applications','Package','System',1,1,'system',NULL,'2026-02-05T11:32:48.579520',56);
INSERT INTO "apps" VALUES ('eventviewer','Event Viewer','1.0.0','View system events and logs','AlertCircle','System',1,1,'system',NULL,'2026-02-05T11:46:08.772894',20);
INSERT INTO "apps" VALUES ('diagnostics','System Diagnostics','1.0.0','Diagnose system issues','Stethoscope','System',1,1,'system',NULL,'2026-02-05T11:46:08.773984',30);
INSERT INTO "apps" VALUES ('calculator','Calculator','1.0.0','Basic calculator with standard operations','Calculator','Productivity',1,1,'',NULL,'2026-02-05T12:49:53.671735',8);
INSERT INTO "apps" VALUES ('camera','Camera','1.0.0','Take photos and record videos','Camera','Multimedia',1,1,'camera,filesystem',NULL,'2026-02-05T12:49:53.673236',35);
INSERT INTO "apps" VALUES ('clock','Clock','1.0.0','Timer and stopwatch','Clock','Productivity',1,1,'',NULL,'2026-02-05T12:49:53.673236',10);
INSERT INTO "apps" VALUES ('calendar','Calendar','1.0.0','View and navigate calendar dates','Calendar','Productivity',1,1,'',NULL,'2026-02-05T12:49:53.673236',12);
INSERT INTO "apps" VALUES ('tips','Tips & Getting Started','1.0.0','Learn how to use JezOS','Lightbulb','System',1,1,'',NULL,'2026-02-05T12:49:53.673236',5);
INSERT INTO "apps" VALUES ('webbrowser','Web Browser','1.0.0','Browse the web and download files','Package','Internet',1,1,'filesystem,network',NULL,'2026-02-07T00:43:05.402045',22);
INSERT INTO "apps" VALUES ('minesweeper','Minesweeper','1.0.0','Classic mine detection puzzle game','Bomb','Games',1,1,'',NULL,'2026-04-17T20:47:50.778814',2);
INSERT INTO "apps" VALUES ('solitaire','Solitaire','1.0.0','Classic Klondike card game','Spade','Games',1,1,'',NULL,'2026-04-17T20:47:50.784198',2);
INSERT INTO "fs_nodes" VALUES (1,'/','/','dir','',0,'user','2026-02-05T11:32:48.526213','2026-02-05T11:32:48.526213','normal');
INSERT INTO "fs_nodes" VALUES (2,'/home','/','dir','',0,'user','2026-02-05T11:32:48.527214','2026-02-05T11:32:48.527214','normal');
INSERT INTO "fs_nodes" VALUES (3,'/home/user','/home','dir','',0,'user','2026-02-05T11:32:48.527214','2026-02-05T11:32:48.527214','normal');
INSERT INTO "fs_nodes" VALUES (4,'/home/admin','/home','dir','',0,'user','2026-02-05T11:32:48.527214','2026-02-05T11:32:48.527214','normal');
INSERT INTO "fs_nodes" VALUES (5,'/bin','/','dir','',0,'user','2026-02-05T11:32:48.527214','2026-02-05T11:32:48.527214','normal');
INSERT INTO "fs_nodes" VALUES (6,'/system','/','dir','',0,'user','2026-02-05T11:32:48.527214','2026-02-05T11:32:48.527214','normal');
INSERT INTO "fs_nodes" VALUES (7,'/home/user/notes.txt','/home/user','file','Welcome to VirtuOS!',19,'user','2026-02-05T11:32:48.527214','2026-02-05T11:32:48.527214','normal');
INSERT INTO "fs_nodes" VALUES (8,'/home/user/Desktop','/home/user','dir','',0,'user','2026-02-05T11:32:48.584824','2026-02-05T11:32:48.584824','normal');
INSERT INTO "fs_nodes" VALUES (9,'/home/user/Downloads','/home/user','dir','',0,'user','2026-02-05T11:32:48.584824','2026-02-05T11:32:48.584824','normal');
INSERT INTO "fs_nodes" VALUES (10,'/home/user/Documents','/home/user','dir','',0,'user','2026-02-05T11:32:48.584824','2026-02-05T11:32:48.584824','normal');
INSERT INTO "fs_nodes" VALUES (11,'/home/user/Pictures','/home/user','dir','',0,'user','2026-02-05T11:32:48.584824','2026-02-05T11:32:48.584824','normal');
INSERT INTO "fs_nodes" VALUES (12,'/home/user/Music','/home/user','dir','',0,'user','2026-02-05T11:32:48.584824','2026-02-05T11:32:48.584824','normal');
INSERT INTO "fs_nodes" VALUES (13,'/home/user/Videos','/home/user','dir','',0,'user','2026-02-05T11:32:48.584824','2026-02-05T11:32:48.584824','normal');
INSERT INTO "fs_nodes" VALUES (14,'/home/user/notes','/home/user','dir','',0,'user','2026-02-05T11:32:48.584824','2026-02-05T11:32:48.584824','normal');
INSERT INTO "fs_nodes" VALUES (15,'/network','/','dir','',0,'user','2026-02-05T11:32:48.584824','2026-02-05T11:32:48.584824','normal');
INSERT INTO "fs_nodes" VALUES (16,'/home/user/Desktop/Notes.lnk','/home/user/Desktop','file','{"type":"app-shortcut","appId":"notes","appTitle":"Notes","position":{"row":0,"col":1}}',87,'user','2026-02-05T11:32:49.057464','2026-02-05T11:32:49.057464','normal');
INSERT INTO "fs_nodes" VALUES (17,'/home/user/Desktop/Settings.lnk','/home/user/Desktop','file','{"type":"app-shortcut","appId":"settings","appTitle":"Settings","position":{"row":1,"col":0}}',93,'user','2026-02-05T11:32:49.089464','2026-02-05T11:32:49.089464','normal');
INSERT INTO "fs_nodes" VALUES (18,'/home/user/Desktop/System Monitor.lnk','/home/user/Desktop','file','{"type":"app-shortcut","appId":"monitor","appTitle":"System Monitor","position":{"row":4,"col":0}}',98,'user','2026-02-05T11:32:49.100962','2026-02-05T11:32:49.100962','normal');
INSERT INTO "fs_nodes" VALUES (19,'/home/user/Desktop/App Store.lnk','/home/user/Desktop','file','{"type":"app-shortcut","appId":"appstore","appTitle":"App Store","position":{"row":5,"col":0}}',94,'user','2026-02-05T11:32:49.112748','2026-02-05T11:32:49.112748','normal');
INSERT INTO "fs_nodes" VALUES (20,'/home/user/Desktop/Terminal.lnk','/home/user/Desktop','file','{"type":"app-shortcut","appId":"terminal","appTitle":"Terminal","position":{"row":0,"col":0}}',93,'user','2026-02-05T11:32:49.124412','2026-02-05T11:32:49.124412','normal');
INSERT INTO "fs_nodes" VALUES (21,'/home/user/Desktop/Event Viewer.lnk','/home/user/Desktop','file','{"type":"app-shortcut","appId":"eventviewer","appTitle":"Event Viewer","position":{"row":1,"col":1}}',100,'user','2026-02-05T11:32:49.160753','2026-02-05T11:32:49.160753','normal');
INSERT INTO "fs_nodes" VALUES (22,'/home/user/Desktop/System Diagnostics.lnk','/home/user/Desktop','file','{"type":"app-shortcut","appId":"diagnostics","appTitle":"System Diagnostics","position":{"row":2,"col":1}}',106,'user','2026-02-05T11:32:49.172356','2026-02-05T11:32:49.172356','normal');
INSERT INTO "fs_nodes" VALUES (23,'/home/user/Desktop/Files.lnk','/home/user/Desktop','file','{"type":"app-shortcut","appId":"files","appTitle":"Files","position":{"row":3,"col":0}}',87,'user','2026-02-05T11:32:52.566603','2026-02-05T11:32:52.566603','normal');
INSERT INTO "fs_nodes" VALUES (24,'/home/user/Desktop/Local Files.lnk','/home/user/Desktop','file','{"type":"app-shortcut","appId":"localfiles","appTitle":"Local Files","position":{"row":2,"col":0}}',98,'user','2026-02-05T11:32:52.580819','2026-02-05T11:32:52.580819','normal');
INSERT INTO "fs_nodes" VALUES (25,'/home/user/Desktop/File Explorer.lnk','/home/user/Desktop','file','{"type":"app-shortcut","appId":"files","appTitle":"File Explorer","position":{"row":3,"col":0}}',95,'user','2026-02-05T11:32:52.589736','2026-02-05T11:32:52.589736','normal');
INSERT INTO "fs_nodes" VALUES (26,'/home/user/notes/testing.txt','/home/user/notes','file','testing, this is a sample
testing for sample',44,'user','2026-02-05T11:37:29.727455','2026-03-27T06:26:01.421550','normal');
INSERT INTO "fs_nodes" VALUES (27,'/home/user/Desktop/Camera.lnk','/home/user/Desktop','file','{"type":"app-shortcut","appId":"camera","appTitle":"Camera","position":{"row":0,"col":0}}',89,'user','2026-02-05T12:52:21.688410','2026-02-05T12:52:21.688410','normal');
INSERT INTO "fs_nodes" VALUES (28,'/home/user/Desktop/Calculator.lnk','/home/user/Desktop','file','{"type":"app-shortcut","appId":"calculator","appTitle":"Calculator","position":{"row":0,"col":1}}',97,'user','2026-02-05T12:52:21.706808','2026-02-05T12:52:21.706808','normal');
INSERT INTO "fs_nodes" VALUES (29,'/home/user/Desktop/Calendar.lnk','/home/user/Desktop','file','{"type":"app-shortcut","appId":"calendar","appTitle":"Calendar","position":{"row":0,"col":2}}',93,'user','2026-02-05T12:52:21.722614','2026-02-05T12:52:21.722614','normal');
INSERT INTO "fs_nodes" VALUES (30,'/home/user/Desktop/Clock.lnk','/home/user/Desktop','file','{"type":"app-shortcut","appId":"clock","appTitle":"Clock","position":{"row":0,"col":3}}',87,'user','2026-02-05T12:52:21.734610','2026-02-05T12:52:21.734610','normal');
INSERT INTO "fs_nodes" VALUES (31,'/home/user/Desktop/Tips & Getting Started.lnk','/home/user/Desktop','file','{"type":"app-shortcut","appId":"tips","appTitle":"Tips & Getting Started","position":{"row":2,"col":3}}',103,'user','2026-02-05T12:52:21.804137','2026-02-05T12:52:21.804137','normal');
INSERT INTO "fs_nodes" VALUES (38,'/home/user/Videos/video_2026-02-05T13-35-08.mp4','/home/user/Videos','file','mp4a.40.2;base64',16,'user','2026-02-05T13:35:08.512537','2026-02-05T13:35:08.512537','normal');
INSERT INTO "fs_nodes" VALUES (40,'/home/user/Desktop/Web Browser.lnk','/home/user/Desktop','file','{"type":"app-shortcut","appId":"webbrowser","appTitle":"Web Browser","position":{"row":0,"col":0}}',98,'user','2026-02-07T00:46:06.434556','2026-02-07T00:46:06.434556','normal');
INSERT INTO "fs_nodes" VALUES (44,'/home/user/.recycle_bin','/home/user','dir','',0,'user','2026-03-27T06:24:55.559997','2026-03-27T06:24:55.559997','normal');
INSERT INTO "fs_nodes" VALUES (48,'/home/user/notes/notes.txt','/home/user/notes','file','Phase 26 na ang start
',22,'user','2026-03-27T06:31:50.808371','2026-03-27T06:31:50.808371','normal');
INSERT INTO "fs_nodes" VALUES (51,'/home/user/Documents/berto','/home/user/Documents','dir','',0,'user','2026-03-28T01:07:59.912959','2026-03-28T01:07:59.912959','normal');
INSERT INTO "fs_nodes" VALUES (52,'/home/user/Desktop/Armoury Crate.lnk','/home/user/Desktop','file','{"type":"app-shortcut","appId":"armourycrate","appTitle":"Armoury Crate","position":{"row":3,"col":0}}',102,'user','2026-04-09T00:36:22.475069','2026-04-09T00:36:22.475069','normal');
INSERT INTO "fs_nodes" VALUES (53,'/home/user/Desktop/Minesweeper.lnk','/home/user/Desktop','file','{"type":"app-shortcut","appId":"minesweeper","appTitle":"Minesweeper","position":{"row":0,"col":0}}',99,'user','2026-04-17T20:47:56.109827','2026-04-17T20:47:56.109827','normal');
INSERT INTO "fs_nodes" VALUES (54,'/home/user/Desktop/Solitaire.lnk','/home/user/Desktop','file','{"type":"app-shortcut","appId":"solitaire","appTitle":"Solitaire","position":{"row":0,"col":1}}',95,'user','2026-04-17T20:47:56.136652','2026-04-17T20:47:56.136652','normal');
INSERT INTO "note_versions" VALUES (1,'/home/user/notes/testing.txt','testing, this is a sample','2026-03-27T06:26:01.419565');
INSERT INTO "note_versions" VALUES (2,'/home/user/notes/sample 2.txt','','2026-03-27T06:26:17.298006');
INSERT INTO "notifications" VALUES (1,'Notes','Note saved successfully','success','notes','2026-02-05T11:37:34.811367',0);
INSERT INTO "notifications" VALUES (2,'Notes','Note saved successfully','success','notes','2026-02-05T13:37:21.560936',0);
INSERT INTO "notifications" VALUES (3,'Notes','Note saved successfully','success','notes','2026-03-27T02:46:04.805279',0);
INSERT INTO "security_logs" VALUES (1,'2026-02-05T13:38:26.427313','login_success','user','login',NULL,1,NULL,'User role: user');
INSERT INTO "security_logs" VALUES (2,'2026-02-05T13:41:11.099718','login_success','admin','login',NULL,1,NULL,'User role: admin');
INSERT INTO "security_logs" VALUES (3,'2026-02-05T13:41:33.146984','login_success','admin','login',NULL,1,NULL,'User role: admin');
INSERT INTO "security_logs" VALUES (4,'2026-02-05T13:42:06.540260','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (5,'2026-02-05T13:42:06.583858','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (6,'2026-02-05T13:42:49.405321','login_success','admin','login',NULL,1,NULL,'User role: admin');
INSERT INTO "security_logs" VALUES (7,'2026-02-06T02:44:56.886987','login_success','admin','login',NULL,1,NULL,'User role: admin');
INSERT INTO "security_logs" VALUES (8,'2026-02-06T03:00:44.827498','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (9,'2026-02-06T03:00:44.863275','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (10,'2026-02-06T03:05:02.600273','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (11,'2026-02-06T03:05:02.635170','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (12,'2026-02-06T03:09:03.088621','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (13,'2026-02-06T03:09:03.124266','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (14,'2026-02-06T03:11:48.328833','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (15,'2026-02-06T03:11:48.372157','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (16,'2026-02-06T03:15:46.680643','login_success','user','login',NULL,1,NULL,'User role: user');
INSERT INTO "security_logs" VALUES (17,'2026-02-06T03:19:01.577681','login_success','user','login',NULL,1,NULL,'User role: user');
INSERT INTO "security_logs" VALUES (18,'2026-02-06T04:18:56.007025','login_success','admin','login',NULL,1,NULL,'User role: admin');
INSERT INTO "security_logs" VALUES (19,'2026-02-07T00:47:55.898556','login_success','user','login',NULL,1,NULL,'User role: user');
INSERT INTO "security_logs" VALUES (20,'2026-02-28T13:38:38.249474','login_failed','admin','login',NULL,0,NULL,'Invalid credentials');
INSERT INTO "security_logs" VALUES (21,'2026-02-28T13:38:42.033290','login_failed','admin','login',NULL,0,NULL,'Invalid credentials');
INSERT INTO "security_logs" VALUES (22,'2026-02-28T13:38:50.632895','login_failed','admin','login',NULL,0,NULL,'Invalid credentials');
INSERT INTO "security_logs" VALUES (23,'2026-02-28T13:39:02.509505','login_failed','user','login',NULL,0,NULL,'Invalid credentials');
INSERT INTO "security_logs" VALUES (24,'2026-02-28T13:39:04.872746','login_failed','user','login',NULL,0,NULL,'Invalid credentials');
INSERT INTO "security_logs" VALUES (25,'2026-02-28T13:39:12.381069','login_success','user','login',NULL,1,NULL,'User role: user');
INSERT INTO "security_logs" VALUES (26,'2026-03-27T02:34:14.374481','login_success','admin','login',NULL,1,NULL,'User role: admin');
INSERT INTO "security_logs" VALUES (27,'2026-03-27T02:34:25.108142','login_failed','user','login',NULL,0,NULL,'Invalid credentials');
INSERT INTO "security_logs" VALUES (28,'2026-03-27T02:34:28.763916','login_failed','user','login',NULL,0,NULL,'Invalid credentials');
INSERT INTO "security_logs" VALUES (29,'2026-03-27T02:34:32.955654','login_failed','user','login',NULL,0,NULL,'Invalid credentials');
INSERT INTO "security_logs" VALUES (30,'2026-03-27T02:34:35.521861','login_failed','user','login',NULL,0,NULL,'Invalid credentials');
INSERT INTO "security_logs" VALUES (31,'2026-03-27T02:34:48.139864','login_failed','user','login',NULL,0,NULL,'Invalid credentials');
INSERT INTO "security_logs" VALUES (32,'2026-03-27T02:35:30.798100','login_success','user','login',NULL,1,NULL,'User role: user');
INSERT INTO "security_logs" VALUES (33,'2026-03-27T02:36:42.143721','login_success','user','login',NULL,1,NULL,'User role: user');
INSERT INTO "security_logs" VALUES (34,'2026-03-27T06:32:44.014417','login_success','user','login',NULL,1,NULL,'User role: user');
INSERT INTO "security_logs" VALUES (35,'2026-03-27T06:48:42.136598','login_success','user','login',NULL,1,NULL,'User role: user');
INSERT INTO "security_logs" VALUES (36,'2026-03-28T00:36:18.859217','login_failed','user','login',NULL,0,NULL,'Invalid credentials');
INSERT INTO "security_logs" VALUES (37,'2026-03-28T00:36:21.572758','login_success','user','login',NULL,1,NULL,'User role: user');
INSERT INTO "security_logs" VALUES (38,'2026-03-28T01:04:39.272250','login_success','user','login',NULL,1,NULL,'User role: user');
INSERT INTO "security_logs" VALUES (39,'2026-03-28T01:12:53.546937','login_success','admin','login',NULL,1,NULL,'User role: admin');
INSERT INTO "security_logs" VALUES (40,'2026-03-28T01:48:47.044519','login_success','user','login',NULL,1,NULL,'User role: user');
INSERT INTO "security_logs" VALUES (41,'2026-04-11T07:18:27.081009','login_success','admin','login',NULL,1,NULL,'User role: admin');
INSERT INTO "security_logs" VALUES (42,'2026-04-14T00:27:34.365078','login_success','user','login',NULL,1,NULL,'User role: user');
INSERT INTO "security_logs" VALUES (43,'2026-04-14T00:36:42.942884','login_failed','user','login',NULL,0,NULL,'Invalid credentials');
INSERT INTO "security_logs" VALUES (44,'2026-04-14T00:36:46.136064','login_success','user','login',NULL,1,NULL,'User role: user');
INSERT INTO "security_logs" VALUES (45,'2026-04-17T20:47:24.641501','login_success','admin','login',NULL,1,NULL,'User role: admin');
INSERT INTO "security_logs" VALUES (46,'2026-04-17T20:48:36.123483','login_success','admin','login',NULL,1,NULL,'User role: admin');
INSERT INTO "security_logs" VALUES (47,'2026-04-17T20:52:11.369221','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (48,'2026-04-17T20:52:11.376532','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (49,'2026-04-18T00:24:57.621089','login_failed','admin','login',NULL,0,NULL,'Invalid credentials');
INSERT INTO "security_logs" VALUES (50,'2026-04-18T00:25:00.877201','login_failed','admin','login',NULL,0,NULL,'Invalid credentials');
INSERT INTO "security_logs" VALUES (51,'2026-04-18T00:25:11.999377','login_failed','user','login',NULL,0,NULL,'Invalid credentials');
INSERT INTO "security_logs" VALUES (52,'2026-04-18T00:27:00.057609','login_success','admin','login',NULL,1,NULL,'User role: admin');
INSERT INTO "security_logs" VALUES (53,'2026-04-18T00:49:37.019053','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (54,'2026-04-18T00:49:37.070999','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (55,'2026-04-18T00:50:14.480953','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (56,'2026-04-18T00:50:14.507526','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (57,'2026-04-18T00:50:18.892229','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (58,'2026-04-18T00:50:18.924410','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (59,'2026-04-18T01:28:29.095607','login_success','admin','login',NULL,1,NULL,'User role: admin');
INSERT INTO "security_logs" VALUES (60,'2026-04-18T02:09:41.735370','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (61,'2026-04-18T02:09:41.782911','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (62,'2026-04-18T02:09:52.800736','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "security_logs" VALUES (63,'2026-04-18T02:09:52.827271','log_access','admin','view_security_logs',NULL,1,NULL,NULL);
INSERT INTO "startup_processes" VALUES (1,'Event Viewer',0,'2026-02-05T12:04:10.513509');
INSERT INTO "startup_processes" VALUES (2,'Calendar',1,'2026-02-06T02:53:05.488235');
INSERT INTO "startup_processes" VALUES (3,'System Monitor',1,'2026-02-06T02:59:43.588184');
INSERT INTO "system_events" VALUES (355,'2026-02-06T03:24:24.932901','Information','System','ProcessManager',5001,'Process terminated: Event Viewer (PID: 1)',NULL,'{"pid": 1, "app": "Event Viewer", "memory_freed": 12}',NULL);
INSERT INTO "system_events" VALUES (356,'2026-02-06T03:25:36.220673','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 2)',NULL,'{"pid": 2, "app": "System Monitor", "memory": 19, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (357,'2026-02-06T03:26:21.345733','Information','System','ProcessManager',5000,'Process started: Notes (PID: 3)',NULL,'{"pid": 3, "app": "Notes", "memory": 27, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (358,'2026-02-06T03:26:24.592652','Information','System','ProcessManager',5001,'Process terminated: Notes (PID: 3)',NULL,'{"pid": 3, "app": "Notes", "memory_freed": 27}',NULL);
INSERT INTO "system_events" VALUES (359,'2026-02-06T03:26:30.688603','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 2)',NULL,'{"pid": 2, "app": "System Monitor", "memory_freed": 19}',NULL);
INSERT INTO "system_events" VALUES (360,'2026-02-06T03:27:27.967396','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 4)',NULL,'{"pid": 4, "app": "System Monitor", "memory": 14, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (361,'2026-02-06T03:27:50.391379','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 4)',NULL,'{"pid": 4, "app": "System Monitor", "memory_freed": 14}',NULL);
INSERT INTO "system_events" VALUES (362,'2026-02-06T03:27:51.106266','Information','System','ProcessManager',5000,'Process started: Event Viewer (PID: 5)',NULL,'{"pid": 5, "app": "Event Viewer", "memory": 18, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (363,'2026-02-06T03:27:54.653210','Information','System','ProcessManager',5001,'Process terminated: Event Viewer (PID: 5)',NULL,'{"pid": 5, "app": "Event Viewer", "memory_freed": 18}',NULL);
INSERT INTO "system_events" VALUES (364,'2026-02-06T04:18:24.149011','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (365,'2026-02-06T04:18:56.022618','Information','Security','Authentication',3000,'User logged in: admin','admin','{"role": "admin", "home_dir": "/home/admin"}',NULL);
INSERT INTO "system_events" VALUES (366,'2026-02-06T04:19:02.573791','Information','System','ProcessManager',5000,'Process started: Camera (PID: 1)',NULL,'{"pid": 1, "app": "Camera", "memory": 10, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (367,'2026-02-06T04:19:10.624889','Information','System','ProcessManager',5001,'Process terminated: Camera (PID: 1)',NULL,'{"pid": 1, "app": "Camera", "memory_freed": 10}',NULL);
INSERT INTO "system_events" VALUES (368,'2026-02-06T04:19:13.070301','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 2)',NULL,'{"pid": 2, "app": "System Monitor", "memory": 9, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (369,'2026-02-06T04:19:19.909199','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 2)',NULL,'{"pid": 2, "app": "System Monitor", "memory_freed": 9}',NULL);
INSERT INTO "system_events" VALUES (370,'2026-02-07T00:35:10.905005','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (371,'2026-02-07T00:38:23.276398','Information','System','ProcessManager',5000,'Process started: Local Files (PID: 1)',NULL,'{"pid": 1, "app": "Local Files", "memory": 8, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (372,'2026-02-07T00:38:28.589266','Information','System','ProcessManager',5001,'Process terminated: Local Files (PID: 1)',NULL,'{"pid": 1, "app": "Local Files", "memory_freed": 8}',NULL);
INSERT INTO "system_events" VALUES (373,'2026-02-07T00:40:02.499485','Information','System','ProcessManager',5000,'Process started: App Store (PID: 2)',NULL,'{"pid": 2, "app": "App Store", "memory": 23, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (374,'2026-02-07T00:40:29.632700','Information','System','ProcessManager',5001,'Process terminated: App Store (PID: 2)',NULL,'{"pid": 2, "app": "App Store", "memory_freed": 23}',NULL);
INSERT INTO "system_events" VALUES (375,'2026-02-07T00:43:05.415324','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (376,'2026-02-07T00:43:30.197532','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (377,'2026-02-07T00:43:56.817257','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (378,'2026-02-07T00:43:58.994742','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (379,'2026-02-07T00:45:22.667451','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (380,'2026-02-07T00:46:10.470502','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 1)',NULL,'{"pid": 1, "app": "Web Browser", "memory": 26, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (381,'2026-02-07T00:47:17.626878','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 1)',NULL,'{"pid": 1, "app": "Web Browser", "memory_freed": 26}',NULL);
INSERT INTO "system_events" VALUES (382,'2026-02-07T00:47:24.740761','Information','System','ProcessManager',5000,'Process started: App Store (PID: 2)',NULL,'{"pid": 2, "app": "App Store", "memory": 24, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (383,'2026-02-07T00:47:33.830122','Information','System','ProcessManager',5001,'Process terminated: App Store (PID: 2)',NULL,'{"pid": 2, "app": "App Store", "memory_freed": 24}',NULL);
INSERT INTO "system_events" VALUES (384,'2026-02-07T00:47:55.912068','Information','Security','Authentication',3000,'User logged in: user','user','{"role": "user", "home_dir": "/home/user"}',NULL);
INSERT INTO "system_events" VALUES (385,'2026-02-07T00:50:10.002924','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 3)',NULL,'{"pid": 3, "app": "Web Browser", "memory": 14, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (386,'2026-02-07T00:50:12.316118','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 3)',NULL,'{"pid": 3, "app": "Web Browser", "memory_freed": 14}',NULL);
INSERT INTO "system_events" VALUES (387,'2026-02-07T00:50:16.698790','Information','System','ProcessManager',5000,'Process started: Clock (PID: 4)',NULL,'{"pid": 4, "app": "Clock", "memory": 14, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (388,'2026-02-07T00:50:25.278885','Information','System','ProcessManager',5001,'Process terminated: Clock (PID: 4)',NULL,'{"pid": 4, "app": "Clock", "memory_freed": 14}',NULL);
INSERT INTO "system_events" VALUES (389,'2026-02-07T00:50:32.423823','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 5)',NULL,'{"pid": 5, "app": "Web Browser", "memory": 15, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (390,'2026-02-07T00:51:16.876514','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 6)',NULL,'{"pid": 6, "app": "Web Browser", "memory": 9, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (391,'2026-02-07T00:55:23.244906','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 6)',NULL,'{"pid": 6, "app": "Web Browser", "memory_freed": 9}',NULL);
INSERT INTO "system_events" VALUES (392,'2026-02-07T00:55:24.802016','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 7)',NULL,'{"pid": 7, "app": "Web Browser", "memory": 15, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (393,'2026-02-07T00:59:06.193120','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 7)',NULL,'{"pid": 7, "app": "Web Browser", "memory_freed": 15}',NULL);
INSERT INTO "system_events" VALUES (394,'2026-02-07T01:01:16.316078','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 8)',NULL,'{"pid": 8, "app": "Web Browser", "memory": 24, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (395,'2026-02-07T01:05:47.398284','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (396,'2026-02-07T01:05:47.455363','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (397,'2026-02-07T01:05:54.863296','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (398,'2026-02-07T01:05:54.918373','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (399,'2026-02-07T01:05:55.728825','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 1)',NULL,'{"pid": 1, "app": "Web Browser", "memory": 24, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (400,'2026-02-07T01:17:41.833418','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 2)',NULL,'{"pid": 2, "app": "Web Browser", "memory": 16, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (401,'2026-02-07T01:17:43.930705','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 2)',NULL,'{"pid": 2, "app": "Web Browser", "memory_freed": 16}',NULL);
INSERT INTO "system_events" VALUES (402,'2026-02-07T01:19:29.708284','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 3)',NULL,'{"pid": 3, "app": "Web Browser", "memory": 26, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (403,'2026-02-07T01:21:10.827741','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 3)',NULL,'{"pid": 3, "app": "Web Browser", "memory_freed": 26}',NULL);
INSERT INTO "system_events" VALUES (404,'2026-02-07T01:21:12.461547','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 4)',NULL,'{"pid": 4, "app": "Web Browser", "memory": 23, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (405,'2026-02-07T01:21:14.872242','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 4)',NULL,'{"pid": 4, "app": "Web Browser", "memory_freed": 23}',NULL);
INSERT INTO "system_events" VALUES (406,'2026-02-07T01:22:19.995618','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 5)',NULL,'{"pid": 5, "app": "Web Browser", "memory": 22, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (407,'2026-02-07T01:23:21.471584','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 5)',NULL,'{"pid": 5, "app": "Web Browser", "memory_freed": 22}',NULL);
INSERT INTO "system_events" VALUES (408,'2026-02-07T01:24:13.042602','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 6)',NULL,'{"pid": 6, "app": "Web Browser", "memory": 13, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (409,'2026-02-07T01:25:39.464440','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 6)',NULL,'{"pid": 6, "app": "Web Browser", "memory_freed": 13}',NULL);
INSERT INTO "system_events" VALUES (410,'2026-02-07T01:27:52.512374','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (411,'2026-02-07T01:27:52.607745','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (412,'2026-02-07T01:28:14.723790','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (413,'2026-02-07T01:28:14.765402','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (414,'2026-02-28T13:37:42.760158','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (415,'2026-02-28T13:38:38.261863','Warning','Security','Authentication',3001,'Failed login attempt for user: admin','admin','{"reason": "Invalid credentials"}',NULL);
INSERT INTO "system_events" VALUES (416,'2026-02-28T13:38:42.046933','Warning','Security','Authentication',3001,'Failed login attempt for user: admin','admin','{"reason": "Invalid credentials"}',NULL);
INSERT INTO "system_events" VALUES (417,'2026-02-28T13:38:50.648549','Warning','Security','Authentication',3001,'Failed login attempt for user: admin','admin','{"reason": "Invalid credentials"}',NULL);
INSERT INTO "system_events" VALUES (418,'2026-02-28T13:39:02.521039','Warning','Security','Authentication',3001,'Failed login attempt for user: user','user','{"reason": "Invalid credentials"}',NULL);
INSERT INTO "system_events" VALUES (419,'2026-02-28T13:39:04.882277','Warning','Security','Authentication',3001,'Failed login attempt for user: user','user','{"reason": "Invalid credentials"}',NULL);
INSERT INTO "system_events" VALUES (420,'2026-02-28T13:39:12.391417','Information','Security','Authentication',3000,'User logged in: user','user','{"role": "user", "home_dir": "/home/user"}',NULL);
INSERT INTO "system_events" VALUES (421,'2026-02-28T13:39:39.694401','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 1)',NULL,'{"pid": 1, "app": "System Monitor", "memory": 23, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (422,'2026-02-28T13:40:12.162798','Information','System','ProcessManager',5000,'Process started: Notes (PID: 2)',NULL,'{"pid": 2, "app": "Notes", "memory": 9, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (423,'2026-02-28T13:40:17.206012','Information','System','ProcessManager',5000,'Process started: Clock (PID: 3)',NULL,'{"pid": 3, "app": "Clock", "memory": 24, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (424,'2026-02-28T13:40:20.309774','Information','System','ProcessManager',5000,'Process started: Calculator (PID: 4)',NULL,'{"pid": 4, "app": "Calculator", "memory": 24, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (425,'2026-02-28T13:40:23.541596','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 5)',NULL,'{"pid": 5, "app": "Web Browser", "memory": 20, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (426,'2026-02-28T13:40:33.922361','Information','System','ProcessManager',5001,'Process terminated: Clock (PID: 3)',NULL,'{"pid": 3, "app": "Clock", "memory_freed": 24}',NULL);
INSERT INTO "system_events" VALUES (427,'2026-02-28T13:41:10.877917','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 5)',NULL,'{"pid": 5, "app": "Web Browser", "memory_freed": 20}',NULL);
INSERT INTO "system_events" VALUES (428,'2026-02-28T13:41:22.728465','Information','System','ProcessManager',5001,'Process terminated: Calculator (PID: 4)',NULL,'{"pid": 4, "app": "Calculator", "memory_freed": 24}',NULL);
INSERT INTO "system_events" VALUES (429,'2026-02-28T13:41:23.951052','Information','System','ProcessManager',5001,'Process terminated: Notes (PID: 2)',NULL,'{"pid": 2, "app": "Notes", "memory_freed": 9}',NULL);
INSERT INTO "system_events" VALUES (430,'2026-02-28T13:41:26.124887','Information','System','ProcessManager',5000,'Process started: System Diagnostics (PID: 6)',NULL,'{"pid": 6, "app": "System Diagnostics", "memory": 14, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (431,'2026-02-28T13:41:37.907097','Information','System','ProcessManager',5001,'Process terminated: System Diagnostics (PID: 6)',NULL,'{"pid": 6, "app": "System Diagnostics", "memory_freed": 14}',NULL);
INSERT INTO "system_events" VALUES (432,'2026-02-28T13:41:44.704760','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 1)',NULL,'{"pid": 1, "app": "System Monitor", "memory_freed": 23}',NULL);
INSERT INTO "system_events" VALUES (433,'2026-02-28T13:41:47.660153','Information','System','ProcessManager',5000,'Process started: Camera (PID: 12)',NULL,'{"pid": 12, "app": "Camera", "memory": 19, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (434,'2026-02-28T13:42:02.053334','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 13)',NULL,'{"pid": 13, "app": "File Explorer", "memory": 17, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (435,'2026-02-28T13:42:36.151920','Information','System','ProcessManager',5001,'Process terminated: File Explorer (PID: 13)',NULL,'{"pid": 13, "app": "File Explorer", "memory_freed": 17}',NULL);
INSERT INTO "system_events" VALUES (436,'2026-02-28T13:42:41.085552','Information','System','ProcessManager',5001,'Process terminated: Camera (PID: 12)',NULL,'{"pid": 12, "app": "Camera", "memory_freed": 19}',NULL);
INSERT INTO "system_events" VALUES (437,'2026-02-28T13:42:43.434660','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 14)',NULL,'{"pid": 14, "app": "System Monitor", "memory": 20, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (438,'2026-02-28T13:42:51.704261','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 14)',NULL,'{"pid": 14, "app": "System Monitor", "memory_freed": 20}',NULL);
INSERT INTO "system_events" VALUES (439,'2026-02-28T13:42:56.372600','Information','System','ProcessManager',5000,'Process started: Settings (PID: 15)',NULL,'{"pid": 15, "app": "Settings", "memory": 21, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (440,'2026-02-28T13:43:20.683080','Information','System','ProcessManager',5001,'Process terminated: Settings (PID: 15)',NULL,'{"pid": 15, "app": "Settings", "memory_freed": 21}',NULL);
INSERT INTO "system_events" VALUES (441,'2026-02-28T13:43:30.387679','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 16)',NULL,'{"pid": 16, "app": "Web Browser", "memory": 22, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (442,'2026-02-28T13:43:33.305398','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 16)',NULL,'{"pid": 16, "app": "Web Browser", "memory_freed": 22}',NULL);
INSERT INTO "system_events" VALUES (443,'2026-02-28T13:43:34.420395','Information','System','ProcessManager',5000,'Process started: Calculator (PID: 17)',NULL,'{"pid": 17, "app": "Calculator", "memory": 25, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (444,'2026-02-28T13:43:35.771198','Information','System','ProcessManager',5001,'Process terminated: Calculator (PID: 17)',NULL,'{"pid": 17, "app": "Calculator", "memory_freed": 25}',NULL);
INSERT INTO "system_events" VALUES (445,'2026-02-28T13:43:36.075022','Information','System','ProcessManager',5000,'Process started: Local Files (PID: 18)',NULL,'{"pid": 18, "app": "Local Files", "memory": 11, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (446,'2026-02-28T13:43:37.138987','Information','System','ProcessManager',5001,'Process terminated: Local Files (PID: 18)',NULL,'{"pid": 18, "app": "Local Files", "memory_freed": 11}',NULL);
INSERT INTO "system_events" VALUES (447,'2026-02-28T13:43:37.456386','Information','System','ProcessManager',5000,'Process started: Tips & Getting Started (PID: 19)',NULL,'{"pid": 19, "app": "Tips & Getting Started", "memory": 23, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (448,'2026-02-28T13:43:41.500263','Information','System','ProcessManager',5001,'Process terminated: Tips & Getting Started (PID: 19)',NULL,'{"pid": 19, "app": "Tips & Getting Started", "memory_freed": 23}',NULL);
INSERT INTO "system_events" VALUES (449,'2026-02-28T13:43:45.093067','Information','System','ProcessManager',5000,'Process started: Event Viewer (PID: 20)',NULL,'{"pid": 20, "app": "Event Viewer", "memory": 26, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (450,'2026-02-28T13:43:51.517607','Information','System','ProcessManager',5001,'Process terminated: Event Viewer (PID: 20)',NULL,'{"pid": 20, "app": "Event Viewer", "memory_freed": 26}',NULL);
INSERT INTO "system_events" VALUES (451,'2026-02-28T13:43:52.948028','Information','System','ProcessManager',5000,'Process started: App Store (PID: 21)',NULL,'{"pid": 21, "app": "App Store", "memory": 20, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (452,'2026-02-28T13:43:56.089898','Information','System','ProcessManager',5001,'Process terminated: App Store (PID: 21)',NULL,'{"pid": 21, "app": "App Store", "memory_freed": 20}',NULL);
INSERT INTO "system_events" VALUES (453,'2026-02-28T13:43:56.769985','Information','System','ProcessManager',5000,'Process started: Calendar (PID: 22)',NULL,'{"pid": 22, "app": "Calendar", "memory": 25, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (454,'2026-02-28T13:44:00.070155','Information','System','ProcessManager',5001,'Process terminated: Calendar (PID: 22)',NULL,'{"pid": 22, "app": "Calendar", "memory_freed": 25}',NULL);
INSERT INTO "system_events" VALUES (455,'2026-02-28T13:44:00.914445','Information','System','ProcessManager',5000,'Process started: Camera (PID: 23)',NULL,'{"pid": 23, "app": "Camera", "memory": 26, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (456,'2026-02-28T13:44:03.014187','Information','System','ProcessManager',5001,'Process terminated: Camera (PID: 23)',NULL,'{"pid": 23, "app": "Camera", "memory_freed": 26}',NULL);
INSERT INTO "system_events" VALUES (457,'2026-02-28T13:44:25.718563','Information','System','ProcessManager',5000,'Process started: Settings (PID: 24)',NULL,'{"pid": 24, "app": "Settings", "memory": 12, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (458,'2026-02-28T13:45:23.864949','Information','System','ProcessManager',5001,'Process terminated: Settings (PID: 24)',NULL,'{"pid": 24, "app": "Settings", "memory_freed": 12}',NULL);
INSERT INTO "system_events" VALUES (459,'2026-03-26T23:04:42.517384','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (460,'2026-03-27T02:33:32.775957','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (461,'2026-03-27T02:34:14.385218','Information','Security','Authentication',3000,'User logged in: admin','admin','{"role": "admin", "home_dir": "/home/admin"}',NULL);
INSERT INTO "system_events" VALUES (462,'2026-03-27T02:34:25.124033','Warning','Security','Authentication',3001,'Failed login attempt for user: user','user','{"reason": "Invalid credentials"}',NULL);
INSERT INTO "system_events" VALUES (463,'2026-03-27T02:34:28.776925','Warning','Security','Authentication',3001,'Failed login attempt for user: user','user','{"reason": "Invalid credentials"}',NULL);
INSERT INTO "system_events" VALUES (464,'2026-03-27T02:34:32.968881','Warning','Security','Authentication',3001,'Failed login attempt for user: user','user','{"reason": "Invalid credentials"}',NULL);
INSERT INTO "system_events" VALUES (465,'2026-03-27T02:34:35.533873','Warning','Security','Authentication',3001,'Failed login attempt for user: user','user','{"reason": "Invalid credentials"}',NULL);
INSERT INTO "system_events" VALUES (466,'2026-03-27T02:34:48.155448','Warning','Security','Authentication',3001,'Failed login attempt for user: user','user','{"reason": "Invalid credentials"}',NULL);
INSERT INTO "system_events" VALUES (467,'2026-03-27T02:35:30.813579','Information','Security','Authentication',3000,'User logged in: user','user','{"role": "user", "home_dir": "/home/user"}',NULL);
INSERT INTO "system_events" VALUES (468,'2026-03-27T02:35:43.435766','Information','System','ProcessManager',5000,'Process started: Tips & Getting Started (PID: 1)',NULL,'{"pid": 1, "app": "Tips & Getting Started", "memory": 15, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (469,'2026-03-27T02:35:55.107114','Information','System','ProcessManager',5001,'Process terminated: Tips & Getting Started (PID: 1)',NULL,'{"pid": 1, "app": "Tips & Getting Started", "memory_freed": 15}',NULL);
INSERT INTO "system_events" VALUES (470,'2026-03-27T02:35:56.735764','Information','System','ProcessManager',5000,'Process started: Settings (PID: 2)',NULL,'{"pid": 2, "app": "Settings", "memory": 21, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (471,'2026-03-27T02:36:14.951915','Information','System','ProcessManager',5001,'Process terminated: Settings (PID: 2)',NULL,'{"pid": 2, "app": "Settings", "memory_freed": 21}',NULL);
INSERT INTO "system_events" VALUES (472,'2026-03-27T02:36:42.150582','Information','Security','Authentication',3000,'User logged in: user','user','{"role": "user", "home_dir": "/home/user"}',NULL);
INSERT INTO "system_events" VALUES (473,'2026-03-27T02:36:45.726174','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 3)',NULL,'{"pid": 3, "app": "Web Browser", "memory": 27, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (474,'2026-03-27T02:37:46.524028','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 3)',NULL,'{"pid": 3, "app": "Web Browser", "memory_freed": 27}',NULL);
INSERT INTO "system_events" VALUES (475,'2026-03-27T02:37:47.867688','Information','System','ProcessManager',5000,'Process started: Camera (PID: 4)',NULL,'{"pid": 4, "app": "Camera", "memory": 17, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (476,'2026-03-27T02:38:05.795680','Information','System','ProcessManager',5001,'Process terminated: Camera (PID: 4)',NULL,'{"pid": 4, "app": "Camera", "memory_freed": 17}',NULL);
INSERT INTO "system_events" VALUES (477,'2026-03-27T02:38:07.246428','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 5)',NULL,'{"pid": 5, "app": "File Explorer", "memory": 20, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (478,'2026-03-27T02:38:34.303393','Information','System','ProcessManager',5001,'Process terminated: File Explorer (PID: 5)',NULL,'{"pid": 5, "app": "File Explorer", "memory_freed": 20}',NULL);
INSERT INTO "system_events" VALUES (479,'2026-03-27T02:38:38.309093','Information','System','ProcessManager',5000,'Process started: Calendar (PID: 6)',NULL,'{"pid": 6, "app": "Calendar", "memory": 14, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (480,'2026-03-27T02:38:42.387334','Information','System','ProcessManager',5001,'Process terminated: Calendar (PID: 6)',NULL,'{"pid": 6, "app": "Calendar", "memory_freed": 14}',NULL);
INSERT INTO "system_events" VALUES (481,'2026-03-27T02:38:52.219048','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 7)',NULL,'{"pid": 7, "app": "System Monitor", "memory": 27, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (482,'2026-03-27T02:39:08.324861','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 8)',NULL,'{"pid": 8, "app": "Web Browser", "memory": 19, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (483,'2026-03-27T02:39:08.969084','Information','System','ProcessManager',5000,'Process started: Camera (PID: 9)',NULL,'{"pid": 9, "app": "Camera", "memory": 11, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (484,'2026-03-27T02:39:09.625128','Information','System','ProcessManager',5000,'Process started: Calculator (PID: 10)',NULL,'{"pid": 10, "app": "Calculator", "memory": 8, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (485,'2026-03-27T02:39:10.308622','Information','System','ProcessManager',5000,'Process started: Calendar (PID: 11)',NULL,'{"pid": 11, "app": "Calendar", "memory": 11, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (486,'2026-03-27T02:40:29.766526','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 8)',NULL,'{"pid": 8, "app": "Web Browser", "memory_freed": 19}',NULL);
INSERT INTO "system_events" VALUES (487,'2026-03-27T02:40:31.670926','Information','System','ProcessManager',5001,'Process terminated: Camera (PID: 9)',NULL,'{"pid": 9, "app": "Camera", "memory_freed": 11}',NULL);
INSERT INTO "system_events" VALUES (488,'2026-03-27T02:40:46.783908','Information','System','ProcessManager',5001,'Process terminated: Calculator (PID: 10)',NULL,'{"pid": 10, "app": "Calculator", "memory_freed": 8}',NULL);
INSERT INTO "system_events" VALUES (489,'2026-03-27T02:40:47.657328','Information','System','ProcessManager',5001,'Process terminated: Calendar (PID: 11)',NULL,'{"pid": 11, "app": "Calendar", "memory_freed": 11}',NULL);
INSERT INTO "system_events" VALUES (490,'2026-03-27T02:40:58.504337','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 8)',NULL,'{"pid": 8, "app": "Web Browser", "memory_freed": 19}',NULL);
INSERT INTO "system_events" VALUES (491,'2026-03-27T02:41:00.099805','Information','System','ProcessManager',5001,'Process terminated: Calendar (PID: 11)',NULL,'{"pid": 11, "app": "Calendar", "memory_freed": 11}',NULL);
INSERT INTO "system_events" VALUES (492,'2026-03-27T02:41:00.900590','Information','System','ProcessManager',5001,'Process terminated: Calculator (PID: 10)',NULL,'{"pid": 10, "app": "Calculator", "memory_freed": 8}',NULL);
INSERT INTO "system_events" VALUES (493,'2026-03-27T02:41:02.020091','Information','System','ProcessManager',5001,'Process terminated: Camera (PID: 9)',NULL,'{"pid": 9, "app": "Camera", "memory_freed": 11}',NULL);
INSERT INTO "system_events" VALUES (494,'2026-03-27T02:41:04.706829','Information','System','ProcessManager',5000,'Process started: System Diagnostics (PID: 12)',NULL,'{"pid": 12, "app": "System Diagnostics", "memory": 12, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (495,'2026-03-27T02:41:14.819912','Information','System','ProcessManager',5001,'Process terminated: System Diagnostics (PID: 12)',NULL,'{"pid": 12, "app": "System Diagnostics", "memory_freed": 12}',NULL);
INSERT INTO "system_events" VALUES (496,'2026-03-27T02:41:16.418581','Information','System','ProcessManager',5000,'Process started: Terminal (PID: 13)',NULL,'{"pid": 13, "app": "Terminal", "memory": 10, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (497,'2026-03-27T02:41:31.933219','Information','System','ProcessManager',5001,'Process terminated: Terminal (PID: 13)',NULL,'{"pid": 13, "app": "Terminal", "memory_freed": 10}',NULL);
INSERT INTO "system_events" VALUES (498,'2026-03-27T02:41:34.239751','Information','System','ProcessManager',5000,'Process started: Settings (PID: 14)',NULL,'{"pid": 14, "app": "Settings", "memory": 13, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (499,'2026-03-27T02:41:44.109690','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (500,'2026-03-27T02:42:35.980875','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (501,'2026-03-27T02:42:44.754203','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 1)',NULL,'{"pid": 1, "app": "System Monitor", "memory": 19, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (502,'2026-03-27T02:42:52.467307','Information','System','ProcessManager',5000,'Process started: Clock (PID: 2)',NULL,'{"pid": 2, "app": "Clock", "memory": 24, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (503,'2026-03-27T02:44:30.061864','Information','System','ProcessManager',5000,'Process started: Tips & Getting Started (PID: 3)',NULL,'{"pid": 3, "app": "Tips & Getting Started", "memory": 8, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (504,'2026-03-27T02:44:33.878078','Information','System','ProcessManager',5001,'Process terminated: Tips & Getting Started (PID: 3)',NULL,'{"pid": 3, "app": "Tips & Getting Started", "memory_freed": 8}',NULL);
INSERT INTO "system_events" VALUES (505,'2026-03-27T02:45:00.333759','Information','System','ProcessManager',5000,'Process started: Local Files (PID: 4)',NULL,'{"pid": 4, "app": "Local Files", "memory": 27, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (506,'2026-03-27T02:45:01.234447','Information','System','ProcessManager',5000,'Process started: Calendar (PID: 5)',NULL,'{"pid": 5, "app": "Calendar", "memory": 15, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (507,'2026-03-27T02:45:02.104668','Information','System','ProcessManager',5000,'Process started: Calculator (PID: 6)',NULL,'{"pid": 6, "app": "Calculator", "memory": 13, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (508,'2026-03-27T02:45:03.449759','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 7)',NULL,'{"pid": 7, "app": "Web Browser", "memory": 25, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (509,'2026-03-27T02:45:04.231249','Information','System','ProcessManager',5000,'Process started: Notes (PID: 8)',NULL,'{"pid": 8, "app": "Notes", "memory": 8, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (510,'2026-03-27T02:45:17.410241','Information','System','ProcessManager',5001,'Process terminated: Clock (PID: 2)',NULL,'{"pid": 2, "app": "Clock", "memory_freed": 24}',NULL);
INSERT INTO "system_events" VALUES (511,'2026-03-27T02:45:19.580072','Information','System','ProcessManager',5001,'Process terminated: Local Files (PID: 4)',NULL,'{"pid": 4, "app": "Local Files", "memory_freed": 27}',NULL);
INSERT INTO "system_events" VALUES (512,'2026-03-27T02:45:21.297119','Information','System','ProcessManager',5001,'Process terminated: Calendar (PID: 5)',NULL,'{"pid": 5, "app": "Calendar", "memory_freed": 15}',NULL);
INSERT INTO "system_events" VALUES (513,'2026-03-27T02:45:22.545948','Information','System','ProcessManager',5001,'Process terminated: Calculator (PID: 6)',NULL,'{"pid": 6, "app": "Calculator", "memory_freed": 13}',NULL);
INSERT INTO "system_events" VALUES (514,'2026-03-27T02:45:25.009238','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 7)',NULL,'{"pid": 7, "app": "Web Browser", "memory_freed": 25}',NULL);
INSERT INTO "system_events" VALUES (515,'2026-03-27T02:45:27.177460','Information','System','ProcessManager',5001,'Process terminated: Notes (PID: 8)',NULL,'{"pid": 8, "app": "Notes", "memory_freed": 8}',NULL);
INSERT INTO "system_events" VALUES (516,'2026-03-27T02:45:43.631499','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 1)',NULL,'{"pid": 1, "app": "System Monitor", "memory_freed": 19}',NULL);
INSERT INTO "system_events" VALUES (517,'2026-03-27T02:45:45.600039','Information','System','ProcessManager',5001,'Process terminated: Clock (PID: 2)',NULL,'{"pid": 2, "app": "Clock", "memory_freed": 24}',NULL);
INSERT INTO "system_events" VALUES (518,'2026-03-27T02:45:47.415191','Information','System','ProcessManager',5001,'Process terminated: Notes (PID: 8)',NULL,'{"pid": 8, "app": "Notes", "memory_freed": 8}',NULL);
INSERT INTO "system_events" VALUES (519,'2026-03-27T02:45:48.195890','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 7)',NULL,'{"pid": 7, "app": "Web Browser", "memory_freed": 25}',NULL);
INSERT INTO "system_events" VALUES (520,'2026-03-27T02:45:49.375888','Information','System','ProcessManager',5001,'Process terminated: Calculator (PID: 6)',NULL,'{"pid": 6, "app": "Calculator", "memory_freed": 13}',NULL);
INSERT INTO "system_events" VALUES (521,'2026-03-27T02:45:50.799869','Information','System','ProcessManager',5001,'Process terminated: Calendar (PID: 5)',NULL,'{"pid": 5, "app": "Calendar", "memory_freed": 15}',NULL);
INSERT INTO "system_events" VALUES (522,'2026-03-27T02:45:51.967696','Information','System','ProcessManager',5001,'Process terminated: Local Files (PID: 4)',NULL,'{"pid": 4, "app": "Local Files", "memory_freed": 27}',NULL);
INSERT INTO "system_events" VALUES (523,'2026-03-27T02:45:53.102687','Information','System','ProcessManager',5000,'Process started: Notes (PID: 9)',NULL,'{"pid": 9, "app": "Notes", "memory": 27, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (524,'2026-03-27T02:46:06.296663','Information','System','ProcessManager',5001,'Process terminated: Notes (PID: 9)',NULL,'{"pid": 9, "app": "Notes", "memory_freed": 27}',NULL);
INSERT INTO "system_events" VALUES (525,'2026-03-27T02:46:11.535352','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 10)',NULL,'{"pid": 10, "app": "File Explorer", "memory": 10, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (526,'2026-03-27T02:46:24.983241','Information','System','ProcessManager',5000,'Process started: Notes (PID: 11)',NULL,'{"pid": 11, "app": "Notes", "memory": 17, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (527,'2026-03-27T02:46:30.701021','Information','System','ProcessManager',5001,'Process terminated: Notes (PID: 11)',NULL,'{"pid": 11, "app": "Notes", "memory_freed": 17}',NULL);
INSERT INTO "system_events" VALUES (528,'2026-03-27T02:46:31.485247','Information','System','ProcessManager',5000,'Process started: Notes (PID: 12)',NULL,'{"pid": 12, "app": "Notes", "memory": 23, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (529,'2026-03-27T02:46:48.995002','Information','System','ProcessManager',5001,'Process terminated: Notes (PID: 12)',NULL,'{"pid": 12, "app": "Notes", "memory_freed": 23}',NULL);
INSERT INTO "system_events" VALUES (530,'2026-03-27T02:46:51.114656','Information','System','ProcessManager',5001,'Process terminated: File Explorer (PID: 10)',NULL,'{"pid": 10, "app": "File Explorer", "memory_freed": 10}',NULL);
INSERT INTO "system_events" VALUES (531,'2026-03-27T06:23:25.628407','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (532,'2026-03-27T06:23:33.674194','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (533,'2026-03-27T06:24:22.174611','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 1)',NULL,'{"pid": 1, "app": "File Explorer", "memory": 27, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (534,'2026-03-27T06:24:31.514749','Information','System','ProcessManager',5001,'Process terminated: File Explorer (PID: 1)',NULL,'{"pid": 1, "app": "File Explorer", "memory_freed": 27}',NULL);
INSERT INTO "system_events" VALUES (535,'2026-03-27T06:24:33.958246','Information','System','ProcessManager',5000,'Process started: Camera (PID: 2)',NULL,'{"pid": 2, "app": "Camera", "memory": 12, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (536,'2026-03-27T06:24:42.964180','Information','System','ProcessManager',5001,'Process terminated: Camera (PID: 2)',NULL,'{"pid": 2, "app": "Camera", "memory_freed": 12}',NULL);
INSERT INTO "system_events" VALUES (537,'2026-03-27T06:24:46.666275','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 3)',NULL,'{"pid": 3, "app": "File Explorer", "memory": 18, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (538,'2026-03-27T06:24:57.445165','Information','System','ProcessManager',5001,'Process terminated: File Explorer (PID: 3)',NULL,'{"pid": 3, "app": "File Explorer", "memory_freed": 18}',NULL);
INSERT INTO "system_events" VALUES (539,'2026-03-27T06:24:58.734449','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 4)',NULL,'{"pid": 4, "app": "File Explorer", "memory": 9, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (540,'2026-03-27T06:25:44.188129','Information','System','ProcessManager',5000,'Process started: Notes (PID: 5)',NULL,'{"pid": 5, "app": "Notes", "memory": 20, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (541,'2026-03-27T06:26:40.393028','Information','System','ProcessManager',5001,'Process terminated: Notes (PID: 5)',NULL,'{"pid": 5, "app": "Notes", "memory_freed": 20}',NULL);
INSERT INTO "system_events" VALUES (542,'2026-03-27T06:27:31.007814','Information','System','ProcessManager',5001,'Process terminated: File Explorer (PID: 4)',NULL,'{"pid": 4, "app": "File Explorer", "memory_freed": 9}',NULL);
INSERT INTO "system_events" VALUES (543,'2026-03-27T06:28:05.079610','Information','System','ProcessManager',5000,'Process started: Tips & Getting Started (PID: 6)',NULL,'{"pid": 6, "app": "Tips & Getting Started", "memory": 11, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (544,'2026-03-27T06:28:10.175347','Information','System','ProcessManager',5001,'Process terminated: Tips & Getting Started (PID: 6)',NULL,'{"pid": 6, "app": "Tips & Getting Started", "memory_freed": 11}',NULL);
INSERT INTO "system_events" VALUES (545,'2026-03-27T06:28:34.354703','Information','System','ProcessManager',5000,'Process started: Terminal (PID: 7)',NULL,'{"pid": 7, "app": "Terminal", "memory": 14, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (546,'2026-03-27T06:29:07.703771','Information','System','ProcessManager',5001,'Process terminated: Terminal (PID: 7)',NULL,'{"pid": 7, "app": "Terminal", "memory_freed": 14}',NULL);
INSERT INTO "system_events" VALUES (547,'2026-03-27T06:29:25.409743','Information','System','ProcessManager',5000,'Process started: Terminal (PID: 8)',NULL,'{"pid": 8, "app": "Terminal", "memory": 16, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (548,'2026-03-27T06:29:38.596105','Information','System','ProcessManager',5001,'Process terminated: Terminal (PID: 8)',NULL,'{"pid": 8, "app": "Terminal", "memory_freed": 16}',NULL);
INSERT INTO "system_events" VALUES (549,'2026-03-27T06:30:05.374974','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 9)',NULL,'{"pid": 9, "app": "System Monitor", "memory": 20, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (550,'2026-03-27T06:30:38.095470','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 9)',NULL,'{"pid": 9, "app": "System Monitor", "memory_freed": 20}',NULL);
INSERT INTO "system_events" VALUES (551,'2026-03-27T06:30:40.287041','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 10)',NULL,'{"pid": 10, "app": "File Explorer", "memory": 15, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (552,'2026-03-27T06:31:26.591113','Information','System','ProcessManager',5000,'Process started: Notes (PID: 11)',NULL,'{"pid": 11, "app": "Notes", "memory": 26, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (553,'2026-03-27T06:31:40.388560','Information','System','ProcessManager',5001,'Process terminated: Notes (PID: 11)',NULL,'{"pid": 11, "app": "Notes", "memory_freed": 26}',NULL);
INSERT INTO "system_events" VALUES (554,'2026-03-27T06:31:57.119838','Information','System','ProcessManager',5000,'Process started: Notes (PID: 12)',NULL,'{"pid": 12, "app": "Notes", "memory": 21, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (555,'2026-03-27T06:32:10.770959','Information','System','ProcessManager',5001,'Process terminated: Notes (PID: 12)',NULL,'{"pid": 12, "app": "Notes", "memory_freed": 21}',NULL);
INSERT INTO "system_events" VALUES (556,'2026-03-27T06:32:22.801225','Information','System','ProcessManager',5001,'Process terminated: File Explorer (PID: 10)',NULL,'{"pid": 10, "app": "File Explorer", "memory_freed": 15}',NULL);
INSERT INTO "system_events" VALUES (557,'2026-03-27T06:32:44.025076','Information','Security','Authentication',3000,'User logged in: user','user','{"role": "user", "home_dir": "/home/user"}',NULL);
INSERT INTO "system_events" VALUES (558,'2026-03-27T06:33:00.001936','Information','System','ProcessManager',5000,'Process started: App Store (PID: 13)',NULL,'{"pid": 13, "app": "App Store", "memory": 13, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (559,'2026-03-27T06:33:07.538113','Information','System','ProcessManager',5001,'Process terminated: App Store (PID: 13)',NULL,'{"pid": 13, "app": "App Store", "memory_freed": 13}',NULL);
INSERT INTO "system_events" VALUES (560,'2026-03-27T06:35:31.087695','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (561,'2026-03-27T06:35:40.950860','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (562,'2026-03-27T06:35:59.216916','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 1)',NULL,'{"pid": 1, "app": "File Explorer", "memory": 23, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (563,'2026-03-27T06:36:18.051798','Information','System','ProcessManager',5001,'Process terminated: File Explorer (PID: 1)',NULL,'{"pid": 1, "app": "File Explorer", "memory_freed": 23}',NULL);
INSERT INTO "system_events" VALUES (564,'2026-03-27T06:36:19.409321','Information','System','ProcessManager',5000,'Process started: Terminal (PID: 2)',NULL,'{"pid": 2, "app": "Terminal", "memory": 20, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (565,'2026-03-27T06:36:24.184312','Information','System','ProcessManager',5001,'Process terminated: Terminal (PID: 2)',NULL,'{"pid": 2, "app": "Terminal", "memory_freed": 20}',NULL);
INSERT INTO "system_events" VALUES (566,'2026-03-27T06:36:25.056371','Information','System','ProcessManager',5000,'Process started: Calendar (PID: 3)',NULL,'{"pid": 3, "app": "Calendar", "memory": 27, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (567,'2026-03-27T06:36:26.479224','Information','System','ProcessManager',5001,'Process terminated: Calendar (PID: 3)',NULL,'{"pid": 3, "app": "Calendar", "memory_freed": 27}',NULL);
INSERT INTO "system_events" VALUES (568,'2026-03-27T06:36:26.966706','Information','System','ProcessManager',5000,'Process started: Calculator (PID: 4)',NULL,'{"pid": 4, "app": "Calculator", "memory": 27, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (569,'2026-03-27T06:36:42.591613','Information','System','ProcessManager',5001,'Process terminated: Calculator (PID: 4)',NULL,'{"pid": 4, "app": "Calculator", "memory_freed": 27}',NULL);
INSERT INTO "system_events" VALUES (570,'2026-03-27T06:41:23.684091','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (571,'2026-03-27T06:42:48.153216','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (572,'2026-03-27T06:48:42.149593','Information','Security','Authentication',3000,'User logged in: user','user','{"role": "user", "home_dir": "/home/user"}',NULL);
INSERT INTO "system_events" VALUES (573,'2026-03-27T06:48:45.021515','Information','System','ProcessManager',5000,'Process started: Tips & Getting Started (PID: 1)',NULL,'{"pid": 1, "app": "Tips & Getting Started", "memory": 18, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (574,'2026-03-27T06:48:48.429649','Information','System','ProcessManager',5001,'Process terminated: Tips & Getting Started (PID: 1)',NULL,'{"pid": 1, "app": "Tips & Getting Started", "memory_freed": 18}',NULL);
INSERT INTO "system_events" VALUES (575,'2026-03-27T06:48:49.551352','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 2)',NULL,'{"pid": 2, "app": "Web Browser", "memory": 22, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (576,'2026-03-27T06:49:16.482110','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 3)',NULL,'{"pid": 3, "app": "Web Browser", "memory": 19, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (577,'2026-03-27T06:49:19.158688','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 3)',NULL,'{"pid": 3, "app": "Web Browser", "memory_freed": 19}',NULL);
INSERT INTO "system_events" VALUES (578,'2026-03-27T06:49:20.502394','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 2)',NULL,'{"pid": 2, "app": "Web Browser", "memory_freed": 22}',NULL);
INSERT INTO "system_events" VALUES (579,'2026-03-27T06:49:21.987860','Information','System','ProcessManager',5000,'Process started: Tips & Getting Started (PID: 4)',NULL,'{"pid": 4, "app": "Tips & Getting Started", "memory": 12, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (580,'2026-03-27T06:49:27.704538','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 5)',NULL,'{"pid": 5, "app": "Web Browser", "memory": 16, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (581,'2026-03-27T06:49:29.177855','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 6)',NULL,'{"pid": 6, "app": "Web Browser", "memory": 12, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (582,'2026-03-27T06:49:33.425049','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 5)',NULL,'{"pid": 5, "app": "Web Browser", "memory_freed": 16}',NULL);
INSERT INTO "system_events" VALUES (583,'2026-03-27T06:49:34.391702','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 6)',NULL,'{"pid": 6, "app": "Web Browser", "memory_freed": 12}',NULL);
INSERT INTO "system_events" VALUES (584,'2026-03-27T06:49:36.558653','Information','System','ProcessManager',5001,'Process terminated: Tips & Getting Started (PID: 4)',NULL,'{"pid": 4, "app": "Tips & Getting Started", "memory_freed": 12}',NULL);
INSERT INTO "system_events" VALUES (585,'2026-03-28T00:02:06.390499','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (586,'2026-03-28T00:35:56.263580','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (587,'2026-03-28T00:36:18.872823','Warning','Security','Authentication',3001,'Failed login attempt for user: user','user','{"reason": "Invalid credentials"}',NULL);
INSERT INTO "system_events" VALUES (588,'2026-03-28T00:36:21.585054','Information','Security','Authentication',3000,'User logged in: user','user','{"role": "user", "home_dir": "/home/user"}',NULL);
INSERT INTO "system_events" VALUES (589,'2026-03-28T00:37:32.277865','Information','System','ProcessManager',5000,'Process started: Camera (PID: 1)',NULL,'{"pid": 1, "app": "Camera", "memory": 24, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (590,'2026-03-28T00:37:39.392243','Information','System','ProcessManager',5001,'Process terminated: Camera (PID: 1)',NULL,'{"pid": 1, "app": "Camera", "memory_freed": 24}',NULL);
INSERT INTO "system_events" VALUES (591,'2026-03-28T00:37:43.400126','Information','System','ProcessManager',5000,'Process started: Terminal (PID: 2)',NULL,'{"pid": 2, "app": "Terminal", "memory": 17, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (592,'2026-03-28T00:37:45.818362','Information','System','ProcessManager',5001,'Process terminated: Terminal (PID: 2)',NULL,'{"pid": 2, "app": "Terminal", "memory_freed": 17}',NULL);
INSERT INTO "system_events" VALUES (593,'2026-03-28T00:37:55.403508','Information','System','ProcessManager',5000,'Process started: Camera (PID: 3)',NULL,'{"pid": 3, "app": "Camera", "memory": 27, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (594,'2026-03-28T00:38:04.031437','Information','System','ProcessManager',5001,'Process terminated: Camera (PID: 3)',NULL,'{"pid": 3, "app": "Camera", "memory_freed": 27}',NULL);
INSERT INTO "system_events" VALUES (595,'2026-03-28T00:38:06.368210','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 4)',NULL,'{"pid": 4, "app": "File Explorer", "memory": 9, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (596,'2026-03-28T00:38:59.174845','Information','System','ProcessManager',5001,'Process terminated: File Explorer (PID: 4)',NULL,'{"pid": 4, "app": "File Explorer", "memory_freed": 9}',NULL);
INSERT INTO "system_events" VALUES (597,'2026-03-28T00:39:04.492407','Information','System','ProcessManager',5000,'Process started: Settings (PID: 5)',NULL,'{"pid": 5, "app": "Settings", "memory": 14, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (598,'2026-03-28T00:42:02.018288','Information','System','ProcessManager',5001,'Process terminated: Settings (PID: 5)',NULL,'{"pid": 5, "app": "Settings", "memory_freed": 14}',NULL);
INSERT INTO "system_events" VALUES (599,'2026-03-28T01:04:39.286054','Information','Security','Authentication',3000,'User logged in: user','user','{"role": "user", "home_dir": "/home/user"}',NULL);
INSERT INTO "system_events" VALUES (600,'2026-03-28T01:04:49.427277','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 6)',NULL,'{"pid": 6, "app": "Web Browser", "memory": 22, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (601,'2026-03-28T01:05:11.953445','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 6)',NULL,'{"pid": 6, "app": "Web Browser", "memory_freed": 22}',NULL);
INSERT INTO "system_events" VALUES (602,'2026-03-28T01:05:13.686700','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 7)',NULL,'{"pid": 7, "app": "System Monitor", "memory": 23, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (603,'2026-03-28T01:05:31.327929','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 8)',NULL,'{"pid": 8, "app": "Web Browser", "memory": 20, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (604,'2026-03-28T01:05:42.476673','Information','System','ProcessManager',5000,'Process started: Camera (PID: 9)',NULL,'{"pid": 9, "app": "Camera", "memory": 11, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (605,'2026-03-28T01:05:43.055558','Information','System','ProcessManager',5000,'Process started: Calculator (PID: 10)',NULL,'{"pid": 10, "app": "Calculator", "memory": 27, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (606,'2026-03-28T01:05:43.702179','Information','System','ProcessManager',5000,'Process started: Calendar (PID: 11)',NULL,'{"pid": 11, "app": "Calendar", "memory": 21, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (607,'2026-03-28T01:05:44.325135','Information','System','ProcessManager',5000,'Process started: Clock (PID: 12)',NULL,'{"pid": 12, "app": "Clock", "memory": 12, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (608,'2026-03-28T01:05:46.866333','Information','System','ProcessManager',5000,'Process started: Notes (PID: 13)',NULL,'{"pid": 13, "app": "Notes", "memory": 11, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (609,'2026-03-28T01:06:10.214907','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 14)',NULL,'{"pid": 14, "app": "File Explorer", "memory": 13, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (610,'2026-03-28T01:06:13.047875','Information','System','ProcessManager',5001,'Process terminated: Clock (PID: 12)',NULL,'{"pid": 12, "app": "Clock", "memory_freed": 12}',NULL);
INSERT INTO "system_events" VALUES (611,'2026-03-28T01:06:13.864905','Information','System','ProcessManager',5001,'Process terminated: Calendar (PID: 11)',NULL,'{"pid": 11, "app": "Calendar", "memory_freed": 21}',NULL);
INSERT INTO "system_events" VALUES (612,'2026-03-28T01:06:14.471672','Information','System','ProcessManager',5001,'Process terminated: Calculator (PID: 10)',NULL,'{"pid": 10, "app": "Calculator", "memory_freed": 27}',NULL);
INSERT INTO "system_events" VALUES (613,'2026-03-28T01:06:40.591525','Information','System','ProcessManager',5000,'Process started: Terminal (PID: 15)',NULL,'{"pid": 15, "app": "Terminal", "memory": 27, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (614,'2026-03-28T01:06:58.921893','Information','System','ProcessManager',5001,'Process terminated: Terminal (PID: 15)',NULL,'{"pid": 15, "app": "Terminal", "memory_freed": 27}',NULL);
INSERT INTO "system_events" VALUES (615,'2026-03-28T01:07:16.836212','Information','System','ProcessManager',5001,'Process terminated: Notes (PID: 13)',NULL,'{"pid": 13, "app": "Notes", "memory_freed": 11}',NULL);
INSERT INTO "system_events" VALUES (616,'2026-03-28T01:07:35.690553','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 16)',NULL,'{"pid": 16, "app": "File Explorer", "memory": 14, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (617,'2026-03-28T01:07:47.920473','Information','System','ProcessManager',5001,'Process terminated: File Explorer (PID: 16)',NULL,'{"pid": 16, "app": "File Explorer", "memory_freed": 14}',NULL);
INSERT INTO "system_events" VALUES (618,'2026-03-28T01:07:52.844236','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 17)',NULL,'{"pid": 17, "app": "File Explorer", "memory": 8, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (619,'2026-03-28T01:08:20.041670','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 18)',NULL,'{"pid": 18, "app": "System Monitor", "memory": 14, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (620,'2026-03-28T01:08:31.822955','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 19)',NULL,'{"pid": 19, "app": "File Explorer", "memory": 12, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (621,'2026-03-28T01:09:00.478408','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 7)',NULL,'{"pid": 7, "app": "System Monitor", "memory_freed": 23}',NULL);
INSERT INTO "system_events" VALUES (622,'2026-03-28T01:09:04.886869','Information','System','ProcessManager',5001,'Process terminated: File Explorer (PID: 19)',NULL,'{"pid": 19, "app": "File Explorer", "memory_freed": 12}',NULL);
INSERT INTO "system_events" VALUES (623,'2026-03-28T01:09:33.612006','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 18)',NULL,'{"pid": 18, "app": "System Monitor", "memory_freed": 14}',NULL);
INSERT INTO "system_events" VALUES (624,'2026-03-28T01:09:34.823610','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 8)',NULL,'{"pid": 8, "app": "Web Browser", "memory_freed": 20}',NULL);
INSERT INTO "system_events" VALUES (625,'2026-03-28T01:11:15.529372','Information','System','SystemHealth',5001,'Cleaned up 5 orphaned processes',NULL,'{"pids": [1, 2, 3, 4, 5]}',NULL);
INSERT INTO "system_events" VALUES (626,'2026-03-28T01:12:53.577097','Information','Security','Authentication',3000,'User logged in: admin','admin','{"role": "admin", "home_dir": "/home/admin"}',NULL);
INSERT INTO "system_events" VALUES (627,'2026-03-28T01:12:59.444794','Information','System','ProcessManager',5000,'Process started: Terminal (PID: 20)',NULL,'{"pid": 20, "app": "Terminal", "memory": 13, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (628,'2026-03-28T01:13:01.909282','Information','System','ProcessManager',5001,'Process terminated: Terminal (PID: 20)',NULL,'{"pid": 20, "app": "Terminal", "memory_freed": 13}',NULL);
INSERT INTO "system_events" VALUES (629,'2026-03-28T01:13:07.816506','Information','System','ProcessManager',5000,'Process started: Tips & Getting Started (PID: 21)',NULL,'{"pid": 21, "app": "Tips & Getting Started", "memory": 27, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (630,'2026-03-28T01:13:15.906408','Information','System','ProcessManager',5000,'Process started: Clock (PID: 22)',NULL,'{"pid": 22, "app": "Clock", "memory": 26, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (631,'2026-03-28T01:13:29.739339','Information','System','ProcessManager',5001,'Process terminated: Clock (PID: 22)',NULL,'{"pid": 22, "app": "Clock", "memory_freed": 26}',NULL);
INSERT INTO "system_events" VALUES (632,'2026-03-28T01:13:31.437083','Information','System','ProcessManager',5001,'Process terminated: Tips & Getting Started (PID: 21)',NULL,'{"pid": 21, "app": "Tips & Getting Started", "memory_freed": 27}',NULL);
INSERT INTO "system_events" VALUES (633,'2026-03-28T01:13:40.715894','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 23)',NULL,'{"pid": 23, "app": "System Monitor", "memory": 10, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (634,'2026-03-28T01:13:56.823429','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 23)',NULL,'{"pid": 23, "app": "System Monitor", "memory_freed": 10}',NULL);
INSERT INTO "system_events" VALUES (635,'2026-03-28T01:13:58.065171','Information','System','ProcessManager',5000,'Process started: App Store (PID: 24)',NULL,'{"pid": 24, "app": "App Store", "memory": 22, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (636,'2026-03-28T01:14:05.318323','Information','System','ProcessManager',5001,'Process terminated: App Store (PID: 24)',NULL,'{"pid": 24, "app": "App Store", "memory_freed": 22}',NULL);
INSERT INTO "system_events" VALUES (637,'2026-03-28T01:48:12.336533','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (638,'2026-03-28T01:48:47.059558','Information','Security','Authentication',3000,'User logged in: user','user','{"role": "user", "home_dir": "/home/user"}',NULL);
INSERT INTO "system_events" VALUES (639,'2026-03-28T01:48:54.373095','Information','System','ProcessManager',5000,'Process started: Web Browser (PID: 1)',NULL,'{"pid": 1, "app": "Web Browser", "memory": 26, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (640,'2026-03-28T01:49:27.192966','Information','System','ProcessManager',5001,'Process terminated: Web Browser (PID: 1)',NULL,'{"pid": 1, "app": "Web Browser", "memory_freed": 26}',NULL);
INSERT INTO "system_events" VALUES (641,'2026-03-28T01:49:30.747967','Information','System','ProcessManager',5000,'Process started: Terminal (PID: 2)',NULL,'{"pid": 2, "app": "Terminal", "memory": 9, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (642,'2026-03-28T01:49:32.741306','Information','System','ProcessManager',5001,'Process terminated: Terminal (PID: 2)',NULL,'{"pid": 2, "app": "Terminal", "memory_freed": 9}',NULL);
INSERT INTO "system_events" VALUES (643,'2026-03-28T01:49:35.028625','Information','System','ProcessManager',5000,'Process started: Terminal (PID: 3)',NULL,'{"pid": 3, "app": "Terminal", "memory": 10, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (644,'2026-03-28T01:50:14.919412','Information','System','ProcessManager',5001,'Process terminated: Terminal (PID: 3)',NULL,'{"pid": 3, "app": "Terminal", "memory_freed": 10}',NULL);
INSERT INTO "system_events" VALUES (645,'2026-04-01T12:49:27.169306','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (646,'2026-04-01T12:49:47.592272','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 1)',NULL,'{"pid": 1, "app": "System Monitor", "memory": 8, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (647,'2026-04-01T12:49:59.914442','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 2)',NULL,'{"pid": 2, "app": "File Explorer", "memory": 15, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (648,'2026-04-01T12:50:17.754853','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 1)',NULL,'{"pid": 1, "app": "System Monitor", "memory_freed": 8}',NULL);
INSERT INTO "system_events" VALUES (649,'2026-04-01T12:50:21.875993','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 3)',NULL,'{"pid": 3, "app": "System Monitor", "memory": 13, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (650,'2026-04-01T12:51:20.575977','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (651,'2026-04-01T12:51:22.870670','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (652,'2026-04-01T12:51:24.460614','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 1)',NULL,'{"pid": 1, "app": "System Monitor", "memory": 22, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (653,'2026-04-01T12:51:44.644216','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 1)',NULL,'{"pid": 1, "app": "System Monitor", "memory_freed": 22}',NULL);
INSERT INTO "system_events" VALUES (654,'2026-04-01T12:51:47.876771','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 2)',NULL,'{"pid": 2, "app": "System Monitor", "memory": 18, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (655,'2026-04-01T12:51:50.486499','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 2)',NULL,'{"pid": 2, "app": "System Monitor", "memory_freed": 18}',NULL);
INSERT INTO "system_events" VALUES (656,'2026-04-01T13:04:18.814657','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 3)',NULL,'{"pid": 3, "app": "System Monitor", "memory": 27, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (657,'2026-04-01T13:14:20.165628','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 4)',NULL,'{"pid": 4, "app": "System Monitor", "memory": 11, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (658,'2026-04-01T13:23:36.430511','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 4)',NULL,'{"pid": 4, "app": "System Monitor", "memory_freed": 11}',NULL);
INSERT INTO "system_events" VALUES (659,'2026-04-01T13:25:34.565133','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 5)',NULL,'{"pid": 5, "app": "System Monitor", "memory": 11, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (660,'2026-04-01T13:25:39.093642','Information','System','SystemHealth',5001,'Cleaned up 2 orphaned processes',NULL,'{"pids": [1, 2]}',NULL);
INSERT INTO "system_events" VALUES (661,'2026-04-01T13:26:15.214367','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 6)',NULL,'{"pid": 6, "app": "File Explorer", "memory": 23, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (662,'2026-04-01T13:28:28.826818','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 7)',NULL,'{"pid": 7, "app": "File Explorer", "memory": 10, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (663,'2026-04-01T13:29:38.579851','Information','System','ProcessManager',5001,'Process terminated: File Explorer (PID: 7)',NULL,'{"pid": 7, "app": "File Explorer", "memory_freed": 10}',NULL);
INSERT INTO "system_events" VALUES (664,'2026-04-01T13:29:40.468950','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 8)',NULL,'{"pid": 8, "app": "System Monitor", "memory": 13, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (665,'2026-04-01T13:29:45.346197','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 9)',NULL,'{"pid": 9, "app": "File Explorer", "memory": 9, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (666,'2026-04-01T13:29:48.937979','Information','System','ProcessManager',5000,'Process started: Notes (PID: 10)',NULL,'{"pid": 10, "app": "Notes", "memory": 17, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (667,'2026-04-01T13:41:48.244685','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 8)',NULL,'{"pid": 8, "app": "System Monitor", "memory_freed": 13}',NULL);
INSERT INTO "system_events" VALUES (668,'2026-04-01T13:41:50.236700','Information','System','ProcessManager',5001,'Process terminated: Notes (PID: 10)',NULL,'{"pid": 10, "app": "Notes", "memory_freed": 17}',NULL);
INSERT INTO "system_events" VALUES (669,'2026-04-01T13:41:52.665778','Information','System','ProcessManager',5001,'Process terminated: File Explorer (PID: 9)',NULL,'{"pid": 9, "app": "File Explorer", "memory_freed": 9}',NULL);
INSERT INTO "system_events" VALUES (670,'2026-04-01T13:41:53.542097','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 11)',NULL,'{"pid": 11, "app": "System Monitor", "memory": 25, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (671,'2026-04-01T13:43:18.244514','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 3)',NULL,'{"pid": 3, "app": "System Monitor", "memory_freed": 27}',NULL);
INSERT INTO "system_events" VALUES (672,'2026-04-01T13:43:19.464054','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 5)',NULL,'{"pid": 5, "app": "System Monitor", "memory_freed": 11}',NULL);
INSERT INTO "system_events" VALUES (673,'2026-04-01T13:43:22.786971','Information','System','ProcessManager',5001,'Process terminated: File Explorer (PID: 6)',NULL,'{"pid": 6, "app": "File Explorer", "memory_freed": 23}',NULL);
INSERT INTO "system_events" VALUES (674,'2026-04-01T13:45:45.482794','Information','System','ProcessManager',5000,'Process started: Terminal (PID: 12)',NULL,'{"pid": 12, "app": "Terminal", "memory": 19, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (675,'2026-04-01T13:45:48.475514','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 13)',NULL,'{"pid": 13, "app": "System Monitor", "memory": 14, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (676,'2026-04-01T13:45:54.459200','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 11)',NULL,'{"pid": 11, "app": "System Monitor", "memory_freed": 25}',NULL);
INSERT INTO "system_events" VALUES (677,'2026-04-01T13:46:01.649750','Information','System','ProcessManager',5001,'Process terminated: Terminal (PID: 12)',NULL,'{"pid": 12, "app": "Terminal", "memory_freed": 19}',NULL);
INSERT INTO "system_events" VALUES (678,'2026-04-01T13:46:17.415179','Information','System','SystemHealth',5001,'Cleaned up 2 orphaned processes',NULL,'{"pids": [3, 4]}',NULL);
INSERT INTO "system_events" VALUES (679,'2026-04-01T13:46:30.263735','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 13)',NULL,'{"pid": 13, "app": "System Monitor", "memory_freed": 14}',NULL);
INSERT INTO "system_events" VALUES (680,'2026-04-09T00:36:15.717371','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (681,'2026-04-09T00:36:33.197618','Information','System','ProcessManager',5000,'Process started: Armoury Crate (PID: 1)',NULL,'{"pid": 1, "app": "Armoury Crate", "memory": 9, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (682,'2026-04-09T00:37:20.212796','Information','System','ProcessManager',5001,'Process terminated: Armoury Crate (PID: 1)',NULL,'{"pid": 1, "app": "Armoury Crate", "memory_freed": 9}',NULL);
INSERT INTO "system_events" VALUES (683,'2026-04-09T00:37:21.829100','Information','System','ProcessManager',5000,'Process started: Terminal (PID: 2)',NULL,'{"pid": 2, "app": "Terminal", "memory": 8, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (684,'2026-04-09T00:37:23.295313','Information','System','ProcessManager',5001,'Process terminated: Terminal (PID: 2)',NULL,'{"pid": 2, "app": "Terminal", "memory_freed": 8}',NULL);
INSERT INTO "system_events" VALUES (685,'2026-04-09T00:37:23.829182','Information','System','ProcessManager',5000,'Process started: Tips & Getting Started (PID: 3)',NULL,'{"pid": 3, "app": "Tips & Getting Started", "memory": 24, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (686,'2026-04-09T00:37:25.149951','Information','System','ProcessManager',5001,'Process terminated: Tips & Getting Started (PID: 3)',NULL,'{"pid": 3, "app": "Tips & Getting Started", "memory_freed": 24}',NULL);
INSERT INTO "system_events" VALUES (687,'2026-04-09T00:37:36.194676','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 4)',NULL,'{"pid": 4, "app": "System Monitor", "memory": 22, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (688,'2026-04-09T00:37:55.257815','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 4)',NULL,'{"pid": 4, "app": "System Monitor", "memory_freed": 22}',NULL);
INSERT INTO "system_events" VALUES (689,'2026-04-09T00:37:57.333814','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 5)',NULL,'{"pid": 5, "app": "File Explorer", "memory": 21, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (690,'2026-04-09T00:38:27.195933','Information','System','ProcessManager',5001,'Process terminated: File Explorer (PID: 5)',NULL,'{"pid": 5, "app": "File Explorer", "memory_freed": 21}',NULL);
INSERT INTO "system_events" VALUES (691,'2026-04-11T07:17:51.477349','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (692,'2026-04-11T07:18:27.097152','Information','Security','Authentication',3000,'User logged in: admin','admin','{"role": "admin", "home_dir": "/home/admin"}',NULL);
INSERT INTO "system_events" VALUES (693,'2026-04-11T07:18:30.010095','Information','System','ProcessManager',5000,'Process started: Armoury Crate (PID: 1)',NULL,'{"pid": 1, "app": "Armoury Crate", "memory": 18, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (694,'2026-04-11T07:18:57.291627','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 2)',NULL,'{"pid": 2, "app": "System Monitor", "memory": 24, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (695,'2026-04-11T07:19:03.272157','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 2)',NULL,'{"pid": 2, "app": "System Monitor", "memory_freed": 24}',NULL);
INSERT INTO "system_events" VALUES (696,'2026-04-11T07:20:11.588760','Information','System','ProcessManager',5001,'Process terminated: Armoury Crate (PID: 1)',NULL,'{"pid": 1, "app": "Armoury Crate", "memory_freed": 18}',NULL);
INSERT INTO "system_events" VALUES (697,'2026-04-14T00:26:42.857459','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (698,'2026-04-14T00:27:34.390008','Information','Security','Authentication',3000,'User logged in: user','user','{"role": "user", "home_dir": "/home/user"}',NULL);
INSERT INTO "system_events" VALUES (699,'2026-04-14T00:27:39.653995','Information','System','ProcessManager',5000,'Process started: Camera (PID: 1)',NULL,'{"pid": 1, "app": "Camera", "memory": 24, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (700,'2026-04-14T00:27:44.902620','Information','System','ProcessManager',5001,'Process terminated: Camera (PID: 1)',NULL,'{"pid": 1, "app": "Camera", "memory_freed": 24}',NULL);
INSERT INTO "system_events" VALUES (701,'2026-04-14T00:27:46.642628','Information','System','ProcessManager',5000,'Process started: Clock (PID: 2)',NULL,'{"pid": 2, "app": "Clock", "memory": 21, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (702,'2026-04-14T00:27:53.743654','Information','System','ProcessManager',5001,'Process terminated: Clock (PID: 2)',NULL,'{"pid": 2, "app": "Clock", "memory_freed": 21}',NULL);
INSERT INTO "system_events" VALUES (703,'2026-04-14T00:27:55.629945','Information','System','ProcessManager',5000,'Process started: Settings (PID: 3)',NULL,'{"pid": 3, "app": "Settings", "memory": 20, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (704,'2026-04-14T00:28:03.190206','Information','System','ProcessManager',5001,'Process terminated: Settings (PID: 3)',NULL,'{"pid": 3, "app": "Settings", "memory_freed": 20}',NULL);
INSERT INTO "system_events" VALUES (705,'2026-04-14T00:28:04.446320','Information','System','ProcessManager',5000,'Process started: Armoury Crate (PID: 4)',NULL,'{"pid": 4, "app": "Armoury Crate", "memory": 13, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (706,'2026-04-14T00:29:52.395041','Information','System','ProcessManager',5001,'Process terminated: Armoury Crate (PID: 4)',NULL,'{"pid": 4, "app": "Armoury Crate", "memory_freed": 13}',NULL);
INSERT INTO "system_events" VALUES (707,'2026-04-14T00:33:59.370315','Information','System','ProcessManager',5000,'Process started: Settings (PID: 5)',NULL,'{"pid": 5, "app": "Settings", "memory": 8, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (708,'2026-04-14T00:34:12.948433','Information','System','ProcessManager',5001,'Process terminated: Settings (PID: 5)',NULL,'{"pid": 5, "app": "Settings", "memory_freed": 8}',NULL);
INSERT INTO "system_events" VALUES (709,'2026-04-14T00:34:16.536969','Information','System','ProcessManager',5000,'Process started: Settings (PID: 6)',NULL,'{"pid": 6, "app": "Settings", "memory": 17, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (710,'2026-04-14T00:34:49.790496','Information','System','ProcessManager',5001,'Process terminated: Settings (PID: 6)',NULL,'{"pid": 6, "app": "Settings", "memory_freed": 17}',NULL);
INSERT INTO "system_events" VALUES (711,'2026-04-14T00:34:55.088034','Information','System','ProcessManager',5000,'Process started: Settings (PID: 7)',NULL,'{"pid": 7, "app": "Settings", "memory": 18, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (712,'2026-04-14T00:35:02.428021','Information','System','ProcessManager',5001,'Process terminated: Settings (PID: 7)',NULL,'{"pid": 7, "app": "Settings", "memory_freed": 18}',NULL);
INSERT INTO "system_events" VALUES (713,'2026-04-14T00:35:49.506783','Information','System','ProcessManager',5000,'Process started: Settings (PID: 8)',NULL,'{"pid": 8, "app": "Settings", "memory": 24, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (714,'2026-04-14T00:36:08.773240','Information','System','ProcessManager',5001,'Process terminated: Settings (PID: 8)',NULL,'{"pid": 8, "app": "Settings", "memory_freed": 24}',NULL);
INSERT INTO "system_events" VALUES (715,'2026-04-14T00:36:10.376260','Information','System','ProcessManager',5000,'Process started: Settings (PID: 9)',NULL,'{"pid": 9, "app": "Settings", "memory": 14, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (716,'2026-04-14T00:36:16.186837','Information','System','ProcessManager',5001,'Process terminated: Settings (PID: 9)',NULL,'{"pid": 9, "app": "Settings", "memory_freed": 14}',NULL);
INSERT INTO "system_events" VALUES (717,'2026-04-14T00:36:42.960207','Warning','Security','Authentication',3001,'Failed login attempt for user: user','user','{"reason": "Invalid credentials"}',NULL);
INSERT INTO "system_events" VALUES (718,'2026-04-14T00:36:46.163124','Information','Security','Authentication',3000,'User logged in: user','user','{"role": "user", "home_dir": "/home/user"}',NULL);
INSERT INTO "system_events" VALUES (719,'2026-04-14T02:45:57.206757','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (720,'2026-04-14T02:46:14.364497','Information','System','ProcessManager',5000,'Process started: Armoury Crate (PID: 1)',NULL,'{"pid": 1, "app": "Armoury Crate", "memory": 16, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (721,'2026-04-14T02:47:24.848534','Information','System','ProcessManager',5001,'Process terminated: Armoury Crate (PID: 1)',NULL,'{"pid": 1, "app": "Armoury Crate", "memory_freed": 16}',NULL);
INSERT INTO "system_events" VALUES (722,'2026-04-14T02:47:26.201507','Information','System','ProcessManager',5000,'Process started: Settings (PID: 2)',NULL,'{"pid": 2, "app": "Settings", "memory": 14, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (723,'2026-04-14T02:47:41.303058','Information','System','ProcessManager',5001,'Process terminated: Settings (PID: 2)',NULL,'{"pid": 2, "app": "Settings", "memory_freed": 14}',NULL);
INSERT INTO "system_events" VALUES (724,'2026-04-14T02:47:55.342445','Information','System','ProcessManager',5000,'Process started: Event Viewer (PID: 3)',NULL,'{"pid": 3, "app": "Event Viewer", "memory": 21, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (725,'2026-04-14T02:48:01.560975','Information','System','ProcessManager',5001,'Process terminated: Event Viewer (PID: 3)',NULL,'{"pid": 3, "app": "Event Viewer", "memory_freed": 21}',NULL);
INSERT INTO "system_events" VALUES (726,'2026-04-14T02:48:03.267799','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 4)',NULL,'{"pid": 4, "app": "File Explorer", "memory": 14, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (727,'2026-04-14T02:48:05.788309','Information','System','ProcessManager',5001,'Process terminated: File Explorer (PID: 4)',NULL,'{"pid": 4, "app": "File Explorer", "memory_freed": 14}',NULL);
INSERT INTO "system_events" VALUES (728,'2026-04-14T02:48:06.915375','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 5)',NULL,'{"pid": 5, "app": "System Monitor", "memory": 25, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (729,'2026-04-14T02:48:12.080976','Information','System','ProcessManager',5001,'Process terminated: System Monitor (PID: 5)',NULL,'{"pid": 5, "app": "System Monitor", "memory_freed": 25}',NULL);
INSERT INTO "system_events" VALUES (730,'2026-04-14T02:48:13.237089','Information','System','ProcessManager',5000,'Process started: Armoury Crate (PID: 6)',NULL,'{"pid": 6, "app": "Armoury Crate", "memory": 22, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (731,'2026-04-14T02:48:24.393761','Information','System','ProcessManager',5001,'Process terminated: Armoury Crate (PID: 6)',NULL,'{"pid": 6, "app": "Armoury Crate", "memory_freed": 22}',NULL);
INSERT INTO "system_events" VALUES (732,'2026-04-14T02:48:28.965885','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 7)',NULL,'{"pid": 7, "app": "File Explorer", "memory": 18, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (733,'2026-04-14T02:48:33.468797','Information','System','ProcessManager',5001,'Process terminated: File Explorer (PID: 7)',NULL,'{"pid": 7, "app": "File Explorer", "memory_freed": 18}',NULL);
INSERT INTO "system_events" VALUES (734,'2026-04-14T02:48:39.026257','Information','System','ProcessManager',5000,'Process started: Settings (PID: 8)',NULL,'{"pid": 8, "app": "Settings", "memory": 18, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (735,'2026-04-14T02:48:48.281061','Information','System','ProcessManager',5001,'Process terminated: Settings (PID: 8)',NULL,'{"pid": 8, "app": "Settings", "memory_freed": 18}',NULL);
INSERT INTO "system_events" VALUES (736,'2026-04-14T02:50:54.331712','Information','System','ProcessManager',5000,'Process started: Event Viewer (PID: 9)',NULL,'{"pid": 9, "app": "Event Viewer", "memory": 27, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (737,'2026-04-14T02:50:57.108761','Information','System','ProcessManager',5001,'Process terminated: Event Viewer (PID: 9)',NULL,'{"pid": 9, "app": "Event Viewer", "memory_freed": 27}',NULL);
INSERT INTO "system_events" VALUES (738,'2026-04-14T02:51:25.270282','Information','System','ProcessManager',5000,'Process started: Clock (PID: 10)',NULL,'{"pid": 10, "app": "Clock", "memory": 26, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (739,'2026-04-14T02:51:27.505893','Information','System','ProcessManager',5001,'Process terminated: Clock (PID: 10)',NULL,'{"pid": 10, "app": "Clock", "memory_freed": 26}',NULL);
INSERT INTO "system_events" VALUES (740,'2026-04-14T02:51:30.489227','Information','System','ProcessManager',5000,'Process started: Calendar (PID: 11)',NULL,'{"pid": 11, "app": "Calendar", "memory": 22, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (741,'2026-04-14T02:51:39.805296','Information','System','ProcessManager',5001,'Process terminated: Calendar (PID: 11)',NULL,'{"pid": 11, "app": "Calendar", "memory_freed": 22}',NULL);
INSERT INTO "system_events" VALUES (742,'2026-04-14T02:54:00.211876','Information','System','ProcessManager',5000,'Process started: Calendar (PID: 12)',NULL,'{"pid": 12, "app": "Calendar", "memory": 18, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (743,'2026-04-14T02:54:11.280492','Information','System','ProcessManager',5001,'Process terminated: Calendar (PID: 12)',NULL,'{"pid": 12, "app": "Calendar", "memory_freed": 18}',NULL);
INSERT INTO "system_events" VALUES (744,'2026-04-14T02:57:37.953570','Information','System','ProcessManager',5000,'Process started: Calendar (PID: 13)',NULL,'{"pid": 13, "app": "Calendar", "memory": 23, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (745,'2026-04-14T02:57:51.393276','Information','System','ProcessManager',5001,'Process terminated: Calendar (PID: 13)',NULL,'{"pid": 13, "app": "Calendar", "memory_freed": 23}',NULL);
INSERT INTO "system_events" VALUES (746,'2026-04-17T10:47:35.308281','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (747,'2026-04-17T11:03:09.918453','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (748,'2026-04-17T20:46:41.917828','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (749,'2026-04-17T20:47:24.669507','Information','Security','Authentication',3000,'User logged in: admin','admin','{"role": "admin", "home_dir": "/home/admin"}',NULL);
INSERT INTO "system_events" VALUES (750,'2026-04-17T20:47:30.380009','Information','System','ProcessManager',5000,'Process started: Calendar (PID: 1)',NULL,'{"pid": 1, "app": "Calendar", "memory": 15, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (751,'2026-04-17T20:47:35.505416','Information','System','ProcessManager',5001,'Process terminated: Calendar (PID: 1)',NULL,'{"pid": 1, "app": "Calendar", "memory_freed": 15}',NULL);
INSERT INTO "system_events" VALUES (752,'2026-04-17T20:47:50.798930','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (753,'2026-04-17T20:47:55.217098','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (754,'2026-04-17T20:48:02.834270','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (755,'2026-04-17T20:48:36.131036','Information','Security','Authentication',3000,'User logged in: admin','admin','{"role": "admin", "home_dir": "/home/admin"}',NULL);
INSERT INTO "system_events" VALUES (756,'2026-04-17T20:48:41.266450','Information','System','ProcessManager',5000,'Process started: Calendar (PID: 1)',NULL,'{"pid": 1, "app": "Calendar", "memory": 23, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (757,'2026-04-17T20:48:44.046761','Information','System','ProcessManager',5001,'Process terminated: Calendar (PID: 1)',NULL,'{"pid": 1, "app": "Calendar", "memory_freed": 23}',NULL);
INSERT INTO "system_events" VALUES (758,'2026-04-17T20:49:47.084686','Information','System','ProcessManager',5000,'Process started: Clock (PID: 2)',NULL,'{"pid": 2, "app": "Clock", "memory": 20, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (759,'2026-04-17T20:49:48.881084','Information','System','ProcessManager',5001,'Process terminated: Clock (PID: 2)',NULL,'{"pid": 2, "app": "Clock", "memory_freed": 20}',NULL);
INSERT INTO "system_events" VALUES (760,'2026-04-17T20:49:51.534710','Information','System','ProcessManager',5000,'Process started: Local Files (PID: 3)',NULL,'{"pid": 3, "app": "Local Files", "memory": 8, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (761,'2026-04-17T20:49:53.318045','Information','System','ProcessManager',5001,'Process terminated: Local Files (PID: 3)',NULL,'{"pid": 3, "app": "Local Files", "memory_freed": 8}',NULL);
INSERT INTO "system_events" VALUES (762,'2026-04-17T20:50:05.916518','Information','System','ProcessManager',5000,'Process started: Clock (PID: 4)',NULL,'{"pid": 4, "app": "Clock", "memory": 22, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (763,'2026-04-17T20:50:09.845682','Information','System','ProcessManager',5001,'Process terminated: Clock (PID: 4)',NULL,'{"pid": 4, "app": "Clock", "memory_freed": 22}',NULL);
INSERT INTO "system_events" VALUES (764,'2026-04-17T20:50:11.307477','Information','System','ProcessManager',5000,'Process started: Calendar (PID: 5)',NULL,'{"pid": 5, "app": "Calendar", "memory": 15, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (765,'2026-04-17T20:50:16.743980','Information','System','ProcessManager',5001,'Process terminated: Calendar (PID: 5)',NULL,'{"pid": 5, "app": "Calendar", "memory_freed": 15}',NULL);
INSERT INTO "system_events" VALUES (766,'2026-04-17T20:50:41.082463','Information','System','ProcessManager',5000,'Process started: Solitaire (PID: 6)',NULL,'{"pid": 6, "app": "Solitaire", "memory": 21, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (767,'2026-04-17T20:51:55.266981','Information','System','ProcessManager',5001,'Process terminated: Solitaire (PID: 6)',NULL,'{"pid": 6, "app": "Solitaire", "memory_freed": 21}',NULL);
INSERT INTO "system_events" VALUES (768,'2026-04-17T20:52:01.735430','Information','System','ProcessManager',5000,'Process started: Armoury Crate (PID: 7)',NULL,'{"pid": 7, "app": "Armoury Crate", "memory": 24, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (769,'2026-04-17T20:52:08.295628','Information','System','ProcessManager',5001,'Process terminated: Armoury Crate (PID: 7)',NULL,'{"pid": 7, "app": "Armoury Crate", "memory_freed": 24}',NULL);
INSERT INTO "system_events" VALUES (770,'2026-04-17T20:52:11.277038','Information','System','ProcessManager',5000,'Process started: Settings (PID: 8)',NULL,'{"pid": 8, "app": "Settings", "memory": 26, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (771,'2026-04-17T20:52:20.979108','Information','System','ProcessManager',5001,'Process terminated: Settings (PID: 8)',NULL,'{"pid": 8, "app": "Settings", "memory_freed": 26}',NULL);
INSERT INTO "system_events" VALUES (772,'2026-04-18T00:24:44.335929','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (773,'2026-04-18T00:24:57.637959','Warning','Security','Authentication',3001,'Failed login attempt for user: admin','admin','{"reason": "Invalid credentials"}',NULL);
INSERT INTO "system_events" VALUES (774,'2026-04-18T00:25:00.890949','Warning','Security','Authentication',3001,'Failed login attempt for user: admin','admin','{"reason": "Invalid credentials"}',NULL);
INSERT INTO "system_events" VALUES (775,'2026-04-18T00:25:12.012893','Warning','Security','Authentication',3001,'Failed login attempt for user: user','user','{"reason": "Invalid credentials"}',NULL);
INSERT INTO "system_events" VALUES (776,'2026-04-18T00:27:00.071686','Information','Security','Authentication',3000,'User logged in: admin','admin','{"role": "admin", "home_dir": "/home/admin"}',NULL);
INSERT INTO "system_events" VALUES (777,'2026-04-18T00:27:10.922757','Information','System','ProcessManager',5000,'Process started: Solitaire (PID: 1)',NULL,'{"pid": 1, "app": "Solitaire", "memory": 21, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (778,'2026-04-18T00:43:26.914680','Information','System','ProcessManager',5001,'Process terminated: Solitaire (PID: 1)',NULL,'{"pid": 1, "app": "Solitaire", "memory_freed": 21}',NULL);
INSERT INTO "system_events" VALUES (779,'2026-04-18T00:43:28.645820','Information','System','ProcessManager',5000,'Process started: Minesweeper (PID: 2)',NULL,'{"pid": 2, "app": "Minesweeper", "memory": 13, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (780,'2026-04-18T00:48:46.885646','Information','System','ProcessManager',5001,'Process terminated: Minesweeper (PID: 2)',NULL,'{"pid": 2, "app": "Minesweeper", "memory_freed": 13}',NULL);
INSERT INTO "system_events" VALUES (781,'2026-04-18T00:49:13.542364','Information','System','ProcessManager',5000,'Process started: System Diagnostics (PID: 3)',NULL,'{"pid": 3, "app": "System Diagnostics", "memory": 14, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (782,'2026-04-18T00:49:24.237179','Information','System','ProcessManager',5001,'Process terminated: System Diagnostics (PID: 3)',NULL,'{"pid": 3, "app": "System Diagnostics", "memory_freed": 14}',NULL);
INSERT INTO "system_events" VALUES (783,'2026-04-18T00:49:36.810017','Information','System','ProcessManager',5000,'Process started: Settings (PID: 4)',NULL,'{"pid": 4, "app": "Settings", "memory": 21, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (784,'2026-04-18T00:49:42.924299','Information','System','ProcessManager',5001,'Process terminated: Settings (PID: 4)',NULL,'{"pid": 4, "app": "Settings", "memory_freed": 21}',NULL);
INSERT INTO "system_events" VALUES (785,'2026-04-18T00:49:45.248110','Information','System','ProcessManager',5000,'Process started: App Store (PID: 5)',NULL,'{"pid": 5, "app": "App Store", "memory": 19, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (786,'2026-04-18T00:49:52.524979','Information','System','ProcessManager',5001,'Process terminated: App Store (PID: 5)',NULL,'{"pid": 5, "app": "App Store", "memory_freed": 19}',NULL);
INSERT INTO "system_events" VALUES (787,'2026-04-18T00:50:14.325110','Information','System','ProcessManager',5000,'Process started: Settings (PID: 6)',NULL,'{"pid": 6, "app": "Settings", "memory": 23, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (788,'2026-04-18T00:50:17.037185','Information','System','ProcessManager',5001,'Process terminated: Settings (PID: 6)',NULL,'{"pid": 6, "app": "Settings", "memory_freed": 23}',NULL);
INSERT INTO "system_events" VALUES (789,'2026-04-18T00:50:18.753543','Information','System','ProcessManager',5000,'Process started: Settings (PID: 7)',NULL,'{"pid": 7, "app": "Settings", "memory": 11, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (790,'2026-04-18T00:50:21.391746','Information','System','ProcessManager',5001,'Process terminated: Settings (PID: 7)',NULL,'{"pid": 7, "app": "Settings", "memory_freed": 11}',NULL);
INSERT INTO "system_events" VALUES (791,'2026-04-18T00:50:23.313585','Information','System','ProcessManager',5000,'Process started: Terminal (PID: 8)',NULL,'{"pid": 8, "app": "Terminal", "memory": 14, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (792,'2026-04-18T00:50:33.582989','Information','System','ProcessManager',5001,'Process terminated: Terminal (PID: 8)',NULL,'{"pid": 8, "app": "Terminal", "memory_freed": 14}',NULL);
INSERT INTO "system_events" VALUES (793,'2026-04-18T00:51:46.558994','Information','System','ProcessManager',5000,'Process started: Solitaire (PID: 9)',NULL,'{"pid": 9, "app": "Solitaire", "memory": 22, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (794,'2026-04-18T00:51:52.085667','Information','System','ProcessManager',5001,'Process terminated: Solitaire (PID: 9)',NULL,'{"pid": 9, "app": "Solitaire", "memory_freed": 22}',NULL);
INSERT INTO "system_events" VALUES (795,'2026-04-18T01:25:53.277165','Information','System','Kernel',1000,'JezOS Kernel started successfully',NULL,'{"version": "1.0.0"}',NULL);
INSERT INTO "system_events" VALUES (796,'2026-04-18T01:27:15.509479','Information','System','ProcessManager',5000,'Process started: Clock (PID: 1)',NULL,'{"pid": 1, "app": "Clock", "memory": 26, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (797,'2026-04-18T01:27:38.917129','Information','System','ProcessManager',5001,'Process terminated: Clock (PID: 1)',NULL,'{"pid": 1, "app": "Clock", "memory_freed": 26}',NULL);
INSERT INTO "system_events" VALUES (798,'2026-04-18T01:28:29.106834','Information','Security','Authentication',3000,'User logged in: admin','admin','{"role": "admin", "home_dir": "/home/admin"}',NULL);
INSERT INTO "system_events" VALUES (799,'2026-04-18T01:28:32.834069','Information','System','ProcessManager',5000,'Process started: Calendar (PID: 2)',NULL,'{"pid": 2, "app": "Calendar", "memory": 9, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (800,'2026-04-18T01:28:34.396546','Information','System','ProcessManager',5000,'Process started: Tips & Getting Started (PID: 3)',NULL,'{"pid": 3, "app": "Tips & Getting Started", "memory": 22, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (801,'2026-04-18T01:28:43.657478','Information','System','ProcessManager',5001,'Process terminated: Tips & Getting Started (PID: 3)',NULL,'{"pid": 3, "app": "Tips & Getting Started", "memory_freed": 22}',NULL);
INSERT INTO "system_events" VALUES (802,'2026-04-18T01:29:08.723926','Information','System','ProcessManager',5001,'Process terminated: Calendar (PID: 2)',NULL,'{"pid": 2, "app": "Calendar", "memory_freed": 9}',NULL);
INSERT INTO "system_events" VALUES (803,'2026-04-18T02:07:50.719487','Information','System','SystemHealth',5001,'Cleaned up 3 orphaned processes',NULL,'{"pids": [1, 2, 3]}',NULL);
INSERT INTO "system_events" VALUES (804,'2026-04-18T02:08:07.307838','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 4)',NULL,'{"pid": 4, "app": "System Monitor", "memory": 15, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (805,'2026-04-18T02:08:39.781487','Information','System','ProcessManager',5000,'Process started: Armoury Crate (PID: 5)',NULL,'{"pid": 5, "app": "Armoury Crate", "memory": 22, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (806,'2026-04-18T02:09:30.540690','Information','System','ProcessManager',5000,'Process started: Solitaire (PID: 6)',NULL,'{"pid": 6, "app": "Solitaire", "memory": 21, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (807,'2026-04-18T02:09:40.460298','Information','System','ProcessManager',5000,'Process started: Calculator (PID: 7)',NULL,'{"pid": 7, "app": "Calculator", "memory": 19, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (808,'2026-04-18T02:09:41.489237','Information','System','ProcessManager',5000,'Process started: Settings (PID: 8)',NULL,'{"pid": 8, "app": "Settings", "memory": 14, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (809,'2026-04-18T02:09:44.950330','Information','System','ProcessManager',5000,'Process started: Calendar (PID: 9)',NULL,'{"pid": 9, "app": "Calendar", "memory": 22, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (810,'2026-04-18T02:09:46.068641','Information','System','ProcessManager',5000,'Process started: Notes (PID: 10)',NULL,'{"pid": 10, "app": "Notes", "memory": 26, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (811,'2026-04-18T02:09:49.891601','Information','System','ProcessManager',5000,'Process started: Event Viewer (PID: 11)',NULL,'{"pid": 11, "app": "Event Viewer", "memory": 17, "is_startup": false}',NULL);
INSERT INTO "system_events" VALUES (812,'2026-04-18T02:10:12.449216','Information','System','ProcessManager',5000,'Process started: System Monitor (PID: 12)',NULL,'{"pid": 12, "app": "System Monitor", "memory": 20, "is_startup": true}',NULL);
INSERT INTO "system_events" VALUES (813,'2026-04-18T02:14:32.522664','Information','System','ProcessManager',5000,'Process started: File Explorer (PID: 13)',NULL,'{"pid": 13, "app": "File Explorer", "memory": 16, "is_startup": false}',NULL);
INSERT INTO "update_history" VALUES (1,'1.0.0','initial','Initial OS installation','2026-02-05T11:32:48.555631Z',0);
INSERT INTO "update_history" VALUES (2,'1.1.1','installed','- Minor bug fixes
- Stability improvements','2026-02-05T13:42:17.568784Z',1);
INSERT INTO "update_state" VALUES (1,'1.1.1','1.1.1',0,'2026-02-05T13:42:12.484734Z','stable','idle',0,0,'- Minor bug fixes
- Stability improvements');
INSERT INTO "users" VALUES (1,'user','5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8','user','/home/user','2026-02-05T11:32:48.509961');
INSERT INTO "users" VALUES (2,'admin','8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918','admin','/home/admin','2026-02-05T11:32:48.514209');
COMMIT;
