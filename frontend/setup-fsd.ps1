Write-Host "Creating FSD structure in src/..."
New-Item -ItemType Directory -Path "src" -Force
New-Item -ItemType Directory -Path "src\assets", "src\components\ui", "src\components\common", "src\features", "src\hooks", "src\services", "src\store", "src\types", "src\utils" -Force

Write-Host "Moving existing directories..."
if (Test-Path "app") { Move-Item -Path "app" -Destination "src\app" -Force }
if (Test-Path "components") { Move-Item -Path "components" -Destination "src\components\common_temp" -Force }
if (Test-Path "src\components\common_temp") {
    Move-Item -Path "src\components\common_temp\*" -Destination "src\components\common" -Force
    Remove-Item -Path "src\components\common_temp" -Force
}
if (Test-Path "lib") { Move-Item -Path "lib" -Destination "src\lib" -Force }

Write-Host "Installing new dependencies..."
npm install zustand @tanstack/react-query axios framer-motion clsx tailwind-merge lucide-react

Write-Host "FSD architecture setup complete! You can now start the dev server."
