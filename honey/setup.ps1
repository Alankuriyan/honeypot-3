# ============================================================
# HONEYPOT AUTOMATIC SETUP
# Version 2 - Multi-Format Decoys
# ============================================================

# ============================================================
# 1. ADMINISTRATOR CHECK
# ============================================================

$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()

$principal = New-Object System.Security.Principal.WindowsPrincipal($currentUser)

if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {

    Write-Host ""
    Write-Host "ERROR: Run PowerShell as Administrator." -ForegroundColor Red
    Write-Host ""
    exit 1
}

# ============================================================
# 2. BASIC INFORMATION
# ============================================================

$BaseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "       HONEYPOT AUTOMATIC SETUP" -ForegroundColor Cyan
Write-Host "       VERSION 2 - MULTI-FORMAT DECOYS" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[+] Honeypot directory:"
Write-Host "    $BaseDir"
Write-Host ""

# ============================================================
# 3. ENABLE FILE SYSTEM AUDITING
# ============================================================

Write-Host "[+] Enabling Windows File System auditing..."

auditpol /set /subcategory:"File System" /success:enable /failure:enable

if ($LASTEXITCODE -ne 0) {

    Write-Host "[-] Failed to enable auditing." -ForegroundColor Red
    exit 1
}

Write-Host "[+] File System auditing enabled" -ForegroundColor Green
Write-Host ""

# ============================================================
# 4. USER FOLDERS
# ============================================================

$UserProfile = $env:USERPROFILE

$DesktopPath   = Join-Path $UserProfile "Desktop"
$DocumentsPath = Join-Path $UserProfile "Documents"
$DownloadsPath = Join-Path $UserProfile "Downloads"
$PicturesPath  = Join-Path $UserProfile "Pictures"

# ============================================================
# 5. ONEDRIVE DETECTION
# ============================================================

$OneDrivePath = $null

if ($env:OneDrive -and (Test-Path $env:OneDrive)) {

    $OneDrivePath = $env:OneDrive

}
elseif ($env:OneDriveConsumer -and (Test-Path $env:OneDriveConsumer)) {

    $OneDrivePath = $env:OneDriveConsumer

}
elseif ($env:OneDriveCommercial -and (Test-Path $env:OneDriveCommercial)) {

    $OneDrivePath = $env:OneDriveCommercial
}

# ============================================================
# 6. DISPLAY TARGET LOCATIONS
# ============================================================

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "       TARGET LOCATIONS"
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[+] Desktop:"
Write-Host "    $DesktopPath"

Write-Host "[+] Documents:"
Write-Host "    $DocumentsPath"

Write-Host "[+] Downloads:"
Write-Host "    $DownloadsPath"

Write-Host "[+] Pictures:"
Write-Host "    $PicturesPath"

if ($OneDrivePath) {

    Write-Host "[+] OneDrive:"
    Write-Host "    $OneDrivePath"

}
else {

    Write-Host "[=] OneDrive: Not detected"
}

Write-Host ""

# ============================================================
# 7. REGISTRY
# ============================================================

$Registry = @()

# ============================================================
# 8. AUDIT FUNCTION
# ============================================================

function Set-HoneypotAudit {

    param(
        [string]$FilePath
    )

    try {

        $acl = Get-Acl -Path $FilePath -Audit

        $identity = New-Object System.Security.Principal.SecurityIdentifier(
            "S-1-1-0"
        )

        $rights =
            [System.Security.AccessControl.FileSystemRights]::ReadData `
            -bor `
            [System.Security.AccessControl.FileSystemRights]::WriteData

        $auditFlags =
            [System.Security.AccessControl.AuditFlags]::Success

        $auditRule =
            New-Object System.Security.AccessControl.FileSystemAuditRule(
                $identity,
                $rights,
                $auditFlags
            )

        $acl.AddAuditRule($auditRule)

        Set-Acl -Path $FilePath -AclObject $acl

        return $true
    }
    catch {

        Write-Host "[-] Audit configuration failed" -ForegroundColor Red
        Write-Host "    $($_.Exception.Message)"

        return $false
    }
}

# ============================================================
# 9. REGISTER DECOY
# ============================================================

function Register-Decoy {

    param(
        [string]$Name,
        [string]$Path,
        [string]$Type,
        [string]$Category
    )

    $script:Registry += [PSCustomObject]@{
        Name     = $Name
        Path     = $Path
        Type     = $Type
        Category = $Category
    }
}

# ============================================================
# 10. CREATE TEXT DECOY
# ============================================================

