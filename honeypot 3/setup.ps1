# ============================================
# HONEYPOT AUTOMATIC SETUP
# Version 1 - Multiple Text Decoys
# ============================================

# --------------------------------------------
# 1. Check Administrator privileges
# --------------------------------------------

$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()

$principal = New-Object Security.Principal.WindowsPrincipal(
    $currentUser
)

if (-not $principal.IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)) {

    Write-Host ""
    Write-Host "ERROR: Please run PowerShell/VS Code as Administrator." -ForegroundColor Red
    Write-Host ""
    exit 1
}

# --------------------------------------------
# 2. Basic information
# --------------------------------------------

Write-Host "============================================"
Write-Host "       HONEYPOT AUTOMATIC SETUP"
Write-Host "       VERSION 1 - TEXT DECOYS"
Write-Host "============================================"
Write-Host ""

$BaseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "[+] Honeypot directory:"
Write-Host "    $BaseDir"
Write-Host ""

# --------------------------------------------
# 3. Enable Windows File System auditing
# --------------------------------------------

Write-Host "[+] Enabling Windows File System auditing..."

auditpol /set /subcategory:"File System" /success:enable /failure:enable

if ($LASTEXITCODE -ne 0) {

    Write-Host "[-] Failed to enable File System auditing." -ForegroundColor Red
    exit 1
}

Write-Host "[+] File System auditing enabled" -ForegroundColor Green
Write-Host ""

# --------------------------------------------
# 4. Find user folders
# --------------------------------------------

$UserProfile = $env:USERPROFILE

$DesktopPath   = Join-Path $UserProfile "Desktop"
$DocumentsPath = Join-Path $UserProfile "Documents"
$DownloadsPath = Join-Path $UserProfile "Downloads"
$PicturesPath  = Join-Path $UserProfile "Pictures"

# --------------------------------------------
# 5. Detect OneDrive
# --------------------------------------------

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

# --------------------------------------------
# 6. Display target locations
# --------------------------------------------

Write-Host "============================================"
Write-Host "       TARGET LOCATIONS"
Write-Host "============================================"
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

    Write-Host "[=] OneDrive:"
    Write-Host "    Not detected"
}

Write-Host ""

# --------------------------------------------
# 7. Define decoys
# --------------------------------------------

