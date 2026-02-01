@echo off
cd /d D:\ADVSPL\CMS\admin-panel
call npm install
call npm test -- Institutions.property.test
cd /d D:\ADVSPL\CMS
