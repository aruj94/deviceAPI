local ctx = ngx.ctx
local lim = ctx.limit_conn
if lim then
    -- $upstream_response_time is used instead of $request_time below
    -- because we are using an upstream module proxy_pass.
    -- Using $upstream_response_time will give a more accurate time it takes
    -- for the upstream server to process the request.
    local latency = tonumber(ngx.var.upstream_response_time)
    local key = ctx.limit_conn_key
    assert(key)
    local conn, err = lim:leaving(key, latency)
    if not conn then
        ngx.log(ngx.ERR,
                "failed to record the connection leaving ",
                "request: ", err)
        return
    end

    -- Log the latency to a file or the NGINX error log
    ngx.log(ngx.NOTICE, "Backend Latency: ", latency, " seconds")
end