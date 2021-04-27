Dim fso
Dim CurrentDirectory

Dim Lockfile
Lockfile = WScript.Arguments.Item(2) & "\__ppx_elevated_prompt.lock"

WScript.Echo "WScript Lockfile location: " & Lockfile

Set fso = CreateObject("Scripting.FileSystemObject")
fso.CreateTextFile Lockfile, True

CreateObject("Shell.Application").ShellExecute _
  "cmd", _
  "/k node """ & WScript.Arguments.Item(0) & """ " & WScript.Arguments.Item(1) & " --elevated=""" & WScript.Arguments.Item(2) & """", _
  "", _
  "runas", _
  1

Do Until NOT fso.FileExists(Lockfile)
  WScript.Sleep 400
Loop
