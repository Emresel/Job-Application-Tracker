$env:GIT_SEQUENCE_EDITOR = "node seq.js"
$env:GIT_EDITOR = "node ed.js"
git rebase -i HEAD~3
