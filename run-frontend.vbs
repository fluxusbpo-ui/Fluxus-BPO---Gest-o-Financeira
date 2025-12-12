Option Explicit
Dim fso, scriptPath, scriptDir, frontendDir, wsh, cmd
Set fso = CreateObject("Scripting.FileSystemObject")
scriptPath = WScript.ScriptFullName
scriptDir = fso.GetParentFolderName(scriptPath)
frontendDir = fso.BuildPath(scriptDir, "frontend")

Set wsh = CreateObject("WScript.Shell")
cmd = "cmd /k cd /d """ & frontendDir & """ && node ""node_modules\vite\bin\vite.js"" --port 3001"

wsh.Run cmd, 1, False
