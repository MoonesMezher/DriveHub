$base = "http://localhost:3000/api/v1"
$pass = "StudentPass1!"
$okCount = 0
$failCount = 0

function Test-Step($name, [scriptblock]$Action) {
    try {
        $out = & $Action
        Write-Host "[OK] $name — $out" -ForegroundColor Green
        $script:okCount++
        return $out
    }
    catch {
        $msg = $_.Exception.Message
        if ($_.ErrorDetails.Message) { $msg = $_.ErrorDetails.Message }
        Write-Host "[FAIL] $name — $msg" -ForegroundColor Red
        $script:failCount++
        return $null
    }
}

Write-Host "`n=== DriveHub Integration Check ===`n" -ForegroundColor Cyan

Test-Step "Health" {
    $r = Invoke-RestMethod "$base/health"
    if (-not $r.success) { throw "health failed" }
    "v1 healthy"
} | Out-Null

Test-Step "Sample (guest)" {
    $r = Invoke-RestMethod "$base/content/sample"
    $n = $r.data.questions.Count
    if ($r.data.tier -ne "partial" -or $n -lt 1) { throw "expected partial sample" }
    "tier=partial, questions=$n"
} | Out-Null

Test-Step "Schools nearby" {
    $r = Invoke-RestMethod "$base/schools/nearby?lat=33.5138&lng=36.2765&category=B"
    if (-not $r.data.Count) { throw "no schools" }
    $script:schoolId = $r.data[0]._id
    "school=$($r.data[0].name)"
} | Out-Null

Test-Step "School courses" {
    $r = Invoke-RestMethod "$base/schools/$schoolId/courses"
    if (-not $r.data.courses.Count) { throw "no courses" }
    $script:courseId = $r.data.courses[0]._id
    "courses=$($r.data.courses.Count), id=$courseId"
} | Out-Null

Test-Step "School coaches" {
    $r = Invoke-RestMethod "$base/schools/$schoolId/coaches"
    if (-not $r.data.coaches.Count) { throw "no coaches" }
    $script:coachId = $r.data.coaches[0]._id
    "coaches=$($r.data.coaches.Count)"
} | Out-Null

Test-Step "Active student login" {
    $body = @{ email = "activestudent@drivehub.local"; password = $pass; portal = "student" } | ConvertTo-Json
    $r = Invoke-RestMethod "$base/auth/login" -Method POST -Body $body -ContentType "application/json"
    $script:activeToken = $r.data.accessToken
    "role=$($r.data.user.activeContext.role)"
} | Out-Null

$activeHeaders = @{ Authorization = "Bearer $activeToken" }

Test-Step "Student dashboard" {
    $r = Invoke-RestMethod "$base/student/dashboard" -Headers $activeHeaders
    if (-not $r.data.dashboard.enrollment) { throw "no enrollment" }
    "status=$($r.data.dashboard.enrollment.status)"
} | Out-Null

Test-Step "Practice start" {
    $r = Invoke-RestMethod "$base/student/practice/start" -Method POST -Headers $activeHeaders -Body "{}" -ContentType "application/json"
    $n = $r.data.questions.Count
    if ($n -lt 1) { throw "no questions" }
    $script:practiceQs = $r.data.questions
    $script:practiceAttempt = $r.data.attempt
    "questions=$n"
} | Out-Null

Test-Step "Practice submit + scoring" {
    $answers = @()
    foreach ($q in $practiceQs) {
        $answers += @{ questionId = $q._id; selectedAnswer = "A" }
    }
    $body = @{
        attempt = $practiceAttempt
        durationSeconds = 120
        answers = $answers
    } | ConvertTo-Json -Depth 5
    $r = Invoke-RestMethod "$base/student/practice/submit" -Method POST -Headers $activeHeaders -Body $body -ContentType "application/json"
    if ($null -eq $r.data.score) { throw "no score" }
    if (-not $r.data.review) { throw "no review" }
    "score=$($r.data.score)%, review=$($r.data.review.Count) items"
} | Out-Null