function Create-TextDecoy {

    param(
        [string]$Name,
        [string]$Location,
        [string]$Content,
        [string]$Category
    )

    if (-not (Test-Path $Location)) {
        Write-Host "[=] Location unavailable: $Location"
        return
    }

    $FilePath = Join-Path $Location $Name

    Write-Host ""
    Write-Host "Processing: $Name" -ForegroundColor Yellow

    if (-not (Test-Path $FilePath)) {

        Set-Content `
            -Path $FilePath `
            -Value $Content `
            -Encoding UTF8

        Write-Host "[+] Created" -ForegroundColor Green
    }
    else {

        Write-Host "[=] Already exists"
    }

    if (Set-HoneypotAudit -FilePath $FilePath) {

        Write-Host "[+] Auditing enabled" -ForegroundColor Green
    }

    Register-Decoy `
        -Name $Name `
        -Path (Resolve-Path $FilePath).Path `
        -Type "Text" `
        -Category $Category
}

# ============================================================
# 11. CREATE JAVASCRIPT DECOY
# ============================================================

function Create-JSDecoy {

    param(
        [string]$Name,
        [string]$Location
    )

    if (-not (Test-Path $Location)) {
        return
    }

    $FilePath = Join-Path $Location $Name

    $Content = @"
/*
DATABASE CONFIGURATION
INTERNAL TEST ENVIRONMENT
*/

const databaseConfig = {
    host: "db-test.example.invalid",
    port: 5432,
    database: "CorporateDB",
    username: "database-demo-user",
    password: "HONEYPOT_FAKE_PASSWORD",
    environment: "TEST"
};

module.exports = databaseConfig;

/*
WARNING:
This file is a honeypot decoy.
No real credentials are stored here.
*/
"@

    Write-Host ""
    Write-Host "Processing: $Name" -ForegroundColor Yellow

    if (-not (Test-Path $FilePath)) {

        Set-Content `
            -Path $FilePath `
            -Value $Content `
            -Encoding UTF8

        Write-Host "[+] Created JavaScript" -ForegroundColor Green
    }
    else {

        Write-Host "[=] Already exists"
    }

    if (Set-HoneypotAudit -FilePath $FilePath) {

        Write-Host "[+] Auditing enabled" -ForegroundColor Green
    }

    Register-Decoy `
        -Name $Name `
        -Path (Resolve-Path $FilePath).Path `
        -Type "JavaScript" `
        -Category "Database"
}

# ============================================================
# 12. CREATE PDF DECOY
# ============================================================

