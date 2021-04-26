Dim fso
Dim CurrentDirectory

Set fso = CreateObject("Scripting.FileSystemObject")
fso.CreateTextFile "__ppx_elevated_prompt.lock", True

CreateObject("Shell.Application").ShellExecute _
  "cmd", _
  "/k node """ & WScript.Arguments.Item(0) & """ " & WScript.Arguments.Item(1) & " --elevated=""" & WScript.Arguments.Item(2) & """", _
  "", _
  "runas", _
  1

Do Until NOT fso.FileExists("__ppx_elevated_prompt.lock")
  WScript.Sleep 400
Loop