Test-Step "Student archive" {
    $r = Invoke-RestMethod "$base/student/archive" -Headers $activeHeaders
    "items=$($r.data.archive.Count)"
} | Out-Null

Test-Step "Registered user login" {
    $body = @{ email = "student@drivehub.local"; password = $pass; portal = "student" } | ConvertTo-Json
    $r = Invoke-RestMethod "$base/auth/login" -Method POST -Body $body -ContentType "application/json"
    $script:studentToken = $r.data.accessToken
    "logged in"
} | Out-Null

$studentHeaders = @{ Authorization = "Bearer $studentToken" }

Test-Step "Sample (registered)" {
    $r = Invoke-RestMethod "$base/content/sample" -Headers $studentHeaders
    if ($r.data.tier -ne "full") { throw "expected full tier" }
    "tier=full, questions=$($r.data.questions.Count)"
} | Out-Null

Test-Step "Create enrollment" {
    $body = @{
        courseId = $courseId
        schoolId = $schoolId
        categoryCode = "B"
        subTypeCode = "B1"
        prefersFemaleCoach = $false
    } | ConvertTo-Json
    $r = Invoke-RestMethod "$base/enrollments" -Method POST -Headers $studentHeaders -Body $body -ContentType "application/json"
    $script:enrollmentId = $r.data.enrollment._id
    "id=$enrollmentId, status=$($r.data.enrollment.status)"
} | Out-Null

Test-Step "Manager login + accept" {
    $body = @{ email = "manager@drivehub.local"; password = $pass; portal = "school" } | ConvertTo-Json
    $r = Invoke-RestMethod "$base/auth/login" -Method POST -Body $body -ContentType "application/json"
    $script:mgrHeaders = @{ Authorization = "Bearer $($r.data.accessToken)" }
    $accept = Invoke-RestMethod "$base/manager/enrollments/$enrollmentId/accept" -Method POST -Headers $script:mgrHeaders -Body "{}" -ContentType "application/json"
    if ($accept.data.enrollment.status -ne "awaiting_payment") { throw "not awaiting payment" }
    "accepted"
} | Out-Null

Test-Step "Payment flow + student role" {
    Invoke-RestMethod "$base/enrollments/$enrollmentId/payment/initiate" -Method POST -Headers $studentHeaders -Body "{}" -ContentType "application/json" | Out-Null
    Invoke-RestMethod "$base/enrollments/$enrollmentId/payment/claim" -Method POST -Headers $studentHeaders -Body '{"studentReference":"INTEGRATION-REF"}' -ContentType "application/json" | Out-Null
    $payBody = @{ amount = 500000; gatewayRef = "INTEGRATION-MANUAL" } | ConvertTo-Json
    $confirm = Invoke-RestMethod "$base/manager/enrollments/$enrollmentId/payment/confirm" -Method POST -Headers $script:mgrHeaders -Body $payBody -ContentType "application/json"
    if ($confirm.data.enrollment.status -ne "paid") { throw "payment not confirmed" }
    $me = Invoke-RestMethod "$base/auth/me" -Headers $studentHeaders
    $hasStudent = $me.data.user.roles | Where-Object { $_.role -eq "student" }
    if (-not $hasStudent) { throw "student role not granted" }
    "paid + student role granted"
} | Out-Null

Test-Step "Coach login + schedule" {
    $body = @{ email = "coach@drivehub.local"; password = $pass; portal = "school" } | ConvertTo-Json
    $r = Invoke-RestMethod "$base/auth/login" -Method POST -Body $body -ContentType "application/json"
    $coachHeaders = @{ Authorization = "Bearer $($r.data.accessToken)" }
    Invoke-RestMethod "$base/coach/schedule" -Headers $coachHeaders | Out-Null
    "schedule loaded"
} | Out-Null

Test-Step "Frontend proxy" {
    $r = Invoke-RestMethod "http://localhost:5173/api/v1/health"
    if (-not $r.success) { throw "proxy failed" }
    "proxy OK"
} | Out-Null

Write-Host "`n=== Summary: $okCount passed, $failCount failed ===`n" -ForegroundColor Cyan
if ($failCount -gt 0) { exit 1 }
