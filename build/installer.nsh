!macro customUnInstall
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "App-LOL"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "app-lol"
!macroend