$Decoys = @(

    # ========================================
    # DESKTOP
    # ========================================

    @{
        Name = "Passwords.txt"
        Location = $DesktopPath

        Content = @"
CONFIDENTIAL - PASSWORD INFORMATION

Environment: Internal Testing

Account: finance-demo
Status: Active

Account: reporting-demo
Status: Active

Account: admin-demo
Status: Restricted

NOTICE:
This is a honeypot decoy.
All information in this file is fictional.
"@
    },

    @{
        Name = "VPN_Credentials.txt"
        Location = $DesktopPath

        Content = @"
CONFIDENTIAL - VPN ACCESS INFORMATION

VPN Profile: Corporate-Test-VPN
Server: vpn.example.invalid
Protocol: Test Environment

Username: vpn-demo-user
Status: Active

NOTICE:
This is a honeypot decoy.
No real credentials are stored in this file.
"@
    },

    @{
        Name = "Project_Notes_2026.txt"
        Location = $DesktopPath

        Content = @"
CONFIDENTIAL - PROJECT NOTES

Project: Example Project
Year: 2026

Project status:

- Internal planning
- Development notes
- Testing
- Future tasks

Next review: Q4 2026

This is a honeypot decoy.
All information contained in this file is fake.
"@
    },

    @{
        Name = "Confidential_Notes.txt"
        Location = $DesktopPath

        Content = @"
CONFIDENTIAL INTERNAL NOTES

Document Classification: Internal

Upcoming activities:

- Project review
- Security assessment
- Infrastructure maintenance
- Internal audit

This is a honeypot decoy.
All information contained in this file is fake.
"@
    },

    # ========================================
    # DOCUMENTS
    # ========================================

    @{
        Name = "Employee_Database.txt"
        Location = $DocumentsPath

        Content = @"
CONFIDENTIAL - EMPLOYEE DATABASE

Employee Records - 2026

Employee ID: EMP-1001
Department: Finance
Position: Analyst

Employee ID: EMP-1002
Department: Engineering
Position: Developer

Employee ID: EMP-1003
Department: Operations
Position: Manager

NOTICE:
This is a honeypot decoy.
All employee information is fictional.
"@
    },

    @{
        Name = "Salary_Report.txt"
        Location = $DocumentsPath

        Content = @"
CONFIDENTIAL - SALARY REPORT

Reporting Period: 2026

Department: Engineering
Estimated Payroll: 480000

Department: Finance
Estimated Payroll: 270000

Department: Operations
Estimated Payroll: 320000

NOTICE:
This is a honeypot decoy.
All financial information is fictional.
"@
    },

    @{
        Name = "HR_Records.txt"
        Location = $DocumentsPath

        Content = @"
CONFIDENTIAL - HR RECORDS

Human Resources Department

Active Employees: 127
New Employees: 18
Employees Under Review: 4

Next HR review:
December 2026

This is a honeypot decoy.
All information contained in this file is fake.
"@
    },

    @{
        Name = "Financial_Report_2026.txt"
        Location = $DocumentsPath

        Content = @"
CONFIDENTIAL - FINANCIAL REPORT

Financial Year: 2026

Revenue: 850000
Expenses: 420000
Projected Growth: 12%

Operating Budget: 500000
Reserve Budget: 125000

NOTICE:
This is a honeypot decoy.
All financial information is fictional.
"@
    },

    @{
        Name = "Customer_List.txt"
        Location = $DocumentsPath

        Content = @"
CONFIDENTIAL - CUSTOMER LIST

Customer ID: CUST-1001
Category: Enterprise
Status: Active

Customer ID: CUST-1002
Category: Business
Status: Active

Customer ID: CUST-1003
Category: Standard
Status: Pending

NOTICE:
This is a honeypot decoy.
All customer information is fictional.
"@
    },

    # ========================================
    # DOWNLOADS
    # ========================================

    @{
        Name = "Database_Backup.txt"
        Location = $DownloadsPath

        Content = @"
DATABASE BACKUP INFORMATION

Backup Date: 2026-08-01
Database: ExampleDB
Backup Type: Full
Status: Completed

Backup Size: 4.7 GB

NOTICE:
This is a honeypot decoy.
No real database information is contained here.
"@
    },

    @{
        Name = "Credentials.txt"
        Location = $DownloadsPath

        Content = @"
CONFIDENTIAL - SYSTEM CREDENTIAL INFORMATION

System: Development-Test

Username: demo-user
Environment: Testing
Status: Active

System: Reporting-Test

Username: report-user
Environment: Testing
Status: Active

NOTICE:
This is a honeypot decoy.
No real credentials are stored here.
"@
    },

    @{
        Name = "Network_Config.txt"
        Location = $DownloadsPath

        Content = @"
INTERNAL NETWORK CONFIGURATION

Environment: Development

Network: 10.10.0.0/24
Gateway: 10.10.0.1

Test Server:
10.10.0.20

Database Server:
10.10.0.30

NOTICE:
This is a honeypot decoy.
All network information is fictional.
"@
    },

    @{
        Name = "Backup_Information.txt"
        Location = $DownloadsPath

        Content = @"
CONFIDENTIAL BACKUP INFORMATION

Backup System: Example Backup Server

Last Backup:
2026-08-05

Backup Status:
SUCCESS

Retention:
30 Days

NOTICE:
This is a honeypot decoy.
All information contained in this file is fictional.
"@
    },

    # ========================================
    # PICTURES
    # ========================================

    @{
        Name = "Network_Diagram.txt"
        Location = $PicturesPath

        Content = @"
NETWORK DIAGRAM NOTES

Corporate Network

Internet
   |
Firewall
   |
Core Router
   |
Switch
   |
Application Servers
   |
Database Servers

NOTICE:
This is a honeypot decoy.
This is a text representation of a fictional network.
"@
    },

    @{
        Name = "Server_Architecture.txt"
        Location = $PicturesPath

        Content = @"
SERVER ARCHITECTURE NOTES

Application Layer
        |
Web Server
        |
Application Server
        |
Database Server
        |
Backup Server

Environment:
Internal Test Infrastructure

NOTICE:
This is a honeypot decoy.
All architecture information is fictional.
"@
    },

    # ========================================
    # ONEDRIVE
    # ========================================

    @{
        Name = "Company_Strategy.txt"
        Location = $OneDrivePath

        Content = @"
CONFIDENTIAL - COMPANY STRATEGY

Strategic Planning - 2026

Primary Objectives:

1. Improve infrastructure
2. Expand internal services
3. Improve security
4. Reduce operational costs

Review Period:
Q4 2026

NOTICE:
This is a honeypot decoy.
All information contained in this file is fictional.
"@
    },

    @{
        Name = "Board_Meeting_Notes.txt"
        Location = $OneDrivePath

        Content = @"
CONFIDENTIAL - BOARD MEETING NOTES

Meeting Date:
October 2026

Discussion Topics:

- Infrastructure investment
- Security improvements
- Budget planning
- Project development

Next Meeting:
December 2026

NOTICE:
This is a honeypot decoy.
All information contained in this file is fictional.
"@
    },

    @{
        Name = "Budget_2026.txt"
        Location = $OneDrivePath

        Content = @"
CONFIDENTIAL - COMPANY BUDGET

Budget Year: 2026

Infrastructure: 180000
Operations: 240000
Security: 95000
Research: 125000

Total Planned Budget: 640000

NOTICE:
This is a honeypot decoy.
All financial information is fictional.
"@
    }
)

# --------------------------------------------
# 8. Remove decoys with unavailable locations
# --------------------------------------------

$AvailableDecoys = @()

foreach ($Decoy in $Decoys) {

    if ($Decoy.Location -and (Test-Path $Decoy.Location)) {

        $AvailableDecoys += $Decoy
    }
    elseif ($Decoy.Location) {

        Write-Host "[=] Skipping unavailable location:"
        Write-Host "    $($Decoy.Location)"
        Write-Host ""
    }
}