function Create-PDFDecoy {

    param(
        [string]$Name,
        [string]$Location
    )

    if (-not (Test-Path $Location)) {
        return
    }

    $FilePath = Join-Path $Location $Name

    Write-Host ""
    Write-Host "Processing: $Name" -ForegroundColor Yellow

    if (-not (Test-Path $FilePath)) {

        $pdf = @"
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 180 >>
stream
BT
/F1 20 Tf
72 720 Td
(FINANCIAL REPORT 2026) Tj
/F1 12 Tf
0 -40 Td
(CONFIDENTIAL - HONEYPOT DECOY) Tj
0 -30 Td
(All information in this document is fictional.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
trailer
<< /Root 1 0 R >>
%%EOF
"@

        [System.IO.File]::WriteAllText(
            $FilePath,
            $pdf,
            [System.Text.Encoding]::ASCII
        )

        Write-Host "[+] Created PDF" -ForegroundColor Green
    }
    else {

        Write-Host "[=] Already exists"
    }

    if (Set-HoneypotAudit -FilePath $FilePath) {

        Write-Host "[+] Auditing enabled" -ForegroundColor Green
    }

    Register-Decoy `
        -Name $Name `
        -Path (Resolve-Path $FilePath).Path `
        -Type "PDF" `
        -Category "Financial"
}

# ============================================================
# 13. CREATE EXCEL DECOY
# ============================================================

function Create-ExcelDecoy {

    param(
        [string]$Name,
        [string]$Location
    )

    if (-not (Test-Path $Location)) {
        return
    }

    $FilePath = Join-Path $Location $Name

    Write-Host ""
    Write-Host "Processing: $Name" -ForegroundColor Yellow

    try {

        $excel = New-Object -ComObject Excel.Application

        $excel.Visible = $false
        $excel.DisplayAlerts = $false

        $workbook = $excel.Workbooks.Add()
        $sheet = $workbook.Worksheets.Item(1)

        $sheet.Cells.Item(1,1) = "Employee ID"
        $sheet.Cells.Item(1,2) = "Department"
        $sheet.Cells.Item(1,3) = "Salary"
        $sheet.Cells.Item(1,4) = "Status"

        $sheet.Cells.Item(2,1) = "EMP-1001"
        $sheet.Cells.Item(2,2) = "Finance"
        $sheet.Cells.Item(2,3) = "85000"
        $sheet.Cells.Item(2,4) = "Active"

        $sheet.Cells.Item(3,1) = "EMP-1002"
        $sheet.Cells.Item(3,2) = "Engineering"
        $sheet.Cells.Item(3,3) = "92000"
        $sheet.Cells.Item(3,4) = "Active"

        $sheet.Cells.Item(4,1) = "EMP-1003"
        $sheet.Cells.Item(4,2) = "Operations"
        $sheet.Cells.Item(4,3) = "78000"
        $sheet.Cells.Item(4,4) = "Active"

        $sheet.Cells.Item(6,1) =
            "HONEYPOT DECOY - ALL INFORMATION IS FICTIONAL"

        $workbook.SaveAs(
            $FilePath,
            51
        )

        $workbook.Close($true)
        $excel.Quit()

        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($sheet) | Out-Null
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($workbook) | Out-Null
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null

        Write-Host "[+] Created Excel file" -ForegroundColor Green
    }
    catch {

        Write-Host "[=] Microsoft Excel not available - skipping Excel." -ForegroundColor Yellow
        return
    }

    if (Set-HoneypotAudit -FilePath $FilePath) {

        Write-Host "[+] Auditing enabled" -ForegroundColor Green
    }

    Register-Decoy `
        -Name $Name `
        -Path (Resolve-Path $FilePath).Path `
        -Type "Excel" `
        -Category "Employee"
}

# ============================================================
# 14. CREATE WORD DECOY
# ============================================================

function Create-WordDecoy {

    param(
        [string]$Name,
        [string]$Location
    )

    if (-not (Test-Path $Location)) {
        return
    }

    $FilePath = Join-Path $Location $Name

    Write-Host ""
    Write-Host "Processing: $Name" -ForegroundColor Yellow

    try {

        $word = New-Object -ComObject Word.Application

        $word.Visible = $false
        $word.DisplayAlerts = 0

        $document = $word.Documents.Add()

        $selection = $word.Selection

        $selection.TypeText("CUSTOMER DATABASE - INTERNAL")
        $selection.TypeParagraph()

        $selection.TypeText("Customer ID: CUST-1001")
        $selection.TypeParagraph()

        $selection.TypeText("Category: Enterprise")
        $selection.TypeParagraph()

        $selection.TypeText("Status: Active")
        $selection.TypeParagraph()

        $selection.TypeParagraph()

        $selection.TypeText(
            "HONEYPOT DECOY - ALL INFORMATION IS FICTIONAL"
        )

        $document.SaveAs2(
            $FilePath,
            16
        )

        $document.Close()
        $word.Quit()

        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($selection) | Out-Null
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($document) | Out-Null
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null

        Write-Host "[+] Created Word file" -ForegroundColor Green
    }
    catch {

        Write-Host "[=] Microsoft Word not available - skipping Word." -ForegroundColor Yellow
        return
    }

    if (Set-HoneypotAudit -FilePath $FilePath) {

        Write-Host "[+] Auditing enabled" -ForegroundColor Green
    }

    Register-Decoy `
        -Name $Name `
        -Path (Resolve-Path $FilePath).Path `
        -Type "Word" `
        -Category "Customer"
}

# ============================================================
# 15. CREATE PNG DECOY
# ============================================================

function Create-PNGDecoy {

    param(
        [string]$Name,
        [string]$Location
    )

    if (-not (Test-Path $Location)) {
        return
    }

    $FilePath = Join-Path $Location $Name

    Write-Host ""
    Write-Host "Processing: $Name" -ForegroundColor Yellow

    try {

        Add-Type -AssemblyName System.Drawing

        $bitmap = New-Object System.Drawing.Bitmap(800,500)

        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

        $graphics.Clear(
            [System.Drawing.Color]::White
        )

        $font = New-Object System.Drawing.Font(
            "Arial",
            24
        )

        $brush = [System.Drawing.Brushes]::Black

        $graphics.DrawString(
            "NETWORK DIAGRAM",
            $font,
            $brush,
            250,
            50
        )

        $graphics.DrawString(
            "Internet",
            $font,
            $brush,
            330,
            120
        )

        $graphics.DrawString(
            "Firewall",
            $font,
            $brush,
            320,
            220
        )

        $graphics.DrawString(
            "Application Server",
            $font,
            $brush,
            250,
            320
        )

        $graphics.DrawString(
            "Database Server",
            $font,
            $brush,
            270,
            420
        )

        $bitmap.Save(
            $FilePath,
            [System.Drawing.Imaging.ImageFormat]::Png
        )

        $font.Dispose()
        $graphics.Dispose()
        $bitmap.Dispose()

        Write-Host "[+] Created PNG" -ForegroundColor Green
    }
    catch {

        Write-Host "[-] PNG creation failed: $($_.Exception.Message)" -ForegroundColor Red
        return
    }

    if (Set-HoneypotAudit -FilePath $FilePath) {

        Write-Host "[+] Auditing enabled" -ForegroundColor Green
    }

    Register-Decoy `
        -Name $Name `
        -Path (Resolve-Path $FilePath).Path `
        -Type "PNG" `
        -Category "Network"
}

# ============================================================
# 16. CREATE TEXT DECOYS
# ============================================================

Create-TextDecoy `
    -Name "VPN_Credentials.txt" `
    -Location $DesktopPath `
    -Content @"
CONFIDENTIAL - VPN ACCESS

VPN Profile: Corporate-Test-VPN
Server: vpn.example.invalid

Username: vpn-demo-user
Status: Active

HONEYPOT DECOY
All credentials are fictional.
"@ `
    -Category "Credentials"


Create-TextDecoy `
    -Name "Passwords.txt" `
    -Location $DesktopPath `
    -Content @"
CONFIDENTIAL PASSWORD INFORMATION

Account: finance-demo
Account: reporting-demo
Account: admin-demo

HONEYPOT DECOY
All information is fictional.
"@ `
    -Category "Credentials"


Create-TextDecoy `
    -Name "Salary_Report.txt" `
    -Location $DocumentsPath `
    -Content @"
CONFIDENTIAL SALARY REPORT

Department: Engineering
Payroll: 480000

Department: Finance
Payroll: 270000

HONEYPOT DECOY
All information is fictional.
"@ `
    -Category "Financial"


Create-TextDecoy `
    -Name "Customer_List.txt" `
    -Location $DocumentsPath `
    -Content @"
CONFIDENTIAL CUSTOMER LIST

Customer ID: CUST-1001
Category: Enterprise
Status: Active

Customer ID: CUST-1002
Category: Business
Status: Active

HONEYPOT DECOY
All information is fictional.
"@ `
    -Category "Customer"


Create-TextDecoy `
    -Name "Network_Config.txt" `
    -Location $DownloadsPath `
    -Content @"
INTERNAL NETWORK CONFIGURATION

Network: 10.10.0.0/24
Gateway: 10.10.0.1

Database Server:
10.10.0.30

HONEYPOT DECOY
All information is fictional.
"@ `
    -Category "Network"

# ============================================================
# 17. CREATE MULTI-FORMAT DECOYS
# ============================================================

Create-JSDecoy `
    -Name "database_config.js" `
    -Location $DownloadsPath


Create-PDFDecoy `
    -Name "Financial_Report_2026.pdf" `
    -Location $DocumentsPath


Create-ExcelDecoy `
    -Name "Employee_Salaries.xlsx" `
    -Location $DocumentsPath


Create-WordDecoy `
    -Name "Customer_Database.docx" `
    -Location $DocumentsPath


Create-PNGDecoy `
    -Name "Network_Diagram.png" `
    -Location $PicturesPath

# ============================================================
# 18. SAVE REGISTRY
# ============================================================

$RegistryFile = Join-Path $BaseDir "decoy_registry.json"

$json = $Registry | ConvertTo-Json -Depth 5

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

[System.IO.File]::WriteAllText(
    $RegistryFile,
    $json,
    $Utf8NoBom
)

# ============================================================
# 19. SUMMARY
# ============================================================

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "             DECOY SETUP COMPLETE" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Total registered decoys: $($Registry.Count)" -ForegroundColor Green

Write-Host ""

foreach ($Entry in $Registry) {

    Write-Host "[$($Entry.Type)] $($Entry.Name)"
    Write-Host "    $($Entry.Path)"
}

Write-Host ""

Write-Host "Registry:"
Write-Host "    $RegistryFile"

Write-Host ""

# ============================================================
# 20. AUDIT POLICY VERIFICATION
# ============================================================

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "             AUDIT POLICY CHECK" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

auditpol /get /subcategory:"File System"

Write-Host ""

Write-Host "==================================================" -ForegroundColor Green
Write-Host "        HONEYPOT SETUP FINISHED" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

Write-Host ""
Write-Host "Next:"
Write-Host "1. Start monitor.py"
Write-Host "2. Access ONE decoy"
Write-Host "3. Check Event ID 4663"
Write-Host "4. Check the API"
Write-Host "5. Check the dashboard"
Write-Host ""