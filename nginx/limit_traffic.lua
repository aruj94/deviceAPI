local limit_conn = require "resty.limit.conn"
local limit_req = require "resty.limit.req"
local limit_traffic = require "resty.limit.traffic"

local lim1, err = limit_req.new("my_req_store", 300, 200)
assert(lim1, err)
local lim2, err = limit_req.new("my_req_store", 200, 100)
assert(lim2, err)
local lim3, err = limit_conn.new("my_conn_store", 1000, 1000, 0.5)
assert(lim3, err)

local limiters = {lim1, lim2, lim3}

local host = ngx.var.host
local client = ngx.var.binary_remote_addr
local keys = {host, client, client}

local states = {}

local delay, err = limit_traffic.combine(limiters, keys, states)
if not delay then
    if err == "rejected" then
        return ngx.exit(503)
    end
    ngx.log(ngx.ERR, "failed to limit traffic: ", err)
    return ngx.exit(500)
end

if lim3:is_committed() then
    local ctx = ngx.ctx
    ctx.limit_conn = lim3
    ctx.limit_conn_key = keys[3]
end

print("sleeping ", delay, " sec, states: ",
        table.concat(states, ", "))

if delay >= 0.001 then
    ngx.sleep(delay)
end