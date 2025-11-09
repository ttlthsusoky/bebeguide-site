# Cloudflare Pages 커스텀 도메인 설정 스크립트

$accountId = "73345ebbd3c77f0860735858087bf3b0"
$projectName = "bebeguide"
$domain = "be-be-guide.com"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Cloudflare Pages 도메인 설정" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Account ID: $accountId" -ForegroundColor Green
Write-Host "Project: $projectName" -ForegroundColor Green
Write-Host "Domain: $domain" -ForegroundColor Green
Write-Host ""

# Cloudflare Dashboard URL 생성
$dashboardUrl = "https://dash.cloudflare.com/$accountId/pages/view/$projectName/domains"

Write-Host "도메인을 추가하려면 아래 링크로 이동하세요:" -ForegroundColor Yellow
Write-Host $dashboardUrl -ForegroundColor Cyan
Write-Host ""
Write-Host "설정 방법:" -ForegroundColor Yellow
Write-Host "1. 위 링크 클릭 (자동으로 브라우저에서 열립니다)" -ForegroundColor White
Write-Host "2. 'Set up a custom domain' 버튼 클릭" -ForegroundColor White
Write-Host "3. '$domain' 입력" -ForegroundColor White
Write-Host "4. 'Continue' 클릭" -ForegroundColor White
Write-Host "5. DNS 레코드 자동 추가됨!" -ForegroundColor White
Write-Host ""

# 브라우저에서 열기
Start-Process $dashboardUrl

Write-Host "브라우저가 열렸습니다! 위 단계를 따라하세요." -ForegroundColor Green
Write-Host ""
Write-Host "완료 후 Enter를 눌러주세요..."
Read-Host
