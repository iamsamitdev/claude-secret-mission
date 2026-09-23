# Block file deletion commands (rm / Remove-Item) from Claude Code
$payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
$cmd = $payload.tool_input.command

if ($cmd -match '(^|[\s;&|(])(rm|Remove-Item|del|rd|rmdir|ri)(\s|$)') {
    [Console]::Error.WriteLine("Blocked: deleting files is not allowed. Please ask the user first. Command: $cmd")
    exit 2
}

exit 0
