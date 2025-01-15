function! petit#pairs#setup()
    let s:plugin_path = expand('<sfile>:p:h:h:h') . "/pairs"

    if index(split(&runtimepath, ','), s:plugin_path) == -1
        let &runtimepath .= ',' . s:plugin_path
    endif
endfunction
