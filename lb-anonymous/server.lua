print("[anonymous] server.lua loaded")

local identifier = "lb-anonymous"

Citizen.CreateThread(function()
    while GetResourceState("lb-phone") ~= "started" do
        Citizen.Wait(500)
    end
end)

RegisterNetEvent("anonymous:sendNotificationToAll", function(data)
    local src = source
    print(("[anonymous] Received notification request from %s: %s"):format(src, json.encode(data)))

    local payload = {
        app     = identifier,
        title   = data.title   or "Anonymous",
        content = data.content or "",
        icon    = "danger"
    }

    for _, id in ipairs(GetPlayers()) do
        TriggerClientEvent("anonymous:client:showNotif", tonumber(id), payload)
    end
end)

RegisterNetEvent("lb-anonymous:server:sendChatMessage", function(data)
    local src = source
    print(("[lb-anonymous] chat from %s: %s"):format(src, json.encode(data)))
    TriggerClientEvent("lb-anonymous:broadcastMessage", -1, data)
end)

RegisterCommand("anonnotify", function(src, args)
    if #args == 0 then
        if src == 0 then
            print("Usage: /anonnotify <message>")
        else
            TriggerClientEvent("chat:addMessage", src, { args = { "^1Usage:", "/anonnotify <message>" } })
        end
        return
    end

    local text = table.concat(args, " ")

    local payload = {
        app     = identifier,
        title   = "Anonymous",
        content = text,
        icon    = "danger"
    }

    for _, id in ipairs(GetPlayers()) do
        exports["lb-phone"]:SendNotification(tonumber(id), payload)
    end

    print(("anonnotify sent by %s: %s"):format(src == 0 and "console" or src, text))
end, true)
