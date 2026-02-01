@echo off
echo Seeding database...
set PGPASSWORD=0DJwGb4YyCFFba59W6M1kqFhOu6v6xyI
psql -h dpg-d5uof5h4tr6s7395u750-a.oregon-postgres.render.com -p 5432 -U cms_db_x549_user -d cms_db_x549 -f src/database/seed.sql
echo.
echo Database seeding complete!
pause
