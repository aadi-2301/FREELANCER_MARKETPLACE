@echo off
title FreelanceShield - TCET Cyber Security Marketplace
color 0b
echo ===============================================================================
echo   FREELANCESHIELD: ZERO-TRUST FREELANCE MARKETPLACE WITH ESCROW & SOC
echo   TCET Department of Computer Science & Engineering (Cyber Security)
echo   Choice Based Credit Grading Scheme with HME Under Autonomy - CBCGS-HME 2023
echo   University of Mumbai
echo ===============================================================================
echo.
echo Starting FreelanceShield Core on http://localhost:5000 ...
echo Opening web browser...
start http://localhost:5000
node server/index.js
pause
