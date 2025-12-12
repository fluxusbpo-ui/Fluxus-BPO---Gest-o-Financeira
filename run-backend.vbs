Option Explicit
Dim fso, scriptPath, scriptDir, backendDir, wsh, cmd
Set fso = CreateObject("Scripting.FileSystemObject")
scriptPath = WScript.ScriptFullName
scriptDir = fso.GetParentFolderName(scriptPath)
backendDir = fso.BuildPath(scriptDir, "backend")

Set wsh = CreateObject("WScript.Shell")
cmd = "cmd /k cd /d """ & backendDir & """ && set PORT=5000 && node src\index.js"

wsh.Run cmd, 1, False