# --------------------------------------------
# 9. Function to configure auditing
# --------------------------------------------

function Set-HoneypotAudit {

    param (
        [string]$FilePath
    )

    try {

        # Get existing ACL including audit information
        $acl = Get-Acl -Path $FilePath -Audit

        # Everyone SID
        $identity = New-Object System.Security.Principal.SecurityIdentifier(
            "S-1-1-0"
        )

        # Read + Write
        $rights =
            [System.Security.AccessControl.FileSystemRights]::ReadData `
            -bor `
            [System.Security.AccessControl.FileSystemRights]::WriteData

        # Successful access
        $auditFlags =
            [System.Security.AccessControl.AuditFlags]::Success

        # Create audit rule
        $auditRule =
            New-Object System.Security.AccessControl.FileSystemAuditRule(
                $identity,
                $rights,
                $auditFlags
            )

        # Add audit rule
        $acl.AddAuditRule($auditRule)

        # Apply ACL
        Set-Acl -Path $FilePath -AclObject $acl

        return $true
    }

    catch {

        Write-Host ""
        Write-Host "Audit configuration error:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host ""

        return $false
    }
}

# --------------------------------------------
# 10. Registry
# --------------------------------------------

$Registry = @()

# --------------------------------------------
# 11. Create and configure decoys
# --------------------------------------------

foreach ($Decoy in $AvailableDecoys) {

    $FilePath = Join-Path $Decoy.Location $Decoy.Name

    Write-Host "--------------------------------------------"
    Write-Host "Processing: $($Decoy.Name)"
    Write-Host "Location: $($Decoy.Location)"
    Write-Host "--------------------------------------------"

    # ----------------------------------------
    # Create decoy
    # ----------------------------------------

    if (-not (Test-Path $FilePath)) {

        Set-Content `
            -Path $FilePath `
            -Value $Decoy.Content `
            -Encoding UTF8

        Write-Host "[+] Created file" -ForegroundColor Green
    }

    else {

        Write-Host "[=] File already exists"
    }

    # ----------------------------------------
    # Configure auditing
    # ----------------------------------------

    Write-Host "[+] Configuring file auditing..."

    $AuditResult = Set-HoneypotAudit -FilePath $FilePath

    if ($AuditResult) {

        Write-Host "[+] Auditing configured successfully" -ForegroundColor Green
    }

    else {

        Write-Host "[-] Auditing configuration failed" -ForegroundColor Red
    }

    # ----------------------------------------
    # Resolve exact path
    # ----------------------------------------

    $ResolvedPath = (Resolve-Path $FilePath).Path

    # ----------------------------------------
    # Add to registry
    # ----------------------------------------

    $Registry += [PSCustomObject]@{

        Name = $Decoy.Name

        Path = $ResolvedPath

        Type = "Honeypot Decoy"

    }

    Write-Host ""
}

# --------------------------------------------
# 12. Save registry
# --------------------------------------------

$RegistryFile = Join-Path $BaseDir "decoy_registry.json"

$json = $Registry | ConvertTo-Json -Depth 5

# Write UTF-8 WITHOUT BOM
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

[System.IO.File]::WriteAllText(
    $RegistryFile,
    $json,
    $Utf8NoBom
)

Write-Host "============================================"
Write-Host "       DECOY REGISTRY CREATED"
Write-Host "============================================"
Write-Host ""

Write-Host "[+] Registry:"
Write-Host "    $RegistryFile"

Write-Host ""

# --------------------------------------------
# 13. Display registered decoys
# --------------------------------------------

Write-Host "============================================"
Write-Host "       REGISTERED DECOYS"
Write-Host "============================================"
Write-Host ""

foreach ($Entry in $Registry) {

    Write-Host "[+] $($Entry.Name)"
    Write-Host "    $($Entry.Path)"
    Write-Host ""
}

# --------------------------------------------
# 14. Registry count
# --------------------------------------------

Write-Host "============================================"
Write-Host "       DECOY SUMMARY"
Write-Host "============================================"
Write-Host ""

Write-Host "[+] Total registered decoys: $($Registry.Count)" -ForegroundColor Green

Write-Host ""

# --------------------------------------------
# 15. Verify audit policy
# --------------------------------------------

Write-Host "============================================"
Write-Host "       AUDIT POLICY CHECK"
Write-Host "============================================"
Write-Host ""

auditpol /get /subcategory:"File System"

Write-Host ""

# --------------------------------------------
# 16. Finish
# --------------------------------------------

Write-Host "============================================"
Write-Host "       HONEYPOT SETUP COMPLETE"
Write-Host "============================================"
Write-Host ""

Write-Host "Created/registered decoys:"
Write-Host ""

foreach ($Entry in $Registry) {

    Write-Host " - $($Entry.Path)"
}

Write-Host ""

Write-Host "Registry:"
Write-Host " $RegistryFile"

Write-Host ""

Write-Host "Next step:"
Write-Host "Run monitor.py and test ONE decoy at a time."

Write-Host ""