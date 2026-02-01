@echo off
echo Copying user pages to user folder...

copy client\src\pages\Dashboard.tsx client\src\pages\user\Dashboard.tsx
copy client\src\pages\Products.tsx client\src\pages\user\Products.tsx
copy client\src\pages\Cart.tsx client\src\pages\user\Cart.tsx
copy client\src\pages\Checkout.tsx client\src\pages\user\Checkout.tsx
copy client\src\pages\DigitalBill.tsx client\src\pages\user\DigitalBill.tsx
copy client\src\pages\OrderHistory.tsx client\src\pages\user\OrderHistory.tsx
copy client\src\pages\Profile.tsx client\src\pages\user\Profile.tsx

echo.
echo Done! User pages copied to client/src/pages/user/
echo.
echo Next steps:
echo 1. Backup current App.tsx: copy client\src\App.tsx client\src\App.old.tsx
echo 2. Replace with unified: copy client\src\App.unified.tsx client\src\App.tsx
echo 3. Start the app: cd client ^&^& npm run dev
pause
